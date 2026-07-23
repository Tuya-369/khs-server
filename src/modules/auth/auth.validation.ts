import { z } from "zod";

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
  "CONTRACTION",
]);

export const registerSchema = z.object({
  body: z
    .object({
      sapId: sapIdSchema,
      firstName: z.string().min(2, "Нэрээ оруулна уу."),
      lastName: z.string().min(2, "Овогоо оруулна уу."),
      ProjectName: projectNameSchema,
      phoneNumber: z.string().min(8, "Утасны дугаар буруу байна."),
      password: z.string().min(6, "Нууц үг хамгийн багадаа 6 тэмдэгт байна."),
      confirmPassword: z.string().min(1, "Нууц үгээ давтаж оруулна уу."),
    })
    .refine((value) => value.password === value.confirmPassword, {
      message: "Нууц үг зөрүүтэй байна.",
      path: ["confirmPassword"],
    }),
});

export const loginSchema = z.object({
  body: z.object({
    sapId: z.string().trim().min(1, "SAP ID эсвэл утасны дугаар оруулна уу."),
    password: z.string().min(1, "Нууц үг оруулна уу."),
  }),
});

export const verifyOtpSchema = z.object({
  body: z.object({
    otpToken: z.string().min(1, "OTP сесс токен шаардлагатай."),
    code: z
      .string()
      .trim()
      .regex(/^\d{6}$/, "OTP код 6 оронтой тоо байна."),
  }),
});

export const createUserByAdminSchema = z.object({
  body: z.object({
    sapId: sapIdSchema,
    firstName: z.string().min(2, "Нэрээ оруулна уу."),
    lastName: z.string().min(2, "Овогоо оруулна уу."),
    ProjectName: projectNameSchema,
    phoneNumber: z.string().min(8, "Утасны дугаар буруу байна."),
    password: z.string().min(6, "Нууц үг хамгийн багадаа 6 тэмдэгт байна."),
    role: z.enum(["ADMIN", "DRIVER", "TOKEN_MANAGER", "EMPLOYEE"]),
  }),
});

export const updateMeSchema = z.object({
  body: z
    .object({
      firstName: z.string().min(2, "Нэрээ оруулна уу.").optional(),
      lastName: z.string().min(2, "Овогоо оруулна уу.").optional(),
      ProjectName: projectNameSchema.optional(),
      phoneNumber: z.string().min(8, "Утасны дугаар буруу байна.").optional(),
    })
    .refine(
      (value) =>
        value.firstName !== undefined ||
        value.lastName !== undefined ||
        value.ProjectName !== undefined ||
        value.phoneNumber !== undefined,
      {
        message: "Шинэчлэх дор хаяж нэг талбар оруулна уу.",
      },
    ),
});
