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
      durationType: z.enum(["DAILY", "HOURLY"]),
      selectedApproverPhoneNumber: z
        .string()
        .regex(/^\d{8}$/, "Батлагчийн дугаар буруу байна."),
      selectedHrPhoneNumber: z
        .string()
        .regex(/^\d{8}$/, "ХН ажилтны дугаар буруу байна.")
        .optional(),
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
    )
    .superRefine((data, context) => {
      if (data.durationType !== "HOURLY") return;

      if (data.startDate.slice(0, 10) !== data.endDate.slice(0, 10)) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Цагийн чөлөө нэг өдөрт багтах ёстой.",
          path: ["endDate"],
        });
      }

      if (new Date(data.startDate) >= new Date(data.endDate)) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Дуусах цаг эхлэх цагаас хойш байна.",
          path: ["endDate"],
        });
      }
    }),
});

export const updateLeaveRequestStatusSchema = z.object({
  ...leaveRequestIdSchema.shape,
  body: z.object({
    status: z.enum(["APPROVED", "REJECTED"]),
  }),
});
