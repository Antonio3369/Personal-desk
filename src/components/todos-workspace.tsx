"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { TodoCalendar, type CalendarTodo } from "@/components/todo-calendar";
import { CollapsibleSection } from "@/components/collapsible-section";
import { TodoList, type TodoItem } from "@/components/todo-list";
import { EmptyState, SectionHeader } from "@/components/ui-shell";
import {
  completionTimestamp,
  isDueThisWeek,
  isDueToday,
  isWithinDays,
} from "@/lib/utils";
import { format, isSameDay, parseISO } from "date-fns";

const listViews = [
  { key: "today", label: "今日" },
  { key: "week", label: "本周" },
  { key: "active", label: "进行中" },
  { key: "waiting", label: "等待对方" },
  { key: "global", label: "全局任务" },
  { key: "personal", label: "个人事务" },
  { key: "done", label: "已完成" },
  { key: "all", label: "全部" },
];

const RECENT_DONE_DAYS = 14;

function toDate(value: string | Date | null) {
  if (!value) return null;
  return typeof value === "string" ? parseISO(value) : value;
}

function sortByCompletionDesc(a: TodoItem, b: TodoItem) {
  const ta = completionTimestamp(a);
  const tb = completionTimestamp(b);
  const aTime = ta ? new Date(ta).getTime() : 0;
  const bTime = tb ? new Date(tb).getTime() : 0;
  return bTime - aTime;
}

export function TodosWorkspace({
  calendarItems,
  listItems,
}: {
  calendarItems: CalendarTodo[];
  listItems: TodoItem[];
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialView = searchParams.get("view");
  const [selectedDay, setSelectedDay] = useState<Date | null>(new Date());
  const [listView, setListView] = useState(() =>
    listViews.some((item) => item.key === initialView) ? initialView! : "active",
  );

  const recentlyCompleted = useMemo(
    () =>
      listItems
        .filter((item) => {
          if (item.progress !== "done") return false;
          const stamp = completionTimestamp(item);
          return stamp && isWithinDays(stamp, RECENT_DONE_DAYS);
        })
        .slice()
        .sort(sortByCompletionDesc),
    [listItems],
  );

  const filteredByView = useMemo(() => {
    if (listView === "all") {
      return listItems.slice().sort((a, b) => {
        if (a.progress === "done" && b.progress !== "done") return 1;
        if (a.progress !== "done" && b.progress === "done") return -1;
        return 0;
      });
    }
    if (listView === "done") {
      return listItems
        .filter((item) => item.progress === "done")
        .slice()
        .sort(sortByCompletionDesc);
    }
    if (listView === "personal") {
      return listItems.filter((item) => item.scope === "personal" && item.progress !== "done");
    }
    if (listView === "global") {
      return listItems.filter(
        (item) => item.scope === "work" && !item.city && item.progress !== "done",
      );
    }
    if (listView === "waiting") {
      return listItems.filter((item) => item.progress === "waiting");
    }
    if (listView === "active") {
      return listItems.filter((item) => item.progress !== "done");
    }
    if (listView === "week") {
      return listItems.filter(
        (item) =>
          item.progress !== "done" &&
          item.followUpDate &&
          isDueThisWeek(item.followUpDate),
      );
    }
    return listItems.filter((item) => {
      if (item.progress === "done") return false;
      return (
        (item.followUpDate && isDueToday(item.followUpDate)) ||
        item.progress === "waiting" ||
        item.progress === "in_progress"
      );
    });
  }, [listItems, listView]);

  const dayItems = useMemo(() => {
    if (!selectedDay) return filteredByView;
    return listItems.filter((item) => {
      const followUp = toDate(item.followUpDate);
      if (followUp && isSameDay(followUp, selectedDay)) return true;
      const completed = toDate(completionTimestamp(item));
      return completed && isSameDay(completed, selectedDay);
    });
  }, [filteredByView, listItems, selectedDay]);

  const showingDay = selectedDay !== null;
  const displayItems = showingDay ? dayItems : filteredByView;
  const showRecentDoneSection =
    !showingDay &&
    listView !== "done" &&
    listView !== "all" &&
    recentlyCompleted.length > 0;

  function switchView(key: string) {
    setListView(key);
    const params = new URLSearchParams(searchParams.toString());
    if (key === "active" || key === "today") {
      params.delete("view");
    } else {
      params.set("view", key);
    }
    const query = params.toString();
    router.replace(query ? `/todos?${query}` : "/todos", { scroll: false });
  }

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <SectionHeader
        title="待办"
        description="标记完成后不会消失，可在「最近完成」或「已完成」里查看处理记录。"
        action={
          <Link
            href="/capture"
            className="inline-flex rounded-xl bg-stone-900 px-4 py-2.5 text-sm font-medium text-white"
          >
            新增待办
          </Link>
        }
      />

      <TodoCalendar
        items={calendarItems}
        selectedDay={selectedDay}
        onSelectDay={setSelectedDay}
      />

      <section className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-lg font-medium text-stone-900">
              {showingDay && selectedDay
                ? `${format(selectedDay, "M月d日")} 的待办`
                : "待办列表"}
            </h3>
            {showingDay ? (
              <button
                type="button"
                onClick={() => setSelectedDay(null)}
                className="mt-1 text-sm text-stone-500 hover:text-stone-700"
              >
                清除日期筛选，看列表视图
              </button>
            ) : null}
          </div>
          {!showingDay ? (
            <div className="flex flex-wrap gap-2">
              {listViews.map((item) => (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => switchView(item.key)}
                  className={`rounded-full px-3 py-1.5 text-sm transition ${
                    listView === item.key
                      ? "bg-teal-900 text-white"
                      : "bg-white text-stone-600 ring-1 ring-stone-200 hover:bg-stone-50"
                  }`}
                >
                  {item.label}
                  {item.key === "done" && recentlyCompleted.length ? (
                    <span className="ml-1 opacity-80">({recentlyCompleted.length})</span>
                  ) : null}
                </button>
              ))}
            </div>
          ) : null}
        </div>

        {displayItems.length ? (
          <TodoList items={displayItems} />
        ) : (
          <EmptyState
            title={showingDay ? "这一天还没有待办" : "这个视图下还没有待办"}
            description="记待办时设置「下次跟进日期」，日历上就会显示。"
          />
        )}

        {showRecentDoneSection ? (
          <CollapsibleSection
            title="最近完成"
            description={`近 ${RECENT_DONE_DAYS} 天内处理过的事项，点击展开查看`}
            count={recentlyCompleted.length}
            defaultOpen={false}
            action={
              <button
                type="button"
                onClick={() => switchView("done")}
                className="text-sm text-stone-500 hover:text-stone-800"
              >
                查看全部
              </button>
            }
          >
            <TodoList items={recentlyCompleted} showCompletionTime />
          </CollapsibleSection>
        ) : null}
      </section>
    </div>
  );
}
