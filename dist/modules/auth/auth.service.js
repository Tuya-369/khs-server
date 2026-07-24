"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const bcrypt_1 = __importDefault(require("bcrypt"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const app_error_1 = require("../../errors/app-error");
const prisma_1 = require("../../utils/prisma");
const logger_1 = require("../../utils/logger");
class AuthService {
    otpExpiresInMs = 3 * 60 * 1000;
    normalizeSapId(value) {
        if (typeof value !== "string")
            return null;
        const trimmed = value.trim();
        return trimmed.length > 0 ? trimmed : null;
    }
    normalizePhone(value) {
        return typeof value === "string" ? value.trim() : "";
    }
    maskPhone(phoneNumber) {
        if (phoneNumber.length < 4)
            return "****";
        return `${phoneNumber.slice(0, 2)}****${phoneNumber.slice(-2)}`;
    }
    getAccessSecret() {
        return process.env.JWT_ACCESS_SECRET || "access_secret";
    }
    getRefreshSecret() {
        return process.env.JWT_REFRESH_SECRET || "refresh_secret";
    }
    getOtpSecret() {
        return process.env.JWT_OTP_SECRET || this.getAccessSecret();
    }
    issueAccessToken(userId, role) {
        return jsonwebtoken_1.default.sign({ userId, role }, this.getAccessSecret(), {
            expiresIn: "15m",
        });
    }
    issueRefreshToken(userId) {
        return jsonwebtoken_1.default.sign({ userId }, this.getRefreshSecret(), {
            expiresIn: "7d",
        });
    }
    issueOtpToken(userId, phoneNumber) {
        return jsonwebtoken_1.default.sign({ userId, phoneNumber, purpose: "otp_login" }, this.getOtpSecret(), {
            expiresIn: "5m",
        });
    }
    async issueSession(user) {
        const accessToken = this.issueAccessToken(user.id, user.role);
        const refreshToken = this.issueRefreshToken(user.id);
        await prisma_1.prisma.refreshToken.create({
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
    async sendOtp(phoneNumber) {
        const formattedPhone = this.normalizePhone(phoneNumber);
        if (!formattedPhone) {
            throw new app_error_1.AppError(400, "Утасны дугаар хоосон байна.");
        }
        const randomCode = Math.floor(100000 + Math.random() * 900000).toString();
        const expiresAt = new Date(Date.now() + this.otpExpiresInMs);
        await prisma_1.prisma.otpVerification.upsert({
            where: { phoneNumber: formattedPhone },
            update: { code: randomCode, expiresAt },
            create: { phoneNumber: formattedPhone, code: randomCode, expiresAt },
        });
        const endpoint = process.env.CALLPRO_SMS_ENDPOINT || "https://api.callpro.mn/v1/sms/send";
        const apiKey = process.env.CALLPRO_API_KEY;
        const senderName = process.env.CALLPRO_SENDER_NAME || "KHS";
        const smsText = `Таны баталгаажуулах код: ${randomCode}`;
        if (!apiKey) {
            if (process.env.NODE_ENV !== "production") {
                logger_1.logger.warn(`CALLPRO_API_KEY тохируулаагүй тул OTP console дээр: ${formattedPhone} -> ${randomCode}`);
                return {
                    message: "Баталгаажуулах код амжилттай илгээгдлээ.",
                    debugCode: randomCode,
                };
            }
            throw new app_error_1.AppError(500, "CALLPRO_API_KEY тохируулаагүй байна.");
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
            logger_1.logger.error("SMS provider error", {
                status: response.status,
                body: raw,
            });
            const message = process.env.NODE_ENV === "production"
                ? "SMS илгээхэд алдаа гарлаа. Дараа дахин оролдоно уу."
                : `SMS илгээхэд алдаа гарлаа. Status: ${response.status}. ${raw}`;
            throw new app_error_1.AppError(502, message);
        }
        return { message: "Баталгаажуулах код амжилттай илгээгдлээ." };
    }
    async createUserByAdmin(data) {
        const sapId = this.normalizeSapId(data.sapId);
        const existing = sapId
            ? await prisma_1.prisma.user.findUnique({
                where: { sapId },
            })
            : null;
        if (existing) {
            throw new app_error_1.AppError(400, "Энэ SAP ID-тай хэрэглэгч аль хэдийн бүртгэгдсэн байна.", [], "USER_ALREADY_EXISTS");
        }
        const passwordHash = await bcrypt_1.default.hash(data.password, 10);
        return prisma_1.prisma.user.create({
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
    async register(data) {
        const sapId = this.normalizeSapId(data.sapId);
        const existing = sapId
            ? await prisma_1.prisma.user.findUnique({
                where: { sapId },
            })
            : null;
        if (existing)
            throw new app_error_1.AppError(400, "Энэ SAP ID-тай хэрэглэгч аль хэдийн бүртгэгдсэн байна.");
        const passwordHash = await bcrypt_1.default.hash(data.password, 10);
        return prisma_1.prisma.user.create({
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
    async login(data) {
        const identifier = String(data.identifier || data.sapId || "").trim();
        const user = await prisma_1.prisma.user.findFirst({
            where: {
                OR: [{ sapId: identifier }, { phoneNumber: identifier }],
            },
        });
        if (!user || !(await bcrypt_1.default.compare(data.password, user.passwordHash))) {
            throw new app_error_1.AppError(401, "SAP ID/Утас эсвэл нууц үг буруу байна.");
        }
        if (!user.isActive)
            throw new app_error_1.AppError(403, "Таны бүртгэл идэвхгүй байна.");
        // OTP баталгаажуулалт түр хугацаагаар идэвхгүй болгосон (API key байхгүй тул).
        return this.issueSession({
            id: user.id,
            sapId: user.sapId,
            role: user.role,
            firstName: user.firstName,
            lastName: user.lastName,
            ProjectName: user.ProjectName,
        });
    }
    async verifyLoginOtp(data) {
        const { otpToken, code } = data;
        let decoded;
        try {
            decoded = jsonwebtoken_1.default.verify(otpToken, this.getOtpSecret());
        }
        catch {
            throw new app_error_1.AppError(401, "OTP сесс хүчинтэй биш эсвэл хугацаа дууссан.");
        }
        if (decoded.purpose !== "otp_login") {
            throw new app_error_1.AppError(401, "OTP сесс хүчинтэй биш байна.");
        }
        const otp = await prisma_1.prisma.otpVerification.findUnique({
            where: { phoneNumber: decoded.phoneNumber },
        });
        if (!otp) {
            throw new app_error_1.AppError(400, "Баталгаажуулах код олдсонгүй.");
        }
        if (otp.expiresAt < new Date()) {
            await prisma_1.prisma.otpVerification.delete({
                where: { phoneNumber: decoded.phoneNumber },
            });
            throw new app_error_1.AppError(400, "Баталгаажуулах кодын хугацаа дууссан байна.");
        }
        if (otp.code !== String(code).trim()) {
            throw new app_error_1.AppError(400, "Баталгаажуулах код буруу байна.");
        }
        await prisma_1.prisma.otpVerification.delete({
            where: { phoneNumber: decoded.phoneNumber },
        });
        const user = await prisma_1.prisma.user.findUnique({
            where: { id: decoded.userId },
        });
        if (!user) {
            throw new app_error_1.AppError(404, "Хэрэглэгч олдсонгүй.");
        }
        if (!user.isActive) {
            throw new app_error_1.AppError(403, "Таны бүртгэл идэвхгүй байна.");
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
    async refresh(token) {
        const dbToken = await prisma_1.prisma.refreshToken.findUnique({
            where: { token },
            include: { user: true },
        });
        if (!dbToken || dbToken.expiresAt < new Date()) {
            if (dbToken)
                await prisma_1.prisma.refreshToken.delete({ where: { id: dbToken.id } });
            throw new app_error_1.AppError(401, "Хүчингүй эсвэл хугацаа нь дууссан refresh токен.");
        }
        const accessToken = this.issueAccessToken(dbToken.user.id, dbToken.user.role);
        return { accessToken };
    }
    async logout(token) {
        await prisma_1.prisma.refreshToken.deleteMany({ where: { token } });
    }
    async getMe(userId) {
        const user = await prisma_1.prisma.user.findUnique({
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
            throw new app_error_1.AppError(404, "Хэрэглэгч олдсонгүй.", [], "USER_NOT_FOUND");
        }
        return user;
    }
    async updateMe(userId, data) {
        const updateData = {};
        if (data.firstName !== undefined)
            updateData.firstName = data.firstName;
        if (data.lastName !== undefined)
            updateData.lastName = data.lastName;
        if (data.ProjectName !== undefined)
            updateData.ProjectName = data.ProjectName;
        if (data.phoneNumber !== undefined)
            updateData.phoneNumber = data.phoneNumber;
        if (Object.keys(updateData).length === 0) {
            throw new app_error_1.AppError(400, "Шинэчлэх өгөгдөл хоосон байна.");
        }
        const user = await prisma_1.prisma.user.update({
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
exports.AuthService = AuthService;
