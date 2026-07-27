import { PrismaClient } from "@prisma/client";
import { CITIES } from "../src/lib/constants";

const prisma = new PrismaClient();

async function main() {
  for (let i = 0; i < CITIES.length; i++) {
    const name = CITIES[i];
    await prisma.city.upsert({
      where: { name },
      update: {},
      create: { name, sortOrder: i },
    });
  }

  // 为已有城市补 sortOrder（按默认列表顺序，未在列表中的排最后）
  const allCities = await prisma.city.findMany({ orderBy: { name: "asc" } });
  let order = CITIES.length;
  for (const city of allCities) {
    const defaultIndex = CITIES.indexOf(city.name as (typeof CITIES)[number]);
    const sortOrder = defaultIndex >= 0 ? defaultIndex : order++;
    if (city.sortOrder !== sortOrder) {
      await prisma.city.update({
        where: { id: city.id },
        data: { sortOrder },
      });
    }
  }

  console.log("Seeded cities.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
