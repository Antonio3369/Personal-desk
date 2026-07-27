"use client";

import { useTransition } from "react";
import { updateCityAction } from "@/app/actions/cities";

type CityEditorProps = {
  city: {
    id: string;
    name: string;
    notes: string | null;
    leaderLink: string | null;
  };
};

export function CityEditor({ city }: CityEditorProps) {
  const [pending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      await updateCityAction(city.id, {
        notes: String(formData.get("notes") ?? "") || null,
        leaderLink: String(formData.get("leaderLink") ?? "") || null,
      });
    });
  }

  return (
    <form
      action={handleSubmit}
      className="space-y-4 rounded-2xl border border-stone-200 bg-white p-5"
    >
      <div>
        <h3 className="text-base font-medium text-stone-900">城市备注</h3>
        <p className="mt-1 text-sm text-stone-500">
          团队和业务问题请在上方逐条添加；这里放整体近况和外链。
        </p>
      </div>
      <Field label="近况备注" name="notes" defaultValue={city.notes ?? ""} />
      <Field
        label="Leader Space 链接"
        name="leaderLink"
        defaultValue={city.leaderLink ?? ""}
        single
      />
      <button
        type="submit"
        disabled={pending}
        className="rounded-xl bg-stone-900 px-4 py-2.5 text-sm font-medium text-white disabled:opacity-60"
      >
        {pending ? "保存中..." : "保存备注"}
      </button>
    </form>
  );
}

function Field({
  label,
  name,
  defaultValue,
  single = false,
}: {
  label: string;
  name: string;
  defaultValue: string;
  single?: boolean;
}) {
  const className =
    "w-full rounded-xl border border-stone-200 px-3 py-2.5 text-sm outline-none ring-stone-900/10 focus:ring-4";

  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-stone-700">
        {label}
      </label>
      {single ? (
        <input name={name} defaultValue={defaultValue} className={className} />
      ) : (
        <textarea
          name={name}
          defaultValue={defaultValue}
          rows={3}
          className={className}
        />
      )}
    </div>
  );
}
