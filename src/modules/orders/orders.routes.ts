import { Router } from "express";
import { OrdersService } from "./orders.service";
import { authenticate } from "../../middlewares/auth.middleware";
import { authorize } from "../../middlewares/role.middleware";
import { validate } from "../../middlewares/validate.middleware";
import {
  createOrderSchema,
  managerOrdersQuerySchema,
  orderIdParamSchema,
  updateOrderStatusSchema,
} from "./orders.validation";

const router = Router();
const service = new OrdersService();

router.post(
  "/",
  authenticate,
  authorize(
    "SUPERADMIN",
    "EMPLOYEE",
    "DRIVER",
    "ADMIN",
    "TOKEN_MANAGER",
    "ADMIN_PANEL",
    "HR",
  ),
  validate(createOrderSchema),
  async (req, res, next) => {
    try {
      res.status(201).json({
        success: true,
        data: await service.createOrder(req.user!.userId, req.body),
      });
    } catch (e) {
      next(e);
    }
  },
);

router.get(
  "/my",
  authenticate,
  authorize(
    "SUPERADMIN",
    "EMPLOYEE",
    "DRIVER",
    "ADMIN",
    "TOKEN_MANAGER",
    "ADMIN_PANEL",
    "HR",
  ),
  async (req, res, next) => {
    try {
      res.json({
        success: true,
        data: await service.getMyOrders(req.user!.userId),
      });
    } catch (e) {
      next(e);
    }
  },
);

router.get(
  "/",
  authenticate,
  authorize("TOKEN_MANAGER", "ADMIN_PANEL"),
  validate(managerOrdersQuerySchema),
  async (req, res, next) => {
    try {
      res.json({
        success: true,
        data: await service.getManagerOrders(req.query.filter as string),
      });
    } catch (e) {
      next(e);
    }
  },
);

router.patch(
  "/:id/confirm",
  authenticate,
  authorize("TOKEN_MANAGER", "ADMIN_PANEL"),
  validate(orderIdParamSchema),
  async (req, res, next) => {
    try {
      res.json({
        success: true,
        data: await service.confirmOrder(req.params.id, req.user!.userId),
      });
    } catch (e) {
      next(e);
    }
  },
);

router.patch(
  "/:id/status",
  authenticate,
  authorize("TOKEN_MANAGER", "ADMIN_PANEL"),
  validate(updateOrderStatusSchema),
  async (req, res, next) => {
    try {
      res.json({
        success: true,
        data: await service.updateStatus(req.params.id, req.body.status),
      });
    } catch (error) {
      next(error);
    }
  },
);

router
  .route("/:id/reject")
  .patch(
    authenticate,
    authorize("TOKEN_MANAGER", "ADMIN_PANEL"),
    validate(orderIdParamSchema),
    async (req, res, next) => {
      try {
        res.json({
          success: true,
          data: await service.rejectOrder(req.params.id, req.user!.userId),
        });
      } catch (e) {
        next(e);
      }
    },
  )
  .post(
    authenticate,
    authorize("TOKEN_MANAGER", "ADMIN_PANEL"),
    validate(orderIdParamSchema),
    async (req, res, next) => {
      try {
        res.json({
          success: true,
          data: await service.rejectOrder(req.params.id, req.user!.userId),
        });
      } catch (e) {
        next(e);
      }
    },
  );

router.patch(
  "/:id/read",
  authenticate,
  authorize("TOKEN_MANAGER", "ADMIN_PANEL"),
  validate(orderIdParamSchema),
  async (req, res, next) => {
    try {
      res.json({ success: true, data: await service.markRead(req.params.id) });
    } catch (e) {
      next(e);
    }
  },
);

export default router;
