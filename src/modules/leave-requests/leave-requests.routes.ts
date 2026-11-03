import { Router } from "express";
import { authenticate } from "../../middlewares/auth.middleware";
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

      await service.validateApproverForRequest(
        req.user!.userId,
        {
          durationType: req.body.durationType,
          startDate: req.body.startDate,
          endDate: req.body.endDate,
          selectedApproverPhoneNumber:
            req.body.selectedApproverPhoneNumber,
          selectedHrPhoneNumber: req.body.selectedHrPhoneNumber,
        },
      );
      const proofImageUrl = await uploadToCloudinary(req.file);
      if (!proofImageUrl) {
        throw new AppError(
          400,
          "Зураг амжилттай хуулж чадсангүй. Дахин оролдоно уу.",
        );
      }

      const leaveRequest = await service.createLeaveRequest(req.user!.userId, {
        ...req.body,
        proofImageUrl,
      });
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

router.get("/approvers", authenticate, async (req, res, next) => {
  try {
    const approvers = await service.getApprovers(req.user!.userId);
    res.json({
      success: true,
      data: approvers,
    });
  } catch (error) {
    next(error);
  }
});

router.get("/review-access", authenticate, async (req, res, next) => {
  try {
    res.json({
      success: true,
      data: { canReview: await service.hasReviewAccess(req.user!.userId) },
    });
  } catch (error) {
    next(error);
  }
});

router.get("/", authenticate, async (req, res, next) => {
  try {
    res.json({
      success: true,
      data: { items: await service.getLeaveRequests(req.user!.userId) },
    });
  } catch (error) {
    next(error);
  }
});

router.patch(
  "/:id/status",
  authenticate,
  validate(updateLeaveRequestStatusSchema),
  async (req, res, next) => {
    try {
      const leaveRequest = await service.updateStatus(
        req.user!.userId,
        req.params.id,
        req.body.status,
        req.body.comment,
      );
      res.json({ success: true, data: leaveRequest });
    } catch (error) {
      next(error);
    }
  },
);

export default router;
