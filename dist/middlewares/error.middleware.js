"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorMiddleware = void 0;
const multer_1 = __importDefault(require("multer"));
const app_error_1 = require("../errors/app-error");
const logger_1 = require("../utils/logger");
const errorMiddleware = (err, req, res, next) => {
    if (err instanceof multer_1.default.MulterError) {
        if (err.code === "LIMIT_FILE_SIZE") {
            return res.status(400).json({
                success: false,
                code: "FILE_TOO_LARGE",
                message: "Зурагны хэмжээ хэтэрсэн байна.",
                errors: [],
            });
        }
        return res.status(400).json({
            success: false,
            code: "FILE_UPLOAD_ERROR",
            message: "Файл оруулах үед алдаа гарлаа.",
            errors: [],
        });
    }
    if (err instanceof app_error_1.AppError) {
        logger_1.logger.warn(`AppError: ${err.message} [Code: ${err.statusCode}]`);
        return res.status(err.statusCode).json({
            success: false,
            code: err.code,
            message: err.message,
            errors: err.errors,
        });
    }
    logger_1.logger.error(`Unhandled Error: ${err.message}`, { stack: err.stack });
    return res.status(500).json({
        success: false,
        code: "INTERNAL_SERVER_ERROR",
        message: "Серверийн дотоод алдаа гарлаа.",
        errors: [],
    });
};
exports.errorMiddleware = errorMiddleware;
