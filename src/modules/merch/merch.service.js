"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MerchService = void 0;
const prisma_1 = require("../../utils/prisma");
class MerchService {
    async getAll() {
        return prisma_1.prisma.merchItem.findMany({ where: { isActive: true } });
    }
    async getById(id) {
        return prisma_1.prisma.merchItem.findUniqueOrThrow({ where: { id } });
    }
    async create(data) {
        return prisma_1.prisma.merchItem.create({ data });
    }
    async update(id, data) {
        return prisma_1.prisma.merchItem.update({ where: { id }, data });
    }
    async delete(id) {
        return prisma_1.prisma.merchItem.update({
            where: { id },
            data: { isActive: false },
        });
    }
}
exports.MerchService = MerchService;
