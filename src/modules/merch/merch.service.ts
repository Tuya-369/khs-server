import type { Prisma } from "@prisma/client";
import { prisma } from "../../utils/prisma";

export class MerchService {
  async getAll() {
    return prisma.merchItem.findMany({ where: { isActive: true } });
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
