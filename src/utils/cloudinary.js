"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadToCloudinary = void 0;
const cloudinary_1 = require("cloudinary");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const logger_1 = require("./logger");
cloudinary_1.v2.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});
const removeLocalFile = (filePath) => {
    try {
        if (fs_1.default.existsSync(filePath)) {
            fs_1.default.unlinkSync(filePath);
        }
    }
    catch (error) {
        logger_1.logger.warn("Local temp file delete error", { filePath, error });
    }
};
const uploadToCloudinary = async (filePath) => {
    try {
        if (!process.env.CLOUDINARY_CLOUD_NAME) {
            const fileName = path_1.default.basename(filePath);
            return `/uploads/tmp/${fileName}`;
        }
        const result = await cloudinary_1.v2.uploader.upload(filePath, {
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
    }
    catch (error) {
        logger_1.logger.error("Cloudinary upload error", { filePath, error });
        removeLocalFile(filePath);
        return null;
    }
};
exports.uploadToCloudinary = uploadToCloudinary;
