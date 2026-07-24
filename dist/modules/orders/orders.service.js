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
        if (filter === "unread")
            where.isReadByManager = false;
        return prisma_1.prisma.merchOrder.findMany({
            where,
            include: { user: true, merchItem: true },
            orderBy: { orderedAt: "desc" },
        });
    }
    async confirmOrder(id) {
        return prisma_1.prisma.merchOrder.update({
            where: { id },
            data: { status: "CONFIRMED" },
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
