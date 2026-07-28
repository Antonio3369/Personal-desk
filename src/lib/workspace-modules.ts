import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import {
  CITY_MODULE_PERMISSIONS,
  defaultModulePermissions,
  MODULE_KEYS,
  type CityModulePermission,
  type ModuleKey,
} from "@/lib/modules";

export async function seedWorkspaceModules(
  workspaceId: string,
  config: {
    enabledModules: ModuleKey[];
    cityPermissions?: CityModulePermission[];
  },
  client: Prisma.TransactionClient | typeof db = db,
) {
  const enabledSet = new Set<ModuleKey>(["dashboard", ...config.enabledModules]);
  const cityPermissions =
    config.cityPermissions ??
    (enabledSet.has("cities") ? [...CITY_MODULE_PERMISSIONS] : []);

  for (const moduleKey of MODULE_KEYS) {
    const enabled = enabledSet.has(moduleKey);
    const permissions =
      moduleKey === "cities" && enabled
        ? JSON.stringify(cityPermissions)
        : JSON.stringify(defaultModulePermissions(moduleKey));

    await client.workspaceModule.upsert({
      where: {
        workspaceId_moduleKey: { workspaceId, moduleKey },
      },
      update: { enabled, permissions },
      create: { workspaceId, moduleKey, enabled, permissions },
    });
  }
}

export function parseModuleConfigFromForm(formData: FormData) {
  const enabledModules = MODULE_KEYS.filter(
    (key) => formData.get(`module_${key}`) === "on",
  );

  if (!enabledModules.includes("dashboard")) {
    enabledModules.unshift("dashboard");
  }

  const cityPermissions: CityModulePermission[] = [];
  if (enabledModules.includes("cities")) {
    if (formData.get("city_create") === "on") {
      cityPermissions.push("create");
    }
    if (formData.get("city_delete") === "on") {
      cityPermissions.push("delete");
    }
  }

  return { enabledModules, cityPermissions };
}

export function modulesToConfig(
  modules: Array<{ moduleKey: string; enabled: boolean; permissions: string }>,
) {
  const enabledModules = modules
    .filter((item) => item.enabled)
    .map((item) => item.moduleKey as ModuleKey);

  const citiesModule = modules.find((item) => item.moduleKey === "cities");
  let cityPermissions: CityModulePermission[] = [];
  if (citiesModule?.enabled) {
    try {
      const parsed = JSON.parse(citiesModule.permissions) as string[];
      cityPermissions = parsed.filter((item): item is CityModulePermission =>
        (CITY_MODULE_PERMISSIONS as readonly string[]).includes(item),
      );
    } catch {
      cityPermissions = [...CITY_MODULE_PERMISSIONS];
    }
  }

  return { enabledModules, cityPermissions };
}

export async function getWorkspaceModuleConfig(workspaceId: string) {
  const modules = await db.workspaceModule.findMany({
    where: { workspaceId },
  });

  if (!modules.length) {
    return {
      enabledModules: [...MODULE_KEYS],
      cityPermissions: [...CITY_MODULE_PERMISSIONS] as CityModulePermission[],
    };
  }

  return modulesToConfig(modules);
}
