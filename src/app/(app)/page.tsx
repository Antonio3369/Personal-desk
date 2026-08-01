import Link from "next/link";
import { BookOpen, ChevronRight } from "lucide-react";
import { RecentCompletedSection } from "@/components/recent-completed-section";
import { ContactWarmthHint } from "@/components/follow-up-hint";
import { TodoList, type TodoItem } from "@/components/todo-list";
import { EmptyState, SectionHeader } from "@/components/ui-shell";
import { isModuleEnabled } from "@/lib/module-access";
import type { ModuleKey } from "@/lib/modules";
import { getDashboardData } from "@/lib/queries";
import { requireUserWorkspace } from "@/lib/workspace-context";
import { getWorkspaceModuleConfig } from "@/lib/workspace-modules";
import { cn } from "@/lib/utils";

type DashboardTodo = Awaited<ReturnType<typeof getDashboardData>>["activeTodos"][number];

function serializeTodo(item: DashboardTodo): TodoItem {
  return {
    ...item,
    followUpDate: item.followUpDate?.toISOString() ?? null,
    completedAt: item.completedAt?.toISOString() ?? null,
    updatedAt: item.updatedAt.toISOString(),
  };
}

export default async function DashboardPage() {
  const { workspaceId } = await requireUserWorkspace();
  const [{ enabledModules }, dashboardData] = await Promise.all([
    getWorkspaceModuleConfig(workspaceId),
    getDashboardData(),
  ]);
  const {
    todayTodos,
    activeTodos,
    waitingTodos,
    contactsToReach,
    recentlyCompleted,
    completedCount,
    todayFocusTodos,
  } = dashboardData;

  const showTodos = isModuleEnabled(enabledModules, "todos");
  const showContacts = isModuleEnabled(enabledModules, "contacts");
  const mobileContacts = contactsToReach.slice(0, 3);

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <SectionHeader
        title="首页"
        description="今日该做什么、该联系谁、最近处理过什么。"
      />

      {showTodos ? (
        <StatCards
          todayCount={todayTodos.length}
          activeCount={activeTodos.length}
          waitingCount={waitingTodos.length}
          completedCount={completedCount}
        />
      ) : null}

      <div className="hidden lg:block">
        <DesktopDashboard
          showTodos={showTodos}
          showContacts={showContacts}
          enabledModules={enabledModules}
          activeTodos={activeTodos}
          contactsToReach={contactsToReach}
          recentlyCompleted={recentlyCompleted}
        />
      </div>

      <div className="space-y-6 lg:hidden">
        <MobileDashboard
          showTodos={showTodos}
          showContacts={showContacts}
          enabledModules={enabledModules}
          todayFocusTodos={todayFocusTodos}
          mobileContacts={mobileContacts}
        />
      </div>
    </div>
  );
}

function StatCards({
  todayCount,
  activeCount,
  waitingCount,
  completedCount,
}: {
  todayCount: number;
  activeCount: number;
  waitingCount: number;
  completedCount: number;
}) {
  return (
    <section className="grid grid-cols-2 gap-4 md:grid-cols-4">
      <StatCard label="今日待办" value={todayCount} href="/todos?view=today" tone="default" />
      <StatCard label="进行中" value={activeCount} href="/todos?view=active" tone="active" />
      <StatCard label="等待对方" value={waitingCount} href="/todos?view=waiting" tone="waiting" />
      <StatCard label="已完成" value={completedCount} href="/todos?view=done" tone="done" />
    </section>
  );
}

function DesktopDashboard({
  showTodos,
  showContacts,
  enabledModules,
  activeTodos,
  contactsToReach,
  recentlyCompleted,
}: {
  showTodos: boolean;
  showContacts: boolean;
  enabledModules: ModuleKey[];
  activeTodos: DashboardTodo[];
  contactsToReach: Awaited<ReturnType<typeof getDashboardData>>["contactsToReach"];
  recentlyCompleted: DashboardTodo[];
}) {
  return (
    <>
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
              <TodoList items={activeTodos.map(serializeTodo)} compact />
            ) : (
              <EmptyState
                title="暂无进行中的待办"
                description="点侧栏「快速记录」添加；手机可用底部「记录」。"
              />
            )}
          </div>
        ) : (
          <DashboardModuleHint enabledModules={enabledModules} />
        )}

        {showContacts ? (
          <ContactsPanel contacts={contactsToReach} />
        ) : null}
      </section>

      {showTodos ? (
        <RecentCompletedSection items={recentlyCompleted.map(serializeTodo)} />
      ) : null}
    </>
  );
}

