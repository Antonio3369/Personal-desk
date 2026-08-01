import type { TodoProgress } from "@/lib/constants";
import { cn } from "@/lib/utils";

const PROGRESS_DOT: Partial<Record<TodoProgress, string>> = {
  in_progress: "bg-teal-800",
  waiting: "bg-amber-600",
  done: "bg-emerald-600",
};

export function StatusDot({
  progress,
  className,
}: {
  progress: string;
  className?: string;
}) {
  const color = PROGRESS_DOT[progress as TodoProgress];
  if (!color) return null;

  return (
    <span
      className={cn("mt-2 h-2 w-2 shrink-0 rounded-full", color, className)}
      aria-hidden
    />
  );
}
