"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { createCityAction } from "@/app/actions/cities";

export function CreateCityForm({ compact = false }: { compact?: boolean }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      try {
        const city = await createCityAction(String(formData.get("name") ?? ""));
        router.push(`/cities/${city.id}`);
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "创建失败");
      }
    });
  }

  if (compact) {
    return (
      <form action={handleSubmit} className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <input
          name="name"
          required
          placeholder="城市名称"
          className="w-full rounded-xl border border-stone-200 px-3 py-2.5 text-sm sm:w-48"
        />
        <button
          type="submit"
          disabled={pending}
          className="shrink-0 rounded-xl bg-stone-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-stone-800 disabled:opacity-60"
        >
          {pending ? "添加中..." : "新增城市"}
        </button>
        {error ? <p className="text-sm text-red-600 sm:ml-2">{error}</p> : null}
      </form>
    );
  }

  return (
    <form action={handleSubmit} className="space-y-4">
      <div>
        <label className="mb-2 block text-sm font-medium text-stone-700">
          城市名称
        </label>
        <input
          name="name"
          required
          placeholder="例如：深圳"
          className="w-full rounded-xl border border-stone-200 px-3 py-2.5 text-sm"
        />
      </div>
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      <button
        type="submit"
        disabled={pending}
        className="rounded-xl bg-stone-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-stone-800 disabled:opacity-60"
      >
        {pending ? "添加中..." : "添加城市"}
      </button>
    </form>
  );
}
