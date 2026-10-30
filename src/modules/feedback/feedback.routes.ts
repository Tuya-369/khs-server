import { Router } from "express";
import { authenticate } from "../../middlewares/auth.middleware";
import { authorize } from "../../middlewares/role.middleware";
import { validate } from "../../middlewares/validate.middleware";
import { FeedbackService } from "./feedback.service";
import {
  createFeedbackSchema,
  updateFeedbackStatusSchema,
} from "./feedback.validation";

const router = Router();
const service = new FeedbackService();

router.post(
  "/",
  authenticate,
  validate(createFeedbackSchema),
  async (req, res, next) => {
    try {
      const feedback = await service.createFeedback(
        req.user!.userId,
        req.body.message,
        req.body.category,
      );
      res.status(201).json({ success: true, data: feedback });
    } catch (error) {
      next(error);
    }
  },
);

router.get(
  "/",
  authenticate,
  authorize("HR", "ADMIN_PANEL"),
  async (_req, res, next) => {
    try {
      res.json({ success: true, data: { items: await service.getFeedback() } });
    } catch (error) {
      next(error);
    }
  },
);

router.get("/mine", authenticate, async (req, res, next) => {
  try {
    res.json({
      success: true,
      data: { items: await service.getMyFeedback(req.user!.userId) },
    });
  } catch (error) {
    next(error);
  }
});

router.patch(
  "/:id/status",
  authenticate,
  authorize("HR", "ADMIN_PANEL"),
  validate(updateFeedbackStatusSchema),
  async (req, res, next) => {
    try {
      const feedback = await service.updateStatus(
        req.params.id,
        req.body.status,
        req.body.response,
      );
      res.json({ success: true, data: feedback });
    } catch (error) {
      next(error);
    }
  },
);

export default router;
