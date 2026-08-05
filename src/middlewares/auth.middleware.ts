import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { AppError } from "../errors/app-error";
import { prisma } from "../utils/prisma";

interface JwtPayload {
  userId: string;
  role: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

export const authenticate = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return next(new AppError(401, "Нэвтрэх токен олдсонгүй."));
  }

  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_ACCESS_SECRET || "access_secret",
    ) as JwtPayload;

    prisma.user
      .findUnique({
        where: { id: decoded.userId },
        select: { id: true, role: true, isActive: true },
      })
      .then((user) => {
        if (!user) {
          return next(new AppError(401, "Хэрэглэгч олдсонгүй."));
        }

        if (!user.isActive) {
          return next(new AppError(403, "Таны бүртгэл идэвхгүй байна."));
        }

        req.user = { userId: user.id, role: user.role };
        return next();
      })
      .catch(() =>
        next(new AppError(500, "Хэрэглэгчийн эрх шалгах үед алдаа гарлаа.")),
      );
  } catch {
    return next(new AppError(401, "Хүчингүй эсвэл хугацаа нь дууссан токен."));
  }
};
