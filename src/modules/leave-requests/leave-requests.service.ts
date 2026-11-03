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

type LeaveRequestApproverOverride = {
  displayName: string;
  phoneNumber: string;
};

type ResolvedLeaveRequestApprover = {
  displayName: string;
  phoneNumber: string;
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

const HR_WINDOW_MAX_WORKING_DAYS = 14;

// Барилгын хэлтсийн хүсэлтийн батлагч: 1–3 хоног → Bayarmunkh, 4–14 хоног → Erdenezul (HR).
const CONSTRUCTION_SHORT_LEAVE_APPROVER = "88116975";
const CONSTRUCTION_LONG_LEAVE_APPROVER = "99009051";

function isWithinHrWindow(leaveRequest: {
  durationType: LeaveDurationType;
  startDate: Date;
  endDate: Date;
}) {
  return (
    leaveRequest.durationType !== LeaveDurationType.DAILY ||
    countWorkingDays(leaveRequest.startDate, leaveRequest.endDate) <=
      HR_WINDOW_MAX_WORKING_DAYS
  );
}

function hasStartDateArrived(startDate: Date) {
  const today = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Ulaanbaatar",
  }).format(new Date());
  return today >= startDate.toISOString().slice(0, 10);
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

    const approverOverride = await this.getLeaveRequestApproverOverride(
      requester.phoneNumber,
    );
    const isConstructionDepartment = await this.getIsConstructionDepartment(
      requester.phoneNumber,
    );
    const selectedApprover = await this.resolveApprovalTarget(
      requester.ProjectName,
      input,
      approverOverride,
      isConstructionDepartment,
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

    // Notify project reviewers, the selected approver, and SUPERADMIN.
    const reviewerAssignments = await prisma.leaveRequestAccess.findMany({
      where: {
        projectName: requester.ProjectName,
        ...(selectedApprover.displayName === "OT"
          ? { OR: [{ canView: true }, { canApprove: true }] }
          : { canView: true }),
      },
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
    }

    // SMS is sent to phone numbers directly, so approvers without a User account still receive it.
    const smsPhoneNumbers = Array.from(
      new Set([
        ...reviewerPhoneNumbers,
        ...recipients.map((recipient) => recipient.phoneNumber),
      ]),
    );
    if (smsPhoneNumbers.length) {
      const smsText = `${requester.lastName} ${requester.firstName}-с чөлөөний хүсэлт ирсэн байна. Та систем рүү орж дэлгэрэнгүй харна уу`;

      await sendSmsToMany(smsPhoneNumbers, smsText);
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

    const approverOverride = await this.getLeaveRequestApproverOverride(
      requester.phoneNumber,
    );
    const isConstructionDepartment = await this.getIsConstructionDepartment(
      requester.phoneNumber,
    );
    await this.resolveApprovalTarget(
      requester.ProjectName,
      input,
      approverOverride,
      isConstructionDepartment,
    );
  }

  private async getLeaveRequestApproverOverride(
    requesterPhoneNumber: string,
  ): Promise<LeaveRequestApproverOverride | null> {
    const whitelistEntry = await prisma.whitelist.findUnique({
      where: { phoneNumber: requesterPhoneNumber },
      select: {
        leaveRequestApproverOverrideName: true,
        leaveRequestApproverOverridePhoneNumber: true,
      },
    });
    if (!whitelistEntry) return null;

    const { leaveRequestApproverOverrideName, leaveRequestApproverOverridePhoneNumber } =
      whitelistEntry;
    if (
      leaveRequestApproverOverrideName === null &&
      leaveRequestApproverOverridePhoneNumber === null
    ) {
      return null;
    }
    if (!leaveRequestApproverOverrideName || !leaveRequestApproverOverridePhoneNumber) {
      throw new AppError(
        500,
        "Чөлөөний батлагчийн тусгай тохиргоо буруу байна.",
      );
    }

    return {
      displayName: leaveRequestApproverOverrideName,
      phoneNumber: leaveRequestApproverOverridePhoneNumber,
    };
  }

  private async getIsConstructionDepartment(
    requesterPhoneNumber: string,
  ): Promise<boolean> {
    const whitelistEntry = await prisma.whitelist.findUnique({
      where: { phoneNumber: requesterPhoneNumber },
      select: { isConstructionDepartment: true },
    });
    return whitelistEntry?.isConstructionDepartment ?? false;
  }

  private async resolveApprovalTarget(
    projectName: ProjectName,
    input: LeaveRequestApprovalInput,
    approverOverride: LeaveRequestApproverOverride | null,
    isConstructionDepartment: boolean,
  ): Promise<ResolvedLeaveRequestApprover> {
    if (input.durationType !== "DAILY") {
      if (approverOverride) {
        return this.resolveApproverOverride(
          projectName,
          input.selectedApproverPhoneNumber,
          approverOverride,
        );
      }
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

    if (approverOverride) {
      return this.resolveApproverOverride(
        projectName,
        input.selectedApproverPhoneNumber,
        approverOverride,
      );
    }

    if (
      isConstructionDepartment &&
      projectName === ProjectName.UB &&
      workingDays <= 14
    ) {
      const requiredApproverPhoneNumber =
        workingDays <= 3 ? CONSTRUCTION_SHORT_LEAVE_APPROVER : CONSTRUCTION_LONG_LEAVE_APPROVER;
      if (input.selectedApproverPhoneNumber !== requiredApproverPhoneNumber) {
        throw new AppError(
          400,
          "Сонгосон батлагч барилгын хэлтсийн хүсэлтийн дүрэмд тохирохгүй байна.",
        );
      }
      return this.getAssignedApprover(projectName, requiredApproverPhoneNumber);
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
      eligibleApprovers = projectApprovers.filter(
        ({ approvalLevel, isResponsibleHr }) =>
          approvalLevel === LeaveApprovalLevel.HR_DIRECTOR ||
          isResponsibleHr,
      );
    } else {
      eligibleApprovers = projectApprovers.filter(
        ({ approvalLevel }) =>
          approvalLevel === LeaveApprovalLevel.GENERAL_DIRECTOR,
      );
    }

    if (eligibleApprovers.length === 0) {
      const message =
        workingDays <= 7
          ? "Тухайн төслийн шаардлагатай ахлах ажилтан эсвэл нэгжийн удирдлага бүртгэгдээгүй байна."
          : workingDays <= 14
            ? "Тухайн төслийн ХН хариуцагч бүртгэгдээгүй байна."
            : "Тухайн төслийн ерөнхий захирал бүртгэгдээгүй байна.";
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

  private async resolveApproverOverride(
    projectName: ProjectName,
    selectedApproverPhoneNumber: string,
    approverOverride: LeaveRequestApproverOverride,
  ): Promise<ResolvedLeaveRequestApprover> {
    if (selectedApproverPhoneNumber !== approverOverride.phoneNumber) {
      throw new AppError(
        400,
        "Сонгосон батлагч тухайн ажилтны тохиргоонд байхгүй байна.",
      );
    }

    const approver = await this.getAssignedApprover(
      projectName,
      approverOverride.phoneNumber,
    );
    return {
      phoneNumber: approver.phoneNumber,
      displayName: approverOverride.displayName,
    };
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

    const approverOverride = await this.getLeaveRequestApproverOverride(
      requester.phoneNumber,
    );
    if (approverOverride) {
      const approver = await this.getAssignedApprover(
        requester.ProjectName,
        approverOverride.phoneNumber,
      );
      return [
        {
          phoneNumber: approver.phoneNumber,
          displayName: approverOverride.displayName,
          approvalLevel: "OT" as const,
          isResponsibleHr: true,
        },
      ];
    }

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

    return accessApprovers;
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

    if (user.role === "SUPERADMIN") return true;

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
    const approvableProjects = new Set(
      accessAssignments
        .filter(({ canApprove }) => canApprove)
        .map(({ projectName }) => projectName),
    );
    const otViewableProjects = new Set(
      accessAssignments
        .filter(({ canView, canApprove }) => canView || canApprove)
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
    if (otViewableProjects.size > 0) {
      scopeFilters.push({
        user: { ProjectName: { in: Array.from(otViewableProjects) } },
        selectedApproverName: "OT",
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

    const visibleLeaveRequests =
      requestingUser.role === "SUPERADMIN"
        ? leaveRequests
        : leaveRequests.filter(
            (leaveRequest) =>
              isWithinHrWindow(leaveRequest) ||
              leaveRequest.selectedApproverPhoneNumber ===
                requestingUser.phoneNumber,
          );

    return visibleLeaveRequests.map(({ user, ...leaveRequest }) => {
      const projectAccess = accessAssignments.find(
        ({ projectName }) => projectName === user.ProjectName,
      );
      const canApprove =
        leaveRequest.selectedApproverName === "OT"
          ? leaveRequest.selectedApproverPhoneNumber ===
              requestingUser.phoneNumber &&
            projectAccess?.isResponsibleHr === true
          : requestingUser.role === "SUPERADMIN" ||
            (projectAccess?.isResponsibleHr === true &&
              isWithinHrWindow(leaveRequest)) ||
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

    const access = await prisma.leaveRequestAccess.findUnique({
      where: {
        phoneNumber_projectName: {
          phoneNumber: reviewer.phoneNumber,
          projectName: leaveRequest.user.ProjectName,
        },
      },
      select: {
        canApprove: true,
        isResponsibleHr: true,
      },
    });
    if (leaveRequest.selectedApproverName === "OT") {
      const canApproveOtRequest =
        reviewer.phoneNumber === leaveRequest.selectedApproverPhoneNumber &&
        access?.isResponsibleHr === true;
      if (!canApproveOtRequest) {
        throw new AppError(
          403,
          "Танд энэ хүсэлтийг шийдвэрлэх эрх байхгүй байна.",
        );
      }
    } else if (reviewer.role !== "SUPERADMIN") {
      const canApproveAsResponsibleHr =
        access?.isResponsibleHr === true &&
        isWithinHrWindow(leaveRequest);
      const canApproveAsSelectedManager =
        access?.canApprove === true &&
        leaveRequest.selectedApproverPhoneNumber === reviewer.phoneNumber;

      if (!canApproveAsResponsibleHr && !canApproveAsSelectedManager) {
        throw new AppError(
          403,
          "Танд энэ хүсэлтийг шийдвэрлэх эрх байхгүй байна.",
        );
      }
    }

    if (status === "APPROVED" && hasStartDateArrived(leaveRequest.startDate)) {
      throw new AppError(
        400,
        "Чөлөөний эхлэх өдөр болсон тул хүсэлтийг батлах боломжгүй.",
      );
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
