import { z } from "zod";

const phoneNumberSchema = z
  .string()
  .trim()
  .transform((value) => value.replace(/\D/g, ""))
  .transform((value) => {
    if (value.length === 11 && value.startsWith("976")) return value.slice(3);
    if (value.length === 9 && value.startsWith("0")) return value.slice(1);
    return value;
  })
  .refine((value) => /^\d{8}$/.test(value), "Утасны дугаар буруу байна.");

const sapIdSchema = z.preprocess((value) => {
  if (typeof value !== "string") return value;
  const trimmed = value.trim();
  return trimmed.length === 0 ? undefined : trimmed;
}, z.string().min(3, "SAP ID хамгийн багадаа 3 тэмдэгт байна.").optional());

const projectNameSchema = z.enum([
  "UG",
  "UB",
  "BAYAJUULAH",
  "PROJECT",
  "OPERATION",
]);

export const registerSchema = z.object({
  body: z
    .object({
      sapId: sapIdSchema,
      firstName: z.string().min(2, "Нэрээ оруулна уу."),
      lastName: z.string().min(2, "Овогоо оруулна уу."),
      phoneNumber: phoneNumberSchema,
      password: z.string().min(6, "Нууц үг хамгийн багадаа 6 тэмдэгт байна."),
      confirmPassword: z.string().min(1, "Нууц үгээ давтаж оруулна уу."),
    })
    .refine((value) => value.password === value.confirmPassword, {
      message: "Нууц үг зөрүүтэй байна.",
      path: ["confirmPassword"],
    }),
});

export const loginSchema = z.object({
  body: z
    .object({
      sapId: z.string().trim().optional(),
      identifier: z.string().trim().optional(),
      password: z.string().min(1, "Нууц үг оруулна уу."),
    })
    .refine(
      (value) =>
        Boolean(value.identifier && value.identifier.trim().length > 0) ||
        Boolean(value.sapId && value.sapId.trim().length > 0),
      {
        message: "SAP ID эсвэл утасны дугаар оруулна уу.",
        path: ["identifier"],
      },
    ),
});
//hgghjdsklgds
export const verifyOtpSchema = z.object({
  body: z.object({
    otpToken: z.string().min(1, "OTP сесс токен шаардлагатай.").optional(),
    code: z
      .string()
      .trim()
      .regex(/^\d{4}$/, "OTP код 4 оронтой тоо байна."),
  }),
});

const otpCodeSchema = z
  .string()
  .trim()
  .regex(/^\d{4}$/, "OTP код 4 оронтой тоо байна.");

export const forgotPasswordSchema = z.object({
  body: z.object({ phoneNumber: phoneNumberSchema }),
});

export const verifyForgotOtpSchema = z.object({
  body: z.object({ phoneNumber: phoneNumberSchema, code: otpCodeSchema }),
});

export const resetPasswordSchema = z.object({
  body: z
    .object({
      resetToken: z
        .string()
        .min(1, "Нууц үг солих баталгаажуулалт шаардлагатай."),
      password: z.string().min(6, "Нууц үг хамгийн багадаа 6 тэмдэгт байна."),
      confirmPassword: z.string().min(1, "Нууц үгээ давтаж оруулна уу."),
    })
    .refine((value) => value.password === value.confirmPassword, {
      message: "Нууц үг зөрүүтэй байна.",
      path: ["confirmPassword"],
    }),
});

export const requestRegistrationOtpSchema = z.object({
  body: registerSchema.shape.body,
});

export const verifyRegistrationOtpSchema = z.object({
  body: z.object({ phoneNumber: phoneNumberSchema, code: otpCodeSchema }),
});

export const createUserByAdminSchema = z.object({
  body: z.object({
    sapId: sapIdSchema,
    firstName: z.string().min(2, "Нэрээ оруулна уу."),
    lastName: z.string().min(2, "Овогоо оруулна уу."),
    ProjectName: projectNameSchema,
    phoneNumber: phoneNumberSchema,
    password: z.string().min(6, "Нууц үг хамгийн багадаа 6 тэмдэгт байна."),
    role: z.enum([
      "SUPERADMIN",
      "ADMIN",
      "ADMIN_PANEL",
      "DRIVER",
      "TOKEN_MANAGER",
      "EMPLOYEE",
    ]),
  }),
});

export const updateMeSchema = z.object({
  body: z.object({
    firstName: z.string().min(2, "Нэрээ оруулна уу.").optional(),
    lastName: z.string().min(2, "Овогоо оруулна уу.").optional(),
    ProjectName: projectNameSchema.optional(),
    phoneNumber: phoneNumberSchema.optional(),
  }),
});
