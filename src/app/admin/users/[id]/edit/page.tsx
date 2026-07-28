import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getAdminUserForEdit,
  updateUserModulesAction,
} from "@/app/actions/admin-users";
import { EditModulesForm } from "@/components/admin/edit-modules-form";
import { ModuleConfigSummary } from "@/components/admin/module-config-summary";
import { UserStatusPanel } from "@/components/admin/user-status-panel";
import { modulesToConfig } from "@/lib/workspace-modules";

export default async function AdminEditUserPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getAdminUserForEdit(id);

  if (!user) {
    notFound();
  }

  const isDisabled = user.status === "disabled";
  const defaults = modulesToConfig(user.modules);
  const updateAction = updateUserModulesAction.bind(null, id);

  return (
    <div>
      <div className="mb-6">
        <Link
          href="/admin/users"
          className="text-sm text-stone-500 transition hover:text-stone-800"
        >
          ← 返回用户列表
        </Link>
        <h2 className="mt-3 text-2xl font-semibold text-stone-900">编辑用户</h2>
        <p className="mt-1 text-sm text-stone-500">
          {isDisabled
            ? "该用户已停用，模块配置为只读。可在此重新启用账号。"
            : "调整该用户可用的模块范围。显示名由用户自己设置，此处不可修改。"}
        </p>
      </div>

      <div className="max-w-2xl space-y-6">
        <section className="rounded-2xl border border-stone-200 bg-white p-6">
          <dl className="grid gap-4 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-stone-500">手机号</dt>
              <dd className="mt-1 font-medium text-stone-900">{user.phoneDisplay}</dd>
            </div>
            <div>
              <dt className="text-stone-500">显示名</dt>
              <dd className="mt-1 font-medium text-stone-900">{user.displayName}</dd>
            </div>
            <div>
              <dt className="text-stone-500">状态</dt>
              <dd className="mt-1 font-medium text-stone-900">
                {isDisabled ? "已停用" : "使用中"}
              </dd>
            </div>
          </dl>
        </section>

        <UserStatusPanel
          userId={user.id}
          status={isDisabled ? "disabled" : "active"}
          displayName={user.displayName}
        />

        <section className="rounded-2xl border border-stone-200 bg-white p-6">
          <h3 className="text-sm font-medium text-stone-900">模块配置</h3>
          <div className="mt-4">
            {isDisabled ? (
              <ModuleConfigSummary modules={user.modules} />
            ) : (
              <EditModulesForm
                action={updateAction}
                defaultEnabled={defaults.enabledModules}
                defaultCityCreate={defaults.cityPermissions.includes("create")}
                defaultCityDelete={defaults.cityPermissions.includes("delete")}
              />
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
