import type { Prisma } from "@prisma/client";
import { AppError } from "../../errors/app-error";
import { prisma } from "../../utils/prisma";

export class OrdersService {
  async createOrder(userId: string, data: any) {
    const item = await prisma.merchItem.findUnique({
      where: { id: data.merchItemId },
    });
    if (!item || !item.isActive || item.stock < data.qty) {
      throw new AppError(
        400,
        "Бараа олдсонгүй эсвэл үлдэгдэл хүрэлцэхгүй байна.",
      );
    }

    return prisma.$transaction(async (tx: Prisma.TransactionClient) => {
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

  async getMyOrders(userId: string) {
    return prisma.merchOrder.findMany({
      where: { userId },
      include: { merchItem: true },
    });
  }

  async getManagerOrders(filter: string) {
    const where: any = {};
    if (filter === "new") where.status = "NEW";
    if (filter === "confirmed") where.status = "CONFIRMED";
    if (filter === "unread") where.isReadByManager = false;

    return prisma.merchOrder.findMany({
      where,
      include: { user: true, merchItem: true },
      orderBy: { orderedAt: "desc" },
    });
  }

  async confirmOrder(id: string) {
    return prisma.merchOrder.update({
      where: { id },
      data: { status: "CONFIRMED" },
    });
  }

  async markRead(id: string) {
    return prisma.merchOrder.update({
      where: { id },
      data: { isReadByManager: true },
    });
  }
}
