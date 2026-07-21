import multer from "multer";
import fs from "fs";
import path from "path";
import { AppError } from "../errors/app-error";

const uploadDir = path.resolve(process.cwd(), "uploads", "tmp");
fs.mkdirSync(uploadDir, { recursive: true });

const hardMaxFileSizeMb = Number(process.env.IMAGE_HARD_MAX_SIZE_MB || "20");
const maxFileSizeBytes =
  Number.isFinite(hardMaxFileSizeMb) && hardMaxFileSizeMb > 0
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

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, `${uniqueSuffix}-${file.originalname}`);
  },
});

export const upload = multer({
  storage,
  limits: { fileSize: maxFileSizeBytes },
  fileFilter: (req, file, cb) => {
    if (allowedMimeTypes.has(file.mimetype.toLowerCase())) {
      cb(null, true);
    } else {
      cb(new AppError(400, "Зөвхөн зураг оруулах боломжтой."));
    }
  },
});
