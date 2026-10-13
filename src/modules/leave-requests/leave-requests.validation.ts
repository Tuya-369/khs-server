import { z } from "zod";

const leaveRequestIdSchema = z.object({
  params: z.object({
    id: z.string().uuid("ID буруу форматтай байна."),
  }),
});

const dateString = z
  .string()
  .refine((value) => !Number.isNaN(new Date(value).getTime()), {
    message: "Огноо буруу форматтай байна.",
  });

export const createLeaveRequestSchema = z.object({
  body: z
    .object({
      type: z.enum(["SICK", "PERSONAL", "OTHER"]),
      startDate: dateString,
      endDate: dateString,
      reason: z
        .string()
        .trim()
        .min(1, "Шалтгаан хоосон байна.")
        .max(1000),
    })
    .refine(
      (data) => new Date(data.startDate) <= new Date(data.endDate),
      {
        message: "Эхлэх огноо дуусах огнооноос хойш байж болохгүй.",
        path: ["endDate"],
      },
    ),
});

export const updateLeaveRequestStatusSchema = z.object({
  ...leaveRequestIdSchema.shape,
  body: z.object({
    status: z.enum(["APPROVED", "REJECTED"]),
  }),
});
