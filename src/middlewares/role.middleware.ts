import { Request, Response, NextFunction } from "express";
import { AppError } from "../errors/app-error";

export const authorize = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new AppError(401, "Хэрэглэгч баталгаажаагүй байна."));
    }
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError(403, "Танд энэ үйлдлийг хийх эрх байхгүй байна."),
      );
    }
    next();
  };
};
