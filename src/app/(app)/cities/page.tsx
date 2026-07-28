import { CitiesList, CitiesPageHeader } from "@/components/cities-list";
import { CreateCityForm } from "@/components/create-city-form";
import { hasCityPermission } from "@/lib/module-access";
import { getCities } from "@/lib/queries";
import { requireUserWorkspace } from "@/lib/workspace-context";
import { getWorkspaceModuleConfig } from "@/lib/workspace-modules";

export default async function CitiesPage() {
  const { workspaceId } = await requireUserWorkspace();
  const [{ cityPermissions }, cities] = await Promise.all([
    getWorkspaceModuleConfig(workspaceId),
    getCities(),
  ]);
  const canCreate = hasCityPermission(cityPermissions, "create");

  return (
    <div className="mx-auto max-w-3xl">
      <CitiesPageHeader
        action={canCreate ? <CreateCityForm compact /> : undefined}
      />
      {!cities.length && canCreate ? (
        <section className="mb-6 rounded-2xl border border-stone-200 bg-white p-5">
          <h3 className="text-base font-medium text-stone-900">添加城市</h3>
          <div className="mt-4">
            <CreateCityForm />
          </div>
        </section>
      ) : null}
      <CitiesList
        canCreate={canCreate}
        cities={cities.map((city) => ({
          id: city.id,
          name: city.name,
          leaderContact: city.leaderContact,
          issues: city.issues,
          activeTodos: city.activeTodos,
          activityScore: city.activityScore,
        }))}
      />
    </div>
  );
}
