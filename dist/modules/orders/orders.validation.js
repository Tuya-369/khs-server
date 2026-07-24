"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.orderIdParamSchema = exports.managerOrdersQuerySchema = exports.createOrderSchema = void 0;
const zod_1 = require("zod");
const uuidParam = zod_1.z.object({
    params: zod_1.z.object({
        id: zod_1.z.string().uuid("ID буруу форматтай байна."),
    }),
});
exports.createOrderSchema = zod_1.z.object({
    body: zod_1.z.object({
        merchItemId: zod_1.z.string().uuid("Барааны ID буруу байна."),
        size: zod_1.z.string().min(1, "Хэмжээ заавал оруулна."),
        color: zod_1.z.string().min(1, "Өнгө заавал оруулна."),
        qty: zod_1.z.coerce.number().int().min(1).max(100),
    }),
});
exports.managerOrdersQuerySchema = zod_1.z.object({
    query: zod_1.z.object({
        filter: zod_1.z.enum(["new", "confirmed", "unread", "all"]).optional(),
    }),
});
exports.orderIdParamSchema = uuidParam;
