import { z } from "zod";

const partIdsSchema = z.preprocess(
  (value) => {
    if (typeof value !== "string") return value;

    try {
      return JSON.parse(value);
    } catch {
      return [value];
    }
  },
  z
    .array(z.string().uuid("Сэлбэгийн ID буруу байна."))
    .min(1, "Дор хаяж нэг сэлбэг сонгоно уу.")
    .max(50, "Нэг хүсэлтэд 50 хүртэл сэлбэг сонгож болно."),
);

const uuidParam = z.object({
  params: z.object({
    id: z.string().uuid("ID буруу форматтай байна."),
  }),
});

export const createRequestSchema = z.object({
  body: z.object({
    vehicleId: z.string().uuid("Машины ID буруу байна."),
    partIds: partIdsSchema,
    description: z
      .string()
      .min(5, "Тайлбар хамгийн багадаа 5 тэмдэгт байна.")
      .max(1000, "Тайлбар хамгийн ихдээ 1000 тэмдэгт байна."),
  }),
});

export const getAllRequestsSchema = z.object({
  query: z.object({
    status: z.enum(["PENDING", "APPROVED", "REJECTED"]).optional(),
    isReadByAdmin: z.enum(["true", "false"]).optional(),
    page: z.coerce.number().int().min(1).optional(),
    limit: z.coerce.number().int().min(1).max(100).optional(),
  }),
});

export const updateRequestStatusSchema = z.object({
  ...uuidParam.shape,
  body: z.object({
    status: z.enum(["PENDING", "APPROVED", "REJECTED"]),
  }),
});

export const requestIdParamSchema = uuidParam;
