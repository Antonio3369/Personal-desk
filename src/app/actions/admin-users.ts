"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { getInviteStatus } from "@/lib/invite";
import { summarizeModules } from "@/lib/modules";
import { formatPhoneDisplay } from "@/lib/phone";
import type { PhoneRegion } from "@/lib/phone";
import {
  parseModuleConfigFromForm,
  seedWorkspaceModules,
} from "@/lib/workspace-modules";
import { requireAdmin } from "@/lib/workspace-context";

export type AdminUserRow = {
  id: string;
  kind: "user" | "invite";
  phone: string;
  phoneDisplay: string;
  displayName: string;
  modulesSummary: string;
  status: "active" | "disabled" | "pending" | "expired";
  statusLabel: string;
  createdAt: Date;
  inviteId?: string;
  userId?: string;
};

export async function getAdminUserRows(): Promise<AdminUserRow[]> {
  await requireAdmin();

  const [users, invites] = await Promise.all([
    db.user.findMany({
      where: { role: "user" },
      include: {
        membership: {
          include: {
            workspace: {
              include: { modules: true },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
    db.invite.findMany({
      where: { usedAt: null },
      include: {
        workspace: { include: { modules: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const activePhones = new Set(users.map((user) => user.phone));

  const userRows: AdminUserRow[] = users.map((user) => ({
    id: user.id,
    kind: "user",
    phone: user.phone,
    phoneDisplay: formatPhoneDisplay(user.phone, user.phoneRegion as PhoneRegion),
    displayName: user.displayName,
    modulesSummary: user.membership
      ? summarizeModules(user.membership.workspace.modules)
      : "—",
    status: user.status === "disabled" ? "disabled" : "active",
    statusLabel: user.status === "disabled" ? "已停用" : "使用中",
    createdAt: user.createdAt,
    userId: user.id,
  }));

  const inviteRows: AdminUserRow[] = invites
    .filter((invite) => !activePhones.has(invite.phone))
    .map((invite) => {
      const inviteStatus = getInviteStatus(invite);
      return {
        id: invite.id,
        kind: "invite",
        phone: invite.phone,
        phoneDisplay: formatPhoneDisplay(
          invite.phone,
          invite.phoneRegion as PhoneRegion,
        ),
        displayName: "—",
        modulesSummary: summarizeModules(invite.workspace.modules),
        status: inviteStatus === "expired" ? "expired" : "pending",
        statusLabel: inviteStatus === "expired" ? "已过期" : "待激活",
        createdAt: invite.createdAt,
        inviteId: invite.id,
      };
    });

  return [...inviteRows, ...userRows].sort(
    (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
  );
}

export type UpdateModulesState = {
  error?: string;
  success?: boolean;
} | null;

export type UserStatusActionState = {
  error?: string;
  success?: boolean;
};

export async function disableUserAction(
  userId: string,
): Promise<UserStatusActionState> {
  await requireAdmin();

  const user = await db.user.findFirst({
    where: { id: userId, role: "user" },
  });

  if (!user) {
    return { error: "用户不存在" };
  }

  if (user.status === "disabled") {
    return { error: "用户已停用" };
  }

  await db.user.update({
    where: { id: userId },
    data: { status: "disabled" },
  });

  revalidatePath("/admin/users");
  revalidatePath(`/admin/users/${userId}/edit`);

  return { success: true };
}

export async function enableUserAction(
  userId: string,
): Promise<UserStatusActionState> {
  await requireAdmin();

  const user = await db.user.findFirst({
    where: { id: userId, role: "user" },
  });

  if (!user) {
    return { error: "用户不存在" };
  }

  if (user.status === "active") {
    return { error: "用户已处于使用中" };
  }

  await db.user.update({
    where: { id: userId },
    data: { status: "active" },
  });

  revalidatePath("/admin/users");
  revalidatePath(`/admin/users/${userId}/edit`);

  return { success: true };
}

export async function getAdminUserForEdit(userId: string) {
  await requireAdmin();

  const user = await db.user.findFirst({
    where: { id: userId, role: "user" },
    include: {
      membership: {
        include: {
          workspace: { include: { modules: true } },
        },
      },
    },
  });

  if (!user?.membership) {
    return null;
  }

  return {
    id: user.id,
    phoneDisplay: formatPhoneDisplay(user.phone, user.phoneRegion as PhoneRegion),
    displayName: user.displayName,
    status: user.status,
    workspaceId: user.membership.workspaceId,
    modules: user.membership.workspace.modules,
  };
}

export async function updateUserModulesAction(
  userId: string,
  _prev: UpdateModulesState,
  formData: FormData,
): Promise<UpdateModulesState> {
  await requireAdmin();

  const user = await db.user.findFirst({
    where: { id: userId, role: "user" },
    include: { membership: true },
  });

  if (!user?.membership) {
    return { error: "用户不存在" };
  }

  if (user.status === "disabled") {
    return { error: "用户已停用，请先启用后再编辑" };
  }

  const moduleConfig = parseModuleConfigFromForm(formData);
  if (moduleConfig.enabledModules.length === 0) {
    return { error: "至少启用一个模块" };
  }

  await seedWorkspaceModules(user.membership.workspaceId, moduleConfig);

  revalidatePath("/admin/users");
  revalidatePath(`/admin/users/${userId}/edit`);

  return { success: true };
}

export async function updateInviteModulesAction(
  inviteId: string,
  _prev: UpdateModulesState,
  formData: FormData,
): Promise<UpdateModulesState> {
  await requireAdmin();

  const invite = await db.invite.findUnique({ where: { id: inviteId } });
  if (!invite) {
    return { error: "邀请不存在" };
  }

  if (invite.usedAt) {
    return { error: "邀请已激活，请编辑用户模块" };
  }

  const moduleConfig = parseModuleConfigFromForm(formData);
  if (moduleConfig.enabledModules.length === 0) {
    return { error: "至少启用一个模块" };
  }

  await seedWorkspaceModules(invite.workspaceId, moduleConfig);

  revalidatePath("/admin/users");
  revalidatePath(`/admin/invites/${inviteId}`);

  return { success: true };
}

export async function getAdminInviteDetail(inviteId: string) {
  await requireAdmin();

  const invite = await db.invite.findUnique({
    where: { id: inviteId },
    include: {
      workspace: { include: { modules: true } },
    },
  });

  if (!invite) {
    return null;
  }

  const status = getInviteStatus(invite);

  return {
    id: invite.id,
    phone: invite.phone,
    phoneDisplay: formatPhoneDisplay(
      invite.phone,
      invite.phoneRegion as PhoneRegion,
    ),
    status,
    statusLabel:
      status === "pending"
        ? "待激活"
        : status === "used"
          ? "已激活"
          : "已过期",
    expiresAt: invite.expiresAt,
    token: invite.token,
    modules: invite.workspace.modules,
  };
}
