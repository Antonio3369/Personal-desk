import {
  formatDaysAgoLabel,
  getWaitingDays,
  isStaleFollowUp,
  daysSince,
} from "@/lib/follow-up";
import { cn } from "@/lib/utils";

function staleTextClass(stale: boolean) {
  return cn(
    "text-xs",
    stale ? "font-medium text-amber-700" : "text-stone-500",
  );
}

export function WaitDaysHint({
  progress,
  followUpDate,
  updatedAt,
  className,
}: {
  progress: string;
  followUpDate?: Date | string | null;
  updatedAt?: Date | string | null;
  className?: string;
}) {
  const days = getWaitingDays({ progress, followUpDate, updatedAt });
  if (days === null) return null;

  return (
    <span className={cn(staleTextClass(isStaleFollowUp(days)), className)}>
      已等 {days} 天
    </span>
  );
}

export function ContactWarmthHint({
  lastInteractionAt,
  className,
}: {
  lastInteractionAt: Date | string | null | undefined;
  className?: string;
}) {
  const days = daysSince(lastInteractionAt);
  if (days === null) return null;

  return (
    <span className={cn(staleTextClass(isStaleFollowUp(days)), className)}>
      上次联系 {formatDaysAgoLabel(days)}
    </span>
  );
}
