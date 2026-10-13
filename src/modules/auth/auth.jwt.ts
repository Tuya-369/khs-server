import jwt from "jsonwebtoken";
import { OtpTokenPayload, ResetTokenPayload } from "./auth.types";
import { getRequiredEnv } from "./auth.utils";

export const REFRESH_TOKEN_TTL_MS = 30 * 24 * 60 * 60 * 1000;

export class AuthJwt {
  constructor(private readonly otpExpiresInSeconds: number) {}

  issueAccessToken(userId: string, role: string): string {
    return jwt.sign({ userId, role }, getRequiredEnv("JWT_ACCESS_SECRET"), {
      expiresIn: "3h",
    });
  }

  issueRefreshToken(userId: string): string {
    return jwt.sign({ userId }, getRequiredEnv("JWT_REFRESH_SECRET"), {
      expiresIn: REFRESH_TOKEN_TTL_MS / 1000,
    });
  }

  verifyRefreshToken(token: string): { userId: string } {
    const payload = jwt.verify(token, getRequiredEnv("JWT_REFRESH_SECRET"));
    if (typeof payload === "string" || typeof payload.userId !== "string") {
      throw new Error("Invalid refresh token payload");
    }
    return { userId: payload.userId };
  }

  issueOtpToken(userId: string, phoneNumber: string): string {
    return jwt.sign(
      { userId, phoneNumber, purpose: "otp_login" },
      getRequiredEnv("JWT_OTP_SECRET"),
      { expiresIn: this.otpExpiresInSeconds },
    );
  }

  issueResetToken(userId: string, phoneNumber: string): string {
    return jwt.sign(
      { userId, phoneNumber, purpose: "password_reset" },
      getRequiredEnv("JWT_OTP_SECRET"),
      { expiresIn: this.otpExpiresInSeconds },
    );
  }

  verifyOtpToken(token: string): OtpTokenPayload {
    return jwt.verify(
      token,
      getRequiredEnv("JWT_OTP_SECRET"),
    ) as OtpTokenPayload;
  }

  verifyResetToken(token: string): ResetTokenPayload {
    return jwt.verify(
      token,
      getRequiredEnv("JWT_OTP_SECRET"),
    ) as ResetTokenPayload;
  }
}
