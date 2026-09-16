import axios from "axios";
import bcrypt from "bcrypt";
import { OtpPurpose } from "@prisma/client";
import { AppError } from "../../errors/app-error";
import { logger } from "../../utils/logger";
import { prisma } from "../../utils/prisma";
import { SendOtpResult } from "./auth.types";
import { getRequiredEnv, normalizePhone } from "./auth.utils";

export class AuthOtpService {
  constructor(private readonly expiresInMs: number) {}

  async send(phoneNumber: string, purpose: OtpPurpose): Promise<SendOtpResult> {
    const formattedPhone = normalizePhone(phoneNumber);
    if (!formattedPhone || !/^\d{8}$/.test(formattedPhone)) {
      throw new AppError(400, "Утасны дугаар буруу байна.");
    }

    const activeOtp = await prisma.otpVerification.findUnique({
      where: { phoneNumber: formattedPhone },
    });
    const now = new Date();
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

    const code = Math.floor(Math.random() * 10000)
      .toString()
      .padStart(4, "0");
    const codeHash = await bcrypt.hash(code, 10);
    const expiresAt = new Date(Date.now() + this.expiresInMs);
    const apiKey = process.env.CALLPRO_API_KEY;

    if (!apiKey) {
      if (process.env.NODE_ENV === "production") {
        throw new AppError(
          503,
          "SMS үйлчилгээ түр ажиллахгүй байна. Системийн тохиргоог шалгана уу.",
          [],
          "SMS_PROVIDER_NOT_CONFIGURED",
        );
      }
      logger.warn(
        `CALLPRO_API_KEY тохируулаагүй тул OTP console дээр: ${formattedPhone} -> ${code}`,
      );
      await this.save(formattedPhone, codeHash, purpose, expiresAt);
      return {
        message: "Баталгаажуулах код амжилттай илгээгдлээ.",
        debugCode: code,
      };
    }

    try {
      const response = await axios.post(
        getRequiredEnv("CALLPRO_API_URL"),
        {
          from: getRequiredEnv("CALLPRO_SENDER"),
          to: formattedPhone,
          text: `Таны баталгаажуулах код: ${code}`,
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
      await this.save(formattedPhone, codeHash, purpose, expiresAt);
    } catch (error) {
      const response = axios.isAxiosError(error) ? error.response : undefined;
      logger.error("SMS provider error", {
        status: response?.status,
        body:
          typeof response?.data === "string"
            ? response.data
            : JSON.stringify(response?.data || {}),
      });
      const message =
        process.env.NODE_ENV === "production"
          ? "SMS илгээхэд алдаа гарлаа. Дараа дахин оролдоно уу."
          : `SMS илгээхэд алдаа гарлаа. Status: ${response?.status || "unknown"}.`;
      throw new AppError(502, message);
    }

    return { message: "Баталгаажуулах код амжилттай илгээгдлээ." };
  }

  async verify(
    phoneNumber: string,
    code: string,
    purpose: OtpPurpose,
  ): Promise<string> {
    const formattedPhone = normalizePhone(phoneNumber);
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
    if (!(await bcrypt.compare(code.trim(), otp.code))) {
      throw new AppError(400, "Код буруу байна. Дахин шалгаад оруулна уу.");
    }
    return formattedPhone;
  }

  async markUsed(phoneNumber: string): Promise<void> {
    await prisma.otpVerification.update({
      where: { phoneNumber },
      data: { usedAt: new Date() },
    });
  }

  private async save(
    phoneNumber: string,
    code: string,
    purpose: OtpPurpose,
    expiresAt: Date,
  ): Promise<void> {
    await prisma.otpVerification.upsert({
      where: { phoneNumber },
      update: { code, purpose, expiresAt, usedAt: null },
      create: { phoneNumber, code, purpose, expiresAt },
    });
  }
}
