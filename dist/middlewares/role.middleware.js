"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authorize = void 0;
const app_error_1 = require("../errors/app-error");
const authorize = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return next(new app_error_1.AppError(401, "Хэрэглэгч баталгаажаагүй байна."));
        }
        if (!roles.includes(req.user.role)) {
            return next(new app_error_1.AppError(403, "Танд энэ үйлдлийг хийх эрх байхгүй байна."));
        }
        next();
    };
};
exports.authorize = authorize;
