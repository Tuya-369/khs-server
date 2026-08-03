"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RequestsService = void 0;
const app_error_1 = require("../../errors/app-error");
const prisma_1 = require("../../utils/prisma");
class RequestsService {
    async getDriverFormOptions(driverId) {
        const vehicles = await prisma_1.prisma.vehicle.findMany({
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
    async createRequest(driverId, data, imageUrls) {
        // Жолоочид тэрэг хуваарилагдсан эсэхийг баталгаажуулах
        const vehicle = await prisma_1.prisma.vehicle.findFirst({
            where: { id: data.vehicleId, assignedDriverId: driverId },
        });
        if (!vehicle)
            throw new app_error_1.AppError(400, "Энэ машин танд хуваарилагдаагүй байна.");
        return prisma_1.prisma.repairRequest.create({
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
    async getMyRequests(driverId) {
        return prisma_1.prisma.repairRequest.findMany({
            where: { driverId },
            include: { vehicle: true, part: true, images: true },
            orderBy: { createdAt: "desc" },
        });
    }
    async getAllRequests(filters) {
        const { status, isReadByAdmin, page = 1, limit = 10 } = filters;
        const skip = (Number(page) - 1) * Number(limit);
        const whereClause = {};
        if (status)
            whereClause.status = status;
        if (isReadByAdmin !== undefined)
            whereClause.isReadByAdmin = isReadByAdmin === "true";
        const [items, total] = await prisma_1.prisma.$transaction([
            prisma_1.prisma.repairRequest.findMany({
                where: whereClause,
                include: { driver: true, vehicle: true, part: true, images: true },
                skip,
                take: Number(limit),
                orderBy: { createdAt: "desc" },
            }),
            prisma_1.prisma.repairRequest.count({ where: whereClause }),
        ]);
        return { items, total, page: Number(page), limit: Number(limit) };
    }
    async updateStatus(id, status) {
        return prisma_1.prisma.repairRequest.update({
            where: { id },
            data: { status },
        });
    }
    async markAsRead(id) {
        return prisma_1.prisma.repairRequest.update({
            where: { id },
            data: { isReadByAdmin: true },
        });
    }
}
exports.RequestsService = RequestsService;
