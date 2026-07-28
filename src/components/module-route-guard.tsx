"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { canAccessPath } from "@/lib/module-access";
import type { ModuleKey } from "@/lib/modules";

export function ModuleRouteGuard({
  enabledModules,
}: {
  enabledModules: ModuleKey[];
}) {
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (!canAccessPath(pathname, enabledModules)) {
      router.replace("/");
    }
  }, [pathname, enabledModules, router]);

  return null;
}
