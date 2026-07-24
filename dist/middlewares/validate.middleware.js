"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validate = void 0;
const zod_1 = require("zod");
const app_error_1 = require("../errors/app-error");
const validate = (schema) => {
    return async (req, res, next) => {
        try {
            await schema.parseAsync({
                body: req.body,
                query: req.query,
                params: req.params,
            });
            return next();
        }
        catch (error) {
            if (error instanceof zod_1.ZodError) {
                const formattedErrors = error.errors.map((err) => ({
                    field: err.path.join(".").replace(/^(body|query|params)\./, ""),
                    message: err.message,
                }));
                const firstMessage = formattedErrors[0]?.message || "Оруулсан өгөгдөл буруу байна.";
                return next(new app_error_1.AppError(400, firstMessage, formattedErrors, "VALIDATION_ERROR"));
            }
            return next(error);
        }
    };
};
exports.validate = validate;
