import {
  Prisma,
  LeaveRequestStatus,
  LeaveDurationType,
  LeaveType,
  ProjectName,
  LeaveApprovalLevel,
} from "@prisma/client";
import { AppError } from "../../errors/app-error";
import { prisma } from "../../utils/prisma";
import { sendSmsToMany } from "../../utils/sms";
import { NotificationsService } from "../notifications/notifications.service";

const LEAVE_TYPE_LABELS: Record<LeaveType, string> = {
  SICK: "Өвчтэй",
  PERSONAL: "Чөлөө",
  OTHER: "Бусад",
};

const DAY_IN_MILLISECONDS = 24 * 60 * 60 * 1000;

type LeaveRequestApprovalInput = {
  durationType: LeaveDurationType;
  startDate: string;
  endDate: string;
  selectedApproverPhoneNumber: string;
};

function getCalendarDate(value: string) {
  const dateParts = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
  const parsedDate = new Date(value);
  if (Number.isNaN(parsedDate.getTime())) {
    throw new AppError(400, "Огноо буруу форматтай байна.");
  }

  if (!dateParts) {
    return new Date(
      Date.UTC(
        parsedDate.getUTCFullYear(),
        parsedDate.getUTCMonth(),
        parsedDate.getUTCDate(),
      ),
    );
  }

  const [, yearValue, monthValue, dayValue] = dateParts;
  const year = Number(yearValue);
  const month = Number(monthValue) - 1;
  const day = Number(dayValue);
  const calendarDate = new Date(Date.UTC(year, month, day));
  if (
    calendarDate.getUTCFullYear() !== year ||
    calendarDate.getUTCMonth() !== month ||
    calendarDate.getUTCDate() !== day
  ) {
    throw new AppError(400, "Огноо буруу форматтай байна.");
  }

  return calendarDate;
}

function addCalendarMonths(date: Date, months: number) {
  const monthIndex = date.getUTCMonth() + months;
  const year = date.getUTCFullYear() + Math.floor(monthIndex / 12);
  const month = monthIndex % 12;
  const lastDayOfMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();

  return new Date(
    Date.UTC(year, month, Math.min(date.getUTCDate(), lastDayOfMonth)),
  );
}

function countWorkingDays(startDate: Date, endDate: Date) {
  let count = 0;
  for (
    let timestamp = startDate.getTime();
    timestamp <= endDate.getTime();
    timestamp += DAY_IN_MILLISECONDS
  ) {
    const weekday = new Date(timestamp).getUTCDay();
    if (weekday !== 0 && weekday !== 6) count += 1;
  }
  return count;
}

export class LeaveRequestsService {
  private readonly notifications = new NotificationsService();

  async createLeaveRequest(
    userId: string,
    input: {
      type: LeaveType;
      durationType: LeaveDurationType;
      startDate: string;
      endDate: string;
      reason: string;
      proofImageUrl: string;
      selectedApproverPhoneNumber: string;
    },
  ) {
    const requester = await prisma.user.findUnique({ where: { id: userId } });
    if (!requester) throw new AppError(404, "Хэрэглэгч олдсонгүй.");

    const selectedApprover = await this.resolveApprovalTarget(
      requester.ProjectName,
      input,
    );

    const leaveRequest = await prisma.leaveRequest.create({
      data: {
        userId,
        type: input.type,
        durationType: input.durationType,
        startDate: new Date(input.startDate),
        endDate: new Date(input.endDate),
        reason: input.reason,
        proofImageUrl: input.proofImageUrl,
        selectedApproverPhoneNumber: selectedApprover.phoneNumber,
        selectedApproverName: selectedApprover.displayName,
      },
    });

    // Notify project monitors, the selected manager, project HR, and SUPERADMIN.
    const reviewerAssignments = await prisma.leaveRequestAccess.findMany({
      where: { projectName: requester.ProjectName, canView: true },
      select: { phoneNumber: true },
    });
    const reviewerPhoneNumbers = Array.from(
      new Set([
        ...reviewerAssignments.map(({ phoneNumber }) => phoneNumber),
        selectedApprover.phoneNumber,
      ]),
    );

    const recipients = await prisma.user.findMany({
      where: {
        isActive: true,
        OR: [
          { role: "SUPERADMIN" },
          { role: "HR", ProjectName: requester.ProjectName },
          { phoneNumber: { in: reviewerPhoneNumbers } },
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
          href: "/profile?tab=dashboard",
        })),
      });

