import Link from "next/link";
import { notFound } from "next/navigation";
import { DeleteCityButton } from "@/components/delete-city-button";
import { CityEditor } from "@/components/city-editor";
import { CityIssuesPanel } from "@/components/city-issues-panel";
import { RelatedNotesSection } from "@/components/related-notes";
import { TodoList } from "@/components/todo-list";
import { Badge, EmptyState, SectionHeader } from "@/components/ui-shell";
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

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <SectionHeader
        title={`${city.name} · 出差简报`}
        description="团队问题、业务问题、待跟进和待提起的事项，出发前先过一遍。"
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

      <section className="space-y-4">
        <h3 className="text-lg font-medium text-stone-900">待跟进</h3>
        {waitingTodos.length ? (
          <TodoList items={waitingTodos} compact />
        ) : (
          <EmptyState
            title="暂无等待对方的事项"
            description="比如合作方还没跟完的需求，可以设为「等待对方」。"
          />
        )}
      </section>

      <section className="space-y-4">
        <h3 className="text-lg font-medium text-stone-900">待合适时机再提</h3>
        {deferredTodos.length ? (
          <TodoList items={deferredTodos} compact />
        ) : (
          <EmptyState
            title="暂无择机提起的事项"
            description="比如到了这座城市再聊的产品或合作话题。"
          />
        )}
      </section>

      <section className="space-y-4">
        <h3 className="text-lg font-medium text-stone-900">其他 open items</h3>
        {otherTodos.length ? (
          <TodoList items={otherTodos} compact />
        ) : (
          <EmptyState title="暂无其他未完成事项" description="" />
        )}
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium text-stone-900">相关人脉</h3>
          <Link href="/contacts" className="text-sm text-stone-500">
            管理人脉
          </Link>
        </div>
        {city.contacts.length ? (
          <div className="grid gap-3 sm:grid-cols-2">
            {city.contacts.map((contact) => (
              <div
                key={contact.id}
                className="rounded-2xl border border-stone-200 bg-white p-4"
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
              </div>
            ))}
          </div>
        ) : (
          <EmptyState
            title="还没有相关人脉"
            description="可以在人脉页添加，并关联到这座城市。"
          />
        )}
      </section>

      <RelatedNotesSection
        notes={city.notes_rel}
        title="相关笔记"
        showAllHref={`/notes?type=learning`}
      />

      <CityEditor city={city} />
    </div>
  );
}
