import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { AppError } from "../../errors/app-error";
import { prisma } from "../../utils/prisma";

export class AuthService {
  async createUserByAdmin(data: any) {
    const existing = await prisma.user.findUnique({
      where: { sapId: data.sapId },
    });

    if (existing) {
      throw new AppError(
        400,
        "Энэ SAP ID-тай хэрэглэгч аль хэдийн бүртгэгдсэн байна.",
        [],
        "USER_ALREADY_EXISTS",
      );
    }

    const passwordHash = await bcrypt.hash(data.password, 10);
    return prisma.user.create({
      data: {
        sapId: data.sapId,
        firstName: data.firstName,
        lastName: data.lastName,
        phoneNumber: data.phoneNumber,
        passwordHash,
        role: data.role,
      },
      select: {
        id: true,
        sapId: true,
        firstName: true,
        lastName: true,
        phoneNumber: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
    });
  }

  async register(data: any) {
    const existing = await prisma.user.findUnique({
      where: { sapId: data.sapId },
    });
    if (existing)
      throw new AppError(
        400,
        "Энэ SAP ID-тай хэрэглэгч аль хэдийн бүртгэгдсэн байна.",
      );

    const passwordHash = await bcrypt.hash(data.password, 10);
    return prisma.user.create({
      data: {
        sapId: data.sapId,
        firstName: data.firstName,
        lastName: data.lastName,
        phoneNumber: data.phoneNumber,
        passwordHash,
        role: "EMPLOYEE",
      },
      select: {
        id: true,
        sapId: true,
        firstName: true,
        lastName: true,
        role: true,
      },
    });
  }

  async login(data: any) {
    const user = await prisma.user.findUnique({ where: { sapId: data.sapId } });
    if (!user || !(await bcrypt.compare(data.password, user.passwordHash))) {
      throw new AppError(401, "SAP ID эсвэл нууц үг буруу байна.");
    }
    if (!user.isActive) throw new AppError(403, "Таны бүртгэл идэвхгүй байна.");

    const accessToken = jwt.sign(
      { userId: user.id, role: user.role },
      process.env.JWT_ACCESS_SECRET || "access_secret",
      { expiresIn: "15m" },
    );
    const refreshToken = jwt.sign(
      { userId: user.id },
      process.env.JWT_REFRESH_SECRET || "refresh_secret",
      { expiresIn: "7d" },
    );

    await prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId: user.id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    return {
      user: {
        id: user.id,
        sapId: user.sapId,
        role: user.role,
        firstName: user.firstName,
        lastName: user.lastName,
      },
      accessToken,
      refreshToken,
    };
  }

  async refresh(token: string) {
    const dbToken = await prisma.refreshToken.findUnique({
      where: { token },
      include: { user: true },
    });
    if (!dbToken || dbToken.expiresAt < new Date()) {
      if (dbToken)
        await prisma.refreshToken.delete({ where: { id: dbToken.id } });
      throw new AppError(
        401,
        "Хүчингүй эсвэл хугацаа нь дууссан refresh токен.",
      );
    }

    const accessToken = jwt.sign(
      { userId: dbToken.user.id, role: dbToken.user.role },
      process.env.JWT_ACCESS_SECRET || "access_secret",
      { expiresIn: "15m" },
    );
    return { accessToken };
  }

  async logout(token: string) {
    await prisma.refreshToken.deleteMany({ where: { token } });
  }

  async getMe(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        sapId: true,
        firstName: true,
        lastName: true,
        phoneNumber: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
    });

    if (!user) {
      throw new AppError(404, "Хэрэглэгч олдсонгүй.", [], "USER_NOT_FOUND");
    }

    return user;
  }
}
