"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";
import Link from "next/link";
import {
  activateInviteAction,
  type ActivateInviteState,
} from "@/app/actions/invites";

export function InviteActivateForm({
  token,
  phoneDisplay,
  phoneRegion,
}: {
  token: string;
  phoneDisplay: string;
  phoneRegion: "CN" | "HK";
}) {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [state, formAction, pending] = useActionState<
    ActivateInviteState,
    FormData
  >(activateInviteAction.bind(null, token), null);

  useEffect(() => {
    if (state?.success) {
      router.replace(state.redirectTo ?? "/");
      router.refresh();
    }
  }, [state, router]);

  return (
    <form action={formAction} className="space-y-4">
      <div>
        <label className="mb-2 block text-sm font-medium text-stone-700">
          手机号
        </label>
        <div className="flex gap-2">
          <div className="rounded-xl border border-stone-200 bg-stone-50 px-3 py-3 text-sm text-stone-500">
            {phoneRegion === "CN" ? "大陆 +86" : "香港 +852"}
          </div>
          <input
            readOnly
            value={phoneDisplay}
            className="min-w-0 flex-1 rounded-xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm text-stone-600"
          />
        </div>
      </div>

      <div>
        <label htmlFor="displayName" className="mb-2 block text-sm font-medium text-stone-700">
          你的名字
        </label>
        <input
          id="displayName"
          name="displayName"
          required
          maxLength={20}
          className="w-full rounded-xl border border-stone-200 px-4 py-3 text-sm outline-none ring-stone-900/10 focus:ring-4"
          placeholder="请输入您的名字"
        />
        <p className="mt-2 text-xs text-stone-500">将显示在工作台顶部</p>
      </div>

      <div>
        <label htmlFor="password" className="mb-2 block text-sm font-medium text-stone-700">
          设置密码
        </label>
        <div className="relative">
          <input
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            required
            minLength={6}
            autoComplete="new-password"
            className="w-full rounded-xl border border-stone-200 px-4 py-3 pr-11 text-sm outline-none ring-stone-900/10 focus:ring-4"
          />
          <button
            type="button"
            onClick={() => setShowPassword((value) => !value)}
            className="absolute inset-y-0 right-0 flex items-center px-3 text-stone-400 transition hover:text-stone-700"
            aria-label={showPassword ? "隐藏密码" : "显示密码"}
          >
            {showPassword ? (
              <EyeOff className="h-4 w-4 stroke-[1.5]" />
            ) : (
              <Eye className="h-4 w-4 stroke-[1.5]" />
            )}
          </button>
        </div>
      </div>

      <div>
        <label htmlFor="confirmPassword" className="mb-2 block text-sm font-medium text-stone-700">
          确认密码
        </label>
        <input
          id="confirmPassword"
          name="confirmPassword"
          type={showPassword ? "text" : "password"}
          required
          minLength={6}
          autoComplete="new-password"
          className="w-full rounded-xl border border-stone-200 px-4 py-3 text-sm outline-none ring-stone-900/10 focus:ring-4"
        />
      </div>

      {state?.error ? <p className="text-sm text-red-600">{state.error}</p> : null}

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-xl bg-stone-900 px-4 py-3 text-sm font-medium text-white transition hover:bg-stone-800 disabled:opacity-60"
      >
        {pending ? "激活中..." : "完成激活"}
      </button>

      <p className="text-center text-sm text-stone-500">
        已有账号？{" "}
        <Link href="/login" className="text-stone-800 underline-offset-2 hover:underline">
          去登录
        </Link>
      </p>
    </form>
  );
}
