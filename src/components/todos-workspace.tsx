"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  TodoCalendar,
  calendarDayKey,
  type CalendarTodo,
} from "@/components/todo-calendar";
import { CollapsibleSection } from "@/components/collapsible-section";
import { TodoList, type TodoItem } from "@/components/todo-list";
import { EmptyState, SectionHeader } from "@/components/ui-shell";
import {
  cn,
  completionTimestamp,
  isDueThisWeek,
  isDueToday,
  isWithinDays,
} from "@/lib/utils";
import { format } from "date-fns";

type ListView =
  | "today"
  | "week"
  | "active"
  | "waiting"
  | "global"
  | "personal"
  | "done"
  | "done-recent"
  | "done-work"
  | "done-personal";

const DONE_VIEWS = new Set<ListView>([
  "done",
  "done-recent",
  "done-work",
  "done-personal",
]);

const ACTIVE_SUB_VIEWS: { key: ListView; label: string }[] = [
  { key: "today", label: "今日" },
  { key: "week", label: "本周" },
  { key: "active", label: "全部" },
  { key: "waiting", label: "等待对方" },
  { key: "global", label: "全局任务" },
  { key: "personal", label: "个人事务" },
];

const DONE_SUB_VIEWS: { key: ListView; label: string }[] = [
  { key: "done", label: "全部" },
  { key: "done-recent", label: "近14天" },
  { key: "done-work", label: "工作" },
  { key: "done-personal", label: "个人" },
];

const ALL_VIEWS = new Set<ListView>([
  ...ACTIVE_SUB_VIEWS.map((item) => item.key),
  ...DONE_SUB_VIEWS.map((item) => item.key),
]);

const RECENT_DONE_DAYS = 14;

const LIST_TITLES: Record<ListView, string> = {
  today: "今日待办",
  week: "本周待办",
  active: "进行中的待办",
  waiting: "等待对方",
  global: "全局任务",
  personal: "个人事务",
  done: "已完成事务",
  "done-recent": "近 14 天完成",
  "done-work": "已完成 · 工作",
  "done-personal": "已完成 · 个人",
};

function sortByCompletionDesc(a: TodoItem, b: TodoItem) {
  const ta = completionTimestamp(a);
  const tb = completionTimestamp(b);
  const aTime = ta ? new Date(ta).getTime() : 0;
  const bTime = tb ? new Date(tb).getTime() : 0;
  return bTime - aTime;
}

function sortDayItems(items: TodoItem[]) {
  return items.slice().sort((a, b) => {
    if (a.progress === "done" && b.progress !== "done") return 1;
    if (a.progress !== "done" && b.progress === "done") return -1;
    if (a.progress === "done" && b.progress === "done") {
      return sortByCompletionDesc(a, b);
    }
    return 0;
  });
}

function filterDoneItems(items: TodoItem[], view: ListView) {
  const done = items.filter((item) => item.progress === "done");

  if (view === "done-recent") {
    return done.filter((item) => {
      const stamp = completionTimestamp(item);
      return stamp && isWithinDays(stamp, RECENT_DONE_DAYS);
    });
  }
  if (view === "done-work") {
    return done.filter((item) => item.scope === "work");
  }
  if (view === "done-personal") {
    return done.filter((item) => item.scope === "personal");
  }
  return done;
}

