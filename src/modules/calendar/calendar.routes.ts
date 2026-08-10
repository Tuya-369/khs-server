import { Router } from "express";
import { authenticate } from "../../middlewares/auth.middleware";
import { validate } from "../../middlewares/validate.middleware";
import { CalendarService } from "./calendar.service";
import {
  calendarNoteIdSchema,
  createCalendarNoteSchema,
  updateCalendarNoteSchema,
} from "./calendar.validation";

const router = Router();
const service = new CalendarService();

router.get("/notes", authenticate, async (req, res, next) => {
  try {
    res.json({ success: true, data: await service.getNotes(req.user!.userId) });
  } catch (error) {
    next(error);
  }
});

router.post(
  "/notes",
  authenticate,
  validate(createCalendarNoteSchema),
  async (req, res, next) => {
    try {
      res.status(201).json({
        success: true,
        data: await service.createNote(
          req.user!.userId,
          req.body.noteDate,
          req.body.text,
        ),
      });
    } catch (error) {
      next(error);
    }
  },
);

router.patch(
  "/notes/:id",
  authenticate,
  validate(updateCalendarNoteSchema),
  async (req, res, next) => {
    try {
      res.json({
        success: true,
        data: await service.updateNote(
          req.user!.userId,
          req.params.id,
          req.body.done,
        ),
      });
    } catch (error) {
      next(error);
    }
  },
);

router.delete(
  "/notes/:id",
  authenticate,
  validate(calendarNoteIdSchema),
  async (req, res, next) => {
    try {
      await service.deleteNote(req.user!.userId, req.params.id);
      res.status(204).end();
    } catch (error) {
      next(error);
    }
  },
);

export default router;
