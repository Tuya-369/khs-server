import { AppError } from "../../errors/app-error";
import type { Prisma, RequestStatus } from "@prisma/client";
import { prisma } from "../../utils/prisma";

type CreateRequestData = {
  vehicleId: string;
  partIds: string[];
  description: string;
};

type RequestFilters = {
  status?: RequestStatus;
  isReadByAdmin?: "true" | "false";
  page?: number | string;
  limit?: number | string;
};

const requestDetailsInclude = {
  driver: true,
  vehicle: true,
  part: true,
  requestParts: { include: { part: true } },
  images: true,
} satisfies Prisma.RepairRequestInclude;

export class RequestsService {
  async getDriverFormOptions() {
    const [vehicles, globalParts] = await Promise.all([
      prisma.vehicle.findMany({
        include: {
          parts: {
            orderBy: { name: "asc" },
          },
        },
        orderBy: { name: "asc" },
      }),
      prisma.part.findMany({
        where: { isGlobal: true },
        orderBy: { name: "asc" },
      }),
    ]);

    return vehicles.map((vehicle) => {
      const parts = [...globalParts, ...vehicle.parts];
      const groupedParts = new Map<
        string,
        { id: string; name: string; parts: { id: string; name: string }[] }
      >();

      for (const part of parts) {
        const categoryId = part.categoryId || "vehicle-specific";
        const categoryName = part.categoryName || "Тухайн машины сэлбэг";
        const category = groupedParts.get(categoryId) || {
          id: categoryId,
          name: categoryName,
          parts: [],
        };

        category.parts.push({ id: part.id, name: part.name });
        groupedParts.set(categoryId, category);
      }

      return {
        id: vehicle.id,
        name: vehicle.name,
        plate: vehicle.plate,
        type: vehicle.type,
        department: vehicle.department,
        parts: parts.map((part) => ({ id: part.id, name: part.name })),
        partCategories: Array.from(groupedParts.values()),
      };
    });
  }

  async createRequest(
    driverId: string,
    data: CreateRequestData,
    imageUrls: string[],
  ) {
    const vehicle = await prisma.vehicle.findUnique({
      where: { id: data.vehicleId },
    });
    if (!vehicle)
      throw new AppError(400, "Сонгосон машины мэдээлэл буруу байна.");

    const parts = await prisma.part.findMany({
      where: {
        id: { in: data.partIds },
        OR: [{ isGlobal: true }, { vehicleId: vehicle.id }],
      },
    });

    return prisma.repairRequest.create({
      data: {
        driverId,
        vehicleId: data.vehicleId,
        partId: parts[0]?.id,
        description: data.description,
        requestParts: {
          create: parts.map((part) => ({ partId: part.id })),
        },
        images: {
          create: imageUrls.map((url) => ({ url })),
        },
      },
      include: { requestParts: { include: { part: true } }, images: true },
    });
  }

  async getMyRequests(driverId: string) {
    return prisma.repairRequest.findMany({
      where: { driverId },
      include: {
        vehicle: true,
        part: true,
        requestParts: { include: { part: true } },
        images: true,
      },
      orderBy: { createdAt: "desc" },
    });
  }

  async getAllRequests(filters: RequestFilters) {
    const { status, isReadByAdmin, page = 1, limit = 10 } = filters;
    const skip = (Number(page) - 1) * Number(limit);

    const whereClause: Prisma.RepairRequestWhereInput = {};
    if (status) whereClause.status = status;
    if (isReadByAdmin !== undefined)
      whereClause.isReadByAdmin = isReadByAdmin === "true";

    const [items, total] = await prisma.$transaction([
      prisma.repairRequest.findMany({
        where: whereClause,
        include: requestDetailsInclude,
        skip,
        take: Number(limit),
        orderBy: { createdAt: "desc" },
      }),
      prisma.repairRequest.count({ where: whereClause }),
    ]);

    return { items, total, page: Number(page), limit: Number(limit) };
  }

  async getRequestById(id: string) {
    const request = await prisma.repairRequest.findUnique({
      where: { id },
      include: {
        driver: true,
        vehicle: true,
        part: true,
        requestParts: { include: { part: true } },
        images: true,
      },
    });
    if (!request) throw new AppError(404, "Захиалга олдсонгүй.");

    return request;
  }

  async updateStatus(id: string, status: RequestStatus) {
    const request = await prisma.repairRequest.findUnique({
      where: { id },
      select: { status: true },
    });

    if (!request) throw new AppError(404, "Захиалга олдсонгүй.");
    if (request.status === "COMPLETED") {
      throw new AppError(
        409,
        "Гүйцэтгэсэн захиалгыг цаашид өөрчлөх боломжгүй.",
      );
    }

    return prisma.repairRequest.update({
      where: { id },
      data: { status },
      include: requestDetailsInclude,
    });
  }

  async claim(id: string, adminId: string) {
    const request = await prisma.repairRequest.findUnique({
      where: { id },
      select: { status: true, assignedAdminId: true },
    });

    if (!request) throw new AppError(404, "Захиалга олдсонгүй.");
    if (request.status !== "PENDING" || request.assignedAdminId) {
      throw new AppError(409, "Энэ захиалгыг өөр хэрэглэгч авсан байна.");
    }

    return prisma.repairRequest.update({
      where: { id },
      data: { assignedAdminId: adminId, status: "SEARCHING" },
      include: requestDetailsInclude,
    });
  }

  async markAsRead(id: string) {
    return prisma.repairRequest.update({
      where: { id },
      data: { isReadByAdmin: true },
    });
  }
}
