import Link from "next/link";
import { NoteList, type NoteItem } from "@/components/note-list";
import { CollapsibleSection } from "@/components/collapsible-section";

export function RelatedNotesSection({
  notes,
  title = "相关笔记",
  showAllHref,
}: {
  notes: NoteItem[];
  title?: string;
  showAllHref?: string;
}) {
  return (
    <CollapsibleSection
      variant="card"
      title={title}
      count={notes.length}
      defaultOpen={notes.length > 0}
      emptyHint="暂无相关笔记"
      action={
        showAllHref ? (
          <Link href={showAllHref} className="text-sm text-stone-500">
            全部
          </Link>
        ) : undefined
      }
    >
      {notes.length ? <NoteList items={notes} editable={false} /> : null}
    </CollapsibleSection>
  );
}
