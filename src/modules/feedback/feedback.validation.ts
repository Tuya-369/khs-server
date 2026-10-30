import { z } from "zod";

const feedbackIdSchema = z.object({
  params: z.object({
    id: z.string().uuid("ID буруу форматтай байна."),
  }),
});

export const createFeedbackSchema = z.object({
  body: z.object({
    category: z.enum([
      "WORKPLACE",
      "OPERATIONS",
      "MANAGEMENT",
      "COMPENSATION",
      "OTHER",
    ]),
    message: z.string().trim().min(1, "Санал хүсэлт хоосон байна.").max(1000),
  }),
});

export const updateFeedbackStatusSchema = z.object({
  ...feedbackIdSchema.shape,
  body: z.object({
    status: z.enum(["PENDING", "RESOLVED", "SUSPENDED"]),
    response: z.string().trim().max(1000).optional(),
  }),
});
