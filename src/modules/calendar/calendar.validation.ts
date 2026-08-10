import { z } from "zod";

const uuidParam = z.object({
  params: z.object({
    id: z.string().uuid("ID буруу форматтай байна."),
  }),
});

const noteDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Огноо буруу байна.");

export const createCalendarNoteSchema = z.object({
  body: z.object({
    noteDate,
    text: z.string().trim().min(1, "Тэмдэглэл хоосон байна.").max(500),
  }),
});

export const updateCalendarNoteSchema = z.object({
  ...uuidParam.shape,
  body: z.object({
    done: z.boolean(),
  }),
});

export const calendarNoteIdSchema = uuidParam;
