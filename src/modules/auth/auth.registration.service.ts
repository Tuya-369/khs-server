import bcrypt from "bcrypt";
import { AppError } from "../../errors/app-error";
import { prisma } from "../../utils/prisma";
import { RegisterPayload } from "./auth.types";
import { AuthOtpService } from "./auth.otp.service";
import { normalizeName, normalizePhone, normalizeSapId } from "./auth.utils";

export class AuthRegistrationService {
  constructor(
    private readonly otpService: AuthOtpService,
    private readonly otpExpiresInMs: number,
  ) {}

  async requestOtp(data: RegisterPayload) {
    const phoneNumber = normalizePhone(data.phoneNumber);
    const sapId = normalizeSapId(data.sapId);
    const whitelistEntry = await this.getEligibility(phoneNumber, sapId);
    const passwordHash = await bcrypt.hash(data.password, 10);

    await prisma.pendingRegistration.upsert({
      where: { phoneNumber },
      update: {
        sapId,
        firstName: normalizeName(data.firstName),
        lastName: normalizeName(data.lastName),
        ProjectName: whitelistEntry.projectName,
        passwordHash,
        expiresAt: new Date(Date.now() + this.otpExpiresInMs),
      },
      create: {
        phoneNumber,
        sapId,
        firstName: normalizeName(data.firstName),
        lastName: normalizeName(data.lastName),
        ProjectName: whitelistEntry.projectName,
        passwordHash,
        expiresAt: new Date(Date.now() + this.otpExpiresInMs),
      },
    });
    return this.otpService.send(phoneNumber, "REGISTRATION");
  }

  async verifyOtp(data: { phoneNumber: string; code: string }) {
    const phoneNumber = await this.otpService.verify(
      data.phoneNumber,
      data.code,
      "REGISTRATION",
    );
    const pending = await prisma.pendingRegistration.findUnique({
      where: { phoneNumber },
    });
    if (!pending || pending.expiresAt < new Date()) {
      throw new AppError(
        400,
        "Бүртгэлийн хүсэлтийн хугацаа дууссан байна. Дахин код авна уу.",
      );
    }

    return prisma.$transaction(async (transaction) => {
      const existingUser = await transaction.user.findFirst({
        where: {
          OR: [
            { phoneNumber },
            ...(pending.sapId ? [{ sapId: pending.sapId }] : []),
          ],
        },
      });
      if (existingUser)
        throw new AppError(400, "Энэ хэрэглэгч аль хэдийн бүртгэгдсэн байна.");
      const user = await transaction.user.create({
        data: {
          sapId: pending.sapId,
          firstName: pending.firstName,
          lastName: pending.lastName,
          ProjectName: pending.ProjectName,
          phoneNumber: pending.phoneNumber,
          passwordHash: pending.passwordHash,
          role: "EMPLOYEE",
        },
      });
      await transaction.otpVerification.update({
        where: { phoneNumber },
        data: { usedAt: new Date() },
      });
      await transaction.pendingRegistration.delete({ where: { phoneNumber } });
      return {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        phoneNumber: user.phoneNumber,
      };
    });
  }

  async register(data: RegisterPayload) {
    const phoneNumber = normalizePhone(data.phoneNumber);
    const sapId = normalizeSapId(data.sapId);
    const whitelistEntry = await this.getEligibility(phoneNumber, sapId);
    return prisma.user.create({
      data: {
        sapId,
        firstName: normalizeName(data.firstName),
        lastName: normalizeName(data.lastName),
        ProjectName: whitelistEntry.projectName,
        phoneNumber,
        passwordHash: await bcrypt.hash(data.password, 10),
        role: "EMPLOYEE",
      },
      select: {
        id: true,
        sapId: true,
        firstName: true,
        lastName: true,
        ProjectName: true,
        role: true,
      },
    });
  }

  private async getEligibility(phoneNumber: string, sapId: string | null) {
    const whitelistEntry = await prisma.whitelist.findUnique({
      where: { phoneNumber },
    });
    if (!whitelistEntry)
      throw new AppError(
        403,
        "Энэ утасны дугаар бүртгүүлэх эрхгүй байна. Хүний нөөцтэй холбогдоно уу.",
        [],
        "PHONE_NOT_WHITELISTED",
      );
    const existingUser = await prisma.user.findFirst({
      where: { OR: [{ phoneNumber }, ...(sapId ? [{ sapId }] : [])] },
    });
    if (existingUser)
      throw new AppError(
        400,
        "Энэ утасны дугаар эсвэл SAP ID-тай хэрэглэгч бүртгэгдсэн байна.",
      );
    return whitelistEntry;
  }
}
