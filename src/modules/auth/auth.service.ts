import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { Role } from "@prisma/client";
import { AppError } from "../../errors/app-error";
import { prisma } from "../../utils/prisma";
import { logger } from "../../utils/logger";

type SendOtpResult = {
  message: string;
  debugCode?: string;
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

type UpdateMePayload = {
  firstName?: string;
  lastName?: string;
  ProjectName?: ProjectNameValue;
  phoneNumber?: string;
};

export class AuthService {
  private readonly otpExpiresInMs = 3 * 60 * 1000;

  private normalizeSapId(value: unknown): string | null {
    if (typeof value !== "string") return null;
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
  }

  private normalizePhone(value: unknown): string {
    return typeof value === "string" ? value.trim() : "";
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
      expiresIn: "15m",
    });
  }

  private issueRefreshToken(userId: string): string {
    return jwt.sign({ userId }, this.getRefreshSecret(), {
      expiresIn: "7d",
    });
  }

  private issueOtpToken(userId: string, phoneNumber: string): string {
    return jwt.sign(
      { userId, phoneNumber, purpose: "otp_login" },
      this.getOtpSecret(),
      {
        expiresIn: "5m",
      },
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
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
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

  async sendOtp(phoneNumber: string) {
    const formattedPhone = this.normalizePhone(phoneNumber);

    if (!formattedPhone) {
      throw new AppError(400, "Утасны дугаар хоосон байна.");
    }

    const randomCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + this.otpExpiresInMs);

    await prisma.otpVerification.upsert({
      where: { phoneNumber: formattedPhone },
      update: { code: randomCode, expiresAt },
      create: { phoneNumber: formattedPhone, code: randomCode, expiresAt },
    });

    const endpoint =
      process.env.CALLPRO_SMS_ENDPOINT || "https://api.callpro.mn/v1/sms/send";
    const apiKey = process.env.CALLPRO_API_KEY;
    const senderName = process.env.CALLPRO_SENDER_NAME || "KHS";

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

    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        "x-api-key": apiKey,
      },
      body: JSON.stringify({
        from: senderName,
        to: formattedPhone,
        message: smsText,
      }),
    });

    const raw = await response.text();
    if (!response.ok) {
      logger.error("SMS provider error", {
        status: response.status,
        body: raw,
      });

      const message =
        process.env.NODE_ENV === "production"
          ? "SMS илгээхэд алдаа гарлаа. Дараа дахин оролдоно уу."
          : `SMS илгээхэд алдаа гарлаа. Status: ${response.status}. ${raw}`;

      throw new AppError(502, message);
    }

    return { message: "Баталгаажуулах код амжилттай илгээгдлээ." };
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

  async login(data: LoginPayload) {
    const identifier = String(data.identifier || data.sapId || "").trim();
    const user = await prisma.user.findFirst({
      where: {
        OR: [{ sapId: identifier }, { phoneNumber: identifier }],
      },
    });
    if (!user || !(await bcrypt.compare(data.password, user.passwordHash))) {
      throw new AppError(401, "SAP ID/Утас эсвэл нууц үг буруу байна.");
    }
    if (!user.isActive) throw new AppError(403, "Таны бүртгэл идэвхгүй байна.");

    if (!user.phoneNumber) {
      throw new AppError(400, "OTP илгээх утасны дугаар бүртгэлгүй байна.");
    }

    const otpSendResult: SendOtpResult = await this.sendOtp(user.phoneNumber);
    const otpToken = this.issueOtpToken(user.id, user.phoneNumber);

    return {
      requiresOtp: true,
      otpToken,
      phone: this.maskPhone(user.phoneNumber),
      message: "Нэг удаагийн код утсанд илгээгдлээ.",
      debugCode:
        process.env.NODE_ENV !== "production"
          ? otpSendResult.debugCode || undefined
          : undefined,
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
      throw new AppError(400, "Баталгаажуулах код олдсонгүй.");
    }

    if (otp.expiresAt < new Date()) {
      await prisma.otpVerification.delete({
        where: { phoneNumber: decoded.phoneNumber },
      });
      throw new AppError(400, "Баталгаажуулах кодын хугацаа дууссан байна.");
    }

    if (otp.code !== String(code).trim()) {
      throw new AppError(400, "Баталгаажуулах код буруу байна.");
    }

    await prisma.otpVerification.delete({
      where: { phoneNumber: decoded.phoneNumber },
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
    if (!dbToken || dbToken.expiresAt < new Date()) {
      if (dbToken)
        await prisma.refreshToken.delete({ where: { id: dbToken.id } });
      throw new AppError(
        401,
        "Хүчингүй эсвэл хугацаа нь дууссан refresh токен.",
      );
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
