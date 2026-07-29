"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requestIdParamSchema = exports.updateRequestStatusSchema = exports.getAllRequestsSchema = exports.createRequestSchema = void 0;
const zod_1 = require("zod");
const uuidParam = zod_1.z.object({
    params: zod_1.z.object({
        id: zod_1.z.string().uuid("ID буруу форматтай байна."),
    }),
});
exports.createRequestSchema = zod_1.z.object({
    body: zod_1.z.object({
        vehicleId: zod_1.z.string().uuid("Машины ID буруу байна."),
        partId: zod_1.z
            .string()
            .uuid("Сэлбэгийн ID буруу байна.")
            .optional()
            .or(zod_1.z.literal("")),
        description: zod_1.z
            .string()
            .min(5, "Тайлбар хамгийн багадаа 5 тэмдэгт байна.")
            .max(1000, "Тайлбар хамгийн ихдээ 1000 тэмдэгт байна."),
    }),
});
exports.getAllRequestsSchema = zod_1.z.object({
    query: zod_1.z.object({
        status: zod_1.z.enum(["PENDING", "APPROVED", "REJECTED"]).optional(),
        isReadByAdmin: zod_1.z.enum(["true", "false"]).optional(),
        page: zod_1.z.coerce.number().int().min(1).optional(),
        limit: zod_1.z.coerce.number().int().min(1).max(100).optional(),
    }),
});
exports.updateRequestStatusSchema = zod_1.z.object({
    ...uuidParam.shape,
    body: zod_1.z.object({
        status: zod_1.z.enum(["PENDING", "APPROVED", "REJECTED"]),
    }),
});
exports.requestIdParamSchema = uuidParam;
