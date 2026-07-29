"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const requests_controller_1 = require("./requests.controller");
const auth_middleware_1 = require("../../middlewares/auth.middleware");
const role_middleware_1 = require("../../middlewares/role.middleware");
const upload_middleware_1 = require("../../middlewares/upload.middleware");
const validate_middleware_1 = require("../../middlewares/validate.middleware");
const requests_validation_1 = require("./requests.validation");
const router = (0, express_1.Router)();
const controller = new requests_controller_1.RequestsController();
router.post("/", auth_middleware_1.authenticate, (0, role_middleware_1.authorize)("DRIVER"), upload_middleware_1.upload.array("images", 5), (0, validate_middleware_1.validate)(requests_validation_1.createRequestSchema), controller.create);
router.get("/options", auth_middleware_1.authenticate, (0, role_middleware_1.authorize)("DRIVER"), controller.getOptions);
router.get("/my", auth_middleware_1.authenticate, (0, role_middleware_1.authorize)("DRIVER"), controller.getMy);
// Admin endpoints
router.get("/", auth_middleware_1.authenticate, (0, role_middleware_1.authorize)("ADMIN"), (0, validate_middleware_1.validate)(requests_validation_1.getAllRequestsSchema), controller.getAll);
router.patch("/:id/status", auth_middleware_1.authenticate, (0, role_middleware_1.authorize)("ADMIN"), (0, validate_middleware_1.validate)(requests_validation_1.updateRequestStatusSchema), controller.updateStatus);
router.patch("/:id/read", auth_middleware_1.authenticate, (0, role_middleware_1.authorize)("ADMIN"), (0, validate_middleware_1.validate)(requests_validation_1.requestIdParamSchema), controller.markRead);
exports.default = router;
