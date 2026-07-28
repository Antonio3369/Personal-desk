import type { CityModulePermission, ModuleKey } from "@/lib/modules";

const MODULE_PATHS: Array<{ prefix: string; moduleKey: ModuleKey }> = [
  { prefix: "/cities", moduleKey: "cities" },
  { prefix: "/contacts", moduleKey: "contacts" },
  { prefix: "/todos", moduleKey: "todos" },
  { prefix: "/notes", moduleKey: "notes" },
];

export function isModuleEnabled(
  enabledModules: ModuleKey[],
  moduleKey: ModuleKey,
) {
  return enabledModules.includes(moduleKey);
}

export function canAccessPath(pathname: string, enabledModules: ModuleKey[]) {
  if (pathname === "/") {
    return isModuleEnabled(enabledModules, "dashboard");
  }

  if (pathname.startsWith("/capture")) {
    return (
      isModuleEnabled(enabledModules, "todos") ||
      isModuleEnabled(enabledModules, "notes")
    );
  }

  for (const { prefix, moduleKey } of MODULE_PATHS) {
    if (pathname === prefix || pathname.startsWith(`${prefix}/`)) {
      return isModuleEnabled(enabledModules, moduleKey);
    }
  }

  return true;
}

export function filterNavModules<T extends { href: string; moduleKey: ModuleKey }>(
  items: T[],
  enabledModules: ModuleKey[],
) {
  return items.filter((item) => isModuleEnabled(enabledModules, item.moduleKey));
}

export function hasCityPermission(
  cityPermissions: CityModulePermission[],
  permission: CityModulePermission,
) {
  return cityPermissions.includes(permission);
}
