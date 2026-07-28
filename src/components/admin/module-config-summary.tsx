import {
  CITY_PERMISSION_LABELS,
  MODULE_LABELS,
  type CityModulePermission,
  type ModuleKey,
} from "@/lib/modules";
import { modulesToConfig } from "@/lib/workspace-modules";

export function ModuleConfigSummary({
  modules,
}: {
  modules: Array<{ moduleKey: string; enabled: boolean; permissions: string }>;
}) {
  const { enabledModules, cityPermissions } = modulesToConfig(modules);
  const enabledLabels = enabledModules
    .filter((key) => key !== "dashboard")
    .map((key) => MODULE_LABELS[key as ModuleKey] ?? key);

  return (
    <dl className="space-y-4 text-sm">
      <div>
        <dt className="text-stone-500">已启用模块</dt>
        <dd className="mt-1 font-medium text-stone-900">
          {enabledLabels.length ? enabledLabels.join(" · ") : "无"}
        </dd>
      </div>
      {enabledModules.includes("cities") ? (
        <div>
          <dt className="text-stone-500">城市子权限</dt>
          <dd className="mt-1 text-stone-700">
            {cityPermissions.length
              ? cityPermissions
                  .map(
                    (permission: CityModulePermission) =>
                      CITY_PERMISSION_LABELS[permission],
                  )
                  .join(" · ")
              : "无"}
          </dd>
        </div>
      ) : null}
    </dl>
  );
}