function ViewPills({
  items,
  activeKey,
  onSelect,
  getCount,
}: {
  items: { key: ListView; label: string }[];
  activeKey: ListView;
  onSelect: (key: ListView) => void;
  getCount?: (key: ListView) => number | undefined;
}) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {items.map((item) => {
        const count = getCount?.(item.key);
        return (
          <button
            key={item.key}
            type="button"
            onClick={() => onSelect(item.key)}
            className={cn(
              "shrink-0 rounded-full px-3 py-1.5 text-sm transition",
              activeKey === item.key
                ? "bg-stone-900 text-white"
                : "bg-white text-stone-600 ring-1 ring-stone-200 hover:bg-stone-50",
            )}
          >
            {item.label}
            {count ? <span className="ml-1 opacity-80">({count})</span> : null}
          </button>
        );
      })}
    </div>
  );
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
  const initialView = searchParams.get("view") as ListView | null;
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [listView, setListView] = useState<ListView>(() =>
    initialView && ALL_VIEWS.has(initialView) ? initialView : "active",
  );

  useEffect(() => {
    const view = searchParams.get("view") as ListView | null;
    const nextView = view && ALL_VIEWS.has(view) ? view : "active";
    setListView(nextView);
    if (DONE_VIEWS.has(nextView)) {
      setSelectedDay(null);
    }
  }, [searchParams]);

  const doneItems = useMemo(
    () => listItems.filter((item) => item.progress === "done"),
    [listItems],
  );

  const doneCount = doneItems.length;

  const recentlyCompleted = useMemo(
    () =>
      doneItems
        .filter((item) => {
          const stamp = completionTimestamp(item);
          return stamp && isWithinDays(stamp, RECENT_DONE_DAYS);
        })
        .slice()
        .sort(sortByCompletionDesc),
    [doneItems],
  );

  const isArchiveView = DONE_VIEWS.has(listView);

  const filteredByView = useMemo(() => {
    if (isArchiveView) {
      return filterDoneItems(listItems, listView).slice().sort(sortByCompletionDesc);
    }
    if (listView === "personal") {
      return listItems.filter(
        (item) => item.scope === "personal" && item.progress !== "done",
      );
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
  }, [isArchiveView, listItems, listView]);

  const dayItems = useMemo(() => {
    if (!selectedDay) return filteredByView;
    // Use the same day-key as TodoCalendar, and the same item set (calendarItems),
    // so clicking a cell always shows exactly what that cell displayed.
    const dayKey = format(selectedDay, "yyyy-MM-dd");
    const idsOnDay = new Set(
      calendarItems
        .filter((item) => calendarDayKey(item) === dayKey)
        .map((item) => item.id),
    );
    const fromList = listItems.filter((item) => idsOnDay.has(item.id));
    if (fromList.length === idsOnDay.size) {
      return sortDayItems(fromList);
    }
    // Fallback: hydrate any calendar-only rows missing from listItems
    const byId = new Map(listItems.map((item) => [item.id, item]));
    const merged: TodoItem[] = [];
    for (const item of calendarItems) {
      if (!idsOnDay.has(item.id)) continue;
      const full = byId.get(item.id);
      if (full) {
        merged.push(full);
      } else {
        merged.push({
          id: item.id,
          content: item.content,
          progress: item.progress,
          scope: item.scope,
          nature: null,
          followUpDate: item.followUpDate,
          completedAt: item.completedAt ?? null,
          updatedAt: item.updatedAt ?? undefined,
          city: item.city ? { id: "", name: item.city.name } : null,
        });
      }
    }
    return sortDayItems(merged);
  }, [calendarItems, filteredByView, listItems, selectedDay]);

  const showingDay = selectedDay !== null;
  const displayItems = showingDay ? dayItems : filteredByView;
  const showRecentDoneSection =
    !showingDay && !isArchiveView && recentlyCompleted.length > 0;

  const activeCount = useMemo(
    () => listItems.filter((item) => item.progress !== "done").length,
    [listItems],
  );

  function switchView(key: ListView) {
    setListView(key);
    setSelectedDay(null);
    const params = new URLSearchParams(searchParams.toString());
    if (key === "active") {
      params.delete("view");
    } else {
      params.set("view", key);
    }
    const query = params.toString();
    router.replace(query ? `/todos?${query}` : "/todos", { scroll: false });
  }

  function switchPrimaryMode(mode: "active" | "done") {
    switchView(mode === "done" ? "done" : "active");
  }

  function doneSubCount(key: ListView) {
    if (key === "done") return doneCount || undefined;
    if (key === "done-recent") return recentlyCompleted.length || undefined;
    if (key === "done-work") {
      const count = doneItems.filter((item) => item.scope === "work").length;
      return count || undefined;
    }
    if (key === "done-personal") {
      const count = doneItems.filter((item) => item.scope === "personal").length;
      return count || undefined;
    }
    return undefined;
  }

  const listTitle =
    showingDay && selectedDay
      ? `${format(selectedDay, "M月d日")} 的待办`
      : LIST_TITLES[listView];

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <SectionHeader
        title="待办"
        description={
          isArchiveView
            ? "已完成的事务会保留在这里，可按范围或时间筛选。"
            : "标记完成后不会消失，可在「已完成」里查看处理记录。"
        }
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
        {!showingDay ? (
          <div className="space-y-3 rounded-2xl border border-stone-200 bg-white p-4">
            <div className="grid grid-cols-2 gap-2 rounded-xl bg-stone-100 p-1">
              <button
                type="button"
                onClick={() => switchPrimaryMode("active")}
                className={cn(
                  "rounded-lg px-3 py-2.5 text-sm font-medium transition",
                  !isArchiveView
                    ? "bg-white text-stone-900 shadow-sm"
                    : "text-stone-500 hover:text-stone-700",
                )}
              >
                进行中
                {activeCount ? (
                  <span className="ml-1 text-stone-400">({activeCount})</span>
                ) : null}
              </button>
              <button
                type="button"
                onClick={() => switchPrimaryMode("done")}
                className={cn(
                  "rounded-lg px-3 py-2.5 text-sm font-medium transition",
                  isArchiveView
                    ? "bg-white text-stone-900 shadow-sm"
                    : "text-stone-500 hover:text-stone-700",
                )}
              >
                已完成
                {doneCount ? (
                  <span className="ml-1 text-stone-400">({doneCount})</span>
                ) : null}
              </button>
            </div>

            {isArchiveView ? (
              <ViewPills
                items={DONE_SUB_VIEWS}
                activeKey={listView}
                onSelect={switchView}
                getCount={doneSubCount}
              />
            ) : (
              <ViewPills
                items={ACTIVE_SUB_VIEWS}
                activeKey={listView}
                onSelect={switchView}
              />
            )}
          </div>
        ) : null}

        <div>
          <h3 className="text-lg font-medium text-stone-900">{listTitle}</h3>
          {showingDay ? (
            <>
              <button
                type="button"
                onClick={() => setSelectedDay(null)}
                className="mt-1 text-sm text-stone-500 hover:text-stone-700"
              >
                清除日期筛选，看列表视图
              </button>
              <p className="mt-1 text-sm text-stone-500">共 {displayItems.length} 条</p>
            </>
          ) : (
            <p className="mt-1 text-sm text-stone-500">
              {isArchiveView
                ? `共 ${displayItems.length} 条，按完成时间倒序`
                : `共 ${displayItems.length} 条`}
            </p>
          )}
        </div>

        {displayItems.length ? (
          <TodoList
            items={displayItems}
            showCompletionTime={isArchiveView || showingDay}
          />
        ) : (
          <EmptyState
            title={
              showingDay
                ? "这一天还没有待办"
                : isArchiveView
                  ? "这个范围下还没有已完成的事务"
                  : "这个视图下还没有待办"
            }
            description={
              showingDay
                ? "可在日历上选其他日期，或清除日期筛选返回列表视图。"
                : isArchiveView
                  ? "标记完成的待办会归档在「已完成」里。"
                  : "记待办时设置「下次跟进日期」，日历上就会显示。"
            }
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
                全部已完成
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
