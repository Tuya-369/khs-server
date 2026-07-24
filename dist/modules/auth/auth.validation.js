"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateMeSchema = exports.createUserByAdminSchema = exports.verifyOtpSchema = exports.loginSchema = exports.registerSchema = void 0;
const zod_1 = require("zod");
const sapIdSchema = zod_1.z.preprocess((value) => {
    if (typeof value !== "string")
        return value;
    const trimmed = value.trim();
    return trimmed.length === 0 ? undefined : trimmed;
}, zod_1.z.string().min(3, "SAP ID хамгийн багадаа 3 тэмдэгт байна.").optional());
const projectNameSchema = zod_1.z.enum([
    "UG",
    "UB",
    "BAYAJUULAH",
    "PROJECT",
    "OPERATION",
    "CONTRACTION",
]);
exports.registerSchema = zod_1.z.object({
    body: zod_1.z
        .object({
        sapId: sapIdSchema,
        firstName: zod_1.z.string().min(2, "Нэрээ оруулна уу."),
        lastName: zod_1.z.string().min(2, "Овогоо оруулна уу."),
        ProjectName: projectNameSchema,
        phoneNumber: zod_1.z.string().min(8, "Утасны дугаар буруу байна."),
        password: zod_1.z.string().min(6, "Нууц үг хамгийн багадаа 6 тэмдэгт байна."),
        confirmPassword: zod_1.z.string().min(1, "Нууц үгээ давтаж оруулна уу."),
    })
        .refine((value) => value.password === value.confirmPassword, {
        message: "Нууц үг зөрүүтэй байна.",
        path: ["confirmPassword"],
    }),
});
exports.loginSchema = zod_1.z.object({
    body: zod_1.z.object({
        sapId: zod_1.z.string().trim().min(1, "SAP ID эсвэл утасны дугаар оруулна уу."),
        password: zod_1.z.string().min(1, "Нууц үг оруулна уу."),
    }),
});
//hgghjdsklgds
exports.verifyOtpSchema = zod_1.z.object({
    body: zod_1.z.object({
        otpToken: zod_1.z.string().min(1, "OTP сесс токен шаардлагатай ."),
        code: zod_1.z
            .string()
            .trim()
            .regex(/^\d{6}$/, "OTP код 6 оронтой тоо байна."),
    }),
});
exports.createUserByAdminSchema = zod_1.z.object({
    body: zod_1.z.object({
        sapId: sapIdSchema,
        firstName: zod_1.z.string().min(2, "Нэрээ оруулна уу."),
        lastName: zod_1.z.string().min(2, "Овогоо оруулна уу."),
        ProjectName: projectNameSchema,
        phoneNumber: zod_1.z.string().min(8, "Утасны дугаар буруу байна."),
        password: zod_1.z.string().min(6, "Нууц үг хамгийн багадаа 6 тэмдэгт байна."),
        role: zod_1.z.enum(["ADMIN", "DRIVER", "TOKEN_MANAGER", "EMPLOYEE"]),
    }),
});
exports.updateMeSchema = zod_1.z.object({
    body: zod_1.z
        .object({
        firstName: zod_1.z.string().min(2, "Нэрээ оруулна уу.").optional(),
        lastName: zod_1.z.string().min(2, "Овогоо оруулна уу.").optional(),
        ProjectName: projectNameSchema.optional(),
        phoneNumber: zod_1.z.string().min(8, "Утасны дугаар буруу байна.").optional(),
    })
        .refine((value) => value.firstName !== undefined ||
        value.lastName !== undefined ||
        value.ProjectName !== undefined ||
        value.phoneNumber !== undefined, {
        message: "Шинэчлэх дор хаяж нэг талбар оруулна уу.",
    }),
});
