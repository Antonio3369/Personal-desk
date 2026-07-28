"use server";

import { revalidatePath } from "next/cache";
import { hashPassword } from "@/lib/auth";
import { buildInviteUrl } from "@/lib/invite";
import { getAppBaseUrl } from "@/lib/app-url";
import { db } from "@/lib/db";
import {
  generateInviteToken,
  getInviteStatus,
  inviteExpiresInDays,
  parseInviteExpiryDays,
} from "@/lib/invite";
import { normalizePhone, parsePhoneRegion, formatPhoneDisplay } from "@/lib/phone";
import {
  parseModuleConfigFromForm,
  seedWorkspaceModules,
} from "@/lib/workspace-modules";
import { requireAdmin } from "@/lib/workspace-context";
import { setSessionCookie } from "@/lib/session";
import type { PhoneRegion } from "@/lib/phone";

export type CreateInviteState = {
  error?: string;
  success?: boolean;
  inviteUrl?: string;
  phone?: string;
  expiresAt?: string;
  inviteId?: string;
} | null;

export type ActivateInviteState = {
  error?: string;
  success?: boolean;
  redirectTo?: string;
} | null;

export async function createInviteAction(
  _prev: CreateInviteState,
  formData: FormData,
): Promise<CreateInviteState> {
  const admin = await requireAdmin();

  const phoneRegion = parsePhoneRegion(String(formData.get("phoneRegion") ?? ""));
  const phoneInput = String(formData.get("phone") ?? "").trim();
  const expiryDays = parseInviteExpiryDays(String(formData.get("expiryDays") ?? "7"));

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

  const moduleConfig = parseModuleConfigFromForm(formData);
  if (moduleConfig.enabledModules.length === 0) {
    return { error: "至少启用一个模块" };
  }

  const existingUser = await db.user.findUnique({ where: { phone } });
  if (existingUser) {
    return { error: "该手机号已注册" };
  }

  const pendingInvite = await db.invite.findFirst({
    where: { phone, usedAt: null, expiresAt: { gt: new Date() } },
  });
  if (pendingInvite) {
    return { error: "该手机号已有待激活邀请" };
  }

  const staleInvites = await db.invite.findMany({
    where: { phone, usedAt: null },
    select: { workspaceId: true },
  });
  for (const stale of staleInvites) {
    await db.workspace.delete({ where: { id: stale.workspaceId } });
  }

  const token = generateInviteToken();
  const expiresAt = inviteExpiresInDays(expiryDays);
  const baseUrl = await getAppBaseUrl();

  const invite = await db.$transaction(async (tx) => {
    const workspace = await tx.workspace.create({ data: {} });
    await seedWorkspaceModules(workspace.id, moduleConfig, tx);

    return tx.invite.create({
      data: {
        token,
        phone,
        phoneRegion,
        workspaceId: workspace.id,
        createdById: admin.userId,
        expiresAt,
      },
    });
  });

  revalidatePath("/admin/users");

  return {
    success: true,
    inviteUrl: buildInviteUrl(baseUrl, invite.token),
    phone: formatPhoneDisplay(phone, phoneRegion),
    expiresAt: expiresAt.toISOString(),
    inviteId: invite.id,
  };
}

export async function regenerateInviteAction(inviteId: string) {
  await requireAdmin();

  const invite = await db.invite.findUnique({ where: { id: inviteId } });
  if (!invite) {
    return { error: "邀请不存在" as const };
  }

  if (invite.usedAt) {
    return { error: "邀请已激活，无法重新生成" as const };
  }

  const token = generateInviteToken();
  const expiresAt = inviteExpiresInDays(7);
  const baseUrl = await getAppBaseUrl();

  const updated = await db.invite.update({
    where: { id: inviteId },
    data: { token, expiresAt, usedAt: null, usedByUserId: null },
  });

  revalidatePath("/admin/users");

  return {
    success: true as const,
    inviteUrl: buildInviteUrl(baseUrl, updated.token),
    expiresAt: expiresAt.toISOString(),
  };
}

export async function revokeInviteAction(inviteId: string) {
  await requireAdmin();

  const invite = await db.invite.findUnique({ where: { id: inviteId } });
  if (!invite) {
    return { error: "邀请不存在" as const };
  }

  if (invite.usedAt) {
    return { error: "邀请已激活，无法撤销" as const };
  }

  await db.workspace.delete({ where: { id: invite.workspaceId } });

  revalidatePath("/admin/users");
  return { success: true as const };
}

export async function getInviteForActivation(token: string) {
  const invite = await db.invite.findUnique({
    where: { token },
    include: {
      workspace: {
        include: { modules: true },
      },
    },
  });

  if (!invite) {
    return { status: "invalid" as const };
  }

  const status = getInviteStatus(invite);
  if (status === "used") {
    return { status: "used" as const };
  }
  if (status === "expired") {
    return { status: "expired" as const };
  }

  return {
    status: "pending" as const,
    phone: invite.phone,
    phoneRegion: invite.phoneRegion as PhoneRegion,
    phoneDisplay: formatPhoneDisplay(
      invite.phone,
      invite.phoneRegion as PhoneRegion,
    ),
  };
}

export async function activateInviteAction(
  token: string,
  _prev: ActivateInviteState,
  formData: FormData,
): Promise<ActivateInviteState> {
  const displayName = String(formData.get("displayName") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const confirmPassword = String(formData.get("confirmPassword") ?? "");

  if (!displayName) {
    return { error: "请输入你的名字" };
  }

  if (displayName.length > 20) {
    return { error: "名字不能超过 20 个字" };
  }

  if (!password) {
    return { error: "请设置密码" };
  }

  if (password.length < 6) {
    return { error: "密码至少 6 位" };
  }

  if (password !== confirmPassword) {
    return { error: "两次输入的密码不一致" };
  }

  const invite = await db.invite.findUnique({ where: { token } });
  if (!invite) {
    return { error: "邀请链接无效" };
  }

  const status = getInviteStatus(invite);
  if (status === "used") {
    return { error: "邀请链接已使用，请直接登录" };
  }
  if (status === "expired") {
    return { error: "邀请链接已过期，请联系管理员" };
  }

  const existingUser = await db.user.findUnique({ where: { phone: invite.phone } });
  if (existingUser) {
    return { error: "该手机号已注册，请直接登录" };
  }

  const passwordHash = await hashPassword(password);

  const user = await db.$transaction(async (tx) => {
    const created = await tx.user.create({
      data: {
        phone: invite.phone,
        phoneRegion: invite.phoneRegion,
        displayName,
        passwordHash,
        role: "user",
        membership: {
          create: {
            workspaceId: invite.workspaceId,
            role: "owner",
          },
        },
      },
    });

    await tx.invite.update({
      where: { id: invite.id },
      data: {
        usedAt: new Date(),
        usedByUserId: created.id,
      },
    });

    return created;
  });

  await setSessionCookie({
    userId: user.id,
    role: "user",
    workspaceId: invite.workspaceId,
    displayName: user.displayName,
  });

  return { success: true, redirectTo: "/" };
}
