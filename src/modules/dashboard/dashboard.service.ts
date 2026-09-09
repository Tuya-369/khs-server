import { prisma } from "../../utils/prisma";

export class DashboardService {
  async getAdminSummary() {
    const [totalRequests, pendingRequests, totalVehicles] = await Promise.all([
      prisma.repairRequest.count(),
      prisma.repairRequest.count({ where: { status: "PENDING" } }),
      prisma.vehicle.count(),
    ]);

    return { totalRequests, pendingRequests, totalVehicles };
  }

  async getTokenSummary() {
    const [totalOrders, newOrders, lowStockItems] = await Promise.all([
      prisma.merchOrder.count(),
      prisma.merchOrder.count({ where: { status: "NEW" } }),
      prisma.merchItem.count({ where: { stock: { lt: 5 } } }),
    ]);

    return { totalOrders, newOrders, lowStockItems };
  }

  async getAdminPanelOrders() {
    const baseInclude = {
      user: {
        select: {
          id: true,
          sapId: true,
          firstName: true,
          lastName: true,
          role: true,
        },
      },
      merchItem: {
        select: {
          id: true,
          title: true,
          imageUrl: true,
        },
      },
      confirmedBy: {
        select: {
          id: true,
          sapId: true,
          firstName: true,
          lastName: true,
          role: true,
        },
      },
      rejectedBy: {
        select: {
          id: true,
          sapId: true,
          firstName: true,
          lastName: true,
          role: true,
        },
      },
    } as const;

    const [pendingOrders, reviewedOrders] = await Promise.all([
      prisma.merchOrder.findMany({
        where: { status: "NEW" },
        include: baseInclude,
        orderBy: { orderedAt: "desc" },
      }),
      prisma.merchOrder.findMany({
        where: { status: { in: ["CONFIRMED", "REJECTED"] } },
        include: baseInclude,
        orderBy: { updatedAt: "desc" },
      }),
    ]);

    return {
      summary: {
        totalOrders: pendingOrders.length + reviewedOrders.length,
        pendingOrders: pendingOrders.length,
        reviewedOrders: reviewedOrders.length,
      },
      pendingOrders,
      reviewedOrders,
    };
  }
}
