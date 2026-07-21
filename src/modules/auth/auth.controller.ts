import { Request, Response, NextFunction } from "express";
import { AuthService } from "./auth.service";
import { AppError } from "../../errors/app-error";

const authService = new AuthService();

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

  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const { user, accessToken, refreshToken } = await authService.login(
        req.body,
      );
      res.cookie("refreshToken", refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });
      res.status(200).json({ success: true, data: { user, accessToken } });
    } catch (error) {
      next(error);
    }
  }

  async refresh(req: Request, res: Response, next: NextFunction) {
    try {
      const token = req.cookies.refreshToken;
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
      res.clearCookie("refreshToken");
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
}
