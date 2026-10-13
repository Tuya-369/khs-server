import { Request, Response, NextFunction } from "express";
import { AuthService } from "./auth.service";
import { REFRESH_TOKEN_TTL_MS } from "./auth.jwt";
import { AppError } from "../../errors/app-error";

const authService = new AuthService();
const otpCookieMaxAgeMs = 60 * 1000;

const getCookieOptions = (maxAge?: number) => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite:
    process.env.NODE_ENV === "production"
      ? ("none" as const)
      : ("strict" as const),
  ...(maxAge ? { maxAge } : {}),
});

export class AuthController {
  async createByAdmin(req: Request, res: Response, next: NextFunction) {
    try {
      const user = await authService.createUserByAdmin(req.body);
      res.status(201).json({ success: true, data: user });
    } catch (error) {
      next(error);
    }
  }

  async register(req: Request, res: Response, next: NextFunction) {
    try {
      const user = await authService.register(req.body);
      res.status(201).json({ success: true, data: user });
    } catch (error) {
      next(error);
    }
  }

  async requestRegistrationOtp(
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const result = await authService.requestRegistrationOtp(req.body);
      res.status(200).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  async verifyRegistrationOtp(req: Request, res: Response, next: NextFunction) {
    try {
      const user = await authService.verifyRegistrationOtp(req.body);
      res.status(201).json({ success: true, data: user });
    } catch (error) {
      next(error);
    }
  }

  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await authService.login(req.body);

      res.cookie(
        "otpToken",
        result.otpToken,
        getCookieOptions(otpCookieMaxAgeMs),
      );

      res.status(200).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  async verifyOtp(req: Request, res: Response, next: NextFunction) {
    try {
      const otpToken = req.body.otpToken || req.cookies.otpToken;
      if (!otpToken) {
        throw new AppError(
          400,
          "OTP сесс токен олдсонгүй. Login-г дахин хийгээд кодоо баталгаажуулна уу.",
          [],
          "OTP_TOKEN_MISSING",
        );
      }

      const { user, accessToken, refreshToken } =
        await authService.verifyLoginOtp({
          otpToken,
          code: req.body.code,
        });

      res.clearCookie("otpToken", getCookieOptions());

      res.cookie("refreshToken", refreshToken, {
        ...getCookieOptions(REFRESH_TOKEN_TTL_MS),
        expires: new Date(Date.now() + REFRESH_TOKEN_TTL_MS),
      });

      res.status(200).json({ success: true, data: { user, accessToken } });
    } catch (error) {
      next(error);
    }
  }

  async forgotPassword(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await authService.forgotPassword(req.body.phoneNumber);
      res.status(200).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  async verifyForgotOtp(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await authService.verifyForgotOtp(req.body);
      res.status(200).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  async resetPassword(req: Request, res: Response, next: NextFunction) {
    try {
      await authService.resetPassword(req.body);
      res
        .status(200)
        .json({ success: true, message: "Нууц үг амжилттай шинэчлэгдлээ." });
    } catch (error) {
      next(error);
    }
  }

  async refresh(req: Request, res: Response, next: NextFunction) {
    try {
      const token = req.cookies.refreshToken;
      if (!token) {
        throw new AppError(401, "Refresh токен олдсонгүй.");
      }
      const { accessToken } = await authService.refresh(token);
      res.status(200).json({ success: true, data: { accessToken } });
    } catch (error) {
      next(error);
    }
  }

  async logout(req: Request, res: Response, next: NextFunction) {
    try {
      const token = req.cookies.refreshToken;
      if (token) await authService.logout(token);
      res.clearCookie("refreshToken", getCookieOptions());
      res.status(200).json({ success: true, message: "Амжилттай гарлаа." });
    } catch (error) {
      next(error);
    }
  }

  async me(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user?.userId) {
        throw new AppError(401, "Нэвтрэлт шаардлагатай.", [], "UNAUTHORIZED");
      }

      const user = await authService.getMe(req.user.userId);
      res.status(200).json({ success: true, data: { user } });
    } catch (error) {
      next(error);
    }
  }

  async updateMe(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user?.userId) {
        throw new AppError(401, "Нэвтрэлт шаардлагатай.", [], "UNAUTHORIZED");
      }

      const user = await authService.updateMe(
        req.user.userId,
        req.body,
        req.file,
      );
      res.status(200).json({ success: true, data: { user } });
    } catch (error) {
      next(error);
    }
  }
}
