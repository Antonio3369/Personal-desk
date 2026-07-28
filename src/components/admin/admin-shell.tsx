"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { logoutAction } from "@/app/actions/auth";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/admin/users", label: "用户管理" },
  { href: "/admin/invites/new", label: "发邀请" },
];

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-[#f7f7f5]">
      <header className="border-b border-stone-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4 lg:px-8">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-stone-400">
              Personal Desk
            </p>
            <h1 className="text-lg font-semibold text-stone-900">Admin</h1>
          </div>
          <form action={logoutAction}>
            <button
              type="submit"
              className="rounded-lg px-3 py-2 text-sm text-stone-500 transition hover:bg-stone-100 hover:text-stone-900"
            >
              退出登录
            </button>
          </form>
        </div>
        <nav className="mx-auto flex max-w-5xl gap-2 px-4 pb-3 lg:px-8">
          {navItems.map((item) => {
            const active = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "rounded-lg px-3 py-2 text-sm transition",
                  active
                    ? "bg-stone-900 font-medium text-white"
                    : "text-stone-600 hover:bg-stone-100 hover:text-stone-900",
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-8 lg:px-8">{children}</main>
    </div>
  );
}
