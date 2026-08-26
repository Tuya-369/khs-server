import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import axios from "axios";
import { OtpPurpose, Role } from "@prisma/client";
import { AppError } from "../../errors/app-error";
import { prisma } from "../../utils/prisma";
import { logger } from "../../utils/logger";

type SendOtpResult = {
  message: string;
  debugCode?: string;
};

type ResetTokenPayload = {
  userId: string;
  phoneNumber: string;
  purpose: string;
};

type ProjectNameValue =
  "UG" | "UB" | "BAYAJUULAH" | "PROJECT" | "OPERATION" | "CONTRACTION";

type CreateUserPayload = {
  sapId?: string;
  firstName: string;
  lastName: string;
  ProjectName: ProjectNameValue;
  phoneNumber: string;
  password: string;
  role: Role;
};

type RegisterPayload = {
  sapId?: string;
  firstName: string;
  lastName: string;
  ProjectName: ProjectNameValue;
  phoneNumber: string;
  password: string;
};

type LoginPayload = {
  sapId?: string;
  identifier?: string;
  password: string;
};

type LoginChallengeResult = {
  otpToken: string;
  maskedPhone: string;
  expiresIn: number;
  debugCode?: string;
};

type UpdateMePayload = {
  firstName?: string;
  lastName?: string;
  ProjectName?: ProjectNameValue;
  phoneNumber?: string;
};

export class AuthService {
  private readonly otpExpiresInMs = 60 * 1000;
  private readonly nonExpiringSessionDate = new Date(
    "2099-12-31T23:59:59.999Z",
  );

  private getOtpExpiresInSeconds(): number {
    return Math.floor(this.otpExpiresInMs / 1000);
  }

  private normalizeSapId(value: unknown): string | null {
    if (typeof value !== "string") return null;
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
  }

  private normalizePhone(value: unknown): string {
    if (typeof value !== "string") return "";

    const digits = value.replace(/\D/g, "");
    if (!digits) return "";

    // Accept common Mongolia formats and keep canonical local 8-digit number.
    if (digits.length === 11 && digits.startsWith("976")) {
      return digits.slice(3);
    }
    if (digits.length === 9 && digits.startsWith("0")) {
      return digits.slice(1);
    }

    return digits;
  }

  private maskPhone(phoneNumber: string): string {
    if (phoneNumber.length < 4) return "****";
    return `${phoneNumber.slice(0, 2)}****${phoneNumber.slice(-2)}`;
  }

  private getAccessSecret(): string {
    return process.env.JWT_ACCESS_SECRET || "access_secret";
  }

  private getRefreshSecret(): string {
    return process.env.JWT_REFRESH_SECRET || "refresh_secret";
  }

  private getOtpSecret(): string {
    return process.env.JWT_OTP_SECRET || this.getAccessSecret();
  }

  private issueAccessToken(userId: string, role: string): string {
    return jwt.sign({ userId, role }, this.getAccessSecret(), {
      expiresIn: "3h",
    });
  }

  private issueRefreshToken(userId: string): string {
    return jwt.sign({ userId }, this.getRefreshSecret());
  }

  private issueOtpToken(userId: string, phoneNumber: string): string {
    return jwt.sign(
      { userId, phoneNumber, purpose: "otp_login" },
      this.getOtpSecret(),
      {
        expiresIn: this.getOtpExpiresInSeconds(),
      },
    );
  }

  private issueResetToken(userId: string, phoneNumber: string): string {
    return jwt.sign(
      { userId, phoneNumber, purpose: "password_reset" },
      this.getOtpSecret(),
      { expiresIn: this.getOtpExpiresInSeconds() },
    );
  }

