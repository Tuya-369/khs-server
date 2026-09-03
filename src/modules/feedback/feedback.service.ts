import { FeedbackCategory, FeedbackStatus } from "@prisma/client";
import { AppError } from "../../errors/app-error";
import { prisma } from "../../utils/prisma";

export class FeedbackService {
  async createFeedback(
    userId: string,
    message: string,
    category: FeedbackCategory,
  ) {
    return prisma.feedback.create({
      data: { userId, message, category },
    });
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

    return prisma.feedback.update({ where: { id }, data: { status } });
  }
}
