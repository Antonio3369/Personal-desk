import Link from "next/link";
import { InviteForm } from "@/components/admin/invite-form";

export default function AdminNewInvitePage() {
  return (
    <div>
      <div className="mb-6">
        <Link
          href="/admin/users"
          className="text-sm text-stone-500 transition hover:text-stone-800"
        >
          ← 返回用户列表
        </Link>
        <h2 className="mt-3 text-2xl font-semibold text-stone-900">发邀请</h2>
        <p className="mt-1 text-sm text-stone-500">
          为新用户创建独立账号。邀请链接一次性有效，默认 7 天过期。
        </p>
      </div>
      <div className="max-w-2xl rounded-2xl border border-stone-200 bg-white p-6">
        <InviteForm />
      </div>
    </div>
  );
}
