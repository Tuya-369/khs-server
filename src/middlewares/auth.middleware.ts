import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { AppError } from "../errors/app-error";

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
    req.user = decoded;
    next();
  } catch (error) {
    return next(new AppError(401, "Хүчингүй эсвэл хугацаа нь дууссан токен."));
  }
};
