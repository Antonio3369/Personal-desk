"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { deleteCityAction } from "@/app/actions/cities";

export function DeleteCityButton({
  cityId,
  cityName,
}: {
  cityId: string;
  cityName: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function handleDelete() {
    const confirmed = window.confirm(
      `确定删除「${cityName}」？\n\n关联待办、人脉、笔记会保留，但不再关联此城市。`,
    );
    if (!confirmed) return;

    startTransition(async () => {
      try {
        await deleteCityAction(cityId);
        router.push("/cities");
        router.refresh();
      } catch (error) {
        window.alert(
          error instanceof Error ? error.message : "删除失败，请重试",
        );
      }
    });
  }

  return (
    <button
      type="button"
      onClick={handleDelete}
      disabled={pending}
      className="inline-flex rounded-xl border border-red-200 bg-white px-4 py-2.5 text-sm text-red-700 transition hover:bg-red-50 disabled:opacity-60"
    >
      {pending ? "删除中..." : "删除城市"}
    </button>
  );
}
