import { Suspense } from "react";
import { TodosWorkspace } from "@/components/todos-workspace";
import { getCalendarTodos, getTodos } from "@/lib/queries";

export default async function TodosPage() {
  const [calendarItems, listItems] = await Promise.all([
    getCalendarTodos(),
    getTodos(),
  ]);

  return (
    <Suspense fallback={<div className="text-sm text-stone-500">加载中...</div>}>
      <TodosWorkspace
        calendarItems={calendarItems.map((item) => ({
          id: item.id,
          content: item.content,
          progress: item.progress,
          scope: item.scope,
          followUpDate: item.followUpDate?.toISOString() ?? null,
          completedAt: item.completedAt?.toISOString() ?? null,
          updatedAt: item.updatedAt.toISOString(),
          city: item.city,
        }))}
        listItems={listItems.map((item) => ({
          ...item,
          followUpDate: item.followUpDate?.toISOString() ?? null,
          completedAt: item.completedAt?.toISOString() ?? null,
          updatedAt: item.updatedAt.toISOString(),
        }))}
      />
    </Suspense>
  );
}
