import { Router } from "express";
import { RequestsController } from "./requests.controller";
import { authenticate } from "../../middlewares/auth.middleware";
import { authorize } from "../../middlewares/role.middleware";
import { upload } from "../../middlewares/upload.middleware";
import { validate } from "../../middlewares/validate.middleware";
import {
  createRequestSchema,
  getAllRequestsSchema,
  requestIdParamSchema,
  updateRequestStatusSchema,
} from "./requests.validation";

const router = Router();
const controller = new RequestsController();

router.post(
  "/",
  authenticate,
  authorize("DRIVER"),
  upload.array("images", 2),
  validate(createRequestSchema),
  controller.create,
);
router.get(
  "/options",
  authenticate,
  authorize("DRIVER"),
  controller.getOptions,
);
router.get("/my", authenticate, authorize("DRIVER"), controller.getMy);

// Admin endpoints
router.get(
  "/",
  authenticate,
  authorize("ADMIN", "ADMIN_PANEL"),
  validate(getAllRequestsSchema),
  controller.getAll,
);
router.get(
  "/:id",
  authenticate,
  authorize("ADMIN"),
  validate(requestIdParamSchema),
  controller.getById,
);
router.patch(
  "/:id/status",
  authenticate,
  authorize("ADMIN"),
  validate(updateRequestStatusSchema),
  controller.updateStatus,
);
router.patch(
  "/:id/claim",
  authenticate,
  authorize("ADMIN"),
  validate(requestIdParamSchema),
  controller.claim,
);
router.patch(
  "/:id/read",
  authenticate,
  authorize("ADMIN"),
  validate(requestIdParamSchema),
  controller.markRead,
);

export default router;
