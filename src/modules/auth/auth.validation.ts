import { z } from "zod";

export const registerSchema = z.object({
  body: z.object({
    sapId: z.string().min(3, "SAP ID хамгийн багадаа 3 тэмдэгт байна."),
    firstName: z.string().min(2, "Нэрээ оруулна уу."),
    lastName: z.string().min(2, "Овогоо оруулна уу."),
    phoneNumber: z.string().min(8, "Утасны дугаар буруу байна."),
    password: z.string().min(6, "Нууц үг хамгийн багадаа 6 тэмдэгт байна."),
  }),
});

export const loginSchema = z.object({
  body: z.object({
    sapId: z.string().min(1, "SAP ID оруулна уу."),
    password: z.string().min(1, "Нууц үг оруулна уу."),
  }),
});

export const createUserByAdminSchema = z.object({
  body: z.object({
    sapId: z.string().min(3, "SAP ID хамгийн багадаа 3 тэмдэгт байна."),
    firstName: z.string().min(2, "Нэрээ оруулна уу."),
    lastName: z.string().min(2, "Овогоо оруулна уу."),
    phoneNumber: z.string().min(8, "Утасны дугаар буруу байна."),
    password: z.string().min(6, "Нууц үг хамгийн багадаа 6 тэмдэгт байна."),
    role: z.enum(["ADMIN", "DRIVER", "TOKEN_MANAGER", "EMPLOYEE"]),
  }),
});
