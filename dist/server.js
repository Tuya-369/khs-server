"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const app_1 = __importDefault(require("./app"));
const logger_1 = require("./utils/logger");
const prisma_1 = require("./utils/prisma");
const PORT = process.env.PORT || 5000;
const server = app_1.default.listen(PORT, () => {
    logger_1.logger.info(`Сервер одоо http://localhost:${PORT} порт дээр ажиллаж байна.`);
});
const shutdown = (signal) => {
    logger_1.logger.warn(`${signal} signal хүлээн авлаа. Серверийг зогсоож байна...`);
    server.close(async (error) => {
        if (error) {
            logger_1.logger.error("HTTP сервер зогсоох үед алдаа гарлаа.", { error });
            process.exit(1);
        }
        await prisma_1.prisma.$disconnect();
        logger_1.logger.info("Сервер болон DB холболтууд аюулгүй хаагдлаа.");
        process.exit(0);
    });
    setTimeout(() => {
        logger_1.logger.error("Graceful shutdown timeout. Хүчээр зогсоож байна.");
        process.exit(1);
    }, 10000).unref();
};
process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("unhandledRejection", (reason) => {
    logger_1.logger.error("Unhandled promise rejection", { reason });
});
process.on("uncaughtException", (error) => {
    logger_1.logger.error("Uncaught exception", { error });
    shutdown("uncaughtException");
});
