import { Request, Response, NextFunction } from "express";
import { AnyZodObject, ZodError } from "zod";
import { AppError } from "../errors/app-error";

export const validate = (schema: AnyZodObject) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      return next();
    } catch (error) {
      if (error instanceof ZodError) {
        const formattedErrors = error.errors.map((err) => ({
          field: err.path.join(".").replace(/^(body|query|params)\./, ""),
          message: err.message,
        }));

        const firstMessage =
          formattedErrors[0]?.message || "Оруулсан өгөгдөл буруу байна.";
        return next(
          new AppError(400, firstMessage, formattedErrors, "VALIDATION_ERROR"),
        );
      }
      return next(error);
    }
  };
};