  private async issueSession(user: {
    id: string;
    sapId: string | null;
    role: Role;
    firstName: string;
    lastName: string;
    ProjectName: ProjectNameValue;
  }) {
    const accessToken = this.issueAccessToken(user.id, user.role);
    const refreshToken = this.issueRefreshToken(user.id);

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

  private async sendOtp(phoneNumber: string, purpose: OtpPurpose) {
    const formattedPhone = this.normalizePhone(phoneNumber);

    if (!formattedPhone || !/^\d{8}$/.test(formattedPhone)) {
      throw new AppError(400, "Утасны дугаар буруу байна.");
    }

    const now = new Date();
    const activeOtp = await prisma.otpVerification.findUnique({
      where: { phoneNumber: formattedPhone },
    });

    if (
      activeOtp &&
      activeOtp.purpose === purpose &&
      !activeOtp.usedAt &&
      activeOtp.expiresAt > now
    ) {
      const remainingSeconds = Math.max(
        1,
        Math.ceil((activeOtp.expiresAt.getTime() - now.getTime()) / 1000),
      );
      throw new AppError(
        429,
        `Код аль хэдийн илгээгдсэн байна. ${remainingSeconds} сек дараа дахин оролдоно уу.`,
        [],
        "OTP_RESEND_COOLDOWN",
      );
    }

    const randomCode = Math.floor(Math.random() * 10000)
      .toString()
      .padStart(4, "0");
    const codeHash = await bcrypt.hash(randomCode, 10);
    const expiresAt = new Date(Date.now() + this.otpExpiresInMs);

    const endpoint = "https://api-text.callpro.mn/v1/sms/send";
    const apiKey = process.env.CALLPRO_API_KEY;
    const senderNumber = process.env.CALLPRO_SENDER || "72723355";

    const smsText = `Таны баталгаажуулах код: ${randomCode}`;

    if (!apiKey) {
      if (process.env.NODE_ENV !== "production") {
        logger.warn(
          `CALLPRO_API_KEY тохируулаагүй тул OTP console дээр: ${formattedPhone} -> ${randomCode}`,
        );
        return {
          message: "Баталгаажуулах код амжилттай илгээгдлээ.",
          debugCode: randomCode,
        } satisfies SendOtpResult;
      }
      throw new AppError(500, "CALLPRO_API_KEY тохируулаагүй байна.");
    }

    try {
      const response = await axios.post(
        endpoint,
        {
          from: senderNumber,
          to: formattedPhone,
          text: smsText,
        },
        {
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            "x-api-key": apiKey,
          },
        },
      );

      logger.info("SMS provider response", {
        status: response.status,
        body:
          typeof response.data === "string"
            ? response.data
            : JSON.stringify(response.data),
      });

      await prisma.otpVerification.upsert({
        where: { phoneNumber: formattedPhone },
        update: { code: codeHash, purpose, expiresAt, usedAt: null },
        create: {
          phoneNumber: formattedPhone,
          code: codeHash,
          purpose,
          expiresAt,
        },
      });
    } catch (error) {
      const response = axios.isAxiosError(error) ? error.response : undefined;
      const providerMessage =
        typeof response?.data === "string"
          ? response.data
          : JSON.stringify(response?.data || {});
      logger.error("SMS provider error", {
        status: response?.status,
        body: providerMessage,
      });

      const message =
        process.env.NODE_ENV === "production"
          ? "SMS илгээхэд алдаа гарлаа. Дараа дахин оролдоно уу."
          : `SMS илгээхэд алдаа гарлаа. Status: ${response?.status || "unknown"}.`;

      throw new AppError(502, message);
    }

    return { message: "Баталгаажуулах код амжилттай илгээгдлээ." };
  }

  private async verifyOtpCode(
    phoneNumber: string,
    code: string,
    purpose: OtpPurpose,
  ) {
    const formattedPhone = this.normalizePhone(phoneNumber);
    const otp = await prisma.otpVerification.findUnique({
      where: { phoneNumber: formattedPhone },
    });

    if (!otp || otp.purpose !== purpose || otp.usedAt) {
      throw new AppError(
        400,
        "Код хүчингүй болсон байна. Дахин код авч оролдоно уу.",
      );
    }
    if (otp.expiresAt < new Date()) {
      await prisma.otpVerification.delete({
        where: { phoneNumber: formattedPhone },
      });
      throw new AppError(
        400,
        "Кодын хугацаа дууссан байна. Дахин код авна уу.",
      );
    }
    const isValid = await bcrypt.compare(code.trim(), otp.code);
    if (!isValid) {
      throw new AppError(400, "Код буруу байна. Дахин шалгаад оруулна уу.");
    }

    return formattedPhone;
  }

  async requestRegistrationOtp(data: RegisterPayload) {
    const phoneNumber = this.normalizePhone(data.phoneNumber);
    const sapId = this.normalizeSapId(data.sapId);
    const existingUser = await prisma.user.findFirst({
      where: { OR: [{ phoneNumber }, ...(sapId ? [{ sapId }] : [])] },
    });
    if (existingUser) {
      throw new AppError(
        400,
        "Энэ утасны дугаар эсвэл SAP ID-тай хэрэглэгч бүртгэгдсэн байна.",
      );
    }

    await prisma.pendingRegistration.upsert({
      where: { phoneNumber },
      update: {
        sapId,
        firstName: data.firstName,
        lastName: data.lastName,
        ProjectName: data.ProjectName,
        passwordHash: await bcrypt.hash(data.password, 10),
        expiresAt: new Date(Date.now() + this.otpExpiresInMs),
      },
      create: {
        phoneNumber,
        sapId,
        firstName: data.firstName,
        lastName: data.lastName,
        ProjectName: data.ProjectName,
        passwordHash: await bcrypt.hash(data.password, 10),
        expiresAt: new Date(Date.now() + this.otpExpiresInMs),
      },
    });

    return this.sendOtp(phoneNumber, "REGISTRATION");
  }

