import type { Prisma } from "@prisma/client";
import { AppError } from "../../errors/app-error";
import {
  deleteImageFromCloudinary,
  uploadMerchPartnerLogoToCloudinary,
} from "../../utils/cloudinary";
import { logger } from "../../utils/logger";
import { prisma } from "../../utils/prisma";

type UpdateMerchPartnerPayload = {
  title?: unknown;
  description?: unknown;
  url?: unknown;
  ctaLabel?: unknown;
  footerText?: unknown;
};

const stringField = (value: unknown, field: string): string => {
  if (typeof value !== "string") {
    throw new AppError(400, `${field} текст хэлбэртэй байх ёстой.`);
  }

  return value.trim();
};

export class MerchPartnerService {
  async getAll() {
    const partners = await prisma.merchPartner.findMany({
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        title: true,
        description: true,
        logo: true,
        url: true,
        ctaLabel: true,
        footerText: true,
      },
    });

    return {
      partners: partners.map(
        ({ footerText: _footerText, ...partner }) => partner,
      ),
      footerText: partners[0]?.footerText ?? "",
    };
  }

  async update(
    id: string,
    payload: UpdateMerchPartnerPayload,
    logoFile?: Express.Multer.File,
  ) {
    const existing = await prisma.merchPartner.findUnique({ where: { id } });
    if (!existing) {
      throw new AppError(
        404,
        "Merch partner олдсонгүй.",
        [],
        "PARTNER_NOT_FOUND",
      );
    }

    const data: Prisma.MerchPartnerUpdateInput = {};
    for (const field of [
      "title",
      "description",
      "url",
      "ctaLabel",
      "footerText",
    ] as const) {
      if (payload[field] !== undefined) {
        const value = stringField(payload[field], field);
        if (field === "title" && !value) {
          throw new AppError(400, "title хоосон байж болохгүй.");
        }
        data[field] = value;
      }
    }

    let uploadedLogoPublicId: string | null = null;
    if (logoFile) {
      const uploaded = await uploadMerchPartnerLogoToCloudinary(logoFile);
      if (!uploaded) {
        throw new AppError(502, "Partner logo upload хийхэд алдаа гарлаа.");
      }
      data.logo = uploaded.secureUrl;
      data.logoPublicId = uploaded.publicId;
      uploadedLogoPublicId = uploaded.publicId;
    }

    if (Object.keys(data).length === 0) {
      throw new AppError(400, "Шинэчлэх өгөгдөл хоосон байна.");
    }

    const partner = await prisma.merchPartner.update({ where: { id }, data });
    if (
      uploadedLogoPublicId &&
      existing.logoPublicId &&
      existing.logoPublicId !== uploadedLogoPublicId
    ) {
      const deleted = await deleteImageFromCloudinary(existing.logoPublicId);
      if (!deleted) {
        logger.warn(
          "Failed to delete old merch partner logo from Cloudinary.",
          {
            partnerId: id,
            publicId: existing.logoPublicId,
          },
        );
      }
    }
    const {
      footerText,
      logoPublicId: _logoPublicId,
      secondaryLogoPublicId: _secondaryLogoPublicId,
      ...publicPartner
    } = partner;
    return { partner: publicPartner, footerText };
  }
}
