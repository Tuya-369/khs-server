import { z } from "zod";

const uuidLikePattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const partIdsSchema = z.preprocess(
  (value) => {
    if (typeof value !== "string") return value;

    try {
      return JSON.parse(value);
    } catch {
      return [value];
    }
  },
  z.array(z.string()).max(50, "Нэг хүсэлтэд 50 хүртэл сэлбэг сонгож болно."),
);

const singlePartIdSchema = z.preprocess((value) => {
  if (typeof value !== "string") return value;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}, z.string().optional());

const uuidParam = z.object({
  params: z.object({
    id: z.string().uuid("ID буруу форматтай байна."),
  }),
});

export const createRequestSchema = z.object({
  body: z
    .object({
      vehicleId: z.string().uuid("Машины ID буруу байна."),
      partIds: partIdsSchema.optional(),
      partId: singlePartIdSchema,
      description: z
        .string()
        .min(5, "Тайлбар хамгийн багадаа 5 тэмдэгт байна.")
        .max(1000, "Тайлбар хамгийн ихдээ 1000 тэмдэгт байна."),
    })
    .transform((value) => ({
      ...value,
      partIds:
        value.partIds && value.partIds.length > 0
          ? value.partIds.filter((partId) => uuidLikePattern.test(partId))
          : value.partId
            ? uuidLikePattern.test(value.partId)
              ? [value.partId]
              : []
            : [],
    })),
});

export const getAllRequestsSchema = z.object({
  query: z.object({
    status: z
      .enum(["PENDING", "SEARCHING", "ORDERED", "NOT_FOUND", "COMPLETED"])
      .optional(),
    isReadByAdmin: z.enum(["true", "false"]).optional(),
    page: z.coerce.number().int().min(1).optional(),
    limit: z.coerce.number().int().min(1).max(100).optional(),
  }),
});

export const updateRequestStatusSchema = z.object({
  ...uuidParam.shape,
  body: z.object({
    status: z.enum([
      "PENDING",
      "SEARCHING",
      "ORDERED",
      "NOT_FOUND",
      "COMPLETED",
    ]),
  }),
});

export const requestIdParamSchema = uuidParam;
