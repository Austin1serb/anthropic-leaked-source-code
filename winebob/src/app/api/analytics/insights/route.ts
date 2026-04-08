import { prisma } from "@/lib/db";
import { validateApiKey, rateLimitCheck, checkPermission } from "@/lib/apiAuth";

export const dynamic = "force-dynamic";

/**
 * GET /api/analytics/insights
 *
 * Public endpoint for reading aggregated, anonymized analytics data.
 * Rate-limited: 60 requests per 15 minutes per IP (public), or per API key limit (authenticated).
 *
 * Query patterns:
 *   ?type=wine&wineId=xxx&days=30       - wine popularity over time
 *   ?type=region&region=Bordeaux&weeks=12 - region trends
 *   ?type=grape&grape=Cabernet+Sauvignon&weeks=12 - grape trends
 *   ?type=producer&producer=Chateau+Margaux&months=6 - producer insights (requires API key)
 *   ?type=trending                       - top 10 trending wines/regions/grapes this week
 *   ?type=demographic&ageGroup=25-34&weeks=12 - demographic trends (premium API key required)
 *   ?type=funnel&weeks=12                - funnel metrics
 *   ?type=price&priceRange=premium&weeks=12 - price insights
 */
export async function GET(request: Request) {
  // Rate limiting by IP
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";

  // Check for API key (optional — provides higher limits and access to restricted types)
  const apiKey = await validateApiKey(request);

  if (!apiKey) {
    // Public rate limit: 60 requests per 15 minutes per IP
    if (rateLimitCheck(`insights:${ip}`, 60, 15 * 60 * 1000)) {
      return Response.json(
        { error: "Rate limit exceeded. Consider using an API key for higher limits." },
        { status: 429 }
      );
    }
  }

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
        return await getProducerInsights(searchParams, apiKey);
      case "trending":
        return await getTrending();
      case "demographic":
        return await getDemographicInsights(searchParams, apiKey);
      case "funnel":
        return await getFunnelInsights(searchParams);
      case "price":
        return await getPriceInsights(searchParams);
      default:
        return Response.json(
          { error: `Unknown insight type: ${type}. Valid types: wine, region, grape, producer, trending, demographic, funnel, price` },
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

async function getProducerInsights(
  params: URLSearchParams,
  apiKey: { producerName: string } | null
) {
  const producer = params.get("producer");
  if (!producer) {
    return Response.json(
      { error: "Missing required parameter: producer" },
      { status: 400 }
    );
  }

  // Producer insights require API key matching the producer name
  if (!apiKey || apiKey.producerName !== producer) {
    return Response.json(
      { error: "Producer insights require a valid API key for this producer" },
      { status: 403 }
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

async function getDemographicInsights(
  params: URLSearchParams,
  apiKey: { tier: string; permissions: string[] } | null
) {
  // Demographic data requires premium API key
  if (!apiKey || (apiKey.tier !== "premium" && !checkPermission(apiKey as Parameters<typeof checkPermission>[0], "read:demographics"))) {
    return Response.json(
      { error: "Demographic insights require a premium API key" },
      { status: 403 }
    );
  }

  const weeks = Math.min(parseInt(params.get("weeks") ?? "12", 10) || 12, 52);
  const since = new Date();
  since.setUTCDate(since.getUTCDate() - weeks * 7);
  since.setUTCHours(0, 0, 0, 0);

  const where: Record<string, unknown> = { weekStart: { gte: since } };
  const ageGroup = params.get("ageGroup");
  if (ageGroup) where.ageGroup = ageGroup;
  const wineType = params.get("wineType");
  if (wineType) where.wineType = wineType;
  const priceRange = params.get("priceRange");
  if (priceRange) where.priceRange = priceRange;

  const data = await prisma.demographicWineTrend.findMany({
    where,
    orderBy: { weekStart: "asc" },
    select: {
      weekStart: true,
      ageGroup: true,
      country: true,
      wineType: true,
      priceRange: true,
      viewCount: true,
      favoriteCount: true,
      tastingCount: true,
      avgRating: true,
    },
  });

  return Response.json({ type: "demographic", weeks, data });
}

async function getFunnelInsights(params: URLSearchParams) {
  const weeks = Math.min(parseInt(params.get("weeks") ?? "12", 10) || 12, 52);
  const since = new Date();
  since.setUTCDate(since.getUTCDate() - weeks * 7);
  since.setUTCHours(0, 0, 0, 0);

  const segment = params.get("segment") ?? undefined;

  const data = await prisma.funnelMetric.findMany({
    where: {
      weekStart: { gte: since },
      ...(segment !== undefined ? { segment } : {}),
    },
    orderBy: { weekStart: "asc" },
    select: {
      weekStart: true,
      segment: true,
      searchCount: true,
      viewCount: true,
      favoriteCount: true,
      tastingCount: true,
      checkinCount: true,
      wishlistCount: true,
      searchToView: true,
      viewToFavorite: true,
      favoriteToTaste: true,
      tasteToCheckin: true,
    },
  });

  return Response.json({ type: "funnel", weeks, data });
}

async function getPriceInsights(params: URLSearchParams) {
  const weeks = Math.min(parseInt(params.get("weeks") ?? "12", 10) || 12, 52);
  const since = new Date();
  since.setUTCDate(since.getUTCDate() - weeks * 7);
  since.setUTCHours(0, 0, 0, 0);

  const where: Record<string, unknown> = { weekStart: { gte: since } };
  const priceRange = params.get("priceRange");
  if (priceRange) where.priceRange = priceRange;
  const region = params.get("region");
  if (region) where.region = region;

  const data = await prisma.priceInsight.findMany({
    where,
    orderBy: { weekStart: "asc" },
    select: {
      weekStart: true,
      priceRange: true,
      region: true,
      wineType: true,
      searchVolume: true,
      viewVolume: true,
      favoriteRate: true,
      wishlistRate: true,
      avgRating: true,
    },
  });

  return Response.json({ type: "price", weeks, data });
}
