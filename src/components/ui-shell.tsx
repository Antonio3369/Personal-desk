"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BookOpen,
  Building2,
  CheckSquare,
  Home,
  Lightbulb,
  MessageSquare,
  Plus,
  Users,
  type LucideIcon,
} from "lucide-react";
import { filterNavModules } from "@/lib/module-access";
import { MODULE_LABELS, type ModuleKey } from "@/lib/modules";
import { cn } from "@/lib/utils";

const NAV_DEFS: Array<{
  href: string;
  moduleKey: ModuleKey;
  icon: LucideIcon;
  primary?: boolean;
}> = [
  { href: "/", moduleKey: "dashboard", icon: Home },
  { href: "/todos", moduleKey: "todos", icon: CheckSquare },
  { href: "/notes", moduleKey: "notes", icon: BookOpen },
  { href: "/cities", moduleKey: "cities", icon: Building2 },
  { href: "/contacts", moduleKey: "contacts", icon: Users },
];

export function Sidebar({
  displayName,
  enabledModules,
}: {
  displayName: string;
  enabledModules: ModuleKey[];
}) {
  const pathname = usePathname();
  const navItems = filterNavModules(NAV_DEFS, enabledModules);
  const showCapture =
    enabledModules.includes("todos") || enabledModules.includes("notes");

  return (
    <aside className="hidden lg:flex lg:w-64 lg:flex-col lg:border-r lg:border-stone-200 lg:bg-stone-50">
      <div className="border-b border-stone-200 px-6 py-5">
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-stone-400">
          Personal Desk
        </p>
        <h1 className="mt-1 text-xl font-semibold text-stone-900">{displayName}</h1>
      </div>
      <nav className="flex-1 space-y-0.5 px-3 py-4">
        {navItems.map((item) => {
          const active =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                active
                  ? "bg-teal-900 font-medium text-white shadow-sm"
                  : "text-stone-600 hover:bg-stone-100/80 hover:text-stone-900",
              )}
            >
              <Icon
                className={cn(
                  "h-4 w-4 shrink-0 stroke-[1.5]",
                  active ? "text-white/90" : "text-stone-400",
                )}
              />
              {MODULE_LABELS[item.moduleKey]}
            </Link>
          );
        })}
      </nav>
      {showCapture ? (
        <div className="border-t border-stone-200 px-3 py-4">
          <Link
            href="/capture"
            className="flex items-center justify-center gap-2 rounded-lg border border-stone-300 bg-white px-3 py-2.5 text-sm font-medium text-stone-800 transition hover:bg-stone-50"
          >
            <Plus className="h-4 w-4 stroke-[1.5]" />
            快速记录
          </Link>
        </div>
      ) : null}
    </aside>
  );
}

const MOBILE_NAV_DEFS: Array<{
  href: string;
  label: string;
  icon: LucideIcon;
  primary?: boolean;
  moduleKey?: ModuleKey;
  capture?: boolean;
}> = [
  { href: "/", label: "首页", icon: Home, moduleKey: "dashboard" },
  { href: "/todos", label: "待办", icon: CheckSquare, moduleKey: "todos" },
  { href: "/capture", label: "记录", icon: Plus, primary: true, capture: true },
  { href: "/cities", label: "城市", icon: Building2, moduleKey: "cities" },
  { href: "/contacts", label: "人脉", icon: Users, moduleKey: "contacts" },
];

function buildMobileNavItems(enabledModules: ModuleKey[]) {
  const showCapture =
    enabledModules.includes("todos") || enabledModules.includes("notes");

  const sideItems = MOBILE_NAV_DEFS.filter((item) => {
    if (item.capture) {
      return false;
    }
    if (!item.moduleKey) {
      return true;
    }
    return enabledModules.includes(item.moduleKey);
  });

  const captureItem = MOBILE_NAV_DEFS.find((item) => item.capture);
  if (!showCapture || !captureItem) {
    return sideItems;
  }

  const mid = Math.ceil(sideItems.length / 2);
  return [...sideItems.slice(0, mid), captureItem, ...sideItems.slice(mid)];
}

export function MobileNav({ enabledModules }: { enabledModules: ModuleKey[] }) {
  const pathname = usePathname();
  const mobileItems = buildMobileNavItems(enabledModules);

  if (!mobileItems.length) {
    return null;
  }

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-stone-200 bg-white/95 backdrop-blur lg:hidden">
      <div
        className="mx-auto grid px-2 py-2"
        style={{
          gridTemplateColumns: `repeat(${mobileItems.length}, minmax(0, 1fr))`,
        }}
      >
        {mobileItems.map((item) => {
          const active =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center gap-1 rounded-lg px-1 py-1 text-[11px]",
                item.primary
                  ? "text-stone-800"
                  : active
                    ? "font-medium text-teal-800"
                    : "text-stone-400",
              )}
            >
              <span
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-full",
                  item.primary
                    ? "border border-stone-300 bg-teal-900 text-white shadow-sm"
                    : active
                      ? "bg-teal-900 text-white"
                      : "text-stone-400",
                )}
              >
                <Icon className="h-4 w-4 stroke-[1.5]" />
              </span>
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

export function SectionHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight text-stone-900">
          {title}
        </h2>
        {description ? (
          <p className="mt-1 text-sm text-stone-500">{description}</p>
        ) : null}
      </div>
      {action}
    </div>
  );
}

export function EmptyState({
  title,
  description,
  icon: Icon = MessageSquare,
}: {
  title: string;
  description: string;
  icon?: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div className="rounded-2xl border border-dashed border-stone-200 bg-stone-50 px-6 py-12 text-center">
      <Icon className="mx-auto h-7 w-7 stroke-[1.5] text-stone-300" />
      <h3 className="mt-4 text-base font-medium text-stone-900">{title}</h3>
      <p className="mt-2 text-sm text-stone-500">{description}</p>
    </div>
  );
}

export function Badge({
  children,
  tone = "default",
}: {
  children: React.ReactNode;
  tone?: "default" | "active" | "warning" | "success" | "muted";
}) {
  const tones = {
    default: "bg-stone-100 text-stone-700",
    active: "bg-teal-50 text-teal-800",
    warning: "bg-amber-50 text-amber-700",
    success: "bg-emerald-50 text-emerald-700",
    muted: "bg-stone-50 text-stone-500",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium",
        tones[tone],
      )}
    >
      {children}
    </span>
  );
}

export function NotePlaceholder() {
  return (
    <div className="rounded-2xl border border-stone-200 bg-white p-6">
      <div className="flex items-center gap-3">
        <BookOpen className="h-5 w-5 stroke-[1.5] text-stone-300" />
        <Lightbulb className="h-5 w-5 stroke-[1.5] text-stone-300" />
        <MessageSquare className="h-5 w-5 stroke-[1.5] text-stone-300" />
      </div>
      <h3 className="mt-4 text-lg font-medium text-stone-900">笔记模块</h3>
      <p className="mt-2 text-sm leading-6 text-stone-500">
        学习 / 观点 / 灵感将在第 2 期接入。当前版本先聚焦待办、城市 briefing 和人脉。
      </p>
    </div>
  );
}
