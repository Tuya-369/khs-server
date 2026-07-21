import { AppError } from "../../errors/app-error";
import { prisma } from "../../utils/prisma";

export class RequestsService {
  async getDriverFormOptions(driverId: string) {
    const vehicles = await prisma.vehicle.findMany({
      where: { assignedDriverId: driverId },
      include: {
        parts: {
          orderBy: { name: "asc" },
        },
      },
      orderBy: { name: "asc" },
    });

    return vehicles.map((vehicle) => ({
      id: vehicle.id,
      name: vehicle.name,
      plate: vehicle.plate,
      parts: vehicle.parts.map((part) => ({
        id: part.id,
        name: part.name,
      })),
    }));
  }

  async createRequest(driverId: string, data: any, imageUrls: string[]) {
    // Жолоочид тэрэг хуваарилагдсан эсэхийг баталгаажуулах
    const vehicle = await prisma.vehicle.findFirst({
      where: { id: data.vehicleId, assignedDriverId: driverId },
    });
    if (!vehicle)
      throw new AppError(400, "Энэ машин танд хуваарилагдаагүй байна.");

    return prisma.repairRequest.create({
      data: {
        driverId,
        vehicleId: data.vehicleId,
        partId: data.partId || null,
        description: data.description,
        images: {
          create: imageUrls.map((url) => ({ url })),
        },
      },
      include: { images: true },
    });
  }

  async getMyRequests(driverId: string) {
    return prisma.repairRequest.findMany({
      where: { driverId },
      include: { vehicle: true, part: true, images: true },
      orderBy: { createdAt: "desc" },
    });
  }

  async getAllRequests(filters: any) {
    const { status, isReadByAdmin, page = 1, limit = 10 } = filters;
    const skip = (Number(page) - 1) * Number(limit);

    const whereClause: any = {};
    if (status) whereClause.status = status;
    if (isReadByAdmin !== undefined)
      whereClause.isReadByAdmin = isReadByAdmin === "true";

    const [items, total] = await prisma.$transaction([
      prisma.repairRequest.findMany({
        where: whereClause,
        include: { driver: true, vehicle: true, part: true, images: true },
        skip,
        take: Number(limit),
        orderBy: { createdAt: "desc" },
      }),
      prisma.repairRequest.count({ where: whereClause }),
    ]);

    return { items, total, page: Number(page), limit: Number(limit) };
  }

  async updateStatus(id: string, status: any) {
    return prisma.repairRequest.update({
      where: { id },
      data: { status },
    });
  }

  async markAsRead(id: string) {
    return prisma.repairRequest.update({
      where: { id },
      data: { isReadByAdmin: true },
    });
  }
}
