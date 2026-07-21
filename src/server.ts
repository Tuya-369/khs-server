import app from "./app";
import { logger } from "./utils/logger";
import { prisma } from "./utils/prisma";

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  logger.info(`Сервер одоо http://localhost:${PORT} порт дээр ажиллаж байна.`);
});

const shutdown = (signal: string) => {
  logger.warn(`${signal} signal хүлээн авлаа. Серверийг зогсоож байна...`);

  server.close(async (error) => {
    if (error) {
      logger.error("HTTP сервер зогсоох үед алдаа гарлаа.", { error });
      process.exit(1);
    }

    await prisma.$disconnect();
    logger.info("Сервер болон DB холболтууд аюулгүй хаагдлаа.");
    process.exit(0);
  });

  setTimeout(() => {
    logger.error("Graceful shutdown timeout. Хүчээр зогсоож байна.");
    process.exit(1);
  }, 10000).unref();
};

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));

process.on("unhandledRejection", (reason) => {
  logger.error("Unhandled promise rejection", { reason });
});

process.on("uncaughtException", (error) => {
  logger.error("Uncaught exception", { error });
  shutdown("uncaughtException");
});
