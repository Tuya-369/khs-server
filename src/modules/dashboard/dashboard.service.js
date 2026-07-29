"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DashboardService = void 0;
const prisma_1 = require("../../utils/prisma");
class DashboardService {
    async getAdminSummary() {
        const totalRequests = await prisma_1.prisma.repairRequest.count();
        const pendingRequests = await prisma_1.prisma.repairRequest.count({
            where: { status: "PENDING" },
        });
        const totalVehicles = await prisma_1.prisma.vehicle.count();
        return { totalRequests, pendingRequests, totalVehicles };
    }
    async getTokenSummary() {
        const totalOrders = await prisma_1.prisma.merchOrder.count();
        const newOrders = await prisma_1.prisma.merchOrder.count({
            where: { status: "NEW" },
        });
        const lowStockItems = await prisma_1.prisma.merchItem.count({
            where: { stock: { lt: 5 } },
        });
        return { totalOrders, newOrders, lowStockItems };
    }
}
exports.DashboardService = DashboardService;
