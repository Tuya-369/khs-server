"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const merch_service_1 = require("./merch.service");
const auth_middleware_1 = require("../../middlewares/auth.middleware");
const role_middleware_1 = require("../../middlewares/role.middleware");
const router = (0, express_1.Router)();
const service = new merch_service_1.MerchService();
router.get("/", async (req, res, next) => {
    try {
        res.json({ success: true, data: await service.getAll() });
    }
    catch (e) {
        next(e);
    }
});
router.get("/:id", async (req, res, next) => {
    try {
        res.json({ success: true, data: await service.getById(req.params.id) });
    }
    catch (e) {
        next(e);
    }
});
router.post("/", auth_middleware_1.authenticate, (0, role_middleware_1.authorize)("TOKEN_MANAGER"), async (req, res, next) => {
    try {
        res
            .status(201)
            .json({ success: true, data: await service.create(req.body) });
    }
    catch (e) {
        next(e);
    }
});
router.patch("/:id", auth_middleware_1.authenticate, (0, role_middleware_1.authorize)("TOKEN_MANAGER"), async (req, res, next) => {
    try {
        res.json({
            success: true,
            data: await service.update(req.params.id, req.body),
        });
    }
    catch (e) {
        next(e);
    }
});
router.delete("/:id", auth_middleware_1.authenticate, (0, role_middleware_1.authorize)("TOKEN_MANAGER"), async (req, res, next) => {
    try {
        await service.delete(req.params.id);
        res.json({ success: true, message: "Устгагдлаа." });
    }
    catch (e) {
        next(e);
    }
});
exports.default = router;
