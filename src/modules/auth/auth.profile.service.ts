import { AppError } from "../../errors/app-error";
import {
  deleteImageFromCloudinary,
  uploadProfileImageToCloudinary,
} from "../../utils/cloudinary";
import { logger } from "../../utils/logger";
import { prisma } from "../../utils/prisma";
import { UpdateMePayload } from "./auth.types";
import { normalizeName, normalizePhone } from "./auth.utils";

export class AuthProfileService {
  async getMe(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        sapId: true,
        firstName: true,
        lastName: true,
        ProjectName: true,
        phoneNumber: true,
        profileImage: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
    });
    if (!user)
      throw new AppError(404, "Хэрэглэгч олдсонгүй.", [], "USER_NOT_FOUND");
    return user;
  }

  async updateMe(
    userId: string,
    data: UpdateMePayload,
    profileImageFile?: Express.Multer.File,
  ) {
    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { profileImagePublicId: true },
    });
    if (!existingUser)
      throw new AppError(404, "Хэрэглэгч олдсонгүй.", [], "USER_NOT_FOUND");

    const updateData: UpdateMePayload = {};
    if (data.firstName !== undefined)
      updateData.firstName = normalizeName(data.firstName);
    if (data.lastName !== undefined)
      updateData.lastName = normalizeName(data.lastName);
    if (data.ProjectName !== undefined)
      updateData.ProjectName = data.ProjectName;
    if (data.phoneNumber !== undefined)
      updateData.phoneNumber = normalizePhone(data.phoneNumber);

    let uploadedProfileImagePublicId: string | null = null;
    if (profileImageFile) {
      const image = await uploadProfileImageToCloudinary(profileImageFile);
      if (!image)
        throw new AppError(
          502,
          "Профайл зураг upload хийхэд алдаа гарлаа. Дахин оролдоно уу.",
        );
      updateData.profileImage = image.secureUrl;
      updateData.profileImagePublicId = image.publicId;
      uploadedProfileImagePublicId = image.publicId;
    }
    if (Object.keys(updateData).length === 0)
      throw new AppError(400, "Шинэчлэх өгөгдөл хоосон байна.");

    const user = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        sapId: true,
        firstName: true,
        lastName: true,
        ProjectName: true,
        phoneNumber: true,
        profileImage: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
    });
    if (
      uploadedProfileImagePublicId &&
      existingUser.profileImagePublicId &&
      existingUser.profileImagePublicId !== uploadedProfileImagePublicId
    ) {
      const deleted = await deleteImageFromCloudinary(
        existingUser.profileImagePublicId,
      );
      if (!deleted)
        logger.warn("Failed to delete old profile image from Cloudinary.", {
          userId,
          publicId: existingUser.profileImagePublicId,
        });
    }
    return user;
  }
}
