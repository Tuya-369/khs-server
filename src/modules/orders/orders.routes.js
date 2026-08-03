"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const orders_service_1 = require("./orders.service");
const auth_middleware_1 = require("../../middlewares/auth.middleware");
const role_middleware_1 = require("../../middlewares/role.middleware");
const validate_middleware_1 = require("../../middlewares/validate.middleware");
const orders_validation_1 = require("./orders.validation");
const router = (0, express_1.Router)();
const service = new orders_service_1.OrdersService();
router.post(
  "/",
  auth_middleware_1.authenticate,
  (0, role_middleware_1.authorize)(
    "EMPLOYEE",
    "DRIVER",
    "ADMIN",
    "TOKEN_MANAGER",
  ),
  (0, validate_middleware_1.validate)(orders_validation_1.createOrderSchema),
  async (req, res, next) => {
    try {
      res.status(201).json({
        success: true,
        data: await service.createOrder(req.user.userId, req.body),
      });
    } catch (e) {
      next(e);
    }
  },
);
router.get(
  "/my",
  auth_middleware_1.authenticate,
  (0, role_middleware_1.authorize)(
    "EMPLOYEE",
    "DRIVER",
    "ADMIN",
    "TOKEN_MANAGER",
  ),
  async (req, res, next) => {
    try {
      res.json({
        success: true,
        data: await service.getMyOrders(req.user.userId),
      });
    } catch (e) {
      next(e);
    }
  },
);
router.get(
  "/",
  auth_middleware_1.authenticate,
  (0, role_middleware_1.authorize)("TOKEN_MANAGER"),
  (0, validate_middleware_1.validate)(
    orders_validation_1.managerOrdersQuerySchema,
  ),
  async (req, res, next) => {
    try {
      res.json({
        success: true,
        data: await service.getManagerOrders(req.query.filter),
      });
    } catch (e) {
      next(e);
    }
  },
);
router.patch(
  "/:id/confirm",
  auth_middleware_1.authenticate,
  (0, role_middleware_1.authorize)("TOKEN_MANAGER"),
  (0, validate_middleware_1.validate)(orders_validation_1.orderIdParamSchema),
  async (req, res, next) => {
    try {
      res.json({
        success: true,
        data: await service.confirmOrder(req.params.id),
      });
    } catch (e) {
      next(e);
    }
  },
);
router.post(
  "/:id/reject",
  auth_middleware_1.authenticate,
  (0, role_middleware_1.authorize)("TOKEN_MANAGER"),
  (0, validate_middleware_1.validate)(orders_validation_1.orderIdParamSchema),
  async (req, res, next) => {
    try {
      res.json({
        success: true,
        data: await service.rejectOrder(req.params.id, req.user.userId),
      });
    } catch (e) {
      next(e);
    }
  },
);
router.patch(
  "/:id/reject",
  auth_middleware_1.authenticate,
  (0, role_middleware_1.authorize)("TOKEN_MANAGER"),
  (0, validate_middleware_1.validate)(orders_validation_1.orderIdParamSchema),
  async (req, res, next) => {
    try {
      res.json({
        success: true,
        data: await service.rejectOrder(req.params.id, req.user.userId),
      });
    } catch (e) {
      next(e);
    }
  },
);
router.patch(
  "/:id/read",
  auth_middleware_1.authenticate,
  (0, role_middleware_1.authorize)("TOKEN_MANAGER"),
  (0, validate_middleware_1.validate)(orders_validation_1.orderIdParamSchema),
  async (req, res, next) => {
    try {
      res.json({ success: true, data: await service.markRead(req.params.id) });
    } catch (e) {
      next(e);
    }
  },
);
exports.default = router;
