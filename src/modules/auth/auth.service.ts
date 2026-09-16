import bcrypt from "bcrypt";
import { AppError } from "../../errors/app-error";
import { prisma } from "../../utils/prisma";
import { AuthJwt } from "./auth.jwt";
import { AuthOtpService } from "./auth.otp.service";
import { AuthProfileService } from "./auth.profile.service";
import { AuthRegistrationService } from "./auth.registration.service";
import {
  CreateUserPayload,
  LoginChallengeResult,
  LoginPayload,
  RegisterPayload,
  SessionUser,
  UpdateMePayload,
} from "./auth.types";
import {
  maskPhone,
  normalizeName,
  normalizePhone,
  normalizeSapId,
} from "./auth.utils";

export class AuthService {
  private readonly otpExpiresInMs = 60 * 1000;
  private readonly nonExpiringSessionDate = new Date(
    "2099-12-31T23:59:59.999Z",
  );
  private readonly jwt = new AuthJwt(this.otpExpiresInMs / 1000);
  private readonly otpService = new AuthOtpService(this.otpExpiresInMs);
  private readonly registrationService = new AuthRegistrationService(
    this.otpService,
    this.otpExpiresInMs,
  );
  private readonly profileService = new AuthProfileService();

  async createUserByAdmin(data: CreateUserPayload) {
    const sapId = normalizeSapId(data.sapId);
    const existing = sapId
      ? await prisma.user.findUnique({ where: { sapId } })
      : null;

    if (existing) {
      throw new AppError(
        400,
        "Энэ SAP ID-тай хэрэглэгч аль хэдийн бүртгэгдсэн байна.",
        [],
        "USER_ALREADY_EXISTS",
      );
    }

    return prisma.user.create({
      data: {
        sapId,
        firstName: normalizeName(data.firstName),
        lastName: normalizeName(data.lastName),
        ProjectName: data.ProjectName,
        phoneNumber: normalizePhone(data.phoneNumber),
        passwordHash: await bcrypt.hash(data.password, 10),
        role: data.role,
      },
      select: {
        id: true,
        sapId: true,
        firstName: true,
        lastName: true,
        ProjectName: true,
        phoneNumber: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
    });
  }

  register(data: RegisterPayload) {
    return this.registrationService.register(data);
  }

  requestRegistrationOtp(data: RegisterPayload) {
    return this.registrationService.requestOtp(data);
  }

  verifyRegistrationOtp(data: { phoneNumber: string; code: string }) {
    return this.registrationService.verifyOtp(data);
  }

  async login(data: LoginPayload): Promise<LoginChallengeResult> {
    const identifier = String(data.identifier || data.sapId || "").trim();
    const normalizedPhone = normalizePhone(identifier);
    const phoneCandidates =
      normalizedPhone && normalizedPhone !== identifier
        ? [identifier, normalizedPhone]
        : [identifier];
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { sapId: identifier },
          ...phoneCandidates.map((phoneNumber) => ({ phoneNumber })),
        ],
      },
    });

    if (!user || !(await bcrypt.compare(data.password, user.passwordHash))) {
      throw new AppError(401, "SAP ID/Утас эсвэл нууц үг буруу байна.");
    }
    if (!user.isActive) throw new AppError(403, "Таны бүртгэл идэвхгүй байна.");

    const phoneNumber = normalizePhone(user.phoneNumber);
    const otpResult = await this.otpService.send(phoneNumber, "LOGIN");
    return {
      otpToken: this.jwt.issueOtpToken(user.id, phoneNumber),
      maskedPhone: maskPhone(phoneNumber),
      expiresIn: this.otpExpiresInMs / 1000,
      ...(otpResult.debugCode ? { debugCode: otpResult.debugCode } : {}),
    };
  }

  async verifyLoginOtp(data: { otpToken: string; code: string }) {
    let token;
    try {
      token = this.jwt.verifyOtpToken(data.otpToken);
    } catch {
      throw new AppError(401, "OTP сесс хүчинтэй биш эсвэл хугацаа дууссан.");
    }
    if (token.purpose !== "otp_login") {
      throw new AppError(401, "OTP сесс хүчинтэй биш байна.");
    }

    const phoneNumber = await this.otpService.verify(
      token.phoneNumber,
      data.code,
      "LOGIN",
    );
    await this.otpService.markUsed(phoneNumber);

    const user = await prisma.user.findUnique({ where: { id: token.userId } });
    if (!user) throw new AppError(404, "Хэрэглэгч олдсонгүй.");
    if (!user.isActive) throw new AppError(403, "Таны бүртгэл идэвхгүй байна.");

    return this.issueSession(user);
  }

  async forgotPassword(phoneNumber: string) {
    const formattedPhone = normalizePhone(phoneNumber);
    const user = await prisma.user.findFirst({
      where: { phoneNumber: formattedPhone },
    });
    if (!user) {
      throw new AppError(
        404,
        "Энэ утасны дугаартай хэрэглэгч бүртгэлгүй байна.",
      );
    }
    return this.otpService.send(formattedPhone, "PASSWORD_RESET");
  }

  async verifyForgotOtp(data: { phoneNumber: string; code: string }) {
    const phoneNumber = await this.otpService.verify(
      data.phoneNumber,
      data.code,
      "PASSWORD_RESET",
    );
    const user = await prisma.user.findFirst({ where: { phoneNumber } });
    if (!user) throw new AppError(404, "Хэрэглэгч олдсонгүй.");

    await this.otpService.markUsed(phoneNumber);
    return { resetToken: this.jwt.issueResetToken(user.id, phoneNumber) };
  }

  async resetPassword(data: { resetToken: string; password: string }) {
    let token;
    try {
      token = this.jwt.verifyResetToken(data.resetToken);
    } catch {
      throw new AppError(
        401,
        "Нууц үг солих баталгаажуулалтын хугацаа дууссан байна.",
      );
    }
    if (token.purpose !== "password_reset") {
      throw new AppError(401, "Нууц үг солих баталгаажуулалт буруу байна.");
    }

    await prisma.user.update({
      where: { id: token.userId },
      data: { passwordHash: await bcrypt.hash(data.password, 10) },
    });
    await prisma.refreshToken.deleteMany({ where: { userId: token.userId } });
  }

  async refresh(token: string) {
    const dbToken = await prisma.refreshToken.findUnique({
      where: { token },
      include: { user: true },
    });
    if (!dbToken) throw new AppError(401, "Хүчингүй refresh токен.");

    return {
      accessToken: this.jwt.issueAccessToken(
        dbToken.user.id,
        dbToken.user.role,
      ),
    };
  }

  async logout(token: string) {
    await prisma.refreshToken.deleteMany({ where: { token } });
  }

  getMe(userId: string) {
    return this.profileService.getMe(userId);
  }

  updateMe(
    userId: string,
    data: UpdateMePayload,
    profileImageFile?: Express.Multer.File,
  ) {
    return this.profileService.updateMe(userId, data, profileImageFile);
  }

  private async issueSession(user: SessionUser) {
    const accessToken = this.jwt.issueAccessToken(user.id, user.role);
    const refreshToken = this.jwt.issueRefreshToken(user.id);
    await prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId: user.id,
        expiresAt: this.nonExpiringSessionDate,
      },
    });

    return {
      user: {
        id: user.id,
        sapId: user.sapId,
        role: user.role,
        firstName: user.firstName,
        lastName: user.lastName,
        ProjectName: user.ProjectName,
      },
      accessToken,
      refreshToken,
    };
  }
}
