import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash("password123", 10);

  // Демо хэрэглэгчид үүсгэх
  const admin = await prisma.user.upsert({
    where: { sapId: "SAP001" },
    update: {},
    create: {
      sapId: "SAP001",
      firstName: "Бат",
      lastName: "Болд",
      phoneNumber: "99112233",
      passwordHash,
      role: "ADMIN",
    },
  });

  const driver = await prisma.user.upsert({
    where: { sapId: "SAP002" },
    update: {},
    create: {
      sapId: "SAP002",
      firstName: "Ганзориг",
      lastName: "Төмөр",
      phoneNumber: "88112233",
      passwordHash,
      role: "DRIVER",
    },
  });

  // Машин оруулах
  const vehicle = await prisma.vehicle.upsert({
    where: { plate: "0011УББ" },
    update: {},
    create: {
      name: "Hyundai Mighty",
      plate: "0011УББ",
      assignedDriverId: driver.id,
    },
  });

  console.log("Демо өгөгдөл амжилттай орлоо.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
