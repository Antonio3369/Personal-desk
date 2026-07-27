import { CitiesList, CitiesPageHeader } from "@/components/cities-list";
import { getCities } from "@/lib/queries";

export default async function CitiesPage() {
  const cities = await getCities();

  return (
    <div className="mx-auto max-w-3xl">
      <CitiesPageHeader />
      <CitiesList
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
