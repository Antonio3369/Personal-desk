import { PrismaClient } from "@prisma/client";
import { CITIES } from "../src/lib/constants";

const prisma = new PrismaClient();

async function main() {
  const member = await prisma.workspaceMember.findFirst({
    include: { workspace: true },
  });

  if (!member) {
    console.log("No workspace found. Run db:migrate-phase1 first.");
    return;
  }

  const workspaceId = member.workspaceId;

  for (let i = 0; i < CITIES.length; i++) {
    const name = CITIES[i];
    await prisma.city.upsert({
      where: { workspaceId_name: { workspaceId, name } },
      update: {},
      create: { workspaceId, name, sortOrder: i },
    });
  }

  const allCities = await prisma.city.findMany({
    where: { workspaceId },
    orderBy: { name: "asc" },
  });
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

  console.log("Seeded cities for workspace:", workspaceId);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
