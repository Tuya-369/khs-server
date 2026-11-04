import {
  Prisma,
  LeaveRequestStatus,
  LeaveDurationType,
  LeaveType,
  ProjectName,
  LeaveApprovalLevel,
  LeaveRequestStage,
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

type LeaveApprovalPeriod = "1_3" | "4_7" | "8_14" | "15_PLUS";

const SYSTEM_NOTIFICATION_ONLY_APPROVER_PHONE = "99099511";

const ALL_APPROVAL_PERIODS: readonly LeaveApprovalPeriod[] = [
  "1_3",
  "4_7",
  "8_14",
  "15_PLUS",
];

const APPROVAL_PERIODS_BY_PROJECT: Partial<
  Record<ProjectName, Readonly<Record<string, readonly LeaveApprovalPeriod[]>>>
> = {
  [ProjectName.UB]: {
    "99080190": ["1_3", "4_7", "8_14"],
    "99036907": ["1_3", "4_7", "8_14"],
    [SYSTEM_NOTIFICATION_ONLY_APPROVER_PHONE]: ["15_PLUS"],
  },
  [ProjectName.UG]: {
    "99087813": ["1_3"],
    "99223115": ["1_3"],
    "99566564": ["1_3"],
    "94137227": ["1_3"],
    "99772772": ["1_3"],
    "99888634": ["1_3"],
    "99905440": ["4_7"],
    "89001198": ["4_7"],
    "88368206": ["4_7"],
    "88103163": ["4_7"],
    "99080190": ["8_14"],
    [SYSTEM_NOTIFICATION_ONLY_APPROVER_PHONE]: ["15_PLUS"],
    "88093432": ALL_APPROVAL_PERIODS,
    "88078468": ALL_APPROVAL_PERIODS,
    "99031833": ALL_APPROVAL_PERIODS,
    "99009051": ALL_APPROVAL_PERIODS,
  },
  [ProjectName.PROJECT]: {
    "90901077": ["1_3"],
    "94050002": ["1_3"],
    "88036504": ["1_3"],
    "99176210": ["1_3"],
    "99792201": ["1_3"],
    "94111166": ["4_7"],
    "88098904": ["4_7"],
    "99080190": ["8_14"],
    [SYSTEM_NOTIFICATION_ONLY_APPROVER_PHONE]: ["15_PLUS"],
  },
  [ProjectName.OTHER]: {
    "88116975": ["1_3", "4_7"],
    "99080190": ["8_14"],
    [SYSTEM_NOTIFICATION_ONLY_APPROVER_PHONE]: ["15_PLUS"],
  },
  [ProjectName.OPERATION]: {
    "88989620": ["1_3"],
    "99532332": ["1_3"],
    "80021275": ["1_3"],
    "88051137": ["1_3"],
    "89100229": ["1_3"],
    "95433838": ["1_3"],
    "88800062": ["4_7"],
    "99992245": ["4_7"],
    "99080190": ["8_14"],
    [SYSTEM_NOTIFICATION_ONLY_APPROVER_PHONE]: ["15_PLUS"],
  },
};

function getLeaveApprovalPeriod(workingDays: number): LeaveApprovalPeriod {
  if (workingDays <= 3) return "1_3";
  if (workingDays <= 7) return "4_7";
  if (workingDays <= 14) return "8_14";
  return "15_PLUS";
}

function getApprovalPeriods(
  projectName: ProjectName,
  phoneNumber: string,
): readonly LeaveApprovalPeriod[] | undefined {
  const projectPeriods = APPROVAL_PERIODS_BY_PROJECT[projectName];
  if (!projectPeriods) return undefined;
  return projectPeriods[phoneNumber] ?? [];
}

type LeaveRequestApprovalInput = {
  durationType: LeaveDurationType;
  startDate: string;
  endDate: string;
  selectedApproverPhoneNumber: string;
  selectedHrPhoneNumber?: string;
  selectedManagerPhoneNumber?: string;
};

type LeaveRequestApproverOverride = {
  displayName: string;
  phoneNumber: string;
};

type ResolvedLeaveRequestApprover = {
  displayName: string;
  phoneNumber: string;
};

// stageSequence нь хүсэлтийн бүх шатыг дарааллаар агуулна. selectedApprover нь эхний шатны батлагч.
type StagedLeaveRoute = {
  stageSequence: LeaveRequestStage[];
  selectedApprover: ResolvedLeaveRequestApprover;
  selectedHr: ResolvedLeaveRequestApprover | null;
  manager: ResolvedLeaveRequestApprover | null;
  finalApprover: ResolvedLeaveRequestApprover | null;
};

// Шат бүр тусдаа талбарт хадгалагдсан батлагчтай тохирно.
function getStageReviewerPhoneNumber(leaveRequest: {
  currentStage: LeaveRequestStage | null;
  selectedApproverPhoneNumber: string | null;
  managerPhoneNumber: string | null;
  selectedHrPhoneNumber: string | null;
  finalApproverPhoneNumber: string | null;
}) {
  switch (leaveRequest.currentStage) {
    case "FIRST_APPROVER_REVIEW":
      return leaveRequest.selectedApproverPhoneNumber;
    case "SECOND_APPROVER_REVIEW":
      return leaveRequest.managerPhoneNumber;
    case "HR_REVIEW":
      return leaveRequest.selectedHrPhoneNumber;
    case "FINAL_APPROVER_REVIEW":
      return leaveRequest.finalApproverPhoneNumber;
    default:
      return null;
  }
}

function getNextStage(leaveRequest: {
  currentStage: LeaveRequestStage | null;
  stageSequence: LeaveRequestStage[];
}) {
  if (!leaveRequest.currentStage) return null;
  const index = leaveRequest.stageSequence.indexOf(leaveRequest.currentStage);
  if (index === -1) return null;
  return leaveRequest.stageSequence[index + 1] ?? null;
}

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

// Барилгын хэлтсийн хүсэлтийн батлагч: 1–3 хоног → Bayarmunkh, 4–14 хоног → Erdenezul (HR).
const CONSTRUCTION_SHORT_LEAVE_APPROVER = "88116975";
const CONSTRUCTION_LONG_LEAVE_APPROVER = "99009051";

// 8–14 хоногийн эцсийн батлагч болон ХН, менежер, ахлахын хүсэлтийн эцсийн батлагч.
const HR_DIRECTOR_FINAL_APPROVER = {
  phoneNumber: "99080190",
  displayName: "Bilguun Ganbold",
};

// UB-ийн хэлтсийн HR болон батлагчийн дүрэм: HR (Erdenezul) эхлээд хянана, дараа нь батлагч батална.
const UB_CONSTRUCTION_HR_PHONE = "99009051";
const UB_CONSTRUCTION_APPROVER_PHONE = "88116975";
const UB_HR_DEPARTMENT_PHONES = [
  "99009051",
  "99031833",
  "88078468",
  "88093432",
  "99097083",
  "98111734",
  "99393999",
  "99069343",
  "99399797",
  "85121254",
  "94777079",
];
const UB_HR_DEPARTMENT_APPROVER_PHONE = "99080190";
const UB_DIRECT_APPROVER_PHONES = ["99036907", "99080190", "88116975"];

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
      proofImageUrl?: string;
      selectedApproverPhoneNumber: string;
      selectedHrPhoneNumber?: string;
      selectedManagerPhoneNumber?: string;
    },
  ) {
    const requester = await prisma.user.findUnique({ where: { id: userId } });
    if (!requester) throw new AppError(404, "Хэрэглэгч олдсонгүй.");

    const approverOverride = await this.getLeaveRequestApproverOverride(
      requester.phoneNumber,
    );
    const stagedRoute = await this.planStagedRoute(
      requester,
      input,
      approverOverride,
    );
    const isConstructionDepartment = await this.getIsConstructionDepartment(
      requester.phoneNumber,
    );
    const selectedApprover =
      stagedRoute?.selectedApprover ??
      (await this.resolveApprovalTarget(
        requester.ProjectName,
        input,
        approverOverride,
        isConstructionDepartment,
      ));
    const selectedHr = stagedRoute
      ? stagedRoute.selectedHr
      : await this.resolveSelectedHr(
          requester.ProjectName,
          input.selectedHrPhoneNumber,
          approverOverride,
        );

    const leaveRequest = await prisma.leaveRequest.create({
      data: {
        userId,
        type: input.type,
        durationType: input.durationType,
        startDate: new Date(input.startDate),
        endDate: new Date(input.endDate),
        reason: input.reason,
        proofImageUrl: input.proofImageUrl ?? null,
        selectedApproverPhoneNumber: selectedApprover.phoneNumber,
        selectedApproverName: selectedApprover.displayName,
        selectedHrPhoneNumber: selectedHr?.phoneNumber ?? null,
        selectedHrName: selectedHr?.displayName ?? null,
        stageSequence: stagedRoute?.stageSequence ?? [],
        currentStage: stagedRoute?.stageSequence[0] ?? null,
        managerPhoneNumber: stagedRoute?.manager?.phoneNumber ?? null,
        managerName: stagedRoute?.manager?.displayName ?? null,
        finalApproverPhoneNumber:
          stagedRoute?.finalApprover?.phoneNumber ?? null,
        finalApproverName: stagedRoute?.finalApprover?.displayName ?? null,
      },
    });

    // Bayaajuulah notifies its selected approver and HR; other projects notify reviewers.
    // Шатлалтай урсгалд зөвхөн тухайн шатны батлагч мэдэгдэл авна.
    const isBayaajuulah = requester.ProjectName === ProjectName.BAYAJUULAH;
    const reviewerAssignments =
      isBayaajuulah || stagedRoute
        ? []
        : await prisma.leaveRequestAccess.findMany({
            where: {
              projectName: requester.ProjectName,
              isResponsibleHr: false,
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
        ...(selectedHr && !stagedRoute ? [selectedHr.phoneNumber] : []),
      ]),
    );
    const notificationPhoneNumbers = new Set(
      reviewerPhoneNumbers.filter(
        (phoneNumber) =>
          phoneNumber !== SYSTEM_NOTIFICATION_ONLY_APPROVER_PHONE ||
          phoneNumber === selectedApprover.phoneNumber,
      ),
    );

    const reviewerUsers = await prisma.user.findMany({
      where: { phoneNumber: { in: reviewerPhoneNumbers } },
      select: { id: true, phoneNumber: true, role: true, isActive: true },
    });
    const superAdminPhoneNumbers = new Set(
      reviewerUsers
        .filter(({ role }) => role === "SUPERADMIN")
        .map(({ phoneNumber }) => phoneNumber),
    );
    const recipients = reviewerUsers.filter(
      ({ isActive, phoneNumber, role }) =>
        isActive &&
        role !== "SUPERADMIN" &&
        notificationPhoneNumbers.has(phoneNumber),
    );

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

    const smsPhoneNumbers = Array.from(new Set(reviewerPhoneNumbers)).filter(
      (phoneNumber) =>
        phoneNumber !== SYSTEM_NOTIFICATION_ONLY_APPROVER_PHONE &&
        !superAdminPhoneNumbers.has(phoneNumber),
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
    const stagedRoute = await this.planStagedRoute(
      requester,
      input,
      approverOverride,
    );
    if (stagedRoute) return;

    const isConstructionDepartment = await this.getIsConstructionDepartment(
      requester.phoneNumber,
    );
    await this.resolveApprovalTarget(
      requester.ProjectName,
      input,
      approverOverride,
      isConstructionDepartment,
    );
    await this.resolveSelectedHr(
      requester.ProjectName,
      input.selectedHrPhoneNumber,
      approverOverride,
    );
  }

  // Менежер, ахлахын хүсэлтийг ХН → Bilguun; бусад DAILY 1–14 хүсэлтийг шатлалтай төлөвлөнө.
  private async planStagedRoute(
    requester: { phoneNumber: string; ProjectName: ProjectName },
    input: LeaveRequestApprovalInput,
    approverOverride: LeaveRequestApproverOverride | null,
  ): Promise<StagedLeaveRoute | null> {
    const requesterAccess = await prisma.leaveRequestAccess.findUnique({
      where: {
        phoneNumber_projectName: {
          phoneNumber: requester.phoneNumber,
          projectName: requester.ProjectName,
        },
      },
      select: { approvalLevel: true, isResponsibleHr: true },
    });
    const isManagerOrSeniorRequester =
      !requesterAccess?.isResponsibleHr &&
      (requesterAccess?.approvalLevel ===
        LeaveApprovalLevel.SENIOR_SPECIALIST ||
        requesterAccess?.approvalLevel === LeaveApprovalLevel.UNIT_MANAGER);
    if (approverOverride && !isManagerOrSeniorRequester) return null;
    if (input.durationType !== "DAILY" && !isManagerOrSeniorRequester) {
      return null;
    }

    const hrApprovers = await this.getResponsibleHrApprovers(
      requester.ProjectName,
    );
    const isHrRequester = hrApprovers.some(
      ({ phoneNumber }) => phoneNumber === requester.phoneNumber,
    );

    const startDate = getCalendarDate(input.startDate);
    const endDate = getCalendarDate(input.endDate);
    if (isManagerOrSeniorRequester && !isHrRequester) {
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

      if (countWorkingDays(startDate, endDate) === 0) {
        throw new AppError(
          400,
          "Чөлөөний хугацаанд ажлын өдөр байх шаардлагатай.",
        );
      }

      const selectedHrRecord =
        hrApprovers.length > 0
          ? await this.resolveSelectedHr(
              requester.ProjectName,
              input.selectedHrPhoneNumber,
            )
          : null;
      if (!selectedHrRecord) {
        throw new AppError(
          400,
          "Тухайн төслийн ХН хариуцагч бүртгэгдээгүй байна.",
        );
      }

      const selectedHr = {
        phoneNumber: selectedHrRecord.phoneNumber,
        displayName: selectedHrRecord.displayName,
      };
      return {
        stageSequence: [
          LeaveRequestStage.HR_REVIEW,
          LeaveRequestStage.FINAL_APPROVER_REVIEW,
        ],
        selectedApprover: selectedHr,
        selectedHr,
        manager: null,
        finalApprover: HR_DIRECTOR_FINAL_APPROVER,
      };
    }

    if (input.durationType !== "DAILY") return null;
    if (endDate < startDate || endDate > addCalendarMonths(startDate, 3)) {
      return null;
    }

    const workingDays = countWorkingDays(startDate, endDate);
    if (workingDays === 0 || workingDays > 14) return null;

    if (isHrRequester) {
      return {
        stageSequence: [LeaveRequestStage.FINAL_APPROVER_REVIEW],
        selectedApprover: HR_DIRECTOR_FINAL_APPROVER,
        selectedHr: null,
        manager: null,
        finalApprover: HR_DIRECTOR_FINAL_APPROVER,
      };
    }

    const selectedHrRecord =
      hrApprovers.length > 0
        ? await this.resolveSelectedHr(
            requester.ProjectName,
            input.selectedHrPhoneNumber,
          )
        : null;
    const selectedHr = selectedHrRecord
      ? {
          phoneNumber: selectedHrRecord.phoneNumber,
          displayName: selectedHrRecord.displayName,
        }
      : null;

    const isConstructionDepartment = await this.getIsConstructionDepartment(
      requester.phoneNumber,
    );
    if (isConstructionDepartment && requester.ProjectName === ProjectName.UB) {
      const constructionHr = await this.getAssignedApprover(
        requester.ProjectName,
        UB_CONSTRUCTION_HR_PHONE,
      );
      const finalApprover = await this.getAssignedApprover(
        requester.ProjectName,
        UB_CONSTRUCTION_APPROVER_PHONE,
      );
      return {
        stageSequence: [
          LeaveRequestStage.HR_REVIEW,
          LeaveRequestStage.FINAL_APPROVER_REVIEW,
        ],
        selectedApprover: finalApprover,
        selectedHr: constructionHr,
        manager: null,
        finalApprover,
      };
    }

    if (
      requester.ProjectName === ProjectName.UB &&
      UB_HR_DEPARTMENT_PHONES.includes(requester.phoneNumber)
    ) {
      const hrApprover = await this.getAssignedApprover(
        requester.ProjectName,
        UB_CONSTRUCTION_HR_PHONE,
      );
      const finalApprover = await this.getAssignedApprover(
        requester.ProjectName,
        UB_HR_DEPARTMENT_APPROVER_PHONE,
      );
      return {
        stageSequence: [
          LeaveRequestStage.HR_REVIEW,
          LeaveRequestStage.FINAL_APPROVER_REVIEW,
        ],
        selectedApprover: finalApprover,
        selectedHr: hrApprover,
        manager: null,
        finalApprover,
      };
    }

    if (
      requester.ProjectName === ProjectName.UB &&
      !(await this.hasUbSeniorApprover())
    ) {
      const approver = await this.getAssignedApprover(
        requester.ProjectName,
        input.selectedApproverPhoneNumber ?? "",
      );
      if (!UB_DIRECT_APPROVER_PHONES.includes(approver.phoneNumber)) {
        throw new AppError(
          400,
          "Батлагчаар Bilguun, Anar-Erdene, Bayarmunkh-аас сонгоно уу.",
        );
      }
      const hrApprover = await this.getAssignedApprover(
        requester.ProjectName,
        UB_CONSTRUCTION_HR_PHONE,
      );
      return {
        stageSequence: [
          LeaveRequestStage.HR_REVIEW,
          LeaveRequestStage.FINAL_APPROVER_REVIEW,
        ],
        selectedApprover: approver,
        selectedHr: hrApprover,
        manager: null,
        finalApprover: approver,
      };
    }

    if (workingDays <= 3) {
      const senior = await this.getStageApprover(
        requester.ProjectName,
        input.selectedApproverPhoneNumber,
        LeaveApprovalLevel.SENIOR_SPECIALIST,
        "Ахлах ажилтан",
      );
      const manager = await this.getStageApprover(
        requester.ProjectName,
        input.selectedManagerPhoneNumber,
        LeaveApprovalLevel.UNIT_MANAGER,
        "Менежер",
      );
      if (!selectedHr) {
        return {
          stageSequence: [
            LeaveRequestStage.FIRST_APPROVER_REVIEW,
            LeaveRequestStage.SECOND_APPROVER_REVIEW,
          ],
          selectedApprover: senior,
          selectedHr: null,
          manager,
          finalApprover: manager,
        };
      }
      return {
        stageSequence: [
          LeaveRequestStage.FIRST_APPROVER_REVIEW,
          LeaveRequestStage.SECOND_APPROVER_REVIEW,
          LeaveRequestStage.HR_REVIEW,
        ],
        selectedApprover: senior,
        selectedHr,
        manager,
        finalApprover: selectedHr,
      };
    }

    const manager = await this.getStageApprover(
      requester.ProjectName,
      input.selectedManagerPhoneNumber,
      LeaveApprovalLevel.UNIT_MANAGER,
      "Менежер",
    );

    if (workingDays <= 7) {
      if (!selectedHr) {
        return {
          stageSequence: [LeaveRequestStage.SECOND_APPROVER_REVIEW],
          selectedApprover: manager,
          selectedHr: null,
          manager,
          finalApprover: manager,
        };
      }
      return {
        stageSequence: [
          LeaveRequestStage.HR_REVIEW,
          LeaveRequestStage.SECOND_APPROVER_REVIEW,
        ],
        selectedApprover: selectedHr,
        selectedHr,
        manager,
        finalApprover: manager,
      };
    }

    if (!selectedHr) {
      return {
        stageSequence: [
          LeaveRequestStage.SECOND_APPROVER_REVIEW,
          LeaveRequestStage.FINAL_APPROVER_REVIEW,
        ],
        selectedApprover: manager,
        selectedHr: null,
        manager,
        finalApprover: HR_DIRECTOR_FINAL_APPROVER,
      };
    }
    return {
      stageSequence: [
        LeaveRequestStage.HR_REVIEW,
        LeaveRequestStage.SECOND_APPROVER_REVIEW,
        LeaveRequestStage.FINAL_APPROVER_REVIEW,
      ],
      selectedApprover: selectedHr,
      selectedHr,
      manager,
      finalApprover: HR_DIRECTOR_FINAL_APPROVER,
    };
  }

  private async hasUbSeniorApprover(): Promise<boolean> {
    const count = await prisma.leaveRequestAccess.count({
      where: {
        projectName: ProjectName.UB,
        canApprove: true,
        approvalLevel: LeaveApprovalLevel.SENIOR_SPECIALIST,
      },
    });
    return count > 0;
  }

  // Ахлах ажилтан / менежерийг тухайн төслийн батлагчийн түвшинээр нь шалгана.
  private async getStageApprover(
    projectName: ProjectName,
    phoneNumber: string | undefined,
    approvalLevel: LeaveApprovalLevel,
    label: string,
  ): Promise<ResolvedLeaveRequestApprover> {
    if (!phoneNumber) {
      throw new AppError(400, `${label} сонгоно уу.`);
    }

    const access = await prisma.leaveRequestAccess.findUnique({
      where: {
        phoneNumber_projectName: { phoneNumber, projectName },
      },
      select: {
        phoneNumber: true,
        displayName: true,
        canApprove: true,
        approvalLevel: true,
      },
    });
    if (!access?.canApprove || access.approvalLevel !== approvalLevel) {
      throw new AppError(400, `Сонгосон ${label} буруу байна.`);
    }

    return {
      phoneNumber: access.phoneNumber,
      displayName: access.displayName,
    };
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

    const {
      leaveRequestApproverOverrideName,
      leaveRequestApproverOverridePhoneNumber,
    } = whitelistEntry;
    if (
      leaveRequestApproverOverrideName === null &&
      leaveRequestApproverOverridePhoneNumber === null
    ) {
      return null;
    }
    if (
      !leaveRequestApproverOverrideName ||
      !leaveRequestApproverOverridePhoneNumber
    ) {
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

  private async getResponsibleHrApprovers(projectName: ProjectName) {
    return prisma.leaveRequestAccess.findMany({
      where: { projectName, isResponsibleHr: true },
      select: {
        phoneNumber: true,
        displayName: true,
        approvalLevel: true,
        isResponsibleHr: true,
      },
      orderBy: { displayName: "asc" },
    });
  }

  private async resolveSelectedHr(
    projectName: ProjectName,
    selectedHrPhoneNumber?: string,
    approverOverride?: LeaveRequestApproverOverride | null,
  ) {
    if (
      approverOverride &&
      selectedHrPhoneNumber !== undefined &&
      selectedHrPhoneNumber !== approverOverride.phoneNumber
    ) {
      throw new AppError(
        400,
        "Сонгосон ХН ажилтан тухайн ажилтны тохиргоонд байхгүй байна.",
      );
    }

    const hrApprovers = await this.getResponsibleHrApprovers(projectName);
    const requestedPhoneNumber =
      approverOverride?.phoneNumber ?? selectedHrPhoneNumber;

    if (hrApprovers.length === 0) {
      if (requestedPhoneNumber) {
        throw new AppError(
          400,
          "Тухайн хэлтсийн ХН хариуцагч бүртгэгдээгүй байна.",
        );
      }
      return null;
    }

    if (!requestedPhoneNumber) {
      if (hrApprovers.length > 1) {
        throw new AppError(400, "Хүний нөөцийн ажилтан сонгоно уу.");
      }
      return hrApprovers[0];
    }

    const selectedHr = hrApprovers.find(
      ({ phoneNumber }) => phoneNumber === requestedPhoneNumber,
    );
    if (!selectedHr) {
      throw new AppError(
        400,
        "Сонгосон ХН ажилтан тухайн хэлтсийн ХН хариуцагч биш байна.",
      );
    }

    return selectedHr;
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
      const approver = await this.getAssignedApprover(
        projectName,
        input.selectedApproverPhoneNumber,
      );
      const hrApprovers = await this.getResponsibleHrApprovers(projectName);
      if (hrApprovers.length > 1 && approver.isResponsibleHr) {
        throw new AppError(400, "ХН ажилтныг тусдаа сонголтоос сонгоно уу.");
      }
      return approver;
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

    const hrApprovers = await this.getResponsibleHrApprovers(projectName);
    const requiresHrSelection = hrApprovers.length > 1;

    if (
      isConstructionDepartment &&
      projectName === ProjectName.UB &&
      workingDays <= 14
    ) {
      const requiredApproverPhoneNumber =
        workingDays <= 3
          ? CONSTRUCTION_SHORT_LEAVE_APPROVER
          : CONSTRUCTION_LONG_LEAVE_APPROVER;
      if (input.selectedApproverPhoneNumber !== requiredApproverPhoneNumber) {
        throw new AppError(
          400,
          "Сонгосон батлагч барилгын хэлтсийн хүсэлтийн дүрэмд тохирохгүй байна.",
        );
      }
      const approver = await this.getAssignedApprover(
        projectName,
        requiredApproverPhoneNumber,
      );
      if (requiresHrSelection && approver.isResponsibleHr) {
        throw new AppError(400, "ХН ажилтныг тусдаа сонголтоос сонгоно уу.");
      }
      return approver;
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
      isResponsibleHr: boolean;
    }>;

    const projectApprovalPeriods = APPROVAL_PERIODS_BY_PROJECT[projectName];
    if (projectApprovalPeriods) {
      const approvalPeriod = getLeaveApprovalPeriod(workingDays);
      const eligiblePhoneNumbers = new Set(
        Object.entries(projectApprovalPeriods)
          .filter(([, periods]) => periods.includes(approvalPeriod))
          .map(([phoneNumber]) => phoneNumber),
      );
      eligibleApprovers = projectApprovers.filter(({ phoneNumber }) =>
        eligiblePhoneNumbers.has(phoneNumber),
      );
    } else if (workingDays <= 3) {
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
        ({ approvalLevel }) => approvalLevel === LeaveApprovalLevel.HR_DIRECTOR,
      );
      eligibleApprovers =
        hrDirectors.length > 0
          ? hrDirectors
          : projectApprovers.filter(({ isResponsibleHr }) => isResponsibleHr);
    } else {
      eligibleApprovers = projectApprovers.filter(
        ({ approvalLevel }) =>
          approvalLevel === LeaveApprovalLevel.GENERAL_DIRECTOR,
      );
    }

    if (requiresHrSelection) {
      eligibleApprovers = eligibleApprovers.filter(
        ({ isResponsibleHr }) => !isResponsibleHr,
      );
    }

    if (eligibleApprovers.length === 0) {
      const message = projectApprovalPeriods
        ? "Тухайн хэлтсийн энэ хугацааны батлагч бүртгэгдээгүй байна."
        : workingDays <= 7
          ? "Тухайн төслийн шаардлагатай ахлах ажилтан эсвэл нэгжийн удирдлага бүртгэгдээгүй байна."
          : workingDays <= 14
            ? "Тухайн төслийн ХН хариуцагч бүртгэгдээгүй байна."
            : "Тухайн төслийн ерөнхий захирал бүртгэгдээгүй байна.";
      throw new AppError(400, message);
    }

    const approver = eligibleApprovers.find(
      ({ phoneNumber }) => phoneNumber === input.selectedApproverPhoneNumber,
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
      select: {
        phoneNumber: true,
        displayName: true,
        canApprove: true,
        isResponsibleHr: true,
      },
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

    const [approverOverride, requesterAccess] = await Promise.all([
      this.getLeaveRequestApproverOverride(requester.phoneNumber),
      prisma.leaveRequestAccess.findUnique({
        where: {
          phoneNumber_projectName: {
            phoneNumber: requester.phoneNumber,
            projectName: requester.ProjectName,
          },
        },
        select: { approvalLevel: true, isResponsibleHr: true },
      }),
    ]);
    const requesterIsManagerOrSenior =
      !requesterAccess?.isResponsibleHr &&
      (requesterAccess?.approvalLevel ===
        LeaveApprovalLevel.SENIOR_SPECIALIST ||
        requesterAccess?.approvalLevel === LeaveApprovalLevel.UNIT_MANAGER);
    if (approverOverride && !requesterIsManagerOrSenior) {
      const approver = await this.getAssignedApprover(
        requester.ProjectName,
        approverOverride.phoneNumber,
      );
      return {
        items: [
          {
            phoneNumber: approver.phoneNumber,
            displayName: approverOverride.displayName,
            approvalLevel: "OT" as const,
            isResponsibleHr: true,
          },
        ],
        hrItems: [],
        requiresHrSelection: false,
        stagedRouting: false,
        isHrRequester: false,
        isConstructionDepartment: false,
        seniorItems: [],
        managerItems: [],
        finalItems: [],
      };
    }

    const [
      accessApprovers,
      responsibleHrApprovers,
    ] = await Promise.all([
      prisma.leaveRequestAccess.findMany({
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
      }),
      this.getResponsibleHrApprovers(requester.ProjectName),
    ]);

    const hrItems = responsibleHrApprovers.map((approver) => ({
      ...approver,
      approvalPeriods: getApprovalPeriods(
        requester.ProjectName,
        approver.phoneNumber,
      ),
    }));
    const requiresHrSelection = hrItems.length > 1;

    const toApproverItem = ({
      phoneNumber,
      displayName,
      approvalLevel,
      isResponsibleHr,
    }: (typeof accessApprovers)[number]) => ({
      phoneNumber,
      displayName,
      approvalLevel,
      isResponsibleHr,
    });
    const isHrRequester = hrItems.some(
      ({ phoneNumber }) => phoneNumber === requester.phoneNumber,
    );
    const isManagerOrSeniorRequester =
      !isHrRequester && requesterIsManagerOrSenior;
    const isUbHrDepartment =
      requester.ProjectName === ProjectName.UB &&
      !isHrRequester &&
      UB_HR_DEPARTMENT_PHONES.includes(requester.phoneNumber);
    const isConstructionDepartment =
      requester.ProjectName === ProjectName.UB &&
      (await this.getIsConstructionDepartment(requester.phoneNumber));
    const isUbDirectApproval =
      requester.ProjectName === ProjectName.UB &&
      !isHrRequester &&
      !isUbHrDepartment &&
      !isConstructionDepartment &&
      !(await this.hasUbSeniorApprover());

    const fixedFinalPhones = isConstructionDepartment
      ? [UB_CONSTRUCTION_APPROVER_PHONE]
      : isUbHrDepartment
        ? [UB_HR_DEPARTMENT_APPROVER_PHONE]
        : isUbDirectApproval
          ? UB_DIRECT_APPROVER_PHONES
          : [];

    return {
      items: accessApprovers
        .filter(
          ({ isResponsibleHr }) => !requiresHrSelection || !isResponsibleHr,
        )
        .map((approver) => ({
          ...approver,
          approvalPeriods: getApprovalPeriods(
            requester.ProjectName,
            approver.phoneNumber,
          ),
        })),
      hrItems,
      requiresHrSelection,
      stagedRouting: true,
      isHrRequester,
      isManagerOrSeniorRequester,
      isConstructionDepartment,
      isUbHrDepartment,
      isUbDirectApproval,
      seniorItems: accessApprovers
        .filter(
          ({ approvalLevel, isResponsibleHr }) =>
            approvalLevel === LeaveApprovalLevel.SENIOR_SPECIALIST &&
            !isResponsibleHr,
        )
        .map(toApproverItem),
      managerItems: accessApprovers
        .filter(
          ({ approvalLevel, isResponsibleHr }) =>
            approvalLevel === LeaveApprovalLevel.UNIT_MANAGER &&
            !isResponsibleHr,
        )
        .map(toApproverItem),
      finalItems: isManagerOrSeniorRequester
        ? [HR_DIRECTOR_FINAL_APPROVER]
        : accessApprovers
            .filter(({ phoneNumber }) => fixedFinalPhones.includes(phoneNumber))
            .map(toApproverItem),
    };
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

    if (user.role === "SUPERADMIN") return false;

    const access = await prisma.leaveRequestAccess.findFirst({
      where: {
        phoneNumber: user.phoneNumber,
        OR: [
          { canView: true },
          { canApprove: true },
          { isResponsibleHr: true },
        ],
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
    if (requestingUser.role === "SUPERADMIN") {
      throw new AppError(
        403,
        "Танд чөлөөний хүсэлтүүдийг харах эрх байхгүй байна.",
      );
    }

    const accessAssignments = await prisma.leaveRequestAccess.findMany({
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
        .filter(
          ({ canView, canApprove, isResponsibleHr }) =>
            canView || canApprove || isResponsibleHr,
        )
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
    scopeFilters.push({ managerPhoneNumber: requestingUser.phoneNumber });
    scopeFilters.push({ finalApproverPhoneNumber: requestingUser.phoneNumber });

    if (scopeFilters.length === 0) {
      throw new AppError(
        403,
        "Танд чөлөөний хүсэлтүүдийг харах эрх байхгүй байна.",
      );
    }

    const where: Prisma.LeaveRequestWhereInput = { OR: scopeFilters };

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
      if (leaveRequest.currentStage) {
        const canApprove =
          leaveRequest.status === "PENDING" &&
          getStageReviewerPhoneNumber(leaveRequest) ===
            requestingUser.phoneNumber;
        return {
          ...leaveRequest,
          ...user,
          canApprove,
          isFinalStage: getNextStage(leaveRequest) === null,
        };
      }

      const projectAccess = accessAssignments.find(
        ({ projectName }) => projectName === user.ProjectName,
      );
      const canApprove =
        leaveRequest.selectedApproverName === "OT"
          ? projectAccess?.isResponsibleHr === true &&
            (leaveRequest.selectedHrPhoneNumber !== null
              ? leaveRequest.selectedHrPhoneNumber ===
                requestingUser.phoneNumber
              : leaveRequest.selectedApproverPhoneNumber ===
                requestingUser.phoneNumber)
          : (projectAccess?.isResponsibleHr === true &&
              (leaveRequest.selectedHrPhoneNumber === null ||
                leaveRequest.selectedHrPhoneNumber ===
                  requestingUser.phoneNumber)) ||
            (projectAccess?.canApprove === true &&
              leaveRequest.selectedApproverPhoneNumber ===
                requestingUser.phoneNumber);

      return { ...leaveRequest, ...user, canApprove, isFinalStage: true };
    });
  }

  async updateStatus(
    reviewerId: string,
    id: string,
    status: Extract<LeaveRequestStatus, "APPROVED" | "REJECTED">,
    comment?: string,
  ) {
    const reviewer = await prisma.user.findUnique({
      where: { id: reviewerId },
    });
    if (!reviewer) throw new AppError(404, "Хэрэглэгч олдсонгүй.");
    if (reviewer.role === "SUPERADMIN") {
      throw new AppError(
        403,
        "Танд энэ хүсэлтийг шийдвэрлэх эрх байхгүй байна.",
      );
    }

    const leaveRequest = await prisma.leaveRequest.findUnique({
      where: { id },
      include: { user: true },
    });
    if (!leaveRequest) throw new AppError(404, "Чөлөөний хүсэлт олдсонгүй.");

    if (leaveRequest.currentStage) {
      return this.updateStagedLeaveRequestStatus(
        reviewer,
        leaveRequest,
        status,
        comment,
      );
    }

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
        access?.isResponsibleHr === true &&
        (leaveRequest.selectedHrPhoneNumber !== null
          ? leaveRequest.selectedHrPhoneNumber === reviewer.phoneNumber
          : leaveRequest.selectedApproverPhoneNumber === reviewer.phoneNumber);
      if (!canApproveOtRequest) {
        throw new AppError(
          403,
          "Танд энэ хүсэлтийг шийдвэрлэх эрх байхгүй байна.",
        );
      }
    } else {
      const canApproveAsResponsibleHr =
        access?.isResponsibleHr === true &&
        (leaveRequest.selectedHrPhoneNumber === null ||
          leaveRequest.selectedHrPhoneNumber === reviewer.phoneNumber);
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
    const trimmedComment = comment?.trim();
    await this.notifications.create({
      userId: updatedLeaveRequest.userId,
      title: "Чөлөөний хүсэлтийн төлөв шинэчлэгдлээ",
      message: trimmedComment
        ? `Таны чөлөөний хүсэлт ${statusLabel}. Шийдвэрийн тайлбар: ${trimmedComment}`
        : `Таны чөлөөний хүсэлт ${statusLabel}.`,
      type: "LEAVE_REQUEST",
      href: "/profile?tab=leave-request",
    });

    return updatedLeaveRequest;
  }

  private async updateStagedLeaveRequestStatus(
    reviewer: { id: string; phoneNumber: string },
    leaveRequest: {
      id: string;
      userId: string;
      status: LeaveRequestStatus;
      currentStage: LeaveRequestStage | null;
      stageSequence: LeaveRequestStage[];
      startDate: Date;
      selectedApproverPhoneNumber: string | null;
      managerPhoneNumber: string | null;
      selectedHrPhoneNumber: string | null;
      finalApproverPhoneNumber: string | null;
    },
    status: Extract<LeaveRequestStatus, "APPROVED" | "REJECTED">,
    comment?: string,
  ) {
    if (leaveRequest.status !== LeaveRequestStatus.PENDING) {
      throw new AppError(
        400,
        "Чөлөөний хүсэлт аль хэдий нь шийдвэрлэгдсэн байна.",
      );
    }
    if (getStageReviewerPhoneNumber(leaveRequest) !== reviewer.phoneNumber) {
      throw new AppError(
        403,
        "Танд энэ хүсэлтийг шийдвэрлэх эрх байхгүй байна.",
      );
    }
    if (status === "APPROVED" && hasStartDateArrived(leaveRequest.startDate)) {
      throw new AppError(
        400,
        "Чөлөөний эхлэх өдөр болсон тул хүсэлтийг батлах боломжгүй.",
      );
    }

    const nextStage = status === "APPROVED" ? getNextStage(leaveRequest) : null;
    if (nextStage) {
      const advancedLeaveRequest = await prisma.leaveRequest.update({
        where: { id: leaveRequest.id },
        data: {
          currentStage: nextStage,
          reviewedById: reviewer.id,
          reviewedAt: new Date(),
        },
      });

      await this.notifications.create({
        userId: leaveRequest.userId,
        title: "Чөлөөний хүсэлт дараагийн шатанд шилжлээ",
        message:
          "Таны чөлөөний хүсэлтийг урьдчилан зөвшөөрч, дараагийн батлагчид илгээлээ.",
        type: "LEAVE_REQUEST",
        href: "/profile?tab=leave-request",
      });

      const nextReviewerPhoneNumber =
        getStageReviewerPhoneNumber(advancedLeaveRequest);
      if (nextReviewerPhoneNumber) {
        const nextReviewer = await prisma.user.findUnique({
          where: { phoneNumber: nextReviewerPhoneNumber },
          select: { id: true, isActive: true },
        });
        if (nextReviewer?.isActive) {
          await this.notifications.create({
            userId: nextReviewer.id,
            title: "Шинэ чөлөөний хүсэлт",
            message: "Чөлөөний хүсэлт таны батлах шатанд ирлээ.",
            type: "LEAVE_REQUEST",
            href: "/profile?tab=dashboard",
          });
        }
        await sendSmsToMany(
          [nextReviewerPhoneNumber],
          "Чөлөөний хүсэлт таны батлах шатанд ирлээ. Та систем рүү орж дэлгэрэнгүй харна уу",
        );
      }
      return advancedLeaveRequest;
    }

    const updatedLeaveRequest = await prisma.leaveRequest.update({
      where: { id: leaveRequest.id },
      data: { status, reviewedById: reviewer.id, reviewedAt: new Date() },
    });

    const statusLabel = status === "APPROVED" ? "Зөвшөөрөгдлөө" : "Татгалзлаа";
    const trimmedComment = comment?.trim();
    await this.notifications.create({
      userId: updatedLeaveRequest.userId,
      title: "Чөлөөний хүсэлтийн төлөв шинэчлэгдлээ",
      message: trimmedComment
        ? `Таны чөлөөний хүсэлт ${statusLabel}. Шийдвэрийн тайлбар: ${trimmedComment}`
        : `Таны чөлөөний хүсэлт ${statusLabel}.`,
      type: "LEAVE_REQUEST",
      href: "/profile?tab=leave-request",
    });

    return updatedLeaveRequest;
  }
}
