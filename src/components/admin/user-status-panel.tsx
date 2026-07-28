"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import {
  disableUserAction,
  enableUserAction,
} from "@/app/actions/admin-users";

export function UserStatusPanel({
  userId,
  status,
  displayName,
}: {
  userId: string;
  status: "active" | "disabled";
  displayName: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function handleDisable() {
    const confirmed = window.confirm(
      `确定停用「${displayName}」？\n\n停用后该用户将无法登录，已有会话也会在下次请求时失效。`,
    );
    if (!confirmed) return;

    startTransition(async () => {
      const result = await disableUserAction(userId);
      if (result.error) {
        window.alert(result.error);
        return;
      }
      router.refresh();
    });
  }

  function handleEnable() {
    startTransition(async () => {
      const result = await enableUserAction(userId);
      if (result.error) {
        window.alert(result.error);
        return;
      }
      router.refresh();
    });
  }

  if (status === "disabled") {
    return (
      <section className="rounded-2xl border border-red-200 bg-red-50 p-6">
        <h3 className="text-sm font-medium text-red-900">账号已停用</h3>
        <p className="mt-2 text-sm text-red-800">
          该用户无法登录，模块配置为只读。重新启用后可恢复访问。
        </p>
        <button
          type="button"
          onClick={handleEnable}
          disabled={pending}
          className="mt-4 rounded-xl bg-stone-900 px-5 py-3 text-sm font-medium text-white transition hover:bg-stone-800 disabled:opacity-60"
        >
          {pending ? "启用中..." : "重新启用"}
        </button>
      </section>
    );
  }

  return (
    <section className="rounded-2xl border border-stone-200 bg-white p-6">
      <h3 className="text-sm font-medium text-stone-900">账号状态</h3>
      <p className="mt-2 text-sm text-stone-500">
        停用后用户无法登录，数据保留，可随时重新启用。
      </p>
      <button
        type="button"
        onClick={handleDisable}
        disabled={pending}
        className="mt-4 rounded-xl border border-red-200 px-5 py-3 text-sm font-medium text-red-700 transition hover:bg-red-50 disabled:opacity-60"
      >
        {pending ? "停用中..." : "停用账号"}
      </button>
    </section>
  );
}
