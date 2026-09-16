import { Request, Response, NextFunction } from "express";
import multer from "multer";
import { Prisma } from "@prisma/client";
import { AppError } from "../errors/app-error";
import { logger } from "../utils/logger";

export const errorMiddleware = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  void next;

  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({
        success: false,
        code: "FILE_TOO_LARGE",
        message: "Зурагны хэмжээ хэтэрсэн байна.",
        errors: [],
      });
    }

    return res.status(400).json({
      success: false,
      code: "FILE_UPLOAD_ERROR",
      message: "Файл оруулах үед алдаа гарлаа.",
      errors: [],
    });
  }

  if (
    err instanceof Prisma.PrismaClientKnownRequestError &&
    err.code === "P2002"
  ) {
    const fields = Array.isArray(err.meta?.target) ? err.meta.target : [];
    const isPhoneNumber = fields.includes("phoneNumber");

    return res.status(400).json({
      success: false,
      code: isPhoneNumber ? "PHONE_ALREADY_REGISTERED" : "DUPLICATE_VALUE",
      message: isPhoneNumber
        ? "Таны утасны дугаар серверт бүртгэлтэй байна."
        : "Энэ өгөгдөл аль хэдийн бүртгэлтэй байна.",
      errors: [],
    });
  }

  if (err instanceof AppError) {
    logger.warn(`AppError: ${err.message} [Code: ${err.statusCode}]`);
    return res.status(err.statusCode).json({
      success: false,
      code: err.code,
      message: err.message,
      errors: err.errors,
    });
  }

  logger.error(`Unhandled Error: ${err.message}`, { stack: err.stack });
  return res.status(500).json({
    success: false,
    code: "INTERNAL_SERVER_ERROR",
    message: "Серверийн дотоод алдаа гарлаа.",
    errors: [],
  });
};
