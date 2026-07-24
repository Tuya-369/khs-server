"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthController = void 0;
const auth_service_1 = require("./auth.service");
const app_error_1 = require("../../errors/app-error");
const authService = new auth_service_1.AuthService();
class AuthController {
    async createByAdmin(req, res, next) {
        try {
            const user = await authService.createUserByAdmin(req.body);
            res.status(201).json({ success: true, data: user });
        }
        catch (error) {
            next(error);
        }
    }
    async register(req, res, next) {
        try {
            const user = await authService.register(req.body);
            res.status(201).json({ success: true, data: user });
        }
        catch (error) {
            next(error);
        }
    }
    async login(req, res, next) {
        try {
            const { user, accessToken, refreshToken } = await authService.login(req.body);
            res.cookie("refreshToken", refreshToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === "production",
                sameSite: "strict",
                maxAge: 7 * 24 * 60 * 60 * 1000,
            });
            res.status(200).json({ success: true, data: { user, accessToken } });
        }
        catch (error) {
            next(error);
        }
    }
    async verifyOtp(req, res, next) {
        try {
            const { user, accessToken, refreshToken } = await authService.verifyLoginOtp(req.body);
            res.cookie("refreshToken", refreshToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === "production",
                sameSite: "strict",
                maxAge: 7 * 24 * 60 * 60 * 1000,
            });
            res.status(200).json({ success: true, data: { user, accessToken } });
        }
        catch (error) {
            next(error);
        }
    }
    async refresh(req, res, next) {
        try {
            const token = req.cookies.refreshToken;
            const { accessToken } = await authService.refresh(token);
            res.status(200).json({ success: true, data: { accessToken } });
        }
        catch (error) {
            next(error);
        }
    }
    async logout(req, res, next) {
        try {
            const token = req.cookies.refreshToken;
            if (token)
                await authService.logout(token);
            res.clearCookie("refreshToken");
            res.status(200).json({ success: true, message: "Амжилттай гарлаа." });
        }
        catch (error) {
            next(error);
        }
    }
    async me(req, res, next) {
        try {
            if (!req.user?.userId) {
                throw new app_error_1.AppError(401, "Нэвтрэлт шаардлагатай.", [], "UNAUTHORIZED");
            }
            const user = await authService.getMe(req.user.userId);
            res.status(200).json({ success: true, data: { user } });
        }
        catch (error) {
            next(error);
        }
    }
    async updateMe(req, res, next) {
        try {
            if (!req.user?.userId) {
                throw new app_error_1.AppError(401, "Нэвтрэлт шаардлагатай.", [], "UNAUTHORIZED");
            }
            const user = await authService.updateMe(req.user.userId, req.body);
            res.status(200).json({ success: true, data: { user } });
        }
        catch (error) {
            next(error);
        }
    }
}
exports.AuthController = AuthController;
