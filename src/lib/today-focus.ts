import { startOfDay } from "date-fns";
import { STALE_FOLLOW_UP_DAYS, daysSince } from "@/lib/follow-up";
import { isDueToday } from "@/lib/utils";

type FocusTodo = {
  progress: string;
  followUpDate: Date | null;
  updatedAt: Date;
};

function focusRank(todo: FocusTodo) {
  const waitingDays =
    todo.progress === "waiting"
      ? daysSince(todo.followUpDate ?? todo.updatedAt)
      : null;
  const overdue =
    todo.followUpDate !== null &&
    todo.followUpDate < startOfDay(new Date());

  if (
    todo.progress === "waiting" &&
    waitingDays !== null &&
    (overdue || waitingDays >= STALE_FOLLOW_UP_DAYS)
  ) {
    return 0;
  }
  if (todo.followUpDate && isDueToday(todo.followUpDate)) {
    return 1;
  }
  if (todo.progress === "waiting") {
    return 2;
  }
  if (todo.progress === "in_progress") {
    return 3;
  }
  return 4;
}

function followUpTimestamp(todo: FocusTodo) {
  return todo.followUpDate?.getTime() ?? Number.MAX_SAFE_INTEGER;
}

export function sortTodayFocusTodos<T extends FocusTodo>(todos: T[]) {
  return [...todos].sort((a, b) => {
    const rankDiff = focusRank(a) - focusRank(b);
    if (rankDiff !== 0) return rankDiff;
    const followUpDiff = followUpTimestamp(a) - followUpTimestamp(b);
    if (followUpDiff !== 0) return followUpDiff;
    return b.updatedAt.getTime() - a.updatedAt.getTime();
  });
}
