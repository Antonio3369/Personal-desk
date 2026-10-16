import Link from "next/link";
import type { AdminUserRow } from "@/app/actions/admin-users";

const statusStyles: Record<AdminUserRow["status"], string> = {
  active: "bg-emerald-50 text-emerald-700",
  pending: "bg-amber-50 text-amber-700",
  expired: "bg-stone-100 text-stone-600",
  disabled: "bg-red-50 text-red-700",
};

export function UsersTable({ rows }: { rows: AdminUserRow[] }) {
  if (!rows.length) {
    return (
      <div className="rounded-2xl border border-dashed border-stone-200 bg-white px-6 py-12 text-center text-sm text-stone-500">
        还没有用户。点击「发邀请」创建第一个账号。
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-stone-200 bg-white">
      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-stone-200 bg-stone-50 text-stone-500">
            <tr>
              <th className="px-4 py-3 font-medium">手机号</th>
              <th className="px-4 py-3 font-medium">显示名</th>
              <th className="px-4 py-3 font-medium">模块</th>
              <th className="px-4 py-3 font-medium">状态</th>
              <th className="px-4 py-3 font-medium">操作</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className="border-b border-stone-100 last:border-0">
                <td className="px-4 py-3 font-medium text-stone-900">
                  {row.phoneDisplay}
                </td>
                <td className="px-4 py-3 text-stone-700">{row.displayName}</td>
                <td className="px-4 py-3 text-stone-500">{row.modulesSummary}</td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${statusStyles[row.status]}`}
                  >
                    {row.statusLabel}
                  </span>
                </td>
                <td className="whitespace-nowrap px-4 py-3">
                  {row.kind === "invite" && row.inviteId ? (
                    <Link
                      href={`/admin/invites/${row.inviteId}`}
                      className="text-stone-700 underline-offset-2 hover:underline"
                    >
                      查看
                    </Link>
                  ) : row.kind === "user" && row.userId ? (
                    <div className="flex flex-col items-start gap-1.5">
                      <Link
                        href={`/admin/users/${row.userId}/edit`}
                        className="text-stone-700 underline-offset-2 hover:underline"
                      >
                        {row.status === "disabled" ? "查看" : "编辑"}
                      </Link>
                      <Link
                        href={`/admin/users/${row.userId}/edit#reset-password`}
                        className="text-stone-700 underline-offset-2 hover:underline"
                      >
                        重置密码
                      </Link>
                    </div>
                  ) : (
                    <span className="text-stone-400">—</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
