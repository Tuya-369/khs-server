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

const profileImageUploadOptions = {
  folder: "khs/profile-images",
  resource_type: "image",
} as const;

const merchPartnerLogoUploadOptions = {
  folder: "khs/merch-partner-logos",
  resource_type: "image",
} as const;

type CloudinaryUploadedAsset = {
  secure_url: string;
  public_id: string;
};

const isCloudinaryConfigured = (): boolean => {
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
    return false;
  }

  return true;
};

const uploadBufferToCloudinary = async (
  file: Express.Multer.File | { buffer: Buffer; originalname?: string },
  options: Record<string, unknown>,
): Promise<CloudinaryUploadedAsset | null> => {
  if (!isCloudinaryConfigured()) return null;

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
    const result = await new Promise<CloudinaryUploadedAsset>(
      (resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          options,
          (error, uploaded) => {
            if (error) {
              reject(error);
              return;
            }

            if (!uploaded?.secure_url || !uploaded.public_id) {
              reject(
                new Error(
                  "Cloudinary upload succeeded without required fields.",
                ),
              );
              return;
            }

            resolve(uploaded as CloudinaryUploadedAsset);
          },
        );

        uploadStream.end(file.buffer);
      },
    );

    return result;
  } catch (error) {
    logger.error("Cloudinary upload error", {
      fileName: file?.originalname,
      error,
    });
    return null;
  }
};

export const uploadToCloudinary = async (
  file: Express.Multer.File | { buffer: Buffer; originalname?: string },
): Promise<string | null> => {
  const uploaded = await uploadBufferToCloudinary(
    file,
    cloudinaryUploadOptions,
  );
  return uploaded?.secure_url || null;
};

export const uploadProfileImageToCloudinary = async (
  file: Express.Multer.File,
): Promise<{ secureUrl: string; publicId: string } | null> => {
  const uploaded = await uploadBufferToCloudinary(
    file,
    profileImageUploadOptions,
  );
  if (!uploaded) return null;

  return {
    secureUrl: uploaded.secure_url,
    publicId: uploaded.public_id,
  };
};

export const uploadMerchPartnerLogoToCloudinary = async (
  file: Express.Multer.File,
): Promise<{ secureUrl: string; publicId: string } | null> => {
  const uploaded = await uploadBufferToCloudinary(
    file,
    merchPartnerLogoUploadOptions,
  );
  if (!uploaded) return null;

  return {
    secureUrl: uploaded.secure_url,
    publicId: uploaded.public_id,
  };
};

export const deleteImageFromCloudinary = async (
  publicId: string,
): Promise<boolean> => {
  if (!publicId) return false;
  if (!isCloudinaryConfigured()) return false;

  try {
    const result = await cloudinary.uploader.destroy(publicId, {
      resource_type: "image",
    });

    return result.result === "ok" || result.result === "not found";
  } catch (error) {
    logger.error("Cloudinary delete error", { publicId, error });
    return false;
  }
};
