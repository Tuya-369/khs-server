import {
  LeaveRequestStatus,
  LeaveType,
  ProjectName,
  Role,
} from "@prisma/client";
import { AppError } from "../../errors/app-error";
import { prisma } from "../../utils/prisma";
import { sendSmsToMany } from "../../utils/sms";
import { NotificationsService } from "../notifications/notifications.service";

const PROJECT_SCOPED_ROLES: Role[] = ["ADMIN_PANEL", "HR"];

const LEAVE_TYPE_LABELS: Record<LeaveType, string> = {
  SICK: "Эмнэлэг",
  PERSONAL: "Хувийн",
  OTHER: "Бусад",
};

const FRONTEND_URL = (
  process.env.FRONTEND_URL || "https://khs-system.vercel.app"
).replace(/\/+$/, "");
const LEAVE_REQUEST_LINK = `${FRONTEND_URL}/profile?tab=leave-request`;

export class LeaveRequestsService {
  private readonly notifications = new NotificationsService();

  async createLeaveRequest(
    userId: string,
    input: {
      type: LeaveType;
      startDate: string;
      endDate: string;
      reason: string;
      proofImageUrl: string;
    },
  ) {
    const requester = await prisma.user.findUnique({ where: { id: userId } });
    if (!requester) throw new AppError(404, "Хэрэглэгч олдсонгүй.");

    const leaveRequest = await prisma.leaveRequest.create({
      data: {
        userId,
        type: input.type,
        startDate: new Date(input.startDate),
        endDate: new Date(input.endDate),
        reason: input.reason,
        proofImageUrl: input.proofImageUrl,
      },
    });

    // Project-scoped routing: SUPERADMIN sees everything, while
    // ADMIN_PANEL/HR are only notified about requests from their own project.
    const recipients = await prisma.user.findMany({
      where: {
        isActive: true,
        OR: [
          { role: "SUPERADMIN" },
          {
            role: { in: PROJECT_SCOPED_ROLES },
            ProjectName: requester.ProjectName,
          },
        ],
      },
      select: { id: true, phoneNumber: true },
    });

    if (recipients.length) {
      await prisma.notification.createMany({
        data: recipients.map((recipient) => ({
          userId: recipient.id,
          title: "Шинэ чөлөөний хүсэлт",
          message: `${requester.lastName} ${requester.firstName} чөлөөний хүсэлт илгээлээ.`,
          type: "LEAVE_REQUEST",
          href: "/profile?tab=leave-request",
        })),
      });

      const smsText = `${requester.lastName} ${requester.firstName} (${LEAVE_TYPE_LABELS[input.type]}) чөлөөний хүсэлт илгээлээ. Шалгахын тулд дарна уу: ${LEAVE_REQUEST_LINK}`;
      await sendSmsToMany(
        recipients.map((recipient) => recipient.phoneNumber),
        smsText,
      );
    }

    return leaveRequest;
  }

  async getMine(userId: string) {
    return prisma.leaveRequest.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });
  }

  async getLeaveRequests(requestingUserId: string) {
    const requestingUser = await prisma.user.findUnique({
      where: { id: requestingUserId },
    });
    if (!requestingUser) throw new AppError(404, "Хэрэглэгч олдсонгүй.");

    const where =
      requestingUser.role === "SUPERADMIN"
        ? {}
        : { user: { ProjectName: requestingUser.ProjectName as ProjectName } };

    const leaveRequests = await prisma.leaveRequest.findMany({
      where,
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            sapId: true,
            phoneNumber: true,
            ProjectName: true,
            role: true,
          },
        },
        reviewedBy: {
          select: { firstName: true, lastName: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return leaveRequests.map(({ user, ...leaveRequest }) => ({
      ...leaveRequest,
      ...user,
    }));
  }

  async updateStatus(
    reviewerId: string,
    id: string,
    status: Extract<LeaveRequestStatus, "APPROVED" | "REJECTED">,
  ) {
    const reviewer = await prisma.user.findUnique({ where: { id: reviewerId } });
    if (!reviewer) throw new AppError(404, "Хэрэглэгч олдсонгүй.");

    const leaveRequest = await prisma.leaveRequest.findUnique({
      where: { id },
      include: { user: true },
    });
    if (!leaveRequest) throw new AppError(404, "Чөлөөний хүсэлт олдсонгүй.");

    const canReview =
      reviewer.role === "SUPERADMIN" ||
      leaveRequest.user.ProjectName === reviewer.ProjectName;
    if (!canReview) {
      throw new AppError(403, "Танд энэ хүсэлтийг шийдвэрлэх эрх байхгүй байна.");
    }

    const updatedLeaveRequest = await prisma.leaveRequest.update({
      where: { id },
      data: { status, reviewedById: reviewerId, reviewedAt: new Date() },
    });

    const statusLabel =
      status === "APPROVED" ? "Зөвшөөрөгдлөө" : "Татгалзлаа";
    await this.notifications.create({
      userId: updatedLeaveRequest.userId,
      title: "Чөлөөний хүсэлтийн төлөв шинэчлэгдлээ",
      message: `Таны чөлөөний хүсэлт ${statusLabel}.`,
      type: "LEAVE_REQUEST",
      href: "/profile?tab=leave-request",
    });

    return updatedLeaveRequest;
  }
}
