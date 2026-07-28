"use client";

import Link from "next/link";
import { CollapsibleSection } from "@/components/collapsible-section";
import { TodoList, type TodoItem } from "@/components/todo-list";

export function RecentCompletedSection({ items }: { items: TodoItem[] }) {
  if (!items.length) return null;

  return (
    <section>
      <CollapsibleSection
        title="最近完成"
        description="近 14 天内处理过的事项，点击展开查看"
        count={items.length}
        defaultOpen={false}
        bordered={false}
        action={
          <Link
            href="/todos?view=done"
            className="text-sm text-stone-500 hover:text-stone-800"
          >
            全部已完成
          </Link>
        }
      >
        <TodoList items={items} compact showCompletionTime />
      </CollapsibleSection>
    </section>
  );
}
