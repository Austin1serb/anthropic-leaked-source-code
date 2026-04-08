import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

/**
 * GET /api/wineries?region=Burgundy
 *
 * Returns wineries from the database, optionally filtered by region.
 * Used by the map to load real producer data instead of mock data.
 */
export async function GET(req: NextRequest) {
  try {
    const region = req.nextUrl.searchParams.get("region");
    const country = req.nextUrl.searchParams.get("country");
    const featured = req.nextUrl.searchParams.get("featured");

    const where: Record<string, unknown> = {};
    if (region) where.region = region;
    if (country) where.country = country;
    if (featured === "true") where.featured = true;

    const wineries = await prisma.winery.findMany({
      where,
      orderBy: [{ featured: "desc" }, { name: "asc" }],
    });

    // Transform to GeoJSON-compatible format for the map
    const geojson = {
      type: "FeatureCollection" as const,
      features: wineries.map((w) => ({
        type: "Feature" as const,
        properties: {
          name: w.name,
          slug: w.slug,
          description: w.description,
          region: w.region,
          country: w.country,
          featured: w.featured,
          founded: w.founded,
          owner: w.owner,
          grapeVarieties: w.grapeVarieties,
          wineStyles: w.wineStyles,
          vineyardSize: w.vineyardSize,
          annualBottles: w.annualBottles,
          verified: w.verified,
          address: w.address,
          website: w.website,
        },
        geometry: {
          type: "Point" as const,
          coordinates: [w.lng, w.lat],
        },
      })),
    };

    return NextResponse.json(geojson, {
      headers: {
        "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
      },
    });
  } catch {
    // Database unavailable — return empty collection
    return NextResponse.json(
      { type: "FeatureCollection", features: [] },
      { status: 200 }
    );
  }
}
