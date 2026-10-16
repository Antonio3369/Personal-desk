"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import type { ResetPasswordState } from "@/app/actions/admin-users";

export function ResetPasswordForm({
  action,
}: {
  action: (
    prev: ResetPasswordState,
    formData: FormData,
  ) => Promise<ResetPasswordState>;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [state, formAction, pending] = useActionState(action, null);

  useEffect(() => {
    if (state?.success) {
      formRef.current?.reset();
      setShowPassword(false);
    }
  }, [state]);

  return (
    <form ref={formRef} action={formAction} className="space-y-4">
      <div>
        <label
          htmlFor="nextPassword"
          className="mb-2 block text-sm font-medium text-stone-700"
        >
          新密码
        </label>
        <div className="relative">
          <input
            id="nextPassword"
            name="nextPassword"
            type={showPassword ? "text" : "password"}
            required
            minLength={6}
            autoComplete="new-password"
            placeholder="至少 6 位"
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
        <label
          htmlFor="confirmPassword"
          className="mb-2 block text-sm font-medium text-stone-700"
        >
          确认新密码
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
      {state?.success ? (
        <p className="text-sm text-emerald-700">
          密码已重置，请将新密码告知用户。
        </p>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="rounded-xl bg-stone-900 px-5 py-3 text-sm font-medium text-white transition hover:bg-stone-800 disabled:opacity-60"
      >
        {pending ? "重置中..." : "重置密码"}
      </button>
    </form>
  );
}
