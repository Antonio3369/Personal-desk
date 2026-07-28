import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { CollapsibleSection } from "@/components/collapsible-section";
import { ContactEditor } from "@/components/contact-editor";
import { FoldableText } from "@/components/foldable-text";
import { RelatedNotesSection } from "@/components/related-notes";
import { TodoList } from "@/components/todo-list";
import { Badge, SectionHeader } from "@/components/ui-shell";
import { formatDate } from "@/lib/utils";
import { getContactById, getFormOptions } from "@/lib/queries";

export default async function ContactDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [contact, { cities }] = await Promise.all([
    getContactById(id),
    getFormOptions(),
  ]);

  if (!contact) {
    notFound();
  }

  const waitingTodos = contact.todos.filter(
    (todo) => todo.progress === "waiting",
  );
  const otherTodos = contact.todos.filter(
    (todo) => todo.progress !== "waiting",
  );
  const openTodos = [...waitingTodos, ...otherTodos];
  const identityLine = [contact.role, contact.organization]
    .filter(Boolean)
    .join(" · ");

  const briefingTodos = openTodos.slice(0, 2);
  const hasBriefingBody =
    openTodos.length > 0 ||
    Boolean(contact.interactionSummary) ||
    Boolean(contact.notes);

  return (
    <div className="mx-auto max-w-5xl space-y-4">
      <div className="sticky top-16 z-20 -mx-4 border-b border-stone-200/80 bg-[#f7f7f5]/95 px-4 py-2 backdrop-blur lg:-mx-8 lg:px-8">
        <Link
          href="/contacts"
          className="inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-sm font-semibold text-teal-900 transition hover:bg-teal-900/5"
        >
          <ChevronLeft className="h-4 w-4 stroke-[2.5]" aria-hidden />
          返回人脉
        </Link>
      </div>

      <SectionHeader
        title={contact.name}
        description="见面或来电前，先过一眼：是谁、卡在哪、上次聊到哪、要注意什么。"
      />

      <section className="min-w-0 rounded-3xl border border-stone-200 bg-white p-5 sm:p-6">
        <div className="flex flex-wrap items-center gap-2">
          {contact.relationType ? (
            <Badge tone="muted">{contact.relationType}</Badge>
          ) : null}
          {contact.city ? (
            <Link href={`/cities/${contact.city.id}`}>
              <Badge>{contact.city.name}</Badge>
            </Link>
          ) : null}
          {contact.lastInteractionAt ? (
            <span className="text-xs text-stone-400">
              最近互动 {formatDate(contact.lastInteractionAt)}
            </span>
          ) : null}
        </div>

        {identityLine ? (
          <p className="mt-3 break-words text-sm text-stone-500">
            {identityLine}
          </p>
        ) : null}

        {hasBriefingBody ? (
          <div className="mt-5 grid min-w-0 gap-4 sm:grid-cols-2">
            {openTodos.length ? (
              <BriefingBlock label="未了的事">
                <ul className="space-y-2">
                  {briefingTodos.map((todo) => (
                    <li
                      key={todo.id}
                      className="min-w-0 break-words text-sm leading-6 text-stone-700"
                    >
                      <span className="text-stone-400">
                        {todo.progress === "waiting" ? "等待 · " : ""}
                      </span>
                      <span className="line-clamp-2">{todo.content}</span>
                    </li>
                  ))}
                  {openTodos.length > 2 ? (
                    <li className="text-xs text-stone-400">
                      另有 {openTodos.length - 2} 条，见下方
                    </li>
                  ) : null}
                </ul>
              </BriefingBlock>
            ) : null}

            {contact.interactionSummary ? (
              <BriefingBlock label="上次接点">
                <FoldableText text={contact.interactionSummary} />
              </BriefingBlock>
            ) : null}

            {contact.notes ? (
              <BriefingBlock
                label="见面注意"
                className={
                  openTodos.length && contact.interactionSummary
                    ? "sm:col-span-2"
                    : undefined
                }
              >
                <FoldableText text={contact.notes} />
              </BriefingBlock>
            ) : null}
          </div>
        ) : (
          <p className="mt-4 text-sm text-stone-400">
            档案还很空。补上「上次接点」和「见面注意」，来电前会好用很多。
          </p>
        )}
      </section>

      <CollapsibleSection
        variant="card"
        title="等待对方"
        count={waitingTodos.length}
        defaultOpen={waitingTodos.length > 0}
        emptyHint="暂无等待对方的事项"
      >
        <TodoList items={waitingTodos} compact />
      </CollapsibleSection>

      <CollapsibleSection
        variant="card"
        title="其他未了待办"
        count={otherTodos.length}
        defaultOpen={otherTodos.length > 0}
        emptyHint="暂无其他未完成事项"
      >
        <TodoList items={otherTodos} compact />
      </CollapsibleSection>

      <RelatedNotesSection
        notes={contact.notes_rel}
        title="相关笔记"
        showAllHref="/notes"
      />

      <ContactEditor contact={contact} cities={cities} />
    </div>
  );
}

function BriefingBlock({
  label,
  children,
  className,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`min-w-0 overflow-hidden rounded-2xl border border-stone-100 bg-stone-50 px-4 py-3 ${className ?? ""}`}
    >
      <p className="text-xs font-medium uppercase tracking-wide text-stone-400">
        {label}
      </p>
      <div className="mt-2">{children}</div>
    </div>
  );
}