      const smsText = `${requester.lastName} ${requester.firstName}-с чөлөөний хүсэлт ирсэн байна. Та систем рүү орж дэлгэрэнгүй харна уу`;

      await sendSmsToMany(
        recipients.map((recipient) => recipient.phoneNumber),
        smsText,
      );
    }

    return leaveRequest;
  }

  async validateApproverForRequest(
    requesterId: string,
    input: LeaveRequestApprovalInput,
  ) {
    const requester = await prisma.user.findUnique({
      where: { id: requesterId },
    });
    if (!requester) throw new AppError(404, "Хэрэглэгч олдсонгүй.");

    await this.resolveApprovalTarget(requester.ProjectName, input);
  }

  private async resolveApprovalTarget(
    projectName: ProjectName,
    input: LeaveRequestApprovalInput,
  ) {
    if (input.durationType !== "DAILY") {
      return this.getAssignedApprover(
        projectName,
        input.selectedApproverPhoneNumber,
      );
    }

    const startDate = getCalendarDate(input.startDate);
    const endDate = getCalendarDate(input.endDate);
    if (endDate < startDate) {
      throw new AppError(
        400,
        "Эхлэх огноо дуусах огнооноос хойш байж болохгүй.",
      );
    }

    if (endDate > addCalendarMonths(startDate, 3)) {
      throw new AppError(
        400,
        "Цалингүй чөлөөний хугацаа 3 сараас хэтэрч болохгүй.",
      );
    }

    const workingDays = countWorkingDays(startDate, endDate);
    if (workingDays === 0) {
      throw new AppError(
        400,
        "Чөлөөний хугацаанд ажлын өдөр байх шаардлагатай.",
      );
    }

    const projectApprovers = await prisma.leaveRequestAccess.findMany({
      where: { projectName, canApprove: true },
      select: {
        phoneNumber: true,
        displayName: true,
        approvalLevel: true,
        isResponsibleHr: true,
      },
      orderBy: { displayName: "asc" },
    });

    let eligibleApprovers: Array<{
      phoneNumber: string;
      displayName: string;
    }>;

    if (workingDays <= 3) {
      const seniorSpecialists = projectApprovers.filter(
        ({ approvalLevel }) =>
          approvalLevel === LeaveApprovalLevel.SENIOR_SPECIALIST,
      );
      eligibleApprovers =
        seniorSpecialists.length > 0
          ? seniorSpecialists
          : projectApprovers.filter(
              ({ approvalLevel }) =>
                approvalLevel === LeaveApprovalLevel.UNIT_MANAGER,
            );
    } else if (workingDays <= 7) {
      eligibleApprovers = projectApprovers.filter(
        ({ approvalLevel }) =>
          approvalLevel === LeaveApprovalLevel.UNIT_MANAGER,
      );
    } else if (workingDays <= 14) {
      const hrDirectors = projectApprovers.filter(
        ({ approvalLevel }) =>
          approvalLevel === LeaveApprovalLevel.HR_DIRECTOR,
      );
      eligibleApprovers =
        hrDirectors.length > 0
          ? hrDirectors
          : projectApprovers.filter(({ isResponsibleHr }) => isResponsibleHr);
    } else {
      const generalDirectors = await prisma.user.findMany({
        where: { role: "SUPERADMIN", isActive: true },
        select: { phoneNumber: true, firstName: true, lastName: true },
        orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
      });
      eligibleApprovers = generalDirectors.map(
        ({ phoneNumber, firstName, lastName }) => ({
          phoneNumber,
          displayName: `${lastName} ${firstName}`.trim(),
        }),
      );
    }

    if (eligibleApprovers.length === 0) {
      const message =
        workingDays <= 7
          ? "Тухайн төслийн шаардлагатай ахлах ажилтан эсвэл нэгжийн удирдлага бүртгэгдээгүй байна."
          : workingDays <= 14
            ? "Тухайн төслийн ХН хариуцагч бүртгэгдээгүй байна."
            : "Ерөнхий захирлын эрхтэй хэрэглэгч бүртгэгдээгүй байна.";
      throw new AppError(400, message);
    }

    const approver = eligibleApprovers.find(
      ({ phoneNumber }) =>
        phoneNumber === input.selectedApproverPhoneNumber,
    );
    if (!approver) {
      throw new AppError(
        400,
        "Сонгосон батлагч чөлөөний хугацаанд тохирох эрхгүй байна.",
      );
    }

    return approver;
  }

  private async getAssignedApprover(
    projectName: ProjectName,
    phoneNumber: string,
  ) {
    const approver = await prisma.leaveRequestAccess.findUnique({
      where: {
        phoneNumber_projectName: { phoneNumber, projectName },
      },
      select: { phoneNumber: true, displayName: true, canApprove: true },
    });

    if (!approver?.canApprove) {
      throw new AppError(
        400,
        "Сонгосон менежер тухайн төслийн батлагч биш байна.",
      );
    }

    return approver;
  }

  async getApprovers(requesterId: string) {
    const requester = await prisma.user.findUnique({
      where: { id: requesterId },
    });
    if (!requester) throw new AppError(404, "Хэрэглэгч олдсонгүй.");

    const accessApprovers = await prisma.leaveRequestAccess.findMany({
      where: {
        projectName: requester.ProjectName,
        canApprove: true,
      },
      select: {
        phoneNumber: true,
        displayName: true,
        approvalLevel: true,
        isResponsibleHr: true,
      },
      orderBy: { displayName: "asc" },
    });

    const generalDirectors = await prisma.user.findMany({
      where: { role: "SUPERADMIN", isActive: true },
      select: { phoneNumber: true, firstName: true, lastName: true },
      orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
    });

    return [
      ...accessApprovers,
      ...generalDirectors.map(({ phoneNumber, firstName, lastName }) => ({
        phoneNumber,
        displayName: `${lastName} ${firstName}`.trim(),
        approvalLevel: "GENERAL_DIRECTOR" as const,
        isResponsibleHr: false,
      })),
    ];
  }

  async getMine(userId: string) {
    return prisma.leaveRequest.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });
  }

  async hasReviewAccess(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true, phoneNumber: true },
    });
    if (!user) throw new AppError(404, "Хэрэглэгч олдсонгүй.");

    if (user.role === "SUPERADMIN" || user.role === "HR") return true;

    const access = await prisma.leaveRequestAccess.findFirst({
      where: {
        phoneNumber: user.phoneNumber,
        OR: [{ canView: true }, { canApprove: true }],
      },
      select: { phoneNumber: true },
    });

    return Boolean(access);
  }

  async getLeaveRequests(requestingUserId: string) {
    const requestingUser = await prisma.user.findUnique({
      where: { id: requestingUserId },
    });
    if (!requestingUser) throw new AppError(404, "Хэрэглэгч олдсонгүй.");

    const accessAssignments =
      requestingUser.role === "SUPERADMIN"
        ? []
        : await prisma.leaveRequestAccess.findMany({
            where: { phoneNumber: requestingUser.phoneNumber },
              select: {
                projectName: true,
                canView: true,
                canApprove: true,
                isResponsibleHr: true,
              },
          });

    const viewableProjects = new Set(
      accessAssignments
        .filter(({ canView }) => canView)
        .map(({ projectName }) => projectName),
    );
    if (requestingUser.role === "HR") {
      viewableProjects.add(requestingUser.ProjectName);
    }

    const approvableProjects = new Set(
      accessAssignments
        .filter(({ canApprove }) => canApprove)
        .map(({ projectName }) => projectName),
    );
    const scopeFilters: Prisma.LeaveRequestWhereInput[] = [];
    if (viewableProjects.size > 0) {
      scopeFilters.push({
        user: { ProjectName: { in: Array.from(viewableProjects) } },
      });
    }
    if (approvableProjects.size > 0) {
      scopeFilters.push({
        user: { ProjectName: { in: Array.from(approvableProjects) } },
        selectedApproverPhoneNumber: requestingUser.phoneNumber,
      });
    }

    if (requestingUser.role !== "SUPERADMIN" && scopeFilters.length === 0) {
      throw new AppError(
        403,
        "Танд чөлөөний хүсэлтүүдийг харах эрх байхгүй байна.",
      );
    }

    const where: Prisma.LeaveRequestWhereInput =
      requestingUser.role === "SUPERADMIN" ? {} : { OR: scopeFilters };

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

    return leaveRequests.map(({ user, ...leaveRequest }) => {
      const projectAccess = accessAssignments.find(
        ({ projectName }) => projectName === user.ProjectName,
      );
      const canApprove =
        requestingUser.role === "SUPERADMIN" ||
        projectAccess?.isResponsibleHr === true ||
        (requestingUser.role === "HR" &&
          (user.ProjectName === requestingUser.ProjectName ||
            projectAccess?.canView === true)) ||
        (projectAccess?.canApprove === true &&
          leaveRequest.selectedApproverPhoneNumber ===
            requestingUser.phoneNumber);

      return { ...leaveRequest, ...user, canApprove };
    });
  }

  async updateStatus(
    reviewerId: string,
    id: string,
    status: Extract<LeaveRequestStatus, "APPROVED" | "REJECTED">,
  ) {
    const reviewer = await prisma.user.findUnique({
      where: { id: reviewerId },
    });
    if (!reviewer) throw new AppError(404, "Хэрэглэгч олдсонгүй.");

    const leaveRequest = await prisma.leaveRequest.findUnique({
      where: { id },
      include: { user: true },
    });
    if (!leaveRequest) throw new AppError(404, "Чөлөөний хүсэлт олдсонгүй.");

    if (reviewer.role !== "SUPERADMIN") {
      const access = await prisma.leaveRequestAccess.findUnique({
        where: {
          phoneNumber_projectName: {
            phoneNumber: reviewer.phoneNumber,
            projectName: leaveRequest.user.ProjectName,
          },
        },
        select: {
          canView: true,
          canApprove: true,
          isResponsibleHr: true,
        },
      });
      const canApproveAsHr =
        reviewer.role === "HR" &&
        (reviewer.ProjectName === leaveRequest.user.ProjectName ||
          access?.canView === true);
      const canApproveAsResponsibleHr = access?.isResponsibleHr === true;
      const canApproveAsSelectedManager =
        access?.canApprove === true &&
        leaveRequest.selectedApproverPhoneNumber === reviewer.phoneNumber;

      if (
        !canApproveAsHr &&
        !canApproveAsResponsibleHr &&
        !canApproveAsSelectedManager
      ) {
        throw new AppError(
          403,
          "Танд энэ хүсэлтийг шийдвэрлэх эрх байхгүй байна.",
        );
      }
    }

    const updatedLeaveRequest = await prisma.leaveRequest.update({
      where: { id },
      data: { status, reviewedById: reviewerId, reviewedAt: new Date() },
    });

    const statusLabel = status === "APPROVED" ? "Зөвшөөрөгдлөө" : "Татгалзлаа";
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
