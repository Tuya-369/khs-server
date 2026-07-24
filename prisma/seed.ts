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

  // Дэлгүүрийн бараа (merch) оруулах
  const merchItems = [
    {
      title: "T-shirt",
      description: "брэндийн лого хэвлэлттэй",
      longDescription:
        "100% хөвөн даавуугаар хийгдсэн, компанийн лого урд талд хэвлэгдсэн энгийн загварын футболк.",
      price: 40.0,
      stock: 100,
      sizes: ["S", "M", "L", "XL"],
      colors: ["Хар", "Цагаан"],
      imageUrl:
        "https://res.cloudinary.com/hfroefns/image/upload/v1782976073/b7a98308-42af-4142-80e5-50d0615b7134_kgvv1p.jpg",
    },
    {
      title: "KHS Hoodie",
      description: "Даавуун цамц, лого хэвлэлттэй",
      longDescription:
        "Дахин ашиглах боломжтой, бат бөх даавуугаар хийгдсэн, компанийн лого хэвлэгдсэн худи.",
      price: 110.0,
      stock: 150,
      sizes: ["S", "M", "L", "XL"],
      colors: ["Хар", "Хөх"],
      imageUrl:
        "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=900&q=80",
    },
    {
      title: "Уулын малгай",
      description: "Компанийн логотой малгай",
      longDescription:
        "Тохируулгатай хажуу бариултай, компанийн лого хэвлэгдсэн бейсболын малгай.",
      price: 18000,
      stock: 80,
      sizes: ["One Size"],
      colors: ["Хар", "Саарал"],
      imageUrl:
        "https://images.unsplash.com/photo-1588850561407-ed78c282e89b?auto=format&fit=crop&w=900&q=80",
    },
    {
      title: "Термо аяга",
      description: "Дулаан барих чадвартай металл аяга",
      longDescription:
        "Гэрлэн шингэн буцалгах чадвартай, компанийн лого гравюртай, 500мл багтаамжтай термо аяга.",
      price: 30000,
      stock: 60,
      sizes: ["One Size"],
      colors: ["Хар", "Мөнгөлөг"],
      imageUrl:
        "https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?auto=format&fit=crop&w=900&q=80",
    },
  ];

  for (const item of merchItems) {
    const existing = await prisma.merchItem.findFirst({
      where: { title: item.title },
    });

    if (existing) {
      await prisma.merchItem.update({
        where: { id: existing.id },
        data: item,
      });
    } else {
      await prisma.merchItem.create({ data: item });
    }
  }

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
