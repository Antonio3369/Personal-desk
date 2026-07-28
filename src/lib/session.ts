import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

export const SESSION_COOKIE = "personal-desk-session";

export type SessionPayload = {
  userId: string;
  role: "admin" | "user";
  workspaceId: string | null;
  displayName: string | null;
};

function getSecret() {
  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    throw new Error("SESSION_SECRET is not set");
  }
  return new TextEncoder().encode(secret);
}

export async function createSessionToken(payload: SessionPayload) {
  return new SignJWT({
    userId: payload.userId,
    role: payload.role,
    workspaceId: payload.workspaceId,
    displayName: payload.displayName,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(getSecret());
}

export async function setSessionCookie(payload: SessionPayload) {
  const token = await createSessionToken(payload);
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
}

export async function clearSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}

export async function getSessionPayload(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, getSecret());
    const userId = payload.userId;
    const role = payload.role;
    if (typeof userId !== "string" || (role !== "admin" && role !== "user")) {
      return null;
    }

    return {
      userId,
      role,
      workspaceId:
        typeof payload.workspaceId === "string" ? payload.workspaceId : null,
      displayName:
        typeof payload.displayName === "string" ? payload.displayName : null,
    };
  } catch {
    return null;
  }
}

export async function isAuthenticated() {
  const session = await getSessionPayload();
  return session !== null;
}

export function decodeSessionPayload(
  payload: Record<string, unknown>,
): SessionPayload | null {
  const userId = payload.userId;
  const role = payload.role;
  if (typeof userId !== "string" || (role !== "admin" && role !== "user")) {
    return null;
  }

  return {
    userId,
    role,
    workspaceId:
      typeof payload.workspaceId === "string" ? payload.workspaceId : null,
    displayName:
      typeof payload.displayName === "string" ? payload.displayName : null,
  };
}
