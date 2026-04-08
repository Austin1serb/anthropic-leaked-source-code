import { getWineLibrary, getWineCountries, getWineRegionCounts } from "@/lib/actions";
import { WinesClient } from "./WinesClient";

export const dynamic = "force-dynamic";

const EMPTY_DATA = { wines: [], total: 0, pages: 0, page: 1 };

export default async function WinesPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const type = typeof params.type === "string" ? params.type : undefined;
  const country = typeof params.country === "string" ? params.country : undefined;
  const priceRange = typeof params.priceRange === "string" ? params.priceRange : undefined;
  const search = typeof params.search === "string" ? params.search : undefined;
  const page = typeof params.page === "string" ? parseInt(params.page, 10) : 1;

  let data = EMPTY_DATA;
  let countries: string[] = [];
  let regionCounts: Record<string, number> = {};

  try {
    [data, countries, regionCounts] = await Promise.all([
      getWineLibrary({ type, country, priceRange, search, page }),
      getWineCountries(),
      getWineRegionCounts(),
    ]);
  } catch {
    // Database unavailable — render the map with no wine data
  }

  return (
    <WinesClient
      wines={data.wines}
      total={data.total}
      pages={data.pages}
      currentPage={data.page}
      countries={countries}
      regionCounts={regionCounts}
      activeType={type}
      activeCountry={country}
      activePriceRange={priceRange}
      activeSearch={search}
    />
  );
}
