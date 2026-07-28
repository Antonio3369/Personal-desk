import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getSessionPayload, type SessionPayload } from "@/lib/session";

export type UserWorkspaceContext = {
  userId: string;
  workspaceId: string;
  displayName: string;
};

export async function requireSession(): Promise<SessionPayload> {
  const session = await getSessionPayload();
  if (!session) {
    redirect("/login");
  }
  return session;
}

export async function requireUserWorkspace(): Promise<UserWorkspaceContext> {
  const session = await requireSession();

  if (session.role === "admin" || !session.workspaceId || !session.displayName) {
    redirect("/login");
  }

  const user = await db.user.findUnique({
    where: { id: session.userId },
    select: { status: true },
  });

  if (!user || user.status !== "active") {
    redirect("/api/auth/logout?error=disabled");
  }

  return {
    userId: session.userId,
    workspaceId: session.workspaceId,
    displayName: session.displayName,
  };
}

export async function requireAdmin(): Promise<SessionPayload> {
  const session = await requireSession();
  if (session.role !== "admin") {
    redirect("/");
  }
  return session;
}

export async function getWorkspaceId(): Promise<string> {
  const { workspaceId } = await requireUserWorkspace();
  return workspaceId;
}
