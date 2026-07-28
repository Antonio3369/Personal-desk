"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";
import { loginAction, type LoginState } from "@/app/actions/auth";

export function LoginForm() {
  const router = useRouter();
  const [phoneRegion, setPhoneRegion] = useState<"CN" | "HK">("CN");
  const [showPassword, setShowPassword] = useState(false);
  const [state, formAction, pending] = useActionState<LoginState, FormData>(
    loginAction,
    null,
  );

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
            autoComplete="tel"
            maxLength={phoneRegion === "CN" ? 11 : 8}
            className="min-w-0 flex-1 rounded-xl border border-stone-200 px-4 py-3 text-sm outline-none ring-stone-900/10 focus:ring-4"
            placeholder={phoneRegion === "CN" ? "13812345678" : "91234567"}
          />
        </div>
      </div>
      <div>
        <label
          htmlFor="password"
          className="mb-2 block text-sm font-medium text-stone-700"
        >
          Password:
        </label>
        <div className="relative">
          <input
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            required
            autoComplete="current-password"
            enterKeyHint="go"
            className="w-full rounded-xl border border-stone-200 px-4 py-3 pr-11 text-sm outline-none ring-stone-900/10 focus:ring-4"
            placeholder="请输入密码"
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
      {state?.error ? (
        <p className="text-sm text-red-600">{state.error}</p>
      ) : null}
      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-xl bg-stone-900 px-4 py-3 text-sm font-medium text-white transition hover:bg-stone-800 disabled:opacity-60"
      >
        {pending ? "登录中..." : "进入工作台"}
      </button>
    </form>
  );
}
