export class AppError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public errors: any[] = [],
    public code: string = "APP_ERROR",
  ) {
    super(message);
    Object.setPrototypeOf(this, new.target.prototype);
    Error.captureStackTrace(this, this.constructor);
  }
}
