"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  regenerateInviteAction,
  revokeInviteAction,
} from "@/app/actions/invites";
import { buildInviteUrl } from "@/lib/invite";
import { summarizeModules } from "@/lib/modules";

export function InviteDetailPanel({
  invite,
  baseUrl,
}: {
  invite: {
    id: string;
    phoneDisplay: string;
    status: "pending" | "used" | "expired";
    statusLabel: string;
    expiresAt: Date;
    token: string;
    modules: Array<{ moduleKey: string; enabled: boolean }>;
  };
  baseUrl: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [inviteUrl, setInviteUrl] = useState(buildInviteUrl(baseUrl, invite.token));
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canManage = invite.status === "pending";

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-stone-200 bg-white p-6">
        <dl className="grid gap-4 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-stone-500">手机号</dt>
            <dd className="mt-1 font-medium text-stone-900">{invite.phoneDisplay}</dd>
          </div>
          <div>
            <dt className="text-stone-500">状态</dt>
            <dd className="mt-1 font-medium text-stone-900">{invite.statusLabel}</dd>
          </div>
          <div>
            <dt className="text-stone-500">过期时间</dt>
            <dd className="mt-1 font-medium text-stone-900">
              {invite.expiresAt.toLocaleString("zh-CN")}
            </dd>
          </div>
          <div>
            <dt className="text-stone-500">模块</dt>
            <dd className="mt-1 font-medium text-stone-900">
              {summarizeModules(invite.modules)}
            </dd>
          </div>
        </dl>
      </section>

      {canManage ? (
        <section className="rounded-2xl border border-stone-200 bg-white p-6">
          <h2 className="text-sm font-medium text-stone-900">邀请链接</h2>
          <div className="mt-4 flex gap-2">
            <input
              readOnly
              value={inviteUrl}
              className="min-w-0 flex-1 rounded-xl border border-stone-200 px-3 py-2 text-sm text-stone-700"
            />
            <button
              type="button"
              disabled={pending}
              onClick={async () => {
                await navigator.clipboard.writeText(inviteUrl);
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
              }}
              className="shrink-0 rounded-xl bg-stone-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-stone-800"
            >
              {copied ? "已复制" : "复制链接"}
            </button>
          </div>

          {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}

          <div className="mt-4 flex flex-wrap gap-3">
            <button
              type="button"
              disabled={pending}
              onClick={() =>
                startTransition(async () => {
                  setError(null);
                  const result = await regenerateInviteAction(invite.id);
                  if ("error" in result && result.error) {
                    setError(result.error);
                    return;
                  }
                  if (result.inviteUrl) {
                    setInviteUrl(result.inviteUrl);
                  }
                  router.refresh();
                })
              }
              className="rounded-xl border border-stone-200 px-4 py-2 text-sm text-stone-700 transition hover:bg-stone-50 disabled:opacity-60"
            >
              重新生成邀请
            </button>
            <button
              type="button"
              disabled={pending}
              onClick={() =>
                startTransition(async () => {
                  if (!confirm("确定撤销此邀请？预建的工作台将被删除。")) {
                    return;
                  }
                  setError(null);
                  const result = await revokeInviteAction(invite.id);
                  if ("error" in result && result.error) {
                    setError(result.error);
                    return;
                  }
                  router.push("/admin/users");
                  router.refresh();
                })
              }
              className="rounded-xl border border-red-200 px-4 py-2 text-sm text-red-700 transition hover:bg-red-50 disabled:opacity-60"
            >
              撤销邀请
            </button>
          </div>
        </section>
      ) : null}
    </div>
  );
}
