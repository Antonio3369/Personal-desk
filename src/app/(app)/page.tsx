import Link from "next/link";
import { RecentCompletedSection } from "@/components/recent-completed-section";
import { TodoList } from "@/components/todo-list";
import { EmptyState, SectionHeader } from "@/components/ui-shell";
import { isModuleEnabled } from "@/lib/module-access";
import type { ModuleKey } from "@/lib/modules";
import { getDashboardData } from "@/lib/queries";
import { requireUserWorkspace } from "@/lib/workspace-context";
import { getWorkspaceModuleConfig } from "@/lib/workspace-modules";

export default async function DashboardPage() {
  const { workspaceId } = await requireUserWorkspace();
  const [{ enabledModules }, dashboardData] = await Promise.all([
    getWorkspaceModuleConfig(workspaceId),
    getDashboardData(),
  ]);
  const { todayTodos, activeTodos, waitingTodos, contactsToReach, recentlyCompleted, completedCount } =
    dashboardData;

  const showTodos = isModuleEnabled(enabledModules, "todos");
  const showContacts = isModuleEnabled(enabledModules, "contacts");

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <SectionHeader
        title="首页"
        description="今日该做什么、该联系谁、最近处理过什么。"
      />

      {showTodos ? (
        <section className="grid gap-4 sm:grid-cols-2 md:grid-cols-4">
          <StatCard label="今日待办" value={todayTodos.length} href="/todos?view=today" />
          <StatCard label="进行中" value={activeTodos.length} href="/todos?view=active" />
          <StatCard label="等待对方" value={waitingTodos.length} href="/todos?view=waiting" />
          <StatCard label="已完成" value={completedCount} href="/todos?view=done" />
        </section>
      ) : null}

      <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        {showTodos ? (
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
        ) : (
          <DashboardModuleHint enabledModules={enabledModules} />
        )}

        {showContacts ? (
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
        ) : null}
      </section>

      {showTodos ? (
        <RecentCompletedSection
          items={recentlyCompleted.map((item) => ({
            ...item,
            followUpDate: item.followUpDate?.toISOString() ?? null,
            completedAt: item.completedAt?.toISOString() ?? null,
            updatedAt: item.updatedAt.toISOString(),
          }))}
        />
      ) : null}
    </div>
  );
}

function DashboardModuleHint({ enabledModules }: { enabledModules: ModuleKey[] }) {
  const hints = [
    isModuleEnabled(enabledModules, "notes") ? "笔记" : null,
    isModuleEnabled(enabledModules, "cities") ? "城市" : null,
    isModuleEnabled(enabledModules, "contacts") ? "人脉" : null,
  ].filter(Boolean);

  return (
    <EmptyState
      title="待办模块未启用"
      description={
        hints.length
          ? `你可以从侧栏进入${hints.join("、")}等已开通模块。`
          : "当前账号仅开通了首页，如需更多模块请联系管理员。"
      }
    />
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
