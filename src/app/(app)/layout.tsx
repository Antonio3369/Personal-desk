import type { Metadata } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { HeaderAccount } from "@/components/header-account";
import { ModuleRouteGuard } from "@/components/module-route-guard";
import { MobileNav, Sidebar } from "@/components/ui-shell";
import { canAccessPath } from "@/lib/module-access";
import { getWorkspaceModuleConfig } from "@/lib/workspace-modules";
import { requireUserWorkspace } from "@/lib/workspace-context";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const { displayName } = await requireUserWorkspace();
  return {
    title: `${displayName} · Personal Desk`,
    description: "个人知识与业务工作台",
  };
}

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { displayName, workspaceId } = await requireUserWorkspace();
  const { enabledModules } = await getWorkspaceModuleConfig(workspaceId);
  const pathname = (await headers()).get("x-pathname") ?? "/";

  if (!canAccessPath(pathname, enabledModules)) {
    redirect("/");
  }

  return (
    <div className="min-h-screen lg:flex">
      <ModuleRouteGuard enabledModules={enabledModules} />
      <Sidebar displayName={displayName} enabledModules={enabledModules} />
      <div className="flex min-h-screen flex-1 flex-col">
        <header className="sticky top-0 z-30 border-b border-stone-200 bg-[#f7f7f5]/90 backdrop-blur">
          <div className="flex items-center justify-between px-4 py-4 lg:px-8">
            <div className="lg:hidden">
              <p className="text-xs uppercase tracking-[0.2em] text-stone-400">
                Personal Desk
              </p>
              <h1 className="text-lg font-semibold text-stone-900">
                {displayName}
              </h1>
            </div>
            <HeaderAccount />
          </div>
        </header>
        <main className="flex-1 px-4 pb-24 pt-6 lg:px-8 lg:pb-8">
          {children}
        </main>
      </div>
      <MobileNav enabledModules={enabledModules} />
    </div>
  );
}
