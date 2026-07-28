import { LoginForm } from "@/components/login-form";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const disabledNotice = error === "disabled";

  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-md rounded-3xl border border-stone-200 bg-white p-8 shadow-sm">
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-stone-400">
          Personal Desk
        </p>
        <h1 className="mt-2 text-3xl font-semibold text-stone-900">登录</h1>
        {disabledNotice ? (
          <p className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
            账号已停用，请联系管理员。
          </p>
        ) : null}
        <div className="mt-8">
          <LoginForm />
        </div>
      </div>
    </main>
  );
}
