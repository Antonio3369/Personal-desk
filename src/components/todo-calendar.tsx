"use client";

import { useMemo, useState } from "react";
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  isToday,
  parseISO,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import { zhCN } from "date-fns/locale";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export type CalendarTodo = {
  id: string;
  content: string;
  progress: string;
  scope: string;
  followUpDate: string | Date | null;
  city?: { name: string } | null;
};

function toDate(value: string | Date | null) {
  if (!value) return null;
  return typeof value === "string" ? parseISO(value) : value;
}

export function TodoCalendar({
  items,
  selectedDay,
  onSelectDay,
}: {
  items: CalendarTodo[];
  selectedDay?: Date | null;
  onSelectDay?: (day: Date | null) => void;
}) {
  const [month, setMonth] = useState(() => startOfMonth(new Date()));
  const [internalSelected, setInternalSelected] = useState<Date | null>(
    new Date(),
  );
  const selected = selectedDay !== undefined ? selectedDay : internalSelected;

  function selectDay(day: Date) {
    if (onSelectDay) {
      onSelectDay(day);
    } else {
      setInternalSelected(day);
    }
  }

  const monthStart = startOfMonth(month);
  const monthEnd = endOfMonth(month);
  const gridStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const gridEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const days = eachDayOfInterval({ start: gridStart, end: gridEnd });

  const todosByDay = useMemo(() => {
    const map = new Map<string, CalendarTodo[]>();
    for (const todo of items) {
      const date = toDate(todo.followUpDate);
      if (!date) continue;
      const key = format(date, "yyyy-MM-dd");
      const list = map.get(key) ?? [];
      list.push(todo);
      map.set(key, list);
    }
    return map;
  }, [items]);

  const monthCount = items.filter((item) => {
    const date = toDate(item.followUpDate);
    return date && isSameMonth(date, month);
  }).length;

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 rounded-2xl border border-stone-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setMonth((current) => addMonths(current, -1))}
            className="rounded-lg border border-stone-200 p-2 hover:bg-stone-50"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <div>
            <h3 className="text-lg font-medium text-stone-900">
              {format(month, "yyyy年M月", { locale: zhCN })}
            </h3>
            <p className="text-sm text-stone-500">本月 {monthCount} 条有跟进日期</p>
          </div>
          <button
            type="button"
            onClick={() => setMonth((current) => addMonths(current, 1))}
            className="rounded-lg border border-stone-200 p-2 hover:bg-stone-50"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
        <button
          type="button"
          onClick={() => {
            setMonth(startOfMonth(new Date()));
            selectDay(new Date());
          }}
          className="rounded-xl border border-stone-200 px-4 py-2 text-sm text-stone-700 hover:bg-stone-50"
        >
          回到今天
        </button>
      </div>

      <div className="overflow-hidden rounded-2xl border border-stone-200 bg-white">
        <div className="grid grid-cols-7 border-b border-stone-200 bg-stone-50 text-center text-xs font-medium text-stone-500">
          {["一", "二", "三", "四", "五", "六", "日"].map((label) => (
            <div key={label} className="px-2 py-3">
              {label}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {days.map((day) => {
            const key = format(day, "yyyy-MM-dd");
            const dayTodos = todosByDay.get(key) ?? [];
            const inMonth = isSameMonth(day, month);
            const isSelected = selected ? isSameDay(day, selected) : false;
            const hasTodos = dayTodos.length > 0;

            return (
              <button
                key={key}
                type="button"
                onClick={() => selectDay(day)}
                className={cn(
                  "min-h-20 border-b border-r border-stone-100 p-2 text-left transition hover:bg-stone-50 sm:min-h-24",
                  !inMonth && "bg-stone-50/60 text-stone-400",
                  isSelected && "bg-stone-900/5 ring-1 ring-inset ring-stone-300",
                  hasTodos && !isSelected && "bg-amber-50/40",
                )}
              >
                <div className="flex items-center justify-between">
                  <span
                    className={cn(
                      "inline-flex h-7 w-7 items-center justify-center rounded-full text-sm",
                      isToday(day) && "bg-stone-900 text-white",
                    )}
                  >
                    {format(day, "d")}
                  </span>
                  {hasTodos ? (
                    <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-medium text-amber-700">
                      {dayTodos.length}
                    </span>
                  ) : null}
                </div>
                <div className="mt-2 hidden space-y-1 sm:block">
                  {dayTodos.slice(0, 2).map((todo) => (
                    <p
                      key={todo.id}
                      className="truncate text-[11px] leading-4 text-stone-600"
                    >
                      {todo.content}
                    </p>
                  ))}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
