import { Suspense } from "react";
import Link from "next/link";
import { NotesWorkspace } from "@/components/notes-workspace";
import { TagManager } from "@/components/tag-manager";
import { SectionHeader } from "@/components/ui-shell";
import { getFormOptions, getNotes, getTagsWithStats } from "@/lib/queries";
import type { NoteType } from "@/lib/constants";

export default async function NotesPage({
  searchParams,
}: {
  searchParams: Promise<{
    type?: string;
    tag?: string;
    readStatus?: string;
  }>;
}) {
  const params = await searchParams;
  const activeType = (params.type ?? "learning") as NoteType;
  const validTypes = ["learning", "opinion", "inspiration"];
  const type = validTypes.includes(activeType) ? activeType : "learning";

  const [{ cities, contacts, tags }, notes, tagStats] = await Promise.all([
    getFormOptions(),
    getNotes({
      type,
      tag: params.tag,
      readStatus: params.readStatus,
    }),
    getTagsWithStats(),
  ]);

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <SectionHeader
        title="笔记"
        description="学习收藏、观点沉淀、灵感捕获。一库三类型，用标签串联。"
        action={
          <Link
            href={`/capture?type=${type}`}
            className="inline-flex rounded-xl bg-stone-900 px-4 py-2.5 text-sm font-medium text-white"
          >
            快速记录
          </Link>
        }
      />
      <Suspense fallback={<div className="text-sm text-stone-500">加载中...</div>}>
        <NotesWorkspace
          notes={notes}
          activeType={type}
          activeTag={params.tag}
          activeReadStatus={params.readStatus}
          cities={cities}
          contacts={contacts}
          tagOptions={tags}
        />
      </Suspense>

      <Suspense fallback={null}>
        <TagManager tags={tagStats} />
      </Suspense>
    </div>
  );
}
