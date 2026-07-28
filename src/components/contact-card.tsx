import type { ContactListItem } from "@/components/contacts-workspace";
import { Badge } from "@/components/ui-shell";
import Link from "next/link";
import { ChevronRight } from "lucide-react";

export type { ContactListItem };

export function ContactCard({
  contact,
  hideCity = false,
}: {
  contact: ContactListItem;
  hideCity?: boolean;
}) {
  const subtitle = [contact.role, contact.organization]
    .filter(Boolean)
    .join(" · ");

  return (
    <Link
      href={`/contacts/${contact.id}`}
      className="block rounded-2xl border border-stone-200 bg-white p-5 transition hover:border-stone-300 hover:bg-stone-50"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-base font-medium text-stone-900">
              {contact.name}
            </h3>
            {contact.relationType ? (
              <Badge tone="muted">{contact.relationType}</Badge>
            ) : null}
            {!hideCity && contact.city ? (
              <Badge>{contact.city.name}</Badge>
            ) : null}
          </div>
          {subtitle ? (
            <p className="mt-2 text-sm text-stone-500">{subtitle}</p>
          ) : null}
          {contact.interactionSummary ? (
            <p className="mt-3 line-clamp-2 break-words text-sm leading-6 text-stone-600">
              {contact.interactionSummary}
            </p>
          ) : null}
          <p className="mt-3 text-xs text-stone-400">
            未了待办 {contact._count.todos} 条
            {contact._count.notes_rel
              ? ` · 笔记 ${contact._count.notes_rel} 条`
              : ""}
          </p>
        </div>
        <ChevronRight className="mt-1 h-4 w-4 shrink-0 text-stone-300" />
      </div>
    </Link>
  );
}
