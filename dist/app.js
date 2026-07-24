"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const path_1 = __importDefault(require("path"));
const auth_routes_1 = __importDefault(require("./modules/auth/auth.routes"));
const requests_routes_1 = __importDefault(require("./modules/requests/requests.routes"));
const merch_routes_1 = __importDefault(require("./modules/merch/merch.routes"));
const orders_routes_1 = __importDefault(require("./modules/orders/orders.routes"));
const dashboard_routes_1 = __importDefault(require("./modules/dashboard/dashboard.routes"));
const error_middleware_1 = require("./middlewares/error.middleware");
const app = (0, express_1.default)();
const toInt = (value, fallback) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};
const corsWhitelist = (process.env.CORS_WHITELIST || "http://localhost:3000")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
app.set("trust proxy", 1);
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)({
    origin(origin, callback) {
        if (!origin || corsWhitelist.includes(origin)) {
            callback(null, true);
            return;
        }
        callback(new Error(`CORS origin is not allowed: ${origin}`));
    },
    credentials: true,
}));
app.use(express_1.default.json({ limit: "1mb" }));
app.use(express_1.default.urlencoded({ extended: true, limit: "1mb" }));
app.use((0, cookie_parser_1.default)());
app.use("/uploads", express_1.default.static(path_1.default.resolve(process.cwd(), "uploads")));
const limiter = (0, express_rate_limit_1.default)({
    windowMs: toInt(process.env.API_RATE_LIMIT_WINDOW_MS, 15 * 60 * 1000),
    max: toInt(process.env.API_RATE_LIMIT_MAX, 500),
    message: "Хэт олон хүсэлт илгээсэн тул түр хязгаарлав.",
    standardHeaders: true,
    legacyHeaders: false,
});
app.use("/api/", limiter);
const authLimiter = (0, express_rate_limit_1.default)({
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
app.use("/api/auth", auth_routes_1.default);
app.use("/api/requests", requests_routes_1.default);
app.use("/api/merch", merch_routes_1.default);
app.use("/api/merch-orders", orders_routes_1.default);
app.use("/api/dashboard", dashboard_routes_1.default);
app.use(error_middleware_1.errorMiddleware);
exports.default = app;
