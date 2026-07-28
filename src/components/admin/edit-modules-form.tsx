"use client";

import { useRouter } from "next/navigation";
import { useActionState, useEffect } from "react";
import type { UpdateModulesState } from "@/app/actions/admin-users";
import { ModuleConfigFields } from "@/components/admin/module-config-fields";
import type { ModuleKey } from "@/lib/modules";

export function EditModulesForm({
  action,
  defaultEnabled,
  defaultCityCreate,
  defaultCityDelete,
  submitLabel = "保存配置",
}: {
  action: (
    prev: UpdateModulesState,
    formData: FormData,
  ) => Promise<UpdateModulesState>;
  defaultEnabled: ModuleKey[];
  defaultCityCreate: boolean;
  defaultCityDelete: boolean;
  submitLabel?: string;
}) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(action, null);

  useEffect(() => {
    if (state?.success) {
      router.refresh();
    }
  }, [state, router]);

  return (
    <form action={formAction} className="space-y-4">
      <ModuleConfigFields
        defaultEnabled={defaultEnabled}
        defaultCityCreate={defaultCityCreate}
        defaultCityDelete={defaultCityDelete}
      />

      {state?.error ? <p className="text-sm text-red-600">{state.error}</p> : null}
      {state?.success ? (
        <p className="text-sm text-emerald-700">配置已保存。用户下次刷新后生效。</p>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="rounded-xl bg-stone-900 px-5 py-3 text-sm font-medium text-white transition hover:bg-stone-800 disabled:opacity-60"
      >
        {pending ? "保存中..." : submitLabel}
      </button>
    </form>
  );
}
