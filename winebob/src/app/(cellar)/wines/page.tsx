import { getWineLibrary, getWineCountries, getWineRegionCounts } from "@/lib/actions";
import { WinesClient } from "./WinesClient";

export const dynamic = "force-dynamic";

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

  const [data, countries, regionCounts] = await Promise.all([
    getWineLibrary({ type, country, priceRange, search, page }),
    getWineCountries(),
    getWineRegionCounts(),
  ]);

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
