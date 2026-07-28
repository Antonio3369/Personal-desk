import { db } from "@/lib/db";
import { hasCityPermission, isModuleEnabled } from "@/lib/module-access";
import type { CityModulePermission, ModuleKey } from "@/lib/modules";
import type { SessionPayload } from "@/lib/session";
import { requireUserWorkspace } from "@/lib/workspace-context";
import { getWorkspaceModuleConfig } from "@/lib/workspace-modules";

export type ModuleAccessContext = {
  workspaceId: string;
  enabledModules: ModuleKey[];
  cityPermissions: CityModulePermission[];
};

export async function getModuleAccess(): Promise<ModuleAccessContext> {
  const { workspaceId } = await requireUserWorkspace();
  const config = await getWorkspaceModuleConfig(workspaceId);
  return {
    workspaceId,
    enabledModules: config.enabledModules,
    cityPermissions: config.cityPermissions,
  };
}

export async function requireModuleAccess(
  moduleKey: ModuleKey,
): Promise<ModuleAccessContext> {
  const ctx = await getModuleAccess();
  if (!isModuleEnabled(ctx.enabledModules, moduleKey)) {
    throw new Error("该模块未启用");
  }
  return ctx;
}

export async function requireCityModuleAccess(
  permission?: CityModulePermission,
): Promise<ModuleAccessContext> {
  const ctx = await requireModuleAccess("cities");
  if (permission && !hasCityPermission(ctx.cityPermissions, permission)) {
    throw new Error("无权限执行此操作");
  }
  return ctx;
}

export async function requireActiveUserSession(
  session: SessionPayload | null,
): Promise<SessionPayload | null> {
  if (!session?.workspaceId || session.role !== "user") {
    return null;
  }

  const user = await db.user.findUnique({
    where: { id: session.userId },
    select: { status: true },
  });

  if (!user || user.status !== "active") {
    return null;
  }

  return session;
}

export async function requireModuleAccessForSession(
  session: SessionPayload,
  moduleKey: ModuleKey,
): Promise<ModuleAccessContext | null> {
  const activeSession = await requireActiveUserSession(session);
  if (!activeSession?.workspaceId) {
    return null;
  }

  const config = await getWorkspaceModuleConfig(activeSession.workspaceId);
  if (!isModuleEnabled(config.enabledModules, moduleKey)) {
    return null;
  }

  return {
    workspaceId: activeSession.workspaceId,
    enabledModules: config.enabledModules,
    cityPermissions: config.cityPermissions,
  };
}
