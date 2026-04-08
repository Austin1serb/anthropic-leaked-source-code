import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const experiences = await prisma.wineExperience.findMany({
      where: { active: true },
      include: {
        winery: {
          select: { name: true, slug: true, lat: true, lng: true, region: true, country: true },
        },
      },
      orderBy: [{ featured: "desc" }, { createdAt: "desc" }],
    });

    const geojson = {
      type: "FeatureCollection" as const,
      features: experiences.map((exp) => ({
        type: "Feature" as const,
        geometry: {
          type: "Point" as const,
          coordinates: [exp.winery.lng, exp.winery.lat],
        },
        properties: {
          id: exp.id,
          title: exp.title,
          slug: exp.slug,
          type: exp.type,
          duration: exp.duration,
          maxGuests: exp.maxGuests,
          price: exp.pricePerPerson,
          currency: exp.currency,
          featured: exp.featured,
          highlights: exp.highlights,
          wineryName: exp.winery.name,
          winerySlug: exp.winery.slug,
          region: exp.winery.region,
          country: exp.winery.country,
        },
      })),
    };

    return Response.json(geojson, {
      headers: {
        "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
      },
    });
  } catch {
    return Response.json({ type: "FeatureCollection", features: [] });
  }
}
