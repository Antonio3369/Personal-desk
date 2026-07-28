import Link from "next/link";
import { notFound } from "next/navigation";
import { CollapsibleSection } from "@/components/collapsible-section";
import { DeleteCityButton } from "@/components/delete-city-button";
import { CityEditor } from "@/components/city-editor";
import { CityIssuesPanel } from "@/components/city-issues-panel";
import { RelatedNotesSection } from "@/components/related-notes";
import { TodoList } from "@/components/todo-list";
import { Badge, SectionHeader } from "@/components/ui-shell";
import { hasCityPermission } from "@/lib/module-access";
import { getCityById } from "@/lib/queries";
import { requireUserWorkspace } from "@/lib/workspace-context";
import { getWorkspaceModuleConfig } from "@/lib/workspace-modules";

export default async function CityDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { workspaceId } = await requireUserWorkspace();
  const [{ cityPermissions }, city] = await Promise.all([
    getWorkspaceModuleConfig(workspaceId),
    getCityById(id),
  ]);
  const canDelete = hasCityPermission(cityPermissions, "delete");

  if (!city) {
    notFound();
  }

  const headerActions = [
    city.leaderLink ? (
      <a
        key="leader"
        href={city.leaderLink}
        target="_blank"
        rel="noreferrer"
        className="inline-flex rounded-xl border border-stone-200 bg-white px-4 py-2.5 text-sm text-stone-700"
      >
        打开 Leader Space
      </a>
    ) : null,
    canDelete ? (
      <DeleteCityButton key="delete" cityId={city.id} cityName={city.name} />
    ) : null,
  ].filter(Boolean);

  const deferredTodos = city.todos.filter((todo) => todo.progress === "deferred");
  const waitingTodos = city.todos.filter((todo) => todo.progress === "waiting");
  const otherTodos = city.todos.filter(
    (todo) => !["deferred", "waiting"].includes(todo.progress),
  );
  const openIssueCount = city.issues.filter((issue) => issue.status === "open")
    .length;

  return (
    <div className="mx-auto max-w-5xl space-y-4">
      <SectionHeader
        title={`${city.name} · 出差简报`}
        description={
          openIssueCount || waitingTodos.length
            ? "先看进行中的问题和待跟进；其余按需展开。"
            : "出发前过一遍：有内容的会默认展开，空的收在下面。"
        }
        action={
          headerActions.length ? (
            <div className="flex flex-wrap gap-2">{headerActions}</div>
          ) : null
        }
      />

      <CityIssuesPanel
        cityId={city.id}
        issues={city.issues.map((issue) => ({
          ...issue,
          createdAt: issue.createdAt.toISOString(),
          resolvedAt: issue.resolvedAt?.toISOString() ?? null,
        }))}
      />

      {city.notes ? (
        <section className="rounded-2xl border border-stone-200 bg-white p-5">
          <h3 className="text-base font-medium text-stone-900">近况备注</h3>
          <p className="mt-3 text-sm leading-7 text-stone-600">{city.notes}</p>
        </section>
      ) : null}

      <CollapsibleSection
        variant="card"
        title="待跟进"
        count={waitingTodos.length}
        defaultOpen={waitingTodos.length > 0}
        emptyHint="暂无等待对方的事项"
      >
        <TodoList items={waitingTodos} compact />
      </CollapsibleSection>

      <CollapsibleSection
        variant="card"
        title="待合适时机再提"
        count={deferredTodos.length}
        defaultOpen={deferredTodos.length > 0}
        emptyHint="暂无择机提起的事项"
      >
        <TodoList items={deferredTodos} compact />
      </CollapsibleSection>

      <CollapsibleSection
        variant="card"
        title="其他 open items"
        count={otherTodos.length}
        defaultOpen={otherTodos.length > 0}
        emptyHint="暂无其他未完成事项"
      >
        <TodoList items={otherTodos} compact />
      </CollapsibleSection>

      <CollapsibleSection
        variant="card"
        title="相关人脉"
        count={city.contacts.length}
        defaultOpen={city.contacts.length > 0}
        emptyHint="还没有关联人脉"
        action={
          <Link href="/contacts" className="text-sm text-stone-500">
            管理
          </Link>
        }
      >
        <div className="grid gap-3 sm:grid-cols-2">
          {city.contacts.map((contact) => (
            <Link
              key={contact.id}
              href={`/contacts/${contact.id}`}
              className="rounded-2xl border border-stone-200 bg-stone-50 p-4 transition hover:border-stone-300 hover:bg-white"
            >
              <div className="flex items-center justify-between gap-3">
                <p className="font-medium text-stone-900">{contact.name}</p>
                {contact.relationType ? (
                  <Badge tone="muted">{contact.relationType}</Badge>
                ) : null}
              </div>
              {contact.role ? (
                <p className="mt-2 text-sm text-stone-500">{contact.role}</p>
              ) : null}
              {contact.interactionSummary ? (
                <p className="mt-3 text-sm leading-6 text-stone-500">
                  {contact.interactionSummary}
                </p>
              ) : null}
            </Link>
          ))}
        </div>
      </CollapsibleSection>

      <RelatedNotesSection
        notes={city.notes_rel}
        title="相关笔记"
        showAllHref={`/notes?type=learning`}
      />

      <CollapsibleSection
        variant="card"
        title="城市设置"
        defaultOpen={false}
        emptyHint="备注与 Leader 链接"
      >
        <CityEditor city={city} />
      </CollapsibleSection>
    </div>
  );
}
