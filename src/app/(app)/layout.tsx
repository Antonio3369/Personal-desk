import { HeaderAccount } from "@/components/header-account";
import { MobileNav, Sidebar } from "@/components/ui-shell";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen lg:flex">
      <Sidebar />
      <div className="flex min-h-screen flex-1 flex-col">
        <header className="sticky top-0 z-30 border-b border-stone-200 bg-[#f7f7f5]/90 backdrop-blur">
          <div className="flex items-center justify-between px-4 py-4 lg:px-8">
            <div className="lg:hidden">
              <p className="text-xs uppercase tracking-[0.2em] text-stone-400">
                Personal Desk
              </p>
              <h1 className="text-lg font-semibold text-stone-900">Antonio</h1>
            </div>
            <HeaderAccount />
          </div>
        </header>
        <main className="flex-1 px-4 pb-24 pt-6 lg:px-8 lg:pb-8">
          {children}
        </main>
      </div>
      <MobileNav />
    </div>
  );
}
