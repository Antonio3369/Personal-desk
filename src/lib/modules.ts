export const MODULE_KEYS = [
  "dashboard",
  "todos",
  "cities",
  "contacts",
  "notes",
] as const;

export type ModuleKey = (typeof MODULE_KEYS)[number];

export const MODULE_LABELS: Record<ModuleKey, string> = {
  dashboard: "首页",
  todos: "待办",
  cities: "城市",
  contacts: "人脉",
  notes: "笔记",
};

export const CITY_MODULE_PERMISSIONS = ["create", "delete"] as const;

export type CityModulePermission = (typeof CITY_MODULE_PERMISSIONS)[number];

export const CITY_PERMISSION_LABELS: Record<CityModulePermission, string> = {
  create: "允许新增城市",
  delete: "允许删除城市",
};

export function defaultModulePermissions(
  moduleKey: ModuleKey,
): CityModulePermission[] {
  if (moduleKey === "cities") {
    return ["create", "delete"];
  }
  return [];
}

export function defaultEnabledModules(): ModuleKey[] {
  return [...MODULE_KEYS];
}

export function summarizeModules(
  modules: Array<{ moduleKey: string; enabled: boolean }>,
): string {
  return modules
    .filter((item) => item.enabled)
    .map((item) => MODULE_LABELS[item.moduleKey as ModuleKey] ?? item.moduleKey)
    .join(" · ");
}
