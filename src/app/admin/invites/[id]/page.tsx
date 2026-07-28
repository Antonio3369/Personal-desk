import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getAdminInviteDetail,
  updateInviteModulesAction,
} from "@/app/actions/admin-users";
import { EditModulesForm } from "@/components/admin/edit-modules-form";
import { InviteDetailPanel } from "@/components/admin/invite-detail-panel";
import { getAppBaseUrl } from "@/lib/app-url";
import { modulesToConfig } from "@/lib/workspace-modules";

export default async function AdminInviteDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [invite, baseUrl] = await Promise.all([
    getAdminInviteDetail(id),
    getAppBaseUrl(),
  ]);

  if (!invite) {
    notFound();
  }

  const defaults = modulesToConfig(invite.modules);
  const updateAction = updateInviteModulesAction.bind(null, id);

  return (
    <div>
      <div className="mb-6">
        <Link
          href="/admin/users"
          className="text-sm text-stone-500 transition hover:text-stone-800"
        >
          ← 返回用户列表
        </Link>
        <h2 className="mt-3 text-2xl font-semibold text-stone-900">邀请详情</h2>
      </div>
      <InviteDetailPanel invite={invite} baseUrl={baseUrl} />

      {invite.status === "pending" ? (
        <section className="mt-6 max-w-2xl rounded-2xl border border-stone-200 bg-white p-6">
          <h3 className="text-sm font-medium text-stone-900">模块配置</h3>
          <div className="mt-4">
            <EditModulesForm
              action={updateAction}
              defaultEnabled={defaults.enabledModules}
              defaultCityCreate={defaults.cityPermissions.includes("create")}
              defaultCityDelete={defaults.cityPermissions.includes("delete")}
            />
          </div>
        </section>
      ) : null}
    </div>
  );
}
