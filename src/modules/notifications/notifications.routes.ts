import { Router } from "express";
import { authenticate } from "../../middlewares/auth.middleware";
import { NotificationsService } from "./notifications.service";

const router = Router();
const service = new NotificationsService();

router.get("/", authenticate, async (req, res, next) => {
  try {
    const requestedLimit = Number(req.query.limit);
    const limit = Number.isFinite(requestedLimit)
      ? Math.min(Math.max(requestedLimit, 1), 100)
      : 30;

    res.json({
      success: true,
      data: await service.getForUser(req.user!.userId, limit),
    });
  } catch (error) {
    next(error);
  }
});

router.patch("/read-all", authenticate, async (req, res, next) => {
  try {
    await service.markAllRead(req.user!.userId);
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

router.patch("/:id/read", authenticate, async (req, res, next) => {
  try {
    const result = await service.markRead(req.user!.userId, req.params.id);
    if (!result.count) {
      res.status(404).json({ success: false, message: "Мэдэгдэл олдсонгүй." });
      return;
    }

    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

export default router;
