"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticate = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const app_error_1 = require("../errors/app-error");
const authenticate = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return next(new app_error_1.AppError(401, "Нэвтрэх токен олдсонгүй."));
    }
    const token = authHeader.split(" ")[1];
    try {
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_ACCESS_SECRET || "access_secret");
        req.user = decoded;
        next();
    }
    catch (error) {
        return next(new app_error_1.AppError(401, "Хүчингүй эсвэл хугацаа нь дууссан токен."));
    }
};
exports.authenticate = authenticate;
