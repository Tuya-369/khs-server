import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash("password123", 10);

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
      description: "Цэвэр даавуун цамц, лого хэвлэлттэй",
      longDescription:
        "Цэвэр даавуун материалаар хийгдсэн ба компанийн лого урд талд хэвлэгдсэн.",
      price: 110000,
      stock: 100,
      sizes: ["S", "M", "L", "XL"],
      colors: ["Хар", "Хөх"],
      imageUrl:
        "https://res.cloudinary.com/hfroefns/image/upload/v1782976073/3a98925c-2bc6-44a4-aad2-d04660f83387_kkdm3v.jpg",
    },
    {
      title: "KHS Bag",
      description: "Компанийн логотой цүнх",
      longDescription: "Том оврын компанийн логотой цүнх.",
      price: 190000,
      stock: 100,
      sizes: ["One Size"],
      colors: ["Хар"],
      imageUrl:
        "https://res.cloudinary.com/hfroefns/image/upload/v1785743470/bag_gfrdoa.png",
    },
    {
      title: "fliptop mug",
      description: "Stanley-ийн fliptop сав",
      longDescription:
        "Stanley-ийн fliptop mug загвар, 354мл багтаамжтай халуун хүйтнээ хадгалдагч аяга.",
      price: 130000,
      stock: 100,
      sizes: ["One Size"],
      colors: ["Саарал"],
      imageUrl:
        "https://res.cloudinary.com/hfroefns/image/upload/v1785743471/fliptop_sbl2zv.png",
    },
    {
      title: "flip straw tubler",
      description: "Stanley-ийн flip straw tubler",
      longDescription:
        "Stanley-ийн flip straw tubler загвар, 887мл багтаамжтай халуун хүйтнээ хадгалдагч аяга.",
      price: 140000,
      stock: 100,
      sizes: ["One Size"],
      colors: ["Ягаан"],
      imageUrl:
        "https://res.cloudinary.com/hfroefns/image/upload/v1785743471/Flip_straw_p2eclk.png",
    },
    {
      title: "To go bottle",
      description: "Stanley-ийн To go bottle загвар",
      longDescription:
        "Stanley-ийн To go bottle загвар, 500мл багтаамжтай халуун хүйтнээ хадгалдагч аяга.",
      price: 120000,
      stock: 100,
      sizes: ["One Size"],
      colors: ["Ягаан"],
      imageUrl:
        "https://res.cloudinary.com/hfroefns/image/upload/v1785743472/To_go_bottle_mzbec6.png",
    },
    {
      title: "Travel mug",
      description: "Stanley-ийн Travel mug",
      longDescription:
        "Stanley-ийн Travel mug загвар, 473мл багтаамжтай халуун хүйтнээ хадгалдагч аяга.",
      price: 140000,
      stock: 100,
      sizes: ["One Size"],
      colors: ["Хар"],
      imageUrl:
        "https://res.cloudinary.com/hfroefns/image/upload/v1785743471/travel_mug_hofoxu.png",
    },
    {
      title: "Bose headphones",
      description: "Bose-ийн чихэвч",
      longDescription: "Bose-ийн чихэвч загвар, өндөр чанартай дуугаралттай.",
      price: 720000,
      stock: 100,
      sizes: ["One Size"],
      colors: ["Цагаан", "Хар"],
      imageUrl:
        "https://res.cloudinary.com/hfroefns/image/upload/v1785743470/bose_headphone_dxrfl0.png",
    },
    {
      title: "Sony headphones",
      description: "Sony-ийн чихэвч",
      longDescription: "Sony-ийн чихэвч загвар, өндөр чанартай дуугаралттай.",
      price: 90000,
      stock: 100,
      sizes: ["One Size"],
      colors: ["Хар"],
      imageUrl:
        "https://res.cloudinary.com/hfroefns/image/upload/v1785743471/sony_bprtpg.png",
    },
    {
      title: "Wireless Speaker",
      description: "Wireless Speaker",
      longDescription: "Wireless Speaker загвар, өндөр чанартай дуугаралттай.",
      price: 160000,
      stock: 100,
      sizes: ["One Size"],
      colors: ["Хар ", "Цагаан"],
      imageUrl:
        "https://res.cloudinary.com/hfroefns/image/upload/v1785743471/speacker_mtvwj1.png",
    },
    {
      title: "Tablet",
      description: "Tablet",
      longDescription:
        "Орчин үеийн загварын Tablet, өндөр чанартай материалаар хийгдсэн.",
      price: 830000,
      stock: 100,
      sizes: ["One Size"],
      colors: ["Ногоон", "Мөнгөлөг", "Хар"],
      imageUrl:
        "https://res.cloudinary.com/hfroefns/image/upload/v1785743471/Table_a0f9hr.png",
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
