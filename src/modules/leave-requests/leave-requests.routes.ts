import { Router } from "express";
import { authenticate } from "../../middlewares/auth.middleware";
import { authorize } from "../../middlewares/role.middleware";
import { upload } from "../../middlewares/upload.middleware";
import { validate } from "../../middlewares/validate.middleware";
import { AppError } from "../../errors/app-error";
import { uploadToCloudinary } from "../../utils/cloudinary";
import { LeaveRequestsService } from "./leave-requests.service";
import {
  createLeaveRequestSchema,
  updateLeaveRequestStatusSchema,
} from "./leave-requests.validation";

const router = Router();
const service = new LeaveRequestsService();

router.post(
  "/",
  authenticate,
  upload.single("proofImage"),
  validate(createLeaveRequestSchema),
  async (req, res, next) => {
    try {
      if (!req.file) {
        throw new AppError(400, "Баталгаажуулах зураг оруулна уу.");
      }

      const proofImageUrl = await uploadToCloudinary(req.file);
      if (!proofImageUrl) {
        throw new AppError(
          400,
          "Зураг амжилттай хуулж чадсангүй. Дахин оролдоно уу.",
        );
      }

      const leaveRequest = await service.createLeaveRequest(
        req.user!.userId,
        { ...req.body, proofImageUrl },
      );
      res.status(201).json({ success: true, data: leaveRequest });
    } catch (error) {
      next(error);
    }
  },
);

router.get("/mine", authenticate, async (req, res, next) => {
  try {
    res.json({
      success: true,
      data: { items: await service.getMine(req.user!.userId) },
    });
  } catch (error) {
    next(error);
  }
});

router.get(
  "/",
  authenticate,
  authorize("SUPERADMIN", "ADMIN_PANEL", "HR"),
  async (req, res, next) => {
    try {
      res.json({
        success: true,
        data: { items: await service.getLeaveRequests(req.user!.userId) },
      });
    } catch (error) {
      next(error);
    }
  },
);

router.patch(
  "/:id/status",
  authenticate,
  authorize("SUPERADMIN", "ADMIN_PANEL", "HR"),
  validate(updateLeaveRequestStatusSchema),
  async (req, res, next) => {
    try {
      const leaveRequest = await service.updateStatus(
        req.user!.userId,
        req.params.id,
        req.body.status,
      );
      res.json({ success: true, data: leaveRequest });
    } catch (error) {
      next(error);
    }
  },
);

export default router;
