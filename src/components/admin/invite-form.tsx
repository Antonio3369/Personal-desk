"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useActionState, useEffect, useState } from "react";
import {
  createInviteAction,
  type CreateInviteState,
} from "@/app/actions/invites";
import { INVITE_EXPIRY_OPTIONS } from "@/lib/invite";
import { ModuleConfigFields } from "@/components/admin/module-config-fields";

function InviteResult({
  state,
  onContinue,
}: {
  state: CreateInviteState;
  onContinue: () => void;
}) {
  const [copied, setCopied] = useState(false);

  if (!state?.success || !state.inviteUrl) {
    return null;
  }

  return (
    <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
      <p className="text-sm font-medium text-emerald-900">邀请已创建</p>
      <dl className="mt-3 space-y-2 text-sm text-emerald-900/80">
        <div className="flex gap-2">
          <dt className="shrink-0 text-emerald-700">手机号</dt>
          <dd>{state.phone}</dd>
        </div>
        {state.expiresAt ? (
          <div className="flex gap-2">
            <dt className="shrink-0 text-emerald-700">过期时间</dt>
            <dd>{new Date(state.expiresAt).toLocaleString("zh-CN")}</dd>
          </div>
        ) : null}
      </dl>
      <div className="mt-4 flex gap-2">
        <input
          readOnly
          value={state.inviteUrl}
          className="min-w-0 flex-1 rounded-xl border border-emerald-200 bg-white px-3 py-2 text-sm text-stone-700"
        />
        <button
          type="button"
          onClick={async () => {
            await navigator.clipboard.writeText(state.inviteUrl!);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
          }}
          className="shrink-0 rounded-xl bg-emerald-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-800"
        >
          {copied ? "已复制" : "复制链接"}
        </button>
      </div>
      <p className="mt-3 text-xs leading-5 text-emerald-800/80">
        请将链接发送给对方。对方打开后设置名字和密码即可使用。
      </p>
      <div className="mt-4 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={onContinue}
          className="rounded-xl border border-emerald-300 bg-white px-4 py-2 text-sm text-emerald-900 transition hover:bg-emerald-100/60"
        >
          继续发邀请
        </button>
        {state.inviteId ? (
          <Link
            href={`/admin/invites/${state.inviteId}`}
            className="rounded-xl border border-emerald-300 bg-white px-4 py-2 text-sm text-emerald-900 transition hover:bg-emerald-100/60"
          >
            查看邀请
          </Link>
        ) : null}
      </div>
    </div>
  );
}

export function InviteForm() {
  const router = useRouter();
  const [formKey, setFormKey] = useState(0);
  const [phoneRegion, setPhoneRegion] = useState<"CN" | "HK">("CN");
  const [state, formAction, pending] = useActionState<
    CreateInviteState,
    FormData
  >(createInviteAction, null);

  useEffect(() => {
    if (state?.success) {
      router.refresh();
    }
  }, [state, router]);

  return (
    <div>
      <form key={formKey} action={formAction} className="space-y-6">
        <section className="space-y-3">
          <h2 className="text-sm font-medium text-stone-900">手机号</h2>
          <div className="flex gap-2">
            <select
              name="phoneRegion"
              value={phoneRegion}
              onChange={(event) =>
                setPhoneRegion(event.target.value as "CN" | "HK")
              }
              className="rounded-xl border border-stone-200 bg-white px-3 py-3 text-sm outline-none ring-stone-900/10 focus:ring-4"
            >
              <option value="CN">大陆 +86</option>
              <option value="HK">香港 +852</option>
            </select>
            <input
              key={phoneRegion}
              name="phone"
              type="tel"
              inputMode="numeric"
              required
              maxLength={phoneRegion === "CN" ? 11 : 8}
              className="min-w-0 flex-1 rounded-xl border border-stone-200 px-4 py-3 text-sm outline-none ring-stone-900/10 focus:ring-4"
              placeholder={phoneRegion === "CN" ? "13812345678" : "91234567"}
            />
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="text-sm font-medium text-stone-900">模块配置</h2>
          <ModuleConfigFields />
        </section>

        <section className="space-y-3">
          <h2 className="text-sm font-medium text-stone-900">邀请有效期</h2>
          <select
            name="expiryDays"
            defaultValue="7"
            className="rounded-xl border border-stone-200 bg-white px-3 py-3 text-sm outline-none ring-stone-900/10 focus:ring-4"
          >
            {INVITE_EXPIRY_OPTIONS.map((days) => (
              <option key={days} value={days}>
                {days} 天
              </option>
            ))}
          </select>
        </section>

        {state?.error ? (
          <p className="text-sm text-red-600">{state.error}</p>
        ) : null}

        <button
          type="submit"
          disabled={pending}
          className="rounded-xl bg-stone-900 px-5 py-3 text-sm font-medium text-white transition hover:bg-stone-800 disabled:opacity-60"
        >
          {pending ? "生成中..." : "生成邀请链接"}
        </button>
      </form>

      <InviteResult
        state={state}
        onContinue={() => {
          setFormKey((value) => value + 1);
        }}
      />
    </div>
  );
}
