import Link from "next/link";
import { Badge, SectionHeader } from "@/components/ui-shell";

type CityItem = {
  id: string;
  name: string;
  leaderContact: { name: string } | null;
  issues: { id: string; type: string; content: string }[];
  activeTodos: number;
  activityScore: number;
};

export function CitiesList({
  cities,
  canCreate = false,
}: {
  cities: CityItem[];
  canCreate?: boolean;
}) {
  if (!cities.length) {
    return (
      <div className="rounded-2xl border border-dashed border-stone-200 bg-stone-50 px-6 py-12 text-center">
        <p className="text-base font-medium text-stone-900">还没有城市</p>
        <p className="mt-2 text-sm text-stone-500">
          {canCreate
            ? "添加第一个城市，开始记录出差简报和待办。"
            : "当前账号暂无新增城市权限，请联系管理员开通。"}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-stone-500">
        按「进行中待办 + 未解决问题」自动排序，事情越多的城市越靠前。
      </p>
      {cities.map((city, index) => (
        <Link
          key={city.id}
          href={`/cities/${city.id}`}
          className="flex overflow-hidden rounded-2xl border border-stone-200 bg-white transition hover:border-stone-300 hover:shadow-sm"
        >
          <div className="flex w-12 shrink-0 flex-col items-center justify-center border-r border-stone-100 bg-stone-50 py-4">
            <span className="text-lg font-semibold text-stone-700">
              {index + 1}
            </span>
            {city.activityScore > 0 ? (
              <span className="mt-1 text-[10px] text-stone-400">
                {city.activityScore} 项
              </span>
            ) : null}
          </div>

          <div className="min-w-0 flex-1 p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-lg font-semibold text-stone-900">
                  {city.name}
                </h3>
                {city.leaderContact ? (
                  <p className="mt-1 text-sm text-stone-500">
                    负责人：{city.leaderContact.name}
                  </p>
                ) : null}
              </div>
              <div className="flex shrink-0 flex-col items-end gap-1">
                <Badge>{city.activeTodos} 待办</Badge>
                {city.issues.length ? (
                  <Badge tone="warning">{city.issues.length} 问题</Badge>
                ) : null}
              </div>
            </div>
            <div className="mt-3 space-y-1 text-sm leading-6 text-stone-500">
              {city.issues.length ? (
                city.issues.slice(0, 2).map((issue) => (
                  <p key={issue.id} className="truncate">
                    <span className="font-medium text-stone-700">
                      {issue.type === "team" ? "团队" : "业务"}：
                    </span>
                    {issue.content}
                  </p>
                ))
              ) : (
                <p>暂无进行中的问题</p>
              )}
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}

export function CitiesPageHeader({
  action,
}: {
  action?: React.ReactNode;
}) {
  return (
    <SectionHeader
      title="城市"
      description="自动按待办和问题的多少排序，优先显示最需要你关注的城市。"
      action={action}
    />
  );
}
