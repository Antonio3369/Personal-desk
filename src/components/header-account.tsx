"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { KeyRound, LogOut, UserRound, X } from "lucide-react";
import {
  changePasswordAction,
  logoutAction,
  type ChangePasswordState,
} from "@/app/actions/auth";

export function HeaderAccount() {
  const [open, setOpen] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      if (!panelRef.current?.contains(event.target as Node)) {
        setOpen(false);
        setChangingPassword(false);
      }
    }
    if (open) {
      document.addEventListener("mousedown", handlePointerDown);
      return () => document.removeEventListener("mousedown", handlePointerDown);
    }
  }, [open]);

  return (
    <div ref={panelRef} className="relative ml-auto">
      <button
        type="button"
        onClick={() => {
          setOpen((value) => !value);
          setChangingPassword(false);
        }}
        className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-stone-500 transition hover:bg-white hover:text-stone-900"
        aria-expanded={open}
        aria-haspopup="dialog"
      >
        <UserRound className="h-4 w-4 stroke-[1.5]" />
        个人中心
      </button>

      {open ? (
        <div className="absolute right-0 top-full z-50 mt-2 w-[min(20rem,calc(100vw-2rem))] rounded-2xl border border-stone-200 bg-white p-3 shadow-lg">
          {changingPassword ? (
            <ChangePasswordPanel
              onClose={() => setChangingPassword(false)}
              onSuccess={() => {
                setChangingPassword(false);
                setOpen(false);
              }}
            />
          ) : (
            <div className="space-y-1">
              <p className="px-2 pb-2 text-xs font-medium uppercase tracking-[0.16em] text-stone-400">
                个人中心
              </p>
              <button
                type="button"
                onClick={() => setChangingPassword(true)}
                className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-sm text-stone-700 transition hover:bg-stone-50"
              >
                <KeyRound className="h-4 w-4 stroke-[1.5] text-stone-400" />
                修改密码
              </button>
              <form action={logoutAction}>
                <button
                  type="submit"
                  className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-sm text-stone-700 transition hover:bg-stone-50"
                >
                  <LogOut className="h-4 w-4 stroke-[1.5] text-stone-400" />
                  退出登录
                </button>
              </form>
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}

function ChangePasswordPanel({
  onClose,
  onSuccess,
}: {
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [state, formAction, pending] = useActionState<
    ChangePasswordState,
    FormData
  >(changePasswordAction, null);

  useEffect(() => {
    if (state?.success) {
      onSuccess();
    }
  }, [state, onSuccess]);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between px-1">
        <h3 className="text-sm font-medium text-stone-900">修改密码</h3>
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg p-1.5 text-stone-400 transition hover:bg-stone-100 hover:text-stone-700"
          aria-label="关闭"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <form action={formAction} className="space-y-3">
        <Field
          label="当前密码"
          name="currentPassword"
          autoComplete="current-password"
        />
        <Field
          label="新密码"
          name="nextPassword"
          autoComplete="new-password"
          placeholder="至少 6 位"
        />
        <Field
          label="确认新密码"
          name="confirmPassword"
          autoComplete="new-password"
        />
        {state?.error ? (
          <p className="text-sm text-red-600">{state.error}</p>
        ) : null}
        {state?.success ? (
          <p className="text-sm text-emerald-700">密码已更新</p>
        ) : null}
        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-xl bg-stone-900 px-3 py-2.5 text-sm font-medium text-white transition hover:bg-stone-800 disabled:opacity-60"
        >
          {pending ? "保存中..." : "保存新密码"}
        </button>
      </form>
    </div>
  );
}

function Field({
  label,
  name,
  autoComplete,
  placeholder,
}: {
  label: string;
  name: string;
  autoComplete?: string;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-medium text-stone-600">
        {label}
      </label>
      <input
        name={name}
        type="password"
        required
        autoComplete={autoComplete}
        placeholder={placeholder}
        className="w-full rounded-xl border border-stone-200 px-3 py-2.5 text-sm outline-none ring-stone-900/10 focus:ring-4"
      />
    </div>
  );
}
