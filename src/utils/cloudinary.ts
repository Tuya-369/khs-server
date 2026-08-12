import { v2 as cloudinary } from "cloudinary";
import { logger } from "./logger";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const cloudinaryUploadOptions = {
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
} as const;

export const uploadToCloudinary = async (
  file: Express.Multer.File | { buffer: Buffer; originalname?: string },
): Promise<string | null> => {
  const requiredEnv = [
    process.env.CLOUDINARY_CLOUD_NAME,
    process.env.CLOUDINARY_API_KEY,
    process.env.CLOUDINARY_API_SECRET,
  ];

  if (requiredEnv.some((value) => !value)) {
    logger.error(
      "Cloudinary upload skipped because required env vars are not configured.",
      {
        cloudName: !!process.env.CLOUDINARY_CLOUD_NAME,
        apiKey: !!process.env.CLOUDINARY_API_KEY,
        apiSecret: !!process.env.CLOUDINARY_API_SECRET,
      },
    );
    return null;
  }

  if (!file?.buffer || file.buffer.length === 0) {
    logger.error(
      "Cloudinary upload skipped because the file buffer is empty.",
      {
        fileName: file?.originalname,
      },
    );
    return null;
  }

  try {
    const result = await new Promise<{ secure_url: string }>(
      (resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          cloudinaryUploadOptions,
          (error, uploaded) => {
            if (error) {
              reject(error);
              return;
            }

            if (!uploaded?.secure_url) {
              reject(
                new Error("Cloudinary upload succeeded without a secure_url."),
              );
              return;
            }

            resolve(uploaded as { secure_url: string });
          },
        );

        uploadStream.end(file.buffer);
      },
    );

    return result.secure_url;
  } catch (error) {
    logger.error("Cloudinary upload error", {
      fileName: file?.originalname,
      error,
    });
    return null;
  }
};
