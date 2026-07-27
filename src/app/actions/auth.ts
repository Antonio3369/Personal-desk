"use server";

import { redirect } from "next/navigation";
import { updatePassword, verifyPassword } from "@/lib/auth";
import { clearSessionCookie, setSessionCookie } from "@/lib/session";

export type LoginState = {
  error?: string;
  success?: boolean;
} | null;

export type ChangePasswordState = {
  error?: string;
  success?: boolean;
} | null;

export async function loginAction(
  _prev: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const password = String(formData.get("password") ?? "");

  if (!password) {
    return { error: "请输入密码" };
  }

  const valid = await verifyPassword(password);
  if (!valid) {
    return { error: "密码不正确" };
  }

  await setSessionCookie();
  return { success: true };
}

export async function changePasswordAction(
  _prev: ChangePasswordState,
  formData: FormData,
): Promise<ChangePasswordState> {
  const currentPassword = String(formData.get("currentPassword") ?? "");
  const nextPassword = String(formData.get("nextPassword") ?? "");
  const confirmPassword = String(formData.get("confirmPassword") ?? "");

  if (!currentPassword || !nextPassword || !confirmPassword) {
    return { error: "请填写完整" };
  }

  if (nextPassword !== confirmPassword) {
    return { error: "两次输入的新密码不一致" };
  }

  const result = await updatePassword(currentPassword, nextPassword);
  if ("error" in result && result.error) {
    return { error: result.error };
  }

  return { success: true };
}

export async function logoutAction() {
  await clearSessionCookie();
  redirect("/login");
}
