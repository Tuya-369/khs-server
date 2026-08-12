import multer from "multer";
import { AppError } from "../errors/app-error";

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

export const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: maxFileSizeBytes },
  fileFilter: (req, file, cb) => {
    if (allowedMimeTypes.has(file.mimetype.toLowerCase())) {
      cb(null, true);
    } else {
      cb(new AppError(400, "Зөвхөн зураг оруулах боломжтой."));
    }
  },
});
