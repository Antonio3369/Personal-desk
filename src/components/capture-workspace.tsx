"use client";

import { useState } from "react";
import { BookOpen, CheckSquare, Lightbulb, MessageSquare } from "lucide-react";
import { QuickCaptureForm } from "@/components/forms";
import { NoteCreateForm } from "@/components/note-forms";
import { type NoteType, type TodoScope } from "@/lib/constants";
import { cn } from "@/lib/utils";

type Option = { id: string; name: string };

const captureModes = [
  { id: "work", label: "工作待办", icon: CheckSquare, group: "todo" as const },
  {
    id: "personal",
    label: "个人事务",
    icon: CheckSquare,
    group: "todo" as const,
  },
  { id: "learning", label: "收藏学习", icon: BookOpen, group: "note" as const },
  { id: "opinion", label: "记观点", icon: MessageSquare, group: "note" as const },
  {
    id: "inspiration",
    label: "记灵感",
    icon: Lightbulb,
    group: "note" as const,
  },
];

export function CaptureWorkspace({
  defaultType = "work",
  cities,
  contacts,
  tagOptions,
}: {
  defaultType?: string;
  cities: Option[];
  contacts: Option[];
  tagOptions: string[];
}) {
  const initialMode =
    captureModes.find((mode) => mode.id === defaultType) ?? captureModes[0];
  const [activeModeId, setActiveModeId] = useState(initialMode.id);
  const activeMode =
    captureModes.find((mode) => mode.id === activeModeId) ?? captureModes[0];

  return (
    <div className="space-y-5">
      <div className="flex gap-2 overflow-x-auto pb-1">
        {captureModes.map((mode) => {
          const Icon = mode.icon;
          const active = mode.id === activeMode.id;
          return (
            <button
              key={mode.id}
              type="button"
              onClick={() => setActiveModeId(mode.id)}
              className={cn(
                "inline-flex shrink-0 items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition",
                active
                  ? "bg-teal-900 text-white"
                  : "bg-stone-100 text-stone-600 hover:bg-stone-200",
              )}
            >
              <Icon className="h-4 w-4 stroke-[1.5]" />
              {mode.label}
            </button>
          );
        })}
      </div>

      {activeMode.group === "todo" ? (
        <QuickCaptureForm
          key={activeMode.id}
          defaultScope={activeMode.id as TodoScope}
          cities={cities}
          contacts={contacts}
          tagOptions={tagOptions}
        />
      ) : (
        <NoteCreateForm
          key={activeMode.id}
          type={activeMode.id as NoteType}
          cities={cities}
          contacts={contacts}
          tagOptions={tagOptions}
          compact
        />
      )}
    </div>
  );
}
