import type { OrderStatus, Prisma } from "@prisma/client";
import { AppError } from "../../errors/app-error";
import { prisma } from "../../utils/prisma";

type CreateOrderData = {
  merchItemId: string;
  size: string;
  color?: string;
  qty: number;
};

export class OrdersService {
  async createOrder(userId: string, data: CreateOrderData) {
    return prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const item = await tx.merchItem.findUnique({
        where: { id: data.merchItemId },
        select: { colors: true },
      });

      const stockUpdate = await tx.merchItem.updateMany({
        where: {
          id: data.merchItemId,
          isActive: true,
          stock: { gte: data.qty },
        },
        data: { stock: { decrement: data.qty } },
      });

      if (!item || stockUpdate.count === 0) {
        throw new AppError(
          400,
          "Бараа олдсонгүй эсвэл үлдэгдэл хүрэлцэхгүй байна.",
        );
      }

      return tx.merchOrder.create({
        data: {
          userId,
          merchItemId: data.merchItemId,
          size: data.size,
          color: item.colors.length > 0 ? (data.color ?? "") : "",
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
    const where: Prisma.MerchOrderWhereInput = {};
    if (filter === "new") where.status = "NEW";
    if (filter === "confirmed") where.status = "CONFIRMED";
    if (filter === "rejected") where.status = "REJECTED";
    if (filter === "unread") where.isReadByManager = false;

    return prisma.merchOrder.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            sapId: true,
            firstName: true,
            lastName: true,
            phoneNumber: true,
            role: true,
          },
        },
        merchItem: true,
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
      },
      orderBy: { orderedAt: "desc" },
    });
  }

  async confirmOrder(id: string, managerId: string) {
    const order = await prisma.merchOrder.findUnique({ where: { id } });
    if (!order) {
      throw new AppError(404, "Захиалга олдсонгүй.", [], "ORDER_NOT_FOUND");
    }
    if (order.status !== "NEW") {
      throw new AppError(
        409,
        "Энэ захиалгын төлөв аль хэдийн шийдэгдсэн байна.",
      );
    }

    return prisma.merchOrder.update({
      where: { id },
      data: {
        status: "CONFIRMED",
        confirmedAt: new Date(),
        confirmedById: managerId,
      },
      include: {
        user: {
          select: {
            id: true,
            sapId: true,
            firstName: true,
            lastName: true,
            phoneNumber: true,
            role: true,
          },
        },
        merchItem: true,
      },
    });
  }

  async rejectOrder(id: string, managerId: string) {
    const order = await prisma.merchOrder.findUnique({ where: { id } });
    if (!order) {
      throw new AppError(404, "Захиалга олдсонгүй.", [], "ORDER_NOT_FOUND");
    }
    if (order.status !== "NEW") {
      throw new AppError(
        409,
        "Энэ захиалгын төлөв аль хэдийн шийдэгдсэн байна.",
      );
    }

    return prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const rejectedOrder = await tx.merchOrder.update({
        where: { id },
        data: {
          status: "REJECTED",
          rejectedAt: new Date(),
          rejectedById: managerId,
        },
        include: {
          user: {
            select: {
              id: true,
              sapId: true,
              firstName: true,
              lastName: true,
              phoneNumber: true,
              role: true,
            },
          },
          merchItem: true,
        },
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

  async updateStatus(id: string, status: OrderStatus) {
    const order = await prisma.merchOrder.findUnique({ where: { id } });
    if (!order) {
      throw new AppError(404, "Захиалга олдсонгүй.", [], "ORDER_NOT_FOUND");
    }

    return prisma.merchOrder.update({
      where: { id },
      data: { status },
      include: {
        user: {
          select: {
            id: true,
            sapId: true,
            firstName: true,
            lastName: true,
            phoneNumber: true,
            role: true,
          },
        },
        merchItem: true,
      },
    });
  }

  async markRead(id: string) {
    return prisma.merchOrder.update({
      where: { id },
      data: { isReadByManager: true },
    });
  }
}
