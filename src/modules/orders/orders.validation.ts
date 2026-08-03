import { z } from "zod";

const uuidParam = z.object({
  params: z.object({
    id: z.string().uuid("ID буруу форматтай байна."),
  }),
});

export const createOrderSchema = z.object({
  body: z.object({
    merchItemId: z.string().uuid("Барааны ID буруу байна."),
    size: z.string().min(1, "Хэмжээ заавал оруулна."),
    color: z.string().min(1, "Өнгө заавал оруулна."),
    qty: z.coerce.number().int().min(1).max(100),
  }),
});

export const managerOrdersQuerySchema = z.object({
  query: z.object({
    filter: z
      .enum(["new", "confirmed", "rejected", "unread", "all"])
      .optional(),
  }),
});

export const orderIdParamSchema = uuidParam;
