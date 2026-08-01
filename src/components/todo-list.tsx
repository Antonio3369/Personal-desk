"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { TODO_PROGRESS, TODO_SCOPES, type TodoProgress } from "@/lib/constants";
import { cn, formatDate, formatDateTime, completionTimestamp } from "@/lib/utils";
import { deleteTodoAction, toggleTodoDoneAction } from "@/app/actions/todos";
import { AttachmentImageGallery } from "@/components/attachment-image-gallery";
import { WaitDaysHint } from "@/components/follow-up-hint";
import { StatusDot } from "@/components/status-dot";
import { TodoEditForm } from "@/components/todo-edit-form";
import { Badge } from "@/components/ui-shell";
import { Check, Pencil, Trash2 } from "lucide-react";

export type TodoItem = {
  id: string;
  content: string;
  scope: string;
  nature: string | null;
  progress: string;
  followUpDate: Date | string | null;
  completedAt?: Date | string | null;
  updatedAt?: Date | string;
  city?: { id: string; name: string } | null;
  contact?: { id: string; name: string } | null;
  tags?: { tag: { name: string } }[];
  images?: { id: string; path: string }[];
};

function progressTone(progress: string) {
  if (progress === "in_progress") return "active";
  if (progress === "waiting") return "warning";
  if (progress === "done") return "success";
  if (progress === "deferred") return "muted";
  return "default";
}

export function TodoList({
  items,
  compact = false,
  showCompletionTime = false,
  editable = true,
}: {
  items: TodoItem[];
  compact?: boolean;
  showCompletionTime?: boolean;
  editable?: boolean;
}) {
  if (!items.length) {
    return null;
  }

  return (
    <div className="space-y-3">
      {items.map((todo) => (
        <TodoCard
          key={todo.id}
          todo={todo}
          compact={compact}
          showCompletionTime={showCompletionTime}
          editable={editable}
        />
      ))}
    </div>
  );
}

function TodoCard({
  todo,
  compact,
  showCompletionTime = false,
  editable = true,
}: {
  todo: TodoItem;
  compact?: boolean;
  showCompletionTime?: boolean;
  editable?: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [editing, setEditing] = useState(false);
  const done = todo.progress === "done";
  const completedStamp = completionTimestamp(todo);

  if (editing && editable) {
    return <TodoEditForm todo={todo} onClose={() => setEditing(false)} />;
  }

  return (
    <article
      className={cn(
        "card-surface p-4",
        pending && "opacity-60",
        done && "opacity-70",
      )}
    >
      <div className="flex items-start gap-3">
        <button
          type="button"
          onClick={() =>
            startTransition(async () => {
              await toggleTodoDoneAction(todo.id, !done);
              router.refresh();
            })
          }
          className={cn(
            "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border",
            done
              ? "border-emerald-500 bg-emerald-500 text-white"
              : "border-stone-300 text-transparent hover:border-stone-400",
          )}
          aria-label={done ? "标记未完成" : "标记完成"}
        >
          <Check className="h-3 w-3" />
        </button>
        <div className="min-w-0 flex-1">
          <div className="flex items-start gap-2">
            <StatusDot progress={todo.progress} className="mt-2" />
            <p
              className={cn(
                "min-w-0 flex-1 text-sm leading-6 text-stone-900",
                done && "line-through text-stone-500",
              )}
            >
              {todo.content}
            </p>
          </div>
          {todo.images?.length ? (
            <AttachmentImageGallery images={todo.images} compact />
          ) : null}
          <div className="mt-3 flex flex-wrap gap-2">
            <Badge tone={todo.scope === "personal" ? "muted" : "default"}>
              {TODO_SCOPES[todo.scope as keyof typeof TODO_SCOPES] ??
                todo.scope}
            </Badge>
            <Badge tone={progressTone(todo.progress)}>
              {TODO_PROGRESS[todo.progress as TodoProgress] ?? todo.progress}
            </Badge>
            {todo.city ? <Badge>{todo.city.name}</Badge> : null}
            {todo.contact ? (
              <Link href={`/contacts/${todo.contact.id}`}>
                <Badge>{todo.contact.name}</Badge>
              </Link>
            ) : null}
            {todo.followUpDate && !done ? (
              <Badge tone="warning">跟进 {formatDate(todo.followUpDate)}</Badge>
            ) : null}
            <WaitDaysHint
              progress={todo.progress}
              followUpDate={todo.followUpDate}
              updatedAt={todo.updatedAt}
            />
            {done && (showCompletionTime || completedStamp) ? (
              <Badge tone="success">
                完成于 {formatDateTime(completedStamp)}
              </Badge>
            ) : null}
            {todo.tags?.map(({ tag }) => (
              <Badge key={tag.name} tone="muted">
                #{tag.name}
              </Badge>
            ))}
          </div>
        </div>
        <div className="flex shrink-0 items-start gap-1">
          {editable ? (
            <button
              type="button"
              onClick={() => setEditing(true)}
              className="rounded-lg p-2 text-stone-400 transition hover:bg-stone-100 hover:text-stone-700"
              aria-label="编辑待办"
            >
              <Pencil className="h-4 w-4" />
            </button>
          ) : null}
          {!compact ? (
            <button
              type="button"
              onClick={() =>
                startTransition(async () => {
                  await deleteTodoAction(todo.id);
                })
              }
              className="rounded-lg p-2 text-stone-400 transition hover:bg-stone-100 hover:text-red-500"
              aria-label="删除待办"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          ) : null}
        </div>
      </div>
    </article>
  );
}
