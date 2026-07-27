import Link from "next/link";
import { RecentCompletedSection } from "@/components/recent-completed-section";
import { TodoList } from "@/components/todo-list";
import { EmptyState, SectionHeader } from "@/components/ui-shell";
import { getDashboardData } from "@/lib/queries";

export default async function DashboardPage() {
  const { todayTodos, activeTodos, waitingTodos, contactsToReach, recentlyCompleted } =
    await getDashboardData();

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <SectionHeader
        title="首页"
        description="今日该做什么、该联系谁、最近处理过什么。"
      />

      <section className="grid gap-4 md:grid-cols-3">
        <StatCard label="今日待办" value={todayTodos.length} href="/todos?view=today" />
        <StatCard label="进行中" value={activeTodos.length} href="/todos?view=active" />
        <StatCard label="等待对方" value={waitingTodos.length} href="/todos?view=waiting" />
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-stone-900">进行中的待办</h3>
            <Link href="/todos?view=active" className="text-sm text-stone-500">
              查看全部
            </Link>
          </div>
          {activeTodos.length ? (
            <TodoList
              items={activeTodos.map((item) => ({
                ...item,
                followUpDate: item.followUpDate?.toISOString() ?? null,
                completedAt: item.completedAt?.toISOString() ?? null,
                updatedAt: item.updatedAt.toISOString(),
              }))}
              compact
            />
          ) : (
            <EmptyState
              title="暂无进行中的待办"
              description="点底部「记录」添加；手机与电脑共用同一份数据，刷新即可同步。"
            />
          )}
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-medium text-stone-900">该联系的人</h3>
          {contactsToReach.length ? (
            <div className="space-y-3">
              {contactsToReach.map((contact) => (
                <div
                  key={contact.id}
                  className="rounded-2xl border border-stone-200 bg-white p-4"
                >
                  <p className="font-medium text-stone-900">{contact.name}</p>
                  {contact.interactionSummary ? (
                    <p className="mt-2 text-sm leading-6 text-stone-500">
                      {contact.interactionSummary}
                    </p>
                  ) : null}
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              title="暂无需要联系的人"
              description="当待办进入「等待对方」且到了跟进日期，这里会自动出现。"
            />
          )}
        </div>
      </section>

      <RecentCompletedSection
        items={recentlyCompleted.map((item) => ({
          ...item,
          followUpDate: item.followUpDate?.toISOString() ?? null,
          completedAt: item.completedAt?.toISOString() ?? null,
          updatedAt: item.updatedAt.toISOString(),
        }))}
      />

    </div>
  );
}

function StatCard({
  label,
  value,
  href,
}: {
  label: string;
  value: number;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="rounded-2xl border border-stone-200 bg-white p-5 transition hover:border-stone-300 hover:shadow-sm"
    >
      <p className="text-sm text-stone-500">{label}</p>
      <p className="mt-2 text-3xl font-semibold text-stone-900">{value}</p>
    </Link>
  );
}
