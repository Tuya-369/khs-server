import { FeedbackCategory, FeedbackStatus } from "@prisma/client";
import { AppError } from "../../errors/app-error";
import { prisma } from "../../utils/prisma";
import { NotificationsService } from "../notifications/notifications.service";

export class FeedbackService {
  private readonly notifications = new NotificationsService();

  async createFeedback(
    userId: string,
    message: string,
    category: FeedbackCategory,
  ) {
    const feedback = await prisma.feedback.create({
      data: { userId, message, category },
    });
    await this.notifications.notifyRoles(["HR", "ADMIN_PANEL"], {
      title: "Шинэ санал хүсэлт",
      message: "Шинэ санал хүсэлт ирлээ.",
      type: "FEEDBACK",
      href: "/profile?tab=feedback",
    });
    return feedback;
  }

  async getFeedback() {
    const feedbackItems = await prisma.feedback.findMany({
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            sapId: true,
            phoneNumber: true,
            ProjectName: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return feedbackItems.map(({ user, ...feedback }) => ({
      ...feedback,
      ...user,
    }));
  }

  async updateStatus(id: string, status: FeedbackStatus) {
    const feedback = await prisma.feedback.findUnique({ where: { id } });
    if (!feedback) throw new AppError(404, "Санал хүсэлт олдсонгүй.");

    const updatedFeedback = await prisma.feedback.update({
      where: { id },
      data: { status },
    });
    await this.notifications.create({
      userId: updatedFeedback.userId,
      title: "Санал хүсэлтийн төлөв шинэчлэгдлээ",
      message: `Таны санал хүсэлтийн төлөв ${status} боллоо.`,
      type: "FEEDBACK",
      href: "/profile?tab=feedback",
    });
    return updatedFeedback;
  }
}
