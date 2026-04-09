import { getMapWineries, getWineRegionCounts } from "@/lib/actions";
import ExploreClient from "./ExploreClient";

export const dynamic = "force-dynamic";

export default async function ExplorePage() {
  let wineries: Awaited<ReturnType<typeof getMapWineries>> = [];
  let regionCounts: Record<string, number> = {};

  try {
    [wineries, regionCounts] = await Promise.all([
      getMapWineries(),
      getWineRegionCounts(),
    ]);
  } catch {
    // Database unavailable — client will fall back to mockWineries
  }

  // Map DB Winery records to the shape WineRegionMap expects
  const mapped = wineries.map((w) => ({
    name: w.name,
    slug: w.slug,
    description: w.description ?? "",
    founded: w.founded ?? 0,
    owner: w.owner ?? "",
    region: w.region,
    country: w.country,
    lat: w.lat,
    lng: w.lng,
    grapeVarieties: w.grapeVarieties,
    wineStyles: w.wineStyles,
    featured: w.featured,
    vineyardSize: w.vineyardSize ?? "",
    annualBottles: w.annualBottles ?? 0,
  }));

  return (
    <ExploreClient
      wineries={mapped.length > 0 ? mapped : undefined}
      regionCounts={regionCounts}
    />
  );
}
