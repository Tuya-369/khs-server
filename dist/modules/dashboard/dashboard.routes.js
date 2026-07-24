"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const dashboard_service_1 = require("./dashboard.service");
const auth_middleware_1 = require("../../middlewares/auth.middleware");
const role_middleware_1 = require("../../middlewares/role.middleware");
const router = (0, express_1.Router)();
const service = new dashboard_service_1.DashboardService();
router.get("/admin-summary", auth_middleware_1.authenticate, (0, role_middleware_1.authorize)("ADMIN"), async (req, res, next) => {
    try {
        res.json({ success: true, data: await service.getAdminSummary() });
    }
    catch (e) {
        next(e);
    }
});
router.get("/token-summary", auth_middleware_1.authenticate, (0, role_middleware_1.authorize)("TOKEN_MANAGER"), async (req, res, next) => {
    try {
        res.json({ success: true, data: await service.getTokenSummary() });
    }
    catch (e) {
        next(e);
    }
});
exports.default = router;
