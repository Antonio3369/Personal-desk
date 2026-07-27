import Link from "next/link";
import { NoteList, type NoteItem } from "@/components/note-list";
import { EmptyState } from "@/components/ui-shell";

export function RelatedNotesSection({
  notes,
  title = "相关笔记",
  showAllHref,
}: {
  notes: NoteItem[];
  title?: string;
  showAllHref?: string;
}) {
  if (!notes.length) {
    return (
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium text-stone-900">{title}</h3>
          {showAllHref ? (
            <Link href={showAllHref} className="text-sm text-stone-500">
              查看全部
            </Link>
          ) : null}
        </div>
        <EmptyState
          title="暂无相关笔记"
          description="学习、观点或灵感可以关联到城市或人脉，方便追溯背景。"
        />
      </section>
    );
  }

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-stone-900">{title}</h3>
        {showAllHref ? (
          <Link href={showAllHref} className="text-sm text-stone-500">
            查看全部
          </Link>
        ) : null}
      </div>
      <NoteList items={notes} editable={false} />
    </section>
  );
}
