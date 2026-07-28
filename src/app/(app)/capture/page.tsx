import { CaptureWorkspace } from "@/components/capture-workspace";
import { SectionHeader } from "@/components/ui-shell";
import { captureDescription } from "@/lib/capture-utils";
import { getFormOptions } from "@/lib/queries";
import { requireUserWorkspace } from "@/lib/workspace-context";
import { getWorkspaceModuleConfig } from "@/lib/workspace-modules";

export default async function CapturePage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string; scope?: string }>;
}) {
  const params = await searchParams;
  const defaultType =
    params.type ?? (params.scope === "personal" ? "personal" : "work");
  const { workspaceId } = await requireUserWorkspace();
  const [{ enabledModules }, { cities, contacts, tags }] = await Promise.all([
    getWorkspaceModuleConfig(workspaceId),
    getFormOptions(),
  ]);

  return (
    <div className="mx-auto max-w-2xl">
      <SectionHeader
        title="记录"
        description={captureDescription(defaultType)}
      />
      <div className="rounded-3xl border border-stone-200 bg-white p-5 sm:p-6">
        <CaptureWorkspace
          defaultType={defaultType}
          enabledModules={enabledModules}
          cities={cities}
          contacts={contacts}
          tagOptions={tags}
        />
      </div>
    </div>
  );
}
