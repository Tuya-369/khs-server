import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import rateLimit from "express-rate-limit";
import path from "path";

import authRoutes from "./modules/auth/auth.routes";
import requestRoutes from "./modules/requests/requests.routes";
import merchRoutes from "./modules/merch/merch.routes";
import orderRoutes from "./modules/orders/orders.routes";
import dashboardRoutes from "./modules/dashboard/dashboard.routes";
import calendarRoutes from "./modules/calendar/calendar.routes";
import { errorMiddleware } from "./middlewares/error.middleware";

const app = express();

const toInt = (value: string | undefined, fallback: number): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

const corsWhitelist = (process.env.CORS_WHITELIST || "http://localhost:3000")
  .split(",")
  .map((origin) => origin.trim().replace(/\/$/, ""))
  .filter(Boolean);

app.set("trust proxy", true);

app.use(helmet());
app.use(
  cors({
    origin(origin, callback) {
      if (!origin || corsWhitelist.includes(origin.replace(/\/$/, ""))) {
        callback(null, true);
        return;
      }

      callback(new Error(`CORS origin is not allowed: ${origin}`));
    },
    credentials: true,
  }),
);
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true, limit: "1mb" }));
app.use(cookieParser());
app.use("/uploads", express.static(path.resolve(process.cwd(), "uploads")));

const limiter = rateLimit({
  windowMs: toInt(process.env.API_RATE_LIMIT_WINDOW_MS, 15 * 60 * 1000),
  max: toInt(process.env.API_RATE_LIMIT_MAX, 500),
  message: "Хэт олон хүсэлт илгээсэн тул түр хязгаарлав.",
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) =>
    req.method === "OPTIONS" ||
    Boolean(req.headers.authorization?.startsWith("Bearer ")),
});
app.use("/api/", limiter);

const authLimiter = rateLimit({
  windowMs: toInt(process.env.AUTH_RATE_LIMIT_WINDOW_MS, 5 * 60 * 1000),
  max: toInt(process.env.AUTH_RATE_LIMIT_MAX, 20),
  message: "Login оролдлого хэтэрлээ. Түр хүлээгээд дахин оролдоно уу.",
  skipSuccessfulRequests: true,
  standardHeaders: true,
  legacyHeaders: false,
});

app.post("/api/auth/login", authLimiter);

app.get("/healthz", (_req, res) => {
  res.status(200).json({ success: true, message: "ok" });
});

app.use("/api/auth", authRoutes);
app.use("/api/requests", requestRoutes);
app.use("/api/merch", merchRoutes);
app.use("/api/merch-orders", orderRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/calendar", calendarRoutes);

app.use(errorMiddleware);

export default app;
