import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import type { PhoneRegion } from "@/lib/phone";

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 10);
}

export async function verifyUserPassword(userId: string, password: string) {
  const user = await db.user.findUnique({ where: { id: userId } });
  if (!user || user.status !== "active") {
    return false;
  }
  return bcrypt.compare(password, user.passwordHash);
}

export async function authenticateByPhone(
  phone: string,
  password: string,
): Promise<
  | {
      ok: true;
      user: {
        id: string;
        role: "admin" | "user";
        displayName: string;
        workspaceId: string | null;
      };
    }
  | { ok: false; reason: "invalid" | "disabled" }
> {
  const user = await db.user.findUnique({
    where: { phone },
    include: { membership: true },
  });

  if (!user) {
    return { ok: false, reason: "invalid" };
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    return { ok: false, reason: "invalid" };
  }

  if (user.status !== "active") {
    return { ok: false, reason: "disabled" };
  }

  await db.user.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date() },
  });

  return {
    ok: true,
    user: {
      id: user.id,
      role: user.role as "admin" | "user",
      displayName: user.displayName,
      workspaceId: user.membership?.workspaceId ?? null,
    },
  };
}

export async function updateUserPassword(
  userId: string,
  currentPassword: string,
  nextPassword: string,
) {
  const valid = await verifyUserPassword(userId, currentPassword);
  if (!valid) {
    return { error: "当前密码不正确" as const };
  }

  if (nextPassword.length < 6) {
    return { error: "新密码至少 6 位" as const };
  }

  if (currentPassword === nextPassword) {
    return { error: "新密码不能与当前密码相同" as const };
  }

  const passwordHash = await hashPassword(nextPassword);
  await db.user.update({
    where: { id: userId },
    data: { passwordHash },
  });

  return { success: true as const };
}

export async function createUserWithWorkspace(input: {
  phone: string;
  phoneRegion: PhoneRegion;
  displayName: string;
  password: string;
  role?: "admin" | "user";
}) {
  const passwordHash = await hashPassword(input.password);
  const role = input.role ?? "user";

  if (role === "admin") {
    return db.user.create({
      data: {
        phone: input.phone,
        phoneRegion: input.phoneRegion,
        displayName: input.displayName,
        passwordHash,
        role: "admin",
      },
    });
  }

  return db.user.create({
    data: {
      phone: input.phone,
      phoneRegion: input.phoneRegion,
      displayName: input.displayName,
      passwordHash,
      role: "user",
      membership: {
        create: {
          role: "owner",
          workspace: {
            create: {},
          },
        },
      },
    },
    include: {
      membership: true,
    },
  });
}
