import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

/**
 * GET /api/analytics/insights
 *
 * Public endpoint for reading aggregated, anonymized analytics data.
 *
 * Query patterns:
 *   ?type=wine&wineId=xxx&days=30       - wine popularity over time
 *   ?type=region&region=Bordeaux&weeks=12 - region trends
 *   ?type=grape&grape=Cabernet+Sauvignon&weeks=12 - grape trends
 *   ?type=producer&producer=Chateau+Margaux&months=6 - producer insights
 *   ?type=trending                       - top 10 trending wines/regions/grapes this week
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type");

    if (!type) {
      return Response.json(
        { error: "Missing required query parameter: type" },
        { status: 400 }
      );
    }

    switch (type) {
      case "wine":
        return await getWineInsights(searchParams);
      case "region":
        return await getRegionInsights(searchParams);
      case "grape":
        return await getGrapeInsights(searchParams);
      case "producer":
        return await getProducerInsights(searchParams);
      case "trending":
        return await getTrending();
      default:
        return Response.json(
          { error: `Unknown insight type: ${type}. Valid types: wine, region, grape, producer, trending` },
          { status: 400 }
        );
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("Insights error:", message);
    return Response.json({ error: message }, { status: 500 });
  }
}

async function getWineInsights(params: URLSearchParams) {
  const wineId = params.get("wineId");
  if (!wineId) {
    return Response.json(
      { error: "Missing required parameter: wineId" },
      { status: 400 }
    );
  }

  const days = Math.min(parseInt(params.get("days") ?? "30", 10) || 30, 365);
  const since = new Date();
  since.setUTCDate(since.getUTCDate() - days);
  since.setUTCHours(0, 0, 0, 0);

  const data = await prisma.winePopularity.findMany({
    where: {
      wineId,
      date: { gte: since },
    },
    orderBy: { date: "asc" },
    select: {
      date: true,
      views: true,
      favorites: true,
      tastings: true,
      checkIns: true,
      wishlistAdds: true,
      avgRating: true,
    },
  });

  return Response.json({ type: "wine", wineId, days, data });
}

async function getRegionInsights(params: URLSearchParams) {
  const region = params.get("region");
  if (!region) {
    return Response.json(
      { error: "Missing required parameter: region" },
      { status: 400 }
    );
  }

  const weeks = Math.min(parseInt(params.get("weeks") ?? "12", 10) || 12, 52);
  const since = new Date();
  since.setUTCDate(since.getUTCDate() - weeks * 7);
  since.setUTCHours(0, 0, 0, 0);

  const data = await prisma.regionTrend.findMany({
    where: {
      region,
      weekStart: { gte: since },
    },
    orderBy: { weekStart: "asc" },
    select: {
      weekStart: true,
      country: true,
      searches: true,
      explorations: true,
      checkIns: true,
      newWines: true,
      avgRating: true,
    },
  });

  return Response.json({ type: "region", region, weeks, data });
}

async function getGrapeInsights(params: URLSearchParams) {
  const grape = params.get("grape");
  if (!grape) {
    return Response.json(
      { error: "Missing required parameter: grape" },
      { status: 400 }
    );
  }

  const weeks = Math.min(parseInt(params.get("weeks") ?? "12", 10) || 12, 52);
  const since = new Date();
  since.setUTCDate(since.getUTCDate() - weeks * 7);
  since.setUTCHours(0, 0, 0, 0);

  const data = await prisma.grapeTrend.findMany({
    where: {
      grape,
      weekStart: { gte: since },
    },
    orderBy: { weekStart: "asc" },
    select: {
      weekStart: true,
      searches: true,
      tastings: true,
      favorites: true,
      avgRating: true,
    },
  });

  return Response.json({ type: "grape", grape, weeks, data });
}

async function getProducerInsights(params: URLSearchParams) {
  const producer = params.get("producer");
  if (!producer) {
    return Response.json(
      { error: "Missing required parameter: producer" },
      { status: 400 }
    );
  }

  const months = Math.min(
    parseInt(params.get("months") ?? "6", 10) || 6,
    24
  );
  const since = new Date();
  since.setUTCMonth(since.getUTCMonth() - months);
  since.setUTCDate(1);
  since.setUTCHours(0, 0, 0, 0);

  const data = await prisma.producerInsight.findMany({
    where: {
      producerName: producer,
      month: { gte: since },
    },
    orderBy: { month: "asc" },
    select: {
      month: true,
      followerCount: true,
      wineRatings: true,
      avgRating: true,
      checkInVolume: true,
      wishlistAdds: true,
    },
  });

  return Response.json({ type: "producer", producer, months, data });
}

async function getTrending() {
  // Get the current week's Monday
  const now = new Date();
  const day = now.getUTCDay();
  const diff = day === 0 ? 6 : day - 1;
  const weekStart = new Date(now);
  weekStart.setUTCDate(now.getUTCDate() - diff);
  weekStart.setUTCHours(0, 0, 0, 0);

  const [wines, regions, grapes] = await Promise.all([
    // Top 10 trending wines: highest total activity this week
    prisma.winePopularity.findMany({
      where: { date: { gte: weekStart } },
      orderBy: [{ views: "desc" }],
      take: 10,
      include: {
        wine: {
          select: {
            id: true,
            name: true,
            producer: true,
            region: true,
            type: true,
          },
        },
      },
    }),

    // Top 10 trending regions
    prisma.regionTrend.findMany({
      where: { weekStart },
      orderBy: [{ explorations: "desc" }],
      take: 10,
      select: {
        region: true,
        country: true,
        searches: true,
        explorations: true,
        checkIns: true,
      },
    }),

    // Top 10 trending grapes
    prisma.grapeTrend.findMany({
      where: { weekStart },
      orderBy: [{ tastings: "desc" }],
      take: 10,
      select: {
        grape: true,
        searches: true,
        tastings: true,
        favorites: true,
      },
    }),
  ]);

  const trendingWines = wines.map((w) => ({
    wineId: w.wine?.id,
    name: w.wine?.name,
    producer: w.wine?.producer,
    region: w.wine?.region,
    type: w.wine?.type,
    views: w.views,
    favorites: w.favorites,
    tastings: w.tastings,
    checkIns: w.checkIns,
    avgRating: w.avgRating,
  }));

  return Response.json({
    type: "trending",
    weekStart: weekStart.toISOString(),
    wines: trendingWines,
    regions,
    grapes,
  });
}
