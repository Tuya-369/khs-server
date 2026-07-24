"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.upload = void 0;
const multer_1 = __importDefault(require("multer"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const app_error_1 = require("../errors/app-error");
const uploadDir = path_1.default.resolve(process.cwd(), "uploads", "tmp");
fs_1.default.mkdirSync(uploadDir, { recursive: true });
const hardMaxFileSizeMb = Number(process.env.IMAGE_HARD_MAX_SIZE_MB || "20");
const maxFileSizeBytes = Number.isFinite(hardMaxFileSizeMb) && hardMaxFileSizeMb > 0
    ? hardMaxFileSizeMb * 1024 * 1024
    : 20 * 1024 * 1024;
const allowedMimeTypes = new Set([
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/webp",
    "image/heic",
    "image/heif",
]);
const storage = multer_1.default.diskStorage({
    destination: (_req, _file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
        cb(null, `${uniqueSuffix}-${file.originalname}`);
    },
});
exports.upload = (0, multer_1.default)({
    storage,
    limits: { fileSize: maxFileSizeBytes },
    fileFilter: (req, file, cb) => {
        if (allowedMimeTypes.has(file.mimetype.toLowerCase())) {
            cb(null, true);
        }
        else {
            cb(new app_error_1.AppError(400, "Зөвхөн зураг оруулах боломжтой."));
        }
    },
});
