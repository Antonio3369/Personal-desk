import { differenceInCalendarDays, startOfDay } from "date-fns";

export const STALE_FOLLOW_UP_DAYS = 3;

function toDate(value: Date | string | null | undefined) {
  if (!value) return null;
  return typeof value === "string" ? new Date(value) : value;
}

export function daysSince(
  date: Date | string | null | undefined,
  reference = new Date(),
) {
  const value = toDate(date);
  if (!value) return null;

  return Math.max(
    0,
    differenceInCalendarDays(startOfDay(reference), startOfDay(value)),
  );
}

export function isStaleFollowUp(
  days: number | null,
  threshold = STALE_FOLLOW_UP_DAYS,
) {
  return days !== null && days >= threshold;
}

export function formatDaysAgoLabel(days: number) {
  if (days === 0) return "今天";
  if (days === 1) return "昨天";
  return `${days} 天前`;
}

export function getWaitingDays(todo: {
  progress: string;
  followUpDate?: Date | string | null;
  updatedAt?: Date | string | null;
}) {
  if (todo.progress !== "waiting") return null;
  return daysSince(todo.followUpDate ?? todo.updatedAt);
}
