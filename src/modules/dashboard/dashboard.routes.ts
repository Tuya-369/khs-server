import { Router } from "express";
import { DashboardService } from "./dashboard.service";
import { authenticate } from "../../middlewares/auth.middleware";
import { authorize } from "../../middlewares/role.middleware";

const router = Router();
const service = new DashboardService();

router.get(
  "/admin-summary",
  authenticate,
  authorize("ADMIN"),
  async (req, res, next) => {
    try {
      res.json({ success: true, data: await service.getAdminSummary() });
    } catch (e) {
      next(e);
    }
  },
);

router.get(
  "/token-summary",
  authenticate,
  authorize("TOKEN_MANAGER"),
  async (req, res, next) => {
    try {
      res.json({ success: true, data: await service.getTokenSummary() });
    } catch (e) {
      next(e);
    }
  },
);

export default router;
