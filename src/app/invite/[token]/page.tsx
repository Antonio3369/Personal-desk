import Link from "next/link";
import { getInviteForActivation } from "@/app/actions/invites";
import { InviteActivateForm } from "@/components/invite-activate-form";

function InviteInvalid({ message }: { message: string }) {
  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-md rounded-3xl border border-stone-200 bg-white p-8 shadow-sm">
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-stone-400">
          Personal Desk
        </p>
        <h1 className="mt-2 text-2xl font-semibold text-stone-900">邀请链接无效</h1>
        <p className="mt-4 text-sm leading-6 text-stone-600">{message}</p>
        <Link
          href="/login"
          className="mt-6 inline-flex rounded-xl bg-stone-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-stone-800"
        >
          返回登录
        </Link>
      </div>
    </main>
  );
}

export default async function InvitePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const invite = await getInviteForActivation(token);

  if (invite.status === "invalid") {
    return (
      <InviteInvalid message="链接已过期、已使用或不存在。请联系管理员重新获取邀请。" />
    );
  }

  if (invite.status === "used") {
    return (
      <InviteInvalid message="此邀请已激活。请直接登录。" />
    );
  }

  if (invite.status === "expired") {
    return (
      <InviteInvalid message="链接已过期。请联系管理员重新获取邀请。" />
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-md rounded-3xl border border-stone-200 bg-white p-8 shadow-sm">
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-stone-400">
          Personal Desk
        </p>
        <h1 className="mt-2 text-2xl font-semibold text-stone-900">激活你的账号</h1>
        <div className="mt-8">
          <InviteActivateForm
            token={token}
            phoneDisplay={invite.phoneDisplay}
            phoneRegion={invite.phoneRegion}
          />
        </div>
      </div>
    </main>
  );
}
