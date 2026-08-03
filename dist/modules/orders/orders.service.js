"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrdersService = void 0;
const app_error_1 = require("../../errors/app-error");
const prisma_1 = require("../../utils/prisma");
class OrdersService {
    async createOrder(userId, data) {
        const item = await prisma_1.prisma.merchItem.findUnique({
            where: { id: data.merchItemId },
        });
        if (!item || !item.isActive || item.stock < data.qty) {
            throw new app_error_1.AppError(400, "Бараа олдсонгүй эсвэл үлдэгдэл хүрэлцэхгүй байна.");
        }
        return prisma_1.prisma.$transaction(async (tx) => {
            await tx.merchItem.update({
                where: { id: item.id },
                data: { stock: { decrement: data.qty } },
            });
            return tx.merchOrder.create({
                data: {
                    userId,
                    merchItemId: data.merchItemId,
                    size: data.size,
                    color: data.color,
                    qty: data.qty,
                },
            });
        });
    }
    async getMyOrders(userId) {
        return prisma_1.prisma.merchOrder.findMany({
            where: { userId },
            include: { merchItem: true },
        });
    }
    async getManagerOrders(filter) {
        const where = {};
        if (filter === "new")
            where.status = "NEW";
        if (filter === "confirmed")
            where.status = "CONFIRMED";
        if (filter === "rejected")
            where.status = "REJECTED";
        if (filter === "unread")
            where.isReadByManager = false;
        return prisma_1.prisma.merchOrder.findMany({
            where,
            include: { user: true, merchItem: true },
            orderBy: { orderedAt: "desc" },
        });
    }
    async confirmOrder(id) {
        const order = await prisma_1.prisma.merchOrder.findUnique({ where: { id } });
        if (!order) {
            throw new app_error_1.AppError(404, "Захиалга олдсонгүй.", [], "ORDER_NOT_FOUND");
        }
        if (order.status !== "NEW") {
            throw new app_error_1.AppError(409, "Энэ захиалгын төлөв аль хэдийн шийдэгдсэн байна.");
        }
        return prisma_1.prisma.merchOrder.update({
            where: { id },
            data: { status: "CONFIRMED" },
        });
    }
    async rejectOrder(id, managerId) {
        const order = await prisma_1.prisma.merchOrder.findUnique({ where: { id } });
        if (!order) {
            throw new app_error_1.AppError(404, "Захиалга олдсонгүй.", [], "ORDER_NOT_FOUND");
        }
        if (order.status !== "NEW") {
            throw new app_error_1.AppError(409, "Энэ захиалгын төлөв аль хэдийн шийдэгдсэн байна.");
        }
        return prisma_1.prisma.$transaction(async (tx) => {
            const rejectedOrder = await tx.merchOrder.update({
                where: { id },
                data: {
                    status: "REJECTED",
                    rejectedAt: new Date(),
                    rejectedById: managerId,
                },
                include: { user: true, merchItem: true },
            });
            await tx.notification.create({
                data: {
                    userId: rejectedOrder.userId,
                    title: "Барааны захиалга батлагдаагүй",
                    message: "Таны барааны захиалга батлагдаагүй.",
                },
            });
            return rejectedOrder;
        });
    }
    async markRead(id) {
        return prisma_1.prisma.merchOrder.update({
            where: { id },
            data: { isReadByManager: true },
        });
    }
}
exports.OrdersService = OrdersService;
