import {
  LeaveApprovalLevel,
  Prisma,
  PrismaClient,
  ProjectName,
} from "@prisma/client";
import {
  employeeProjectAssignments,
  employeeSeedSummary,
  leaveRequestAccessAssignments,
  leaveRequestHrDirectorAssignments,
  leaveRequestResponsibleHrAssignments,
  leaveRequestSeniorApproverAssignments,
  manualLeaveRequestApproverOverrides,
} from "./employee-seed-data";

const prisma = new PrismaClient();
export interface Vehicle {
  name: string;
  type: string;
  plate: string;
  department: string;
}

export const vehicles: Vehicle[] = [
  {
    name: "Land Cruiser 79",
    type: "Light Vehicle",
    plate: "LV-6415",
    department: "Operation",
  },
  {
    name: "Bieben - Northbenz",
    type: "Waste Water Truck",
    plate: "RT-5312",
    department: "Operation",
  },
  {
    name: "Bieben - Northbenz",
    type: "Waste Water Truck",
    plate: "RT-5311",
    department: "Operation",
  },
  {
    name: "Bieben - Northbenz",
    type: "Waste Water Truck",
    plate: "RT-5765",
    department: "Operation",
  },
  {
    name: "ISUZU Sinotruck",
    type: "Regular Truck",
    plate: "RT-5506",
    department: "Operation",
  },
  {
    name: "KIA Bongo",
    type: "Regular Truck",
    plate: "RT-5667",
    department: "OPS-Mechanic",
  },
  {
    name: "KIA Bongo 3",
    type: "Regular Truck",
    plate: "RT-5723",
    department: "OPS-Mechanic",
  },
  {
    name: "Land Cruiser 70",
    type: "Light Vehicle",
    plate: "LV-6314",
    department: "Project",
  },
  {
    name: "Land Cruiser 76",
    type: "Light Vehicle",
    plate: "LV-6238",
    department: "Project",
  },
  {
    name: "HYUNDAI 11 Ton",
    type: "Truck",
    plate: "RT-5577",
    department: "Project",
  },
  {
    name: "Hyundai Porter II",
    type: "Regular Truck",
    plate: "RT-5382",
    department: "Project",
  },
  {
    name: "Kia - Bongo",
    type: "Regular Truck",
    plate: "RT-5461",
    department: "Project",
  },
  {
    name: "KIA Bongo 3",
    type: "Regular Truck",
    plate: "RT-5740",
    department: "Project",
  },
  {
    name: "Komatsu",
    type: "Backhoe",
    plate: "LO-5227",
    department: "Project",
  },
  {
    name: "Ginjit",
    type: "Excavator",
    plate: "EX-5284",
    department: "Project",
  },
  {
    name: "Sinotruck",
    type: "HOWO",
    plate: "RT-5764",
    department: "Project",
  },
  {
    name: "Land Cruiser 76",
    type: "Light Vehicle",
    plate: "LV-6298",
    department: "Concentrator",
  },
  {
    name: "KIA Bongo",
    type: "Regular Truck",
    plate: "RT-5622",
    department: "Concentrator",
  },
  {
    name: "KIA Bongo",
    type: "Regular Truck",
    plate: "RT-5604",
    department: "Concentrator",
  },
  {
    name: "KIA Bongo",
    type: "Regular Truck",
    plate: "RT-5648",
    department: "Concentrator",
  },
  {
    name: "KIA Bongo 3",
    type: "Regular Truck",
    plate: "RT-5722",
    department: "Concentrator",
  },
  {
    name: "Hyundai Sonata",
    type: "Mid-Size Vehicle",
    plate: "8723-УНГ",
    department: "UB",
  },
  {
    name: "Tacoma",
    type: "Light Vehicle",
    plate: "5921-УБУ",
    department: "UB",
  },
  {
    name: "KIA Bongo",
    type: "Regular Truck",
    plate: "0832-УБЭ",
    department: "UB",
  },
  {
    name: "Ford Ranger",
    type: "Light Vehicle",
    plate: "3912-УКС",
    department: "UB",
  },
  {
    name: "Ford Ranger",
    type: "Light Vehicle",
    plate: "0834-УЕА",
    department: "UB",
  },
  {
    name: "Navara Nissan",
    type: "Light Vehicle",
    plate: "LV-6361",
    department: "UG",
  },
  {
    name: "Mazda",
    type: "Light Vehicle",
    plate: "LV-6386",
    department: "UG-Muck",
  },
  {
    name: "KIA Bongo 3",
    type: "Regular Truck",
    plate: "RT-5568",
    department: "UG",
  },
  {
    name: "HOWO",
    type: "Regular Truck",
    plate: "RT-5746",
    department: "UG-Muck",
  },
  {
    name: "HOWO",
    type: "Regular Truck",
    plate: "RT-5747",
    department: "UG-Muck",
  },
  {
    name: "HOWO",
    type: "Regular Truck",
    plate: "RT-5745",
    department: "UG-Muck",
  },
  {
    name: "HOWO",
    type: "Regular Truck",
    plate: "RT-5751",
    department: "UG-Muck",
  },
  {
    name: "Ус шүрших",
    type: "Regular Truck",
    plate: "RT-5766",
    department: "UG-Muck",
  },
  {
    name: "Waste Water Truck",
    type: "Regular Truck",
    plate: "RT-5404",
    department: "Operation",
  },
  {
    name: "Hyunda County",
    type: "BU",
    plate: "BU-5568",
    department: "Project",
  },
  {
    name: "XCMG",
    type: "Автогрейдер",
    plate: "GR-5074",
    department: "UG-Muck",
  },
  {
    name: "Hyundai.5TON",
    type: "Regular Truck",
    plate: "RT-5805",
    department: "UG-Muck",
  },
  {
    name: "Hyundai.5TON",
    type: "Regular Truck",
    plate: "RT-5809",
    department: "UG-Muck",
  },
  {
    name: "Land Cruiser 79",
    type: "Light Vehicle",
    plate: "LV-6461",
    department: "Project",
  },
];
export interface PartItem {
  id: string;
  name: string;
}

