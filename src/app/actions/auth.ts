"use server";

import { redirect } from "next/navigation";
import {
  authenticateByPhone,
  updateUserPassword,
} from "@/lib/auth";
import { normalizePhone, parsePhoneRegion } from "@/lib/phone";
import { clearSessionCookie, setSessionCookie } from "@/lib/session";

export type LoginState = {
  error?: string;
  success?: boolean;
  redirectTo?: string;
} | null;

export type ChangePasswordState = {
  error?: string;
  success?: boolean;
} | null;

export async function loginAction(
  _prev: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const phoneRegion = parsePhoneRegion(String(formData.get("phoneRegion") ?? ""));
  const phoneInput = String(formData.get("phone") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!phoneRegion) {
    return { error: "请选择地区" };
  }

  if (!phoneInput) {
    return { error: "请输入手机号" };
  }

  const phone = normalizePhone(phoneRegion, phoneInput);
  if (!phone) {
    return {
      error:
        phoneRegion === "CN"
          ? "请输入 11 位大陆手机号"
          : "请输入 8 位香港手机号",
    };
  }

  if (!password) {
    return { error: "请输入密码" };
  }

  const result = await authenticateByPhone(phone, password);
  if (!result.ok) {
    if (result.reason === "disabled") {
      return { error: "账号已停用，请联系管理员" };
    }
    return { error: "手机号或密码不正确" };
  }

  if (result.user.role === "user" && !result.user.workspaceId) {
    return { error: "账号尚未完成配置，请联系管理员" };
  }

  await setSessionCookie({
    userId: result.user.id,
    role: result.user.role,
    workspaceId: result.user.workspaceId,
    displayName: result.user.displayName,
  });

  return {
    success: true,
    redirectTo: result.user.role === "admin" ? "/admin" : "/",
  };
}

export async function changePasswordAction(
  _prev: ChangePasswordState,
  formData: FormData,
): Promise<ChangePasswordState> {
  const { getSessionPayload } = await import("@/lib/session");
  const session = await getSessionPayload();
  if (!session) {
    return { error: "请先登录" };
  }

  const currentPassword = String(formData.get("currentPassword") ?? "");
  const nextPassword = String(formData.get("nextPassword") ?? "");
  const confirmPassword = String(formData.get("confirmPassword") ?? "");

  if (!currentPassword || !nextPassword || !confirmPassword) {
    return { error: "请填写完整" };
  }

  if (nextPassword !== confirmPassword) {
    return { error: "两次输入的新密码不一致" };
  }

  const result = await updateUserPassword(
    session.userId,
    currentPassword,
    nextPassword,
  );
  if ("error" in result && result.error) {
    return { error: result.error };
  }

  return { success: true };
}

export async function logoutAction() {
  await clearSessionCookie();
  redirect("/login");
}