function MobileDashboard({
  showTodos,
  showContacts,
  enabledModules,
  todayFocusTodos,
  mobileContacts,
}: {
  showTodos: boolean;
  showContacts: boolean;
  enabledModules: ModuleKey[];
  todayFocusTodos: DashboardTodo[];
  mobileContacts: Awaited<ReturnType<typeof getDashboardData>>["contactsToReach"];
}) {
  return (
    <>
      {showTodos ? (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-stone-900">今日聚焦</h3>
            <Link href="/todos?view=today" className="text-sm text-stone-500">
              查看全部
            </Link>
          </div>
          {todayFocusTodos.length ? (
            <TodoList items={todayFocusTodos.map(serializeTodo)} compact />
          ) : (
            <EmptyState
              title="今天暂无聚焦事项"
              description="点底部「记录」快速添加待办；逾期和等待对方会优先出现在这里。"
            />
          )}
        </section>
      ) : (
        <DashboardModuleHint enabledModules={enabledModules} />
      )}

      {showContacts ? (
        <ContactsPanel contacts={mobileContacts} />
      ) : null}

      <MobileMoreSection enabledModules={enabledModules} />
    </>
  );
}

function MobileMoreSection({ enabledModules }: { enabledModules: ModuleKey[] }) {
  if (!isModuleEnabled(enabledModules, "notes")) {
    return null;
  }

  return (
    <section className="space-y-4">
      <h3 className="text-lg font-medium text-stone-900">更多</h3>
      <Link
        href="/notes"
        className="card-surface flex items-center gap-3 p-4 hover:border-stone-300 hover:bg-stone-50"
      >
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-stone-100 text-stone-600">
          <BookOpen className="h-5 w-5 stroke-[1.5]" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block font-medium text-stone-900">笔记</span>
          <span className="mt-0.5 block text-xs text-stone-500">
            学习 / 观点 / 灵感
          </span>
        </span>
        <ChevronRight className="h-4 w-4 shrink-0 text-stone-300" />
      </Link>
    </section>
  );
}

function ContactsPanel({
  contacts,
}: {
  contacts: Awaited<ReturnType<typeof getDashboardData>>["contactsToReach"];
}) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium text-stone-900">该联系的人</h3>
      {contacts.length ? (
        <div className="space-y-3">
          {contacts.map((contact) => (
            <Link
              key={contact.id}
              href={`/contacts/${contact.id}`}
              className="card-surface block p-4 hover:border-stone-300 hover:bg-stone-50"
            >
              <p className="font-medium text-stone-900">{contact.name}</p>
              <ContactWarmthHint
                lastInteractionAt={contact.lastInteractionAt}
                className="mt-2 block"
              />
              {contact.interactionSummary ? (
                <p className="mt-2 text-sm leading-6 text-stone-500">
                  {contact.interactionSummary}
                </p>
              ) : null}
            </Link>
          ))}
        </div>
      ) : (
        <EmptyState
          title="暂无需要联系的人"
          description="当待办进入「等待对方」且到了跟进日期，这里会自动出现。"
        />
      )}
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
  tone = "default",
}: {
  label: string;
  value: number;
  href: string;
  tone?: "default" | "active" | "waiting" | "done";
}) {
  const valueTone = {
    default: "text-stone-900",
    active: "text-teal-800",
    waiting: "text-amber-700",
    done: "text-emerald-700",
  }[tone];

  return (
    <Link href={href} className="card-surface block p-5 hover:border-stone-300">
      <p className="text-sm text-stone-500">{label}</p>
      <p className={cn("mt-2 text-3xl font-semibold", valueTone)}>{value}</p>
    </Link>
  );
}