export interface PartCategory {
  categoryId: string;
  categoryName: string;
  parts: PartItem[];
}

export const globalPartsData: PartCategory[] = [
  {
    categoryId: "engine",
    categoryName: "Хөдөлгүүрийн эд анги",
    parts: [
      { id: "e1", name: "Свеч (Нүүрсэн / Иридиум)" },
      { id: "e2", name: "Бабушин (Очлуур / Койл)" },
      { id: "e3", name: "Моторын тос" },
      { id: "e4", name: "Тосны шүүр" },
      { id: "e5", name: "Агаарын шүүр" },
      { id: "e6", name: "Салон шүүр" },
      { id: "e7", name: "Клапангийн крышканы жийрэг" },
      { id: "e8", name: "Коленвал / Распредвал сальник" },
      { id: "e9", name: "Тайминг ремень / Цепь" },
      { id: "e10", name: "Генераторын ба Вентиляторын ремень" },
      { id: "e11", name: "Ремень чангалагч пулик" },
      { id: "e12", name: "Моторын дэр резин (Кронштейн)" },
      { id: "e13", name: "Усны насос (Помп)" },
      { id: "e14", name: "Термостат" },
      { id: "e15", name: "Турбо агрегат (Турбина)" },
      { id: "e16", name: "Инжектор / Форсунк" },
      { id: "e17", name: "Глушитель (Яндан / Катализатор)" },
    ],
  },
  {
    categoryId: "chassis",
    categoryName: "Явах эд анги",
    parts: [
      { id: "c1", name: "Урд амортизатор" },
      { id: "c2", name: "Хойд амортизатор" },
      { id: "c5", name: "Босоо тэнцүүлэгч" },
      { id: "c6", name: " 3 Булан" },
      { id: "c7", name: "5 Булан" },
      { id: "c8", name: "Дээд гар" },
      { id: "c9", name: "Доод гар" },
      { id: "c11", name: "Өндгөн тулгуур" },
      { id: "c12", name: "Тогтворжуулагч " },
      { id: "c13", name: "Рүлийн татуурга" },
      { id: "c14", name: "Цулбуур " },
      { id: "c15", name: "Пүрш " },
      { id: "c16", name: "Рүлийн шарнер (Гадна)" },
      { id: "c17", name: "Рүлийн аппарат" },
      { id: "c18", name: "Дугуйн холхивч" },
      { id: "c20", name: "Цапф" },
      { id: "c22", name: "Гранатын хамгаалалт резин" },
      { id: "c23", name: "Амортизаторын дээд дэр" },
      { id: "c24", name: "Гарны втулк" },
      { id: "c25", name: "Тогтворжуулагчийн резин" },
      { id: "c26", name: "Рүлийн аппаратын резин" },
    ],
  },
  {
    categoryId: "steering",
    categoryName: "Жолооны систем",
    parts: [
      { id: "s1", name: "Жолооны механизм Рүлийн аппарат " },
      { id: "s2", name: "Рүлийн татуурга" },
      { id: "s3", name: "Рүлийн шарнер" },
      { id: "s4", name: "Рүлийн резин" },
      { id: "s5", name: "Рүлийн насос" },
      { id: "s6", name: "Рүлийн кардан" },
      { id: "s7", name: "Рүлийн шингэн " },
      { id: "s8", name: "Рүлийн цахилгаан мотор" },
      { id: "s9", name: "Рүлийн аппаратын втулк" },
      { id: "s10", name: "Рүлийн тууз " },
      { id: "s11", name: "Рүлийн насосны ремень" },
      { id: "s12", name: "Рүлийн шингэний бак" },
    ],
  },
  {
    categoryId: "brakes",
    categoryName: "Тоормосны систем",
    parts: [
      { id: "br1", name: "Урд тоормосны наклад" },
      { id: "br2", name: "Хойд тоормосны наклад" },
      { id: "br3", name: "Тоормосны диск" },
      { id: "br4", name: "Тоормосны барбан" },
      { id: "br5", name: "Тоормосны суппорт" },
      { id: "br6", name: "Суппортын резин " },
      { id: "br7", name: "Тоормосны шланг" },
      { id: "br8", name: "Тоормосны главны цилиндр" },
      { id: "br9", name: "Тоормосны шингэн " },
      { id: "br10", name: "Тросс" },
    ],
  },

  {
    categoryId: "electrical",
    categoryName: "Цахилгаан ба Мэдрэгчийн систем",
    parts: [
      { id: "el1", name: "Аккумулятор" },
      { id: "el2", name: "Стартер (Асаагуур)" },
      { id: "el3", name: "Генератор (Динамо)" },
      { id: "el4", name: "ABS мэдрэгч (Даччик)" },
      { id: "el5", name: "Коленвал / Распредвал мэдрэгч" },
      { id: "el6", name: "Кислородын мэдрэгч (Лямбда зонд)" },
      { id: "el7", name: "Агаарын урсгал мэдрэгч (MAF sensor)" },
      { id: "el8", name: "Тосны даралт мэдрэгч" },
      { id: "el9", name: "Усны температур мэдрэгч" },
      { id: "el10", name: "Гүүрэн залуурга (Пүүз) ба Реле" },
      { id: "el11", name: "Утас ба Шлейф (Рулийн шлейф)" },
    ],
  },
  {
    categoryId: "cooling_heating",
    categoryName: "Хөргөлт ба Халаалтын систем",
    parts: [
      { id: "ch1", name: "Усны радиатор" },
      { id: "ch2", name: "Печкин радиатор" },
      { id: "ch3", name: "A/C радиатор" },
      { id: "ch4", name: "A/C мотор" },
      { id: "ch5", name: "Печкин мотор" },
      { id: "ch6", name: "Радиаторын сэнс" },
      { id: "ch7", name: "Радиаторын сэнсний мотор" },
      { id: "ch8", name: "Радиаторын диффузор " },
      { id: "ch9", name: "Усны насос (Помп)" },
      { id: "ch10", name: "Термостат" },
      { id: "ch11", name: "Радиаторын таглаа" },
      { id: "ch12", name: "Радиаторын хоолой" },
      { id: "ch13", name: "Нэмэлт усны сав " },
      { id: "ch14", name: "Усны температур мэдрэгч " },
      { id: "ch15", name: "Антифриз" },
    ],
  },
  {
    categoryId: "fuel_system",
    categoryName: "Түлшний систем",
    parts: [
      { id: "f1", name: "Түлшний насос Бензин" },
      { id: "f2", name: "Түлшний насос Дизель" },
      { id: "f3", name: "Түлшний шүүр (Шууд ба Бакны)" },
      { id: "f4", name: "Түлшний даралт тохируулагч" },
      { id: "f5", name: "Түлшний бакны таглаа" },
      { id: "f6", name: "Өндөр даралтын насос мэдрэгч" },
    ],
  },
  {
    categoryId: "lighting_mirrors",
    categoryName: "Гэрэл, Салхины шил",
    parts: [
      { id: "lm1", name: "Урд фар (Иж бүрэн / Линз)" },
      { id: "lm2", name: "Хойд стоп гэрэл" },
      { id: "lm3", name: "Дохионы ба Манангийн гэрэл" },
      { id: "lm4", name: "Гэрлийн лампочка (LED / Xenon / Halogen)" },
      { id: "lm5", name: "Хажуугийн толь (Иж бүрэн)" },
      { id: "lm6", name: "Тольны шил" },
      { id: "lm7", name: "Урд салхины шил" },
      { id: "lm8", name: "Хойд салхины шил" },
      { id: "lm9", name: "Шил арчигч" },
      { id: "lm10", name: "Шил арчигчийн мотор" },
    ],
  },
  {
    categoryId: "body_wheels",
    categoryName: "Кузов, Дугуй",
    parts: [
      { id: "bw1", name: "Урд бампер" },
      { id: "bw2", name: "Хойд бампер" },
      { id: "bw3", name: "Хамар (Капот)" },
      { id: "bw4", name: "Ачааны хаалга / Багаж" },
      { id: "bw5", name: "Хаалганы бариул ба Цоож" },
      { id: "bw6", name: "Хаалганы шил өргөгч мотор / Тросс" },
      { id: "bw7", name: "Бөгтөр / Подкрыльник" },
      { id: "bw8", name: "Дугуй өвөл" },
      { id: "bw9", name: "Дугуй зуны" },
      { id: "bw10", name: "Обуд " },
      { id: "bw11", name: "Дугуйн гайка / Спилька" },
    ],
  },
];

