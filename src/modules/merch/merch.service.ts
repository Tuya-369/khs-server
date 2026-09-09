import type { Prisma } from "@prisma/client";
import { prisma } from "../../utils/prisma";

type PaginationOptions = {
  page?: number;
  limit?: number;
};

export class MerchService {
  async getAll({ page = 1, limit = 24 }: PaginationOptions = {}) {
    const where = { isActive: true };
    const [items, total] = await prisma.$transaction([
      prisma.merchItem.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      prisma.merchItem.count({ where }),
    ]);

    return { items, total, page, limit };
  }

  async getById(id: string) {
    return prisma.merchItem.findUniqueOrThrow({ where: { id } });
  }

  async create(data: Prisma.MerchItemCreateInput) {
    return prisma.merchItem.create({ data });
  }

  async update(id: string, data: Prisma.MerchItemUpdateInput) {
    return prisma.merchItem.update({ where: { id }, data });
  }

  async delete(id: string) {
    return prisma.merchItem.update({
      where: { id },
      data: { isActive: false },
    });
  }
}