  async verifyRegistrationOtp(data: { phoneNumber: string; code: string }) {
    const phoneNumber = await this.verifyOtpCode(
      data.phoneNumber,
      data.code,
      "REGISTRATION",
    );
    const pending = await prisma.pendingRegistration.findUnique({
      where: { phoneNumber },
    });
    if (!pending || pending.expiresAt < new Date()) {
      throw new AppError(
        400,
        "Бүртгэлийн хүсэлтийн хугацаа дууссан байна. Дахин код авна уу.",
      );
    }

    return prisma.$transaction(async (transaction) => {
      const existingUser = await transaction.user.findFirst({
        where: {
          OR: [
            { phoneNumber },
            ...(pending.sapId ? [{ sapId: pending.sapId }] : []),
          ],
        },
      });
      if (existingUser)
        throw new AppError(400, "Энэ хэрэглэгч аль хэдийн бүртгэгдсэн байна.");

      const user = await transaction.user.create({
        data: {
          sapId: pending.sapId,
          firstName: pending.firstName,
          lastName: pending.lastName,
          ProjectName: pending.ProjectName,
          phoneNumber: pending.phoneNumber,
          passwordHash: pending.passwordHash,
          role: "EMPLOYEE",
        },
      });
      await transaction.otpVerification.update({
        where: { phoneNumber },
        data: { usedAt: new Date() },
      });
      await transaction.pendingRegistration.delete({ where: { phoneNumber } });
      return {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        phoneNumber: user.phoneNumber,
      };
    });
  }

  async forgotPassword(phoneNumber: string) {
    const formattedPhone = this.normalizePhone(phoneNumber);
    const user = await prisma.user.findFirst({
      where: { phoneNumber: formattedPhone },
    });
    if (!user)
      throw new AppError(
        404,
        "Энэ утасны дугаартай хэрэглэгч бүртгэлгүй байна.",
      );
    return this.sendOtp(formattedPhone, "PASSWORD_RESET");
  }

  async verifyForgotOtp(data: { phoneNumber: string; code: string }) {
    const phoneNumber = await this.verifyOtpCode(
      data.phoneNumber,
      data.code,
      "PASSWORD_RESET",
    );
    const user = await prisma.user.findFirst({ where: { phoneNumber } });
    if (!user) throw new AppError(404, "Хэрэглэгч олдсонгүй.");

    await prisma.otpVerification.update({
      where: { phoneNumber },
      data: { usedAt: new Date() },
    });
    return { resetToken: this.issueResetToken(user.id, phoneNumber) };
  }

