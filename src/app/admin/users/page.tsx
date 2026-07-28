import Link from "next/link";
import { getAdminUserRows } from "@/app/actions/admin-users";
import { UsersTable } from "@/components/admin/users-table";

export default async function AdminUsersPage() {
  const rows = await getAdminUserRows();

  return (
    <div>
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold text-stone-900">用户管理</h2>
          <p className="mt-1 text-sm text-stone-500">
            通过手机号区分用户；待激活邀请也可在此查看。
          </p>
        </div>
        <Link
          href="/admin/invites/new"
          className="shrink-0 rounded-xl bg-stone-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-stone-800"
        >
          发邀请
        </Link>
      </div>
      <UsersTable rows={rows} />
    </div>
  );
}
