import { PrismaClient } from "@prisma/client";

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
    plate: "9598-ӨМЭ",
    department: "Operation",
  },
  {
    name: "Bieben - Northbenz",
    type: "Waste Water Truck",
    plate: "9521-УБК",
    department: "Operation",
  },
  {
    name: "Bieben - Northbenz",
    type: "Waste Water Truck",
    plate: "9531-УБЯ",
    department: "Operation",
  },
  {
    name: "Bieben - Northbenz",
    type: "Waste Water Truck",
    plate: "7673-УКН",
    department: "Operation",
  },
  {
    name: "ISUZU Sinotruck",
    type: "Regular Truck",
    plate: "8711-УЕВ",
    department: "Operation",
  },
  {
    name: "KIA Bongo",
    type: "Regular Truck",
    plate: "8864-УКУ",
    department: "OPS-Mechanic",
  },
  {
    name: "KIA Bongo 3",
    type: "Regular Truck",
    plate: "8706-ӨМЕ",
    department: "OPS-Mechanic",
  },
  {
    name: "HYUNDAI 11 Ton",
    type: "Truck",
    plate: "9563-УБГ",
    department: "Project",
  },
  {
    name: "Hyundai Porter II",
    type: "Regular Truck",
    plate: "0836-УАО",
    department: "Project",
  },
  {
    name: "Kia - Bongo",
    type: "Regular Truck",
    plate: "0832-УЕЕ",
    department: "Project",
  },
  {
    name: "KIA Bongo 3",
    type: "Regular Truck",
    plate: "1723-ӨМЕ",
    department: "Project",
  },
  {
    name: "KIA Bongo 3",
    type: "Regular Truck",
    plate: "8725-ӨМЕ",
    department: "Project",
  },
  { name: "Komatsu", type: "Backhoe", plate: "1697-УБ", department: "Project" },
  {
    name: "Ginjit",
    type: "Excavator",
    plate: "4286-ММА",
    department: "Project",
  },
  {
    name: "Land Cruiser 79",
    type: "Light Vehicle",
    plate: "3134ӨМЕ",
    department: "Project",
  },
  {
    name: "Hyunda County",
    type: "Bus",
    plate: "5518УКН",
    department: "Project",
  },
  {
    name: "KIA Bongo",
    type: "Regular Truck",
    plate: "8051ҮЕК",
    department: "Concentrator",
  },
  {
    name: "KIA Bongo",
    type: "Regular Truck",
    plate: "8096-УНУ",
    department: "Concentrator",
  },
  {
    name: "Land Cruiser 70",
    type: "Light Vehicle",
    plate: "0938-УБС",
    department: "Concentrator",
  },
  {
    name: "Land Cruiser 76",
    type: "Light Vehicle",
    plate: "8789-УНД",
    department: "Concentrator",
  },
  {
    name: "Land Cruiser 76",
    type: "Light Vehicle",
    plate: "8782-УЕА",
    department: "Concentrator",
  },
  {
    name: "Hyundai Sonata",
    type: "Mid-Size Vehicle",
    plate: "6147-УБП",
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
    plate: "RT-5075",
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
    department: "Project",
  },
  {
    name: "Navara Nissan",
    type: "Light Vehicle",
    plate: "0842-УЕХ",
    department: "UG",
  },
  {
    name: "KIA Bongo 3",
    type: "Regular Truck",
    plate: "0836-УЕУ",
    department: "UG",
  },
  {
    name: "HOWO",
    type: "Regular Truck",
    plate: "8509-УКМ",
    department: "UG-Muck",
  },
  {
    name: "Mazda",
    type: "Light Vehicle",
    plate: "2505-ӨМЕ",
    department: "Concentrator",
  },
  {
    name: "HOWO",
    type: "Regular Truck",
    plate: "8657-ӨМЭ",
    department: "UG-Muck",
  },
  {
    name: "HOWO",
    type: "Regular Truck",
    plate: "8661-УКМ",
    department: "UG-Muck",
  },
  {
    name: "HOWO",
    type: "Regular Truck",
    plate: "6712-УКН",
    department: "UG-Muck",
  },
  {
    name: "Ус шүрших",
    type: "Regular Truck",
    plate: "7672-УКН",
    department: "UG-Muck",
  },
  { name: "Sinotruck", type: "HOWO", plate: "6162-ӨМН", department: "UG-Muck" },
  {
    name: "XCMG",
    type: "Автогрейдер",
    plate: "9373-ММА",
    department: "UG-Muck",
  },
  {
    name: "Hyundai.5TON",
    type: "Regular Truck",
    plate: "9653-УКН",
    department: "UG-Muck",
  },
  {
    name: "Hyundai.5TON",
    type: "Regular Truck",
    plate: "7330-УКН",
    department: "UG-Muck",
  },
  { name: "Prius 50", type: "Toyota", plate: "8239-УЕТ", department: "UB" },
  {
    name: "Land Cruiser 79",
    type: "Toyota",
    plate: "7522-УБП",
    department: "UG-Muck",
  },
  {
    name: "Forklift",
    type: "Forklift",
    plate: "2746-УБ",
    department: "Project",
  },
  { name: "loader", type: "Turees", plate: "1815-УР", department: "Project" },
  {
    name: "HOWO",
    type: "Regular Truck",
    plate: "2431-УНД",
    department: "Unassigned",
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
    // --- MERCH & ELECTRONICS ---
    {
      title: "Цамц",
      category: "merch",
      description: "брэндийн лого хэвлэлттэй",
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
      price: 190000,
      stock: 100,
      sizes: ["One Size"],
      colors: ["Хар"],
      imageUrl:
        "https://res.cloudinary.com/hfroefns/image/upload/v1785743470/bag_gfrdoa.png",
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
      title: "Утасгүй спикер",
      category: "merch",
      description: "Утасгүй чанга яригч",
      longDescription:
        "Утасгүй чанга яригч загвар, өндөр чанартай дуугаралттай.",
      price: 160000,
      stock: 100,
      sizes: ["One Size"],
      colors: ["Хар", "Цагаан"],
      imageUrl:
        "https://res.cloudinary.com/hfroefns/image/upload/v1785743471/speacker_mtvwj1.png",
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
      price: 100000, // Үнийг шаардлагатай бол өөрчилнө үү
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

  const merchSeedData = merchItems.map((item) => ({
    ...Object.fromEntries(
      Object.entries(item).filter(
        ([key]) => key !== "category" && key !== "options",
      ),
    ),
    isActive: true,
  }));

  await prisma.merchItem.deleteMany();
  await prisma.merchItem.createMany({
    data: merchSeedData,
  });

  console.log(
    `Демо өгөгдөл амжилттай орлоо. (${merchSeedData.length} merch item)`,
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
