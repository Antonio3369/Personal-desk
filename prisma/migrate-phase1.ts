import bcrypt from "bcryptjs";
import { Prisma, PrismaClient } from "@prisma/client";
import {
  CITY_MODULE_PERMISSIONS,
  defaultModulePermissions,
  MODULE_KEYS,
} from "../src/lib/modules";
import { normalizePhone, parsePhoneRegion } from "../src/lib/phone";

const prisma = new PrismaClient();

function requireEnv(name: string) {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`Missing required env: ${name}`);
  }
  return value;
}

async function seedWorkspaceModules(
  tx: Prisma.TransactionClient,
  workspaceId: string,
) {
  for (const moduleKey of MODULE_KEYS) {
    const permissions =
      moduleKey === "cities"
        ? JSON.stringify([...CITY_MODULE_PERMISSIONS])
        : JSON.stringify(defaultModulePermissions(moduleKey));

    await tx.workspaceModule.upsert({
      where: {
        workspaceId_moduleKey: { workspaceId, moduleKey },
      },
      update: {
        enabled: true,
        permissions,
      },
      create: {
        workspaceId,
        moduleKey,
        enabled: true,
        permissions,
      },
    });
  }
}

async function main() {
  const ownerRegion = parsePhoneRegion(
    requireEnv("MIGRATE_OWNER_PHONE_REGION"),
  );
  const adminRegion = parsePhoneRegion(
    requireEnv("MIGRATE_ADMIN_PHONE_REGION"),
  );
  if (!ownerRegion || !adminRegion) {
    throw new Error("MIGRATE_*_PHONE_REGION must be CN or HK");
  }

  const ownerPhone = normalizePhone(
    ownerRegion,
    requireEnv("MIGRATE_OWNER_PHONE"),
  );
  const adminPhone = normalizePhone(
    adminRegion,
    requireEnv("MIGRATE_ADMIN_PHONE"),
  );
  if (!ownerPhone || !adminPhone) {
    throw new Error("Invalid MIGRATE_OWNER_PHONE or MIGRATE_ADMIN_PHONE");
  }

  const ownerPassword = requireEnv("MIGRATE_OWNER_PASSWORD");
  const adminPassword = requireEnv("MIGRATE_ADMIN_PASSWORD");
  const ownerDisplayName =
    process.env.MIGRATE_OWNER_DISPLAY_NAME?.trim() || "Antonio";

  const existingOwner = await prisma.user.findUnique({
    where: { phone: ownerPhone },
    include: { membership: true },
  });

  if (existingOwner?.membership) {
    console.log("Phase 1 migration already applied for owner:", ownerPhone);
    return;
  }

  const legacyCounts = {
    cities: await prisma.city.count(),
    contacts: await prisma.contact.count(),
    todos: await prisma.todo.count(),
    notes: await prisma.note.count(),
    tags: await prisma.tag.count(),
  };

  const hasLegacyData =
    legacyCounts.cities +
      legacyCounts.contacts +
      legacyCounts.todos +
      legacyCounts.notes +
      legacyCounts.tags >
    0;

  await prisma.$transaction(async (tx) => {
    const workspace = await tx.workspace.create({ data: {} });
    const workspaceId = workspace.id;

    const passwordHash = await bcrypt.hash(ownerPassword, 10);
    if (!existingOwner) {
      await tx.user.create({
        data: {
          phone: ownerPhone,
          phoneRegion: ownerRegion,
          displayName: ownerDisplayName,
          passwordHash,
          role: "user",
          membership: {
            create: {
              workspaceId,
              role: "owner",
            },
          },
        },
      });
    } else {
      await tx.workspaceMember.create({
        data: {
          workspaceId,
          userId: existingOwner.id,
          role: "owner",
        },
      });
    }

    if (hasLegacyData) {
      await tx.city.updateMany({
        where: { workspaceId: null },
        data: { workspaceId },
      });
      await tx.contact.updateMany({
        where: { workspaceId: null },
        data: { workspaceId },
      });
      await tx.todo.updateMany({
        where: { workspaceId: null },
        data: { workspaceId },
      });
      await tx.note.updateMany({
        where: { workspaceId: null },
        data: { workspaceId },
      });
      await tx.tag.updateMany({
        where: { workspaceId: null },
        data: { workspaceId },
      });
    }

    const orphanChecks = await Promise.all([
      tx.city.count({ where: { workspaceId: null } }),
      tx.contact.count({ where: { workspaceId: null } }),
      tx.todo.count({ where: { workspaceId: null } }),
      tx.note.count({ where: { workspaceId: null } }),
      tx.tag.count({ where: { workspaceId: null } }),
    ]);

    if (orphanChecks.some((count) => count > 0)) {
      throw new Error("Migration failed: records without workspaceId remain");
    }

    await seedWorkspaceModules(tx, workspaceId);

    const adminExists = await tx.user.findUnique({ where: { phone: adminPhone } });
    if (!adminExists) {
      const adminHash = await bcrypt.hash(adminPassword, 10);
      await tx.user.create({
        data: {
          phone: adminPhone,
          phoneRegion: adminRegion,
          displayName: "Admin",
          passwordHash: adminHash,
          role: "admin",
        },
      });
    }

    await tx.appSetting.deleteMany({ where: { key: "password_hash" } });
  });

  console.log("Phase 1 migration completed.");
  console.log("Owner phone:", ownerPhone);
  console.log("Admin phone:", adminPhone);
  if (hasLegacyData) {
    console.log("Legacy data attached:", legacyCounts);
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
