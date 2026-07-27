import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, isToday, isThisWeek, startOfDay } from "date-fns";
import { zhCN } from "date-fns/locale";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date | string | null | undefined) {
  if (!date) return "";
  const value = typeof date === "string" ? new Date(date) : date;
  return format(value, "yyyy-MM-dd", { locale: zhCN });
}

export function formatDateTime(date: Date | string | null | undefined) {
  if (!date) return "";
  const value = typeof date === "string" ? new Date(date) : date;
  return format(value, "MM月dd日 HH:mm", { locale: zhCN });
}

export function isDueToday(date: Date | string | null | undefined) {
  if (!date) return false;
  const value = typeof date === "string" ? new Date(date) : date;
  return isToday(value) || value <= startOfDay(new Date());
}

export function isDueThisWeek(date: Date | string | null | undefined) {
  if (!date) return false;
  const value = typeof date === "string" ? new Date(date) : date;
  return isThisWeek(value, { weekStartsOn: 1 });
}

export function isWithinDays(
  date: Date | string | null | undefined,
  days: number,
) {
  if (!date) return false;
  const value = typeof date === "string" ? new Date(date) : date;
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  cutoff.setHours(0, 0, 0, 0);
  return value >= cutoff;
}

export function completionTimestamp(todo: {
  progress: string;
  completedAt?: Date | string | null;
  updatedAt?: Date | string | null;
}) {
  if (todo.progress !== "done") return null;
  return todo.completedAt ?? todo.updatedAt ?? null;
}
