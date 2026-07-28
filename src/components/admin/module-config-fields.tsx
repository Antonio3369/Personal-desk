"use client";

import { useState } from "react";
import {
  CITY_PERMISSION_LABELS,
  MODULE_KEYS,
  MODULE_LABELS,
  type ModuleKey,
} from "@/lib/modules";

export function ModuleConfigFields({
  defaultEnabled = [...MODULE_KEYS],
  defaultCityCreate = true,
  defaultCityDelete = true,
}: {
  defaultEnabled?: ModuleKey[];
  defaultCityCreate?: boolean;
  defaultCityDelete?: boolean;
}) {
  const [citiesEnabled, setCitiesEnabled] = useState(
    defaultEnabled.includes("cities"),
  );

  return (
    <div className="space-y-3">
      <input type="hidden" name="module_dashboard" value="on" />
      <label className="flex items-center gap-3 rounded-xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm text-stone-500">
        <input type="checkbox" checked disabled className="rounded border-stone-300" />
        {MODULE_LABELS.dashboard}
        <span className="ml-auto text-xs">始终启用</span>
      </label>

      {MODULE_KEYS.filter((key) => key !== "dashboard").map((key) => (
        <div key={key}>
          <label className="flex items-center gap-3 rounded-xl border border-stone-200 px-4 py-3 text-sm text-stone-800">
            <input
              type="checkbox"
              name={`module_${key}`}
              defaultChecked={defaultEnabled.includes(key)}
              onChange={
                key === "cities"
                  ? (event) => setCitiesEnabled(event.target.checked)
                  : undefined
              }
              className="rounded border-stone-300"
            />
            {MODULE_LABELS[key]}
          </label>

          {key === "cities" ? (
            <div
              className={`ml-6 mt-2 space-y-2 border-l border-stone-200 pl-4 ${citiesEnabled ? "" : "pointer-events-none opacity-40"}`}
            >
              <label className="flex items-center gap-3 text-sm text-stone-700">
                <input
                  type="checkbox"
                  name="city_create"
                  defaultChecked={defaultCityCreate}
                  disabled={!citiesEnabled}
                  className="rounded border-stone-300"
                />
                {CITY_PERMISSION_LABELS.create}
              </label>
              <label className="flex items-center gap-3 text-sm text-stone-700">
                <input
                  type="checkbox"
                  name="city_delete"
                  defaultChecked={defaultCityDelete}
                  disabled={!citiesEnabled}
                  className="rounded border-stone-300"
                />
                {CITY_PERMISSION_LABELS.delete}
              </label>
            </div>
          ) : null}
        </div>
      ))}
    </div>
  );
}
