import { v2 as cloudinary } from "cloudinary";
import fs from "fs";
import path from "path";
import { logger } from "./logger";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const removeLocalFile = (filePath: string) => {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  } catch (error) {
    logger.warn("Local temp file delete error", { filePath, error });
  }
};

export const uploadToCloudinary = async (
  filePath: string,
): Promise<string | null> => {
  try {
    if (!process.env.CLOUDINARY_CLOUD_NAME) {
      const fileName = path.basename(filePath);
      return `/uploads/tmp/${fileName}`;
    }

    const result = await cloudinary.uploader.upload(filePath, {
      folder: "fleet_repairs",
      resource_type: "image",
      transformation: [
        {
          width: 1600,
          crop: "limit",
          quality: "auto:good",
          fetch_format: "auto",
        },
      ],
    });
    removeLocalFile(filePath);
    return result.secure_url;
  } catch (error) {
    logger.error("Cloudinary upload error", { filePath, error });
    removeLocalFile(filePath);
    return null;
  }
};
