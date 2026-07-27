import bcrypt from "bcryptjs";
import { db } from "@/lib/db";

const PASSWORD_HASH_KEY = "password_hash";

async function getStoredPasswordHash() {
  const setting = await db.appSetting.findUnique({
    where: { key: PASSWORD_HASH_KEY },
  });
  return setting?.value ?? null;
}

export async function verifyPassword(password: string) {
  const storedHash = await getStoredPasswordHash();
  if (storedHash) {
    return bcrypt.compare(password, storedHash);
  }

  const envHash = process.env.APP_PASSWORD_HASH;
  if (envHash) {
    return bcrypt.compare(password, envHash);
  }

  const plain = process.env.APP_PASSWORD;
  if (plain) {
    return password === plain;
  }

  throw new Error("APP_PASSWORD or APP_PASSWORD_HASH must be set");
}

export async function updatePassword(currentPassword: string, nextPassword: string) {
  const valid = await verifyPassword(currentPassword);
  if (!valid) {
    return { error: "当前密码不正确" as const };
  }

  if (nextPassword.length < 6) {
    return { error: "新密码至少 6 位" as const };
  }

  if (currentPassword === nextPassword) {
    return { error: "新密码不能与当前密码相同" as const };
  }

  const hash = await bcrypt.hash(nextPassword, 10);
  await db.appSetting.upsert({
    where: { key: PASSWORD_HASH_KEY },
    update: { value: hash },
    create: { key: PASSWORD_HASH_KEY, value: hash },
  });

  return { success: true as const };
}
