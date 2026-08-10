import { AppError } from "../../errors/app-error";
import { prisma } from "../../utils/prisma";

export class CalendarService {
  async getNotes(userId: string) {
    return prisma.calendarNote.findMany({
      where: { userId },
      orderBy: { createdAt: "asc" },
    });
  }

  async createNote(userId: string, noteDate: string, text: string) {
    return prisma.calendarNote.create({
      data: { userId, noteDate, text },
    });
  }

  async updateNote(userId: string, id: string, done: boolean) {
    const note = await prisma.calendarNote.findFirst({ where: { id, userId } });
    if (!note) throw new AppError(404, "Тэмдэглэл олдсонгүй.");

    return prisma.calendarNote.update({ where: { id }, data: { done } });
  }

  async deleteNote(userId: string, id: string) {
    const note = await prisma.calendarNote.findFirst({ where: { id, userId } });
    if (!note) throw new AppError(404, "Тэмдэглэл олдсонгүй.");

    await prisma.calendarNote.delete({ where: { id } });
  }
}