  async resetPassword(data: { resetToken: string; password: string }) {
    let token: ResetTokenPayload;
    try {
      token = jwt.verify(
        data.resetToken,
        this.getOtpSecret(),
      ) as ResetTokenPayload;
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

  async createUserByAdmin(data: CreateUserPayload) {
    const sapId = this.normalizeSapId(data.sapId);
    const existing = sapId
      ? await prisma.user.findUnique({
          where: { sapId },
        })
      : null;

    if (existing) {
      throw new AppError(
        400,
        "Энэ SAP ID-тай хэрэглэгч аль хэдийн бүртгэгдсэн байна.",
        [],
        "USER_ALREADY_EXISTS",
      );
    }

    const passwordHash = await bcrypt.hash(data.password, 10);
    return prisma.user.create({
      data: {
        sapId,
        firstName: data.firstName,
        lastName: data.lastName,
        ProjectName: data.ProjectName,
        phoneNumber: data.phoneNumber,
        passwordHash,
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

  async register(data: RegisterPayload) {
    const sapId = this.normalizeSapId(data.sapId);
    const existing = sapId
      ? await prisma.user.findUnique({
          where: { sapId },
        })
      : null;
    if (existing)
      throw new AppError(
        400,
        "Энэ SAP ID-тай хэрэглэгч аль хэдийн бүртгэгдсэн байна.",
      );

    const passwordHash = await bcrypt.hash(data.password, 10);
    return prisma.user.create({
      data: {
        sapId,
        firstName: data.firstName,
        lastName: data.lastName,
        ProjectName: data.ProjectName,
        phoneNumber: data.phoneNumber,
        passwordHash,
        role: "EMPLOYEE",
      },
      select: {
        id: true,
        sapId: true,
        firstName: true,
        lastName: true,
        ProjectName: true,
        role: true,
      },
    });
  }

  async login(data: LoginPayload): Promise<LoginChallengeResult> {
    const identifier = String(data.identifier || data.sapId || "").trim();
    const normalizedIdentifierPhone = this.normalizePhone(identifier);
    const phoneCandidates =
      normalizedIdentifierPhone && normalizedIdentifierPhone !== identifier
        ? [identifier, normalizedIdentifierPhone]
        : [identifier];

    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { sapId: identifier },
          ...phoneCandidates.map((value) => ({ phoneNumber: value })),
        ],
      },
    });
    if (!user || !(await bcrypt.compare(data.password, user.passwordHash))) {
      throw new AppError(401, "SAP ID/Утас эсвэл нууц үг буруу байна.");
    }
    if (!user.isActive) throw new AppError(403, "Таны бүртгэл идэвхгүй байна.");

    const otpResult = await this.sendOtp(user.phoneNumber, "LOGIN");

    return {
      otpToken: this.issueOtpToken(
        user.id,
        this.normalizePhone(user.phoneNumber),
      ),
      maskedPhone: this.maskPhone(this.normalizePhone(user.phoneNumber)),
      expiresIn: Math.floor(this.otpExpiresInMs / 1000),
      ...(otpResult.debugCode ? { debugCode: otpResult.debugCode } : {}),
    };
  }

  async verifyLoginOtp(data: { otpToken: string; code: string }) {
    const { otpToken, code } = data;

    let decoded: { userId: string; phoneNumber: string; purpose: string };
    try {
      decoded = jwt.verify(otpToken, this.getOtpSecret()) as {
        userId: string;
        phoneNumber: string;
        purpose: string;
      };
    } catch {
      throw new AppError(401, "OTP сесс хүчинтэй биш эсвэл хугацаа дууссан.");
    }

    if (decoded.purpose !== "otp_login") {
      throw new AppError(401, "OTP сесс хүчинтэй биш байна.");
    }

    const otp = await prisma.otpVerification.findUnique({
      where: { phoneNumber: decoded.phoneNumber },
    });

    if (!otp) {
      throw new AppError(400, "Код олдсонгүй. Дахин login хийж код авна уу.");
    }

    if (otp.purpose !== "LOGIN" || otp.usedAt) {
      throw new AppError(
        400,
        "Энэ код аль хэдийн ашиглагдсан байна. Дахин login хийгээд шинэ код авна уу.",
      );
    }

    if (otp.expiresAt < new Date()) {
      await prisma.otpVerification.delete({
        where: { phoneNumber: decoded.phoneNumber },
      });
      throw new AppError(
        400,
        "Кодын хугацаа дууссан байна. Дахин код авна уу.",
      );
    }

    const isValid = await bcrypt.compare(String(code).trim(), otp.code);
    if (!isValid) {
      throw new AppError(400, "Код буруу байна. Дахин шалгаад оруулна уу.");
    }

    await prisma.otpVerification.update({
      where: { phoneNumber: decoded.phoneNumber },
      data: { usedAt: new Date() },
    });

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
    });
    if (!user) {
      throw new AppError(404, "Хэрэглэгч олдсонгүй.");
    }

    if (!user.isActive) {
      throw new AppError(403, "Таны бүртгэл идэвхгүй байна.");
    }

    return this.issueSession({
      id: user.id,
      sapId: user.sapId,
      role: user.role,
      firstName: user.firstName,
      lastName: user.lastName,
      ProjectName: user.ProjectName,
    });
  }

  async refresh(token: string) {
    const dbToken = await prisma.refreshToken.findUnique({
      where: { token },
      include: { user: true },
    });
    if (!dbToken) {
      throw new AppError(401, "Хүчингүй refresh токен.");
    }

    const accessToken = this.issueAccessToken(
      dbToken.user.id,
      dbToken.user.role,
    );
    return { accessToken };
  }

  async logout(token: string) {
    await prisma.refreshToken.deleteMany({ where: { token } });
  }

  async getMe(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
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

    if (!user) {
      throw new AppError(404, "Хэрэглэгч олдсонгүй.", [], "USER_NOT_FOUND");
    }

    return user;
  }

  async updateMe(userId: string, data: UpdateMePayload) {
    const updateData: UpdateMePayload = {};

    if (data.firstName !== undefined) updateData.firstName = data.firstName;
    if (data.lastName !== undefined) updateData.lastName = data.lastName;
    if (data.ProjectName !== undefined)
      updateData.ProjectName = data.ProjectName;
    if (data.phoneNumber !== undefined)
      updateData.phoneNumber = data.phoneNumber;

    if (Object.keys(updateData).length === 0) {
      throw new AppError(400, "Шинэчлэх өгөгдөл хоосон байна.");
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data: updateData,
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

    return user;
  }
}
