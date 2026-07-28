import { randomBytes } from "crypto";
import type { Invite } from "@prisma/client";

export type InviteStatus = "pending" | "used" | "expired";

export function generateInviteToken() {
  return randomBytes(32).toString("hex");
}

export function getInviteStatus(invite: Pick<Invite, "usedAt" | "expiresAt">): InviteStatus {
  if (invite.usedAt) {
    return "used";
  }
  if (invite.expiresAt < new Date()) {
    return "expired";
  }
  return "pending";
}

export function inviteExpiresInDays(days: number) {
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + days);
  return expiresAt;
}

export const INVITE_EXPIRY_OPTIONS = [3, 7, 14, 30] as const;

export type InviteExpiryDays = (typeof INVITE_EXPIRY_OPTIONS)[number];

export function parseInviteExpiryDays(value: string): InviteExpiryDays {
  const days = Number(value);
  if (INVITE_EXPIRY_OPTIONS.includes(days as InviteExpiryDays)) {
    return days as InviteExpiryDays;
  }
  return 7;
}

export function buildInviteUrl(baseUrl: string, token: string) {
  return `${baseUrl.replace(/\/$/, "")}/invite/${token}`;
}
