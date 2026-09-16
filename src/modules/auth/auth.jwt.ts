import jwt from "jsonwebtoken";
import { OtpTokenPayload, ResetTokenPayload } from "./auth.types";
import { getRequiredEnv } from "./auth.utils";

export class AuthJwt {
  constructor(private readonly otpExpiresInSeconds: number) {}

  issueAccessToken(userId: string, role: string): string {
    return jwt.sign({ userId, role }, getRequiredEnv("JWT_ACCESS_SECRET"), {
      expiresIn: "3h",
    });
  }

  issueRefreshToken(userId: string): string {
    return jwt.sign({ userId }, getRequiredEnv("JWT_REFRESH_SECRET"));
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
