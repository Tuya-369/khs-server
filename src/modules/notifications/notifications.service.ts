import type { Role } from "@prisma/client";
import { prisma } from "../../utils/prisma";

type CreateNotificationInput = {
  userId: string;
  title: string;
  message: string;
  type: string;
  href?: string;
};

export class NotificationsService {
  async create(input: CreateNotificationInput) {
    return prisma.notification.create({
      data: {
        ...input,
        href: input.href || null,
      },
    });
  }

  async notifyRoles(
    roles: Role[],
    notification: Omit<CreateNotificationInput, "userId">,
  ) {
    const users = await prisma.user.findMany({
      where: { role: { in: roles }, isActive: true },
      select: { id: true },
    });

    if (!users.length) return { count: 0 };

    return prisma.notification.createMany({
      data: users.map((user) => ({
        ...notification,
        userId: user.id,
        href: notification.href || null,
      })),
    });
  }

  async getForUser(userId: string, limit = 30) {
    const notifications = await prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: limit,
    });
    const unreadCount = await prisma.notification.count({
      where: { userId, isRead: false },
    });

    return { notifications, unreadCount };
  }

  async markRead(userId: string, id: string) {
    return prisma.notification.updateMany({
      where: { id, userId },
      data: { isRead: true },
    });
  }

  async markAllRead(userId: string) {
    return prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });
  }
}