async function main() {
  for (const vehicle of vehicles) {
    await prisma.vehicle.upsert({
      where: { plate: vehicle.plate },
      update: {
        name: vehicle.name,
        type: vehicle.type,
        department: vehicle.department,
      },
      create: vehicle,
    });
  }

  for (const category of globalPartsData) {
    for (const part of category.parts) {
      const existingPart = await prisma.part.findFirst({
        where: { name: part.name, isGlobal: true },
      });

      if (existingPart) {
        await prisma.part.update({
          where: { id: existingPart.id },
          data: {
            categoryId: category.categoryId,
            categoryName: category.categoryName,
          },
        });
      } else {
        await prisma.part.create({
          data: {
            name: part.name,
            categoryId: category.categoryId,
            categoryName: category.categoryName,
            isGlobal: true,
          },
        });
      }
    }
  }

  const merchItems = [
    {
      title: "Цамц",
      category: "merch",
      description: "Брэндийн лого хэвлэлттэй",
      longDescription:
        "100% хөвөн даавуугаар хийгдсэн, компанийн лого урд талд хэвлэгдсэн энгийн загварын футболк.",
      price: 40000,
      stock: 100,
      sizes: ["S", "M", "L", "XL"],
      colors: ["Хар", "Цагаан"],
      imageUrl:
        "https://res.cloudinary.com/hfroefns/image/upload/v1782976073/b7a98308-42af-4142-80e5-50d0615b7134_kgvv1p.jpg",
    },
    {
      title: "Малгайтай цамц",
      category: "merch",
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
      title: "KHS Цүнх",
      category: "merch",
      description: "Компанийн логотой цүнх",
      longDescription: "Том оврын компанийн логотой цүнх.",
      price: 130000,
      stock: 100,
      sizes: ["One Size"],
      colors: ["Хар"],
      imageUrl:
        "https://res.cloudinary.com/hfroefns/image/upload/v1791770682/Screenshot_2026-10-12_100049_hwfoqr.png",
    },
    {
      title: "Халуун хүйтэнээ хадгалдаг сав",
      category: "merch",
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
      title: "Халуун хүйтнээ хадгалдаг сав",
      category: "merch",
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
      title: "Халуун хүйтнээ хадгалдаг сав",
      category: "merch",
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
      title: "Халуун хүйтнээ хадгалдаг сав",
      category: "merch",
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
      title: "Чихэвч",
      category: "merch",
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
      title: "Чихэвч",
      category: "merch",
      description: "JBL-ийн чихэвч",
      longDescription: "JBL-ийн чихэвч загвар, өндөр чанартай дуугаралттай.",
      price: 130000,
      stock: 100,
      sizes: ["One Size"],
      colors: ["Хар", "Цагаан"],
      imageUrl:
        "https://res.cloudinary.com/hfroefns/image/upload/v1791770826/Screenshot_2026-10-12_100655_ajqhzx.png",
    },

    {
      title: "Утасгүй спикер",
      category: "merch",
      description: "Утасгүй спикер",
      longDescription: "Чанартай дуугаралттай.",
      price: 160000,
      stock: 100,
      sizes: ["One Size"],
      colors: ["Хар", "Цагаан"],
      imageUrl:
        "https://res.cloudinary.com/hfroefns/image/upload/v1785743471/speacker_mtvwj1.png",
    },
    {
      title: "Утасгүй спикер",
      category: "merch",
      description: "Утасгүй спикер ",
      longDescription: "Утасгүй спикер, өндөр чанартай дуугаралттай.",
      price: 230000,
      stock: 100,
      sizes: ["One Size"],
      colors: ["Хар"],
      imageUrl:
        "https://res.cloudinary.com/hfroefns/image/upload/v1791770826/Screenshot_2026-10-12_100643_wzab11.png",
    },
    {
      title: "Таблет",
      category: "merch",
      description: "Таблет",
      longDescription:
        "Орчин үеийн загварын таблет, өндөр чанартай материалаар хийгдсэн.",
      price: 830000,
      stock: 100,
      sizes: ["One Size"],
      colors: ["Ногоон", "Мөнгөлөг", "Хар"],
      imageUrl:
        "https://res.cloudinary.com/hfroefns/image/upload/v1785743471/Table_a0f9hr.png",
    },

    // --- GIFT CARDS & VOUCHERS ---
    {
      title: "Петровис Шатахууны Талон",
      category: "giftcard",
      description: "Петровис шатахууны талон",
      longDescription: "Петровисийн бүх салбараар үйлчлүүлэх шатахууны талон.",
      price: 10000,
      stock: 100,
      sizes: ["One Size"],
      colors: [],
      options: [
        {
          value: "10,000₮",
          price: 10000,
          imageUrl:
            "https://res.cloudinary.com/hfroefns/image/upload/v1786327257/13_pshdlt.png",
        },
        {
          value: "20,000₮",
          price: 20000,
          imageUrl:
            "https://res.cloudinary.com/hfroefns/image/upload/v1786327257/10_cn6irc.png",
        },
      ],
      imageUrl:
        "https://res.cloudinary.com/hfroefns/image/upload/v1786327257/10_cn6irc.png",
    },

    {
      title: "SOYOL Wellness",
      category: "giftcard",
      description: "Soyol Wellness Center бэлгийн карт",
      longDescription: "Soyol Wellness Center-ээр үйлчлүүлэх бэлгийн карт.",
      price: 100000,
      stock: 100,
      sizes: ["One Size"],
      colors: [],
      imageUrl:
        "https://res.cloudinary.com/hfroefns/image/upload/v1786327257/11_gxefhw.png",
    },
    {
      title: "Shoppy Бэлгийн Карт",
      category: "giftcard",
      description: "Shoppy.mn онлайн бэлгийн карт 60,000₮",
      longDescription:
        "Shoppy.mn онлайн дэлгүүрээс худалдан авалт хийх 60,000 төгрөгийн эрхийн бичиг.",
      price: 60000,
      stock: 100,
      sizes: ["One Size"],
      colors: [],
      imageUrl:
        "https://res.cloudinary.com/hfroefns/image/upload/v1786327257/12_d8ed7h.png",
    },
    {
      title: "Интерном Эрхийн Бичиг",
      category: "giftcard",
      description: "Интерном номын дэлгүүрийн ваучер 30,000₮",
      longDescription:
        "Интерном номын их дэлгүүрээр үйлчлүүлэх 30,000 төгрөгийн эрхийн бичиг.",
      price: 30000,
      stock: 100,
      sizes: ["One Size"],
      colors: [],
      imageUrl:
        "https://res.cloudinary.com/hfroefns/image/upload/v1786327257/14_x60g9p.png",
    },
  ];
  const phoneNumbers = employeeProjectAssignments.map(
    ({ phoneNumber }) => phoneNumber,
  );
  const phoneNumbersByProject = new Map<ProjectName, string[]>();
  for (const assignment of employeeProjectAssignments) {
    const projectPhoneNumbers =
      phoneNumbersByProject.get(assignment.projectName) ?? [];
    projectPhoneNumbers.push(assignment.phoneNumber);
    phoneNumbersByProject.set(assignment.projectName, projectPhoneNumbers);
  }
  const manualApproverProjects = new Set<ProjectName>(
    manualLeaveRequestApproverOverrides.map(
      ({ projectName }) => projectName,
    ),
  );
  const approvalLevelsByKey = new Map<string, LeaveApprovalLevel>();
  const responsibleHrKeys = new Set<string>();
  const assignmentKey = (phoneNumber: string, projectName: ProjectName) =>
    `${phoneNumber}|${projectName}`;

  for (const [projectName, phoneNumber] of leaveRequestSeniorApproverAssignments) {
    approvalLevelsByKey.set(
      assignmentKey(phoneNumber, projectName),
      LeaveApprovalLevel.SENIOR_SPECIALIST,
    );
  }
  for (const [projectName, phoneNumber] of leaveRequestHrDirectorAssignments) {
    approvalLevelsByKey.set(
      assignmentKey(phoneNumber, projectName),
      LeaveApprovalLevel.HR_DIRECTOR,
    );
  }
  for (const [projectName, phoneNumber] of leaveRequestResponsibleHrAssignments) {
    responsibleHrKeys.add(assignmentKey(phoneNumber, projectName));
  }

  const accessAssignmentsByKey = new Map<
    string,
    {
      phoneNumber: string;
      displayName: string;
      projectName: ProjectName;
      canView: boolean;
      canApprove: boolean;
      approvalLevel: LeaveApprovalLevel | null;
      isResponsibleHr: boolean;
    }
  >();
  for (const assignment of leaveRequestAccessAssignments) {
    const key = assignmentKey(
      assignment.phoneNumber,
      assignment.projectName,
    );
    const isResponsibleHr = responsibleHrKeys.has(key);
    const canApprove =
      isResponsibleHr ||
      approvalLevelsByKey.has(key) ||
      (manualApproverProjects.has(assignment.projectName)
        ? false
        : assignment.canApprove);
    accessAssignmentsByKey.set(key, {
      ...assignment,
      canView: assignment.canView || isResponsibleHr,
      canApprove,
      approvalLevel:
        approvalLevelsByKey.get(key) ??
        (canApprove && !isResponsibleHr
          ? LeaveApprovalLevel.UNIT_MANAGER
          : null),
      isResponsibleHr,
    });
  }
  for (const assignment of manualLeaveRequestApproverOverrides) {
    const key = assignmentKey(
      assignment.phoneNumber,
      assignment.projectName,
    );
    const existing = accessAssignmentsByKey.get(key);
    const isResponsibleHr = responsibleHrKeys.has(key);
    accessAssignmentsByKey.set(key, {
      ...assignment,
      canView: existing?.canView ?? isResponsibleHr,
      canApprove: true,
      approvalLevel:
        approvalLevelsByKey.get(key) ??
        (isResponsibleHr ? null : LeaveApprovalLevel.UNIT_MANAGER),
      isResponsibleHr,
    });
  }

  for (const key of [
    ...approvalLevelsByKey.keys(),
    ...responsibleHrKeys,
  ]) {
    if (!accessAssignmentsByKey.has(key)) {
      throw new Error(`Missing leave request access assignment for ${key}.`);
    }
  }

  const syncedLeaveRequestAccess = Array.from(
    accessAssignmentsByKey.values(),
  );

  await prisma.$transaction(
    async (transaction) => {
      await transaction.leaveRequestAccess.deleteMany();
      await transaction.whitelist.deleteMany();
      await transaction.whitelist.createMany({
        data: employeeProjectAssignments.map(
          ({ phoneNumber, projectName }) => ({
            phoneNumber,
            projectName,
          }),
        ),
      });
      await transaction.pendingRegistration.deleteMany({
        where: { phoneNumber: { notIn: phoneNumbers } },
      });

      for (const [projectName, projectPhoneNumbers] of phoneNumbersByProject) {
        await transaction.user.updateMany({
          where: { phoneNumber: { in: projectPhoneNumbers } },
          data: { ProjectName: projectName },
        });
        await transaction.pendingRegistration.updateMany({
          where: { phoneNumber: { in: projectPhoneNumbers } },
          data: { ProjectName: projectName },
        });
      }

      await transaction.leaveRequestAccess.createMany({
        data: syncedLeaveRequestAccess,
      });
    },
    { timeout: 15_000 },
  );
  const merchSeedData: Prisma.MerchItemCreateManyInput[] = merchItems.map(
    ({ category: _category, options: _options, ...item }) => ({
      ...item,
      isActive: true,
    }),
  );

  // Захиалгууд cascade-аар устахаас сэргийлж item-үүдийг устгахгүй, шинэчилнэ/нэмнэ.
  const existingItems = await prisma.merchItem.findMany({
    orderBy: [{ createdAt: "asc" }, { id: "asc" }],
  });
  const usedIds = new Set<string>();

  for (const item of merchSeedData) {
    const match =
      existingItems.find(
        (e) =>
          !usedIds.has(e.id) &&
          e.title === item.title &&
          e.imageUrl === item.imageUrl,
      ) ??
      existingItems.find((e) => !usedIds.has(e.id) && e.title === item.title);

    if (match) {
      usedIds.add(match.id);
      const { stock: _stock, isActive: _isActive, ...data } = item;
      await prisma.merchItem.update({ where: { id: match.id }, data });
    } else {
      await prisma.merchItem.create({ data: item });
    }
  }

  console.log(
    `Демо өгөгдөл амжилттай орлоо. (${merchSeedData.length} merch item, ${employeeProjectAssignments.length} whitelist entry, ${syncedLeaveRequestAccess.length} leave access; ${employeeSeedSummary.missingPhoneRows} утасгүй мөр, ${employeeSeedSummary.duplicatePhoneRows} давхардсан дугаартай мөр, ${employeeSeedSummary.unresolvedRoleHolders} эрх эзэмшигч хасагдав)`,
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
