import { prisma } from "../../utils/prisma";

export class DashboardService {
  async getAdminSummary() {
    const totalRequests = await prisma.repairRequest.count();
    const pendingRequests = await prisma.repairRequest.count({
      where: { status: "PENDING" },
    });
    const totalVehicles = await prisma.vehicle.count();

    return { totalRequests, pendingRequests, totalVehicles };
  }

  async getTokenSummary() {
    const totalOrders = await prisma.merchOrder.count();
    const newOrders = await prisma.merchOrder.count({
      where: { status: "NEW" },
    });
    const lowStockItems = await prisma.merchItem.count({
      where: { stock: { lt: 5 } },
    });

    return { totalOrders, newOrders, lowStockItems };
  }
}
