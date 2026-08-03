"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppError = void 0;
class AppError extends Error {
    statusCode;
    message;
    errors;
    code;
    constructor(statusCode, message, errors = [], code = "APP_ERROR") {
        super(message);
        this.statusCode = statusCode;
        this.message = message;
        this.errors = errors;
        this.code = code;
        Object.setPrototypeOf(this, new.target.prototype);
        Error.captureStackTrace(this, this.constructor);
    }
}
exports.AppError = AppError;
