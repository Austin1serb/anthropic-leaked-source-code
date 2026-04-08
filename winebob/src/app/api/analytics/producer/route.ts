import { prisma } from "@/lib/db";
import { validateApiKey, checkPermission } from "@/lib/apiAuth";

export const dynamic = "force-dynamic";

/**
 * GET /api/analytics/producer
 *
 * Authenticated endpoint for producer-facing data products.
 * Requires a valid API key matching the requested producer.
 *
 * Query patterns:
 *   ?producer=X&type=overview    - ProducerInsight time series + funnel data (basic tier)
 *   ?producer=X&type=comparison  - Producer vs. region/category averages (basic tier)
 *   ?producer=X&type=demographics - Demographic trends for producer's wines (premium tier)
 *   ?producer=X&type=export      - CSV/JSON dump of all accessible data (premium tier)
 */
export async function GET(request: Request) {
  const apiKey = await validateApiKey(request);
  if (!apiKey) {
    return Response.json(
      { error: "Valid API key required. Include Authorization: Bearer wb_xxx header." },
      { status: 401 }
    );
  }

  const { searchParams } = new URL(request.url);
  const producer = searchParams.get("producer");
  const type = searchParams.get("type");

  if (!producer) {
    return Response.json(
      { error: "Missing required parameter: producer" },
      { status: 400 }
    );
  }

  // Verify API key matches the requested producer
  if (apiKey.producerName !== producer) {
    return Response.json(
      { error: "API key does not grant access to this producer's data" },
      { status: 403 }
    );
  }

  try {
    switch (type) {
      case "overview":
        return await getOverview(producer, searchParams);
      case "comparison":
        return await getComparison(producer, searchParams);
      case "demographics":
        return await getDemographics(producer, apiKey, searchParams);
      case "export":
        return await getExport(producer, apiKey, searchParams);
      default:
        return Response.json(
          { error: "Missing or invalid type. Valid types: overview, comparison, demographics, export" },
          { status: 400 }
        );
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("Producer API error:", message);
    return Response.json({ error: message }, { status: 500 });
  }
}

async function getOverview(producer: string, params: URLSearchParams) {
  const months = Math.min(parseInt(params.get("months") ?? "6", 10) || 6, 24);
  const since = new Date();
  since.setUTCMonth(since.getUTCMonth() - months);
  since.setUTCDate(1);
  since.setUTCHours(0, 0, 0, 0);

  const [insights, funnel, wineCount, followerCount] = await Promise.all([
    prisma.producerInsight.findMany({
      where: { producerName: producer, month: { gte: since } },
      orderBy: { month: "asc" },
    }),
    // Latest overall funnel metrics
    prisma.funnelMetric.findFirst({
      where: { segment: "" },
      orderBy: { weekStart: "desc" },
    }),
    // Total wines by this producer
    prisma.wine.count({ where: { producer } }),
    // Total followers
    prisma.producerFollow.count({ where: { producerName: producer } }),
  ]);

  return Response.json({
    type: "overview",
    producer,
    months,
    summary: {
      totalWines: wineCount,
      totalFollowers: followerCount,
    },
    insights,
    latestFunnel: funnel,
  });
}

async function getComparison(producer: string, params: URLSearchParams) {
  const months = Math.min(parseInt(params.get("months") ?? "6", 10) || 6, 24);
  const since = new Date();
  since.setUTCMonth(since.getUTCMonth() - months);
  since.setUTCDate(1);
  since.setUTCHours(0, 0, 0, 0);

  // Get the producer's region from their wines
  const producerWine = await prisma.wine.findFirst({
    where: { producer },
    select: { region: true, country: true },
  });

  const [producerData, regionData, categoryAvg] = await Promise.all([
    // Producer's own metrics
    prisma.producerInsight.findMany({
      where: { producerName: producer, month: { gte: since } },
      orderBy: { month: "asc" },
    }),
    // Region trends for the producer's region
    producerWine
      ? prisma.regionTrend.findMany({
          where: { region: producerWine.region, weekStart: { gte: since } },
          orderBy: { weekStart: "asc" },
          take: 24,
        })
      : Promise.resolve([]),
    // Average across all producers in the same region
    producerWine
      ? prisma.producerInsight.aggregate({
          where: {
            month: { gte: since },
            // Can't filter by region directly on ProducerInsight, so we compute the average across all
          },
          _avg: {
            avgRating: true,
            followerCount: true,
            wineRatings: true,
            checkInVolume: true,
            wishlistAdds: true,
          },
        })
      : Promise.resolve(null),
  ]);

  return Response.json({
    type: "comparison",
    producer,
    months,
    region: producerWine?.region ?? null,
    producerData,
    regionTrends: regionData,
    categoryAverages: categoryAvg?._avg ?? null,
  });
}

async function getDemographics(
  producer: string,
  apiKey: { tier: string; permissions: string[] },
  params: URLSearchParams
) {
  // Requires premium tier or demographics permission
  if (apiKey.tier !== "premium" && !checkPermission(apiKey as Parameters<typeof checkPermission>[0], "read:demographics")) {
    return Response.json(
      { error: "Demographic data requires a premium API key" },
      { status: 403 }
    );
  }

  const weeks = Math.min(parseInt(params.get("weeks") ?? "12", 10) || 12, 52);
  const since = new Date();
  since.setUTCDate(since.getUTCDate() - weeks * 7);
  since.setUTCHours(0, 0, 0, 0);

  // Get wine types for this producer to filter demographic data
  const producerWines = await prisma.wine.findMany({
    where: { producer },
    select: { type: true },
    distinct: ["type"],
  });
  const wineTypes = producerWines.map((w) => w.type);

  const data = await prisma.demographicWineTrend.findMany({
    where: {
      weekStart: { gte: since },
      wineType: { in: wineTypes },
    },
    orderBy: { weekStart: "asc" },
  });

  return Response.json({
    type: "demographics",
    producer,
    weeks,
    wineTypes,
    data,
  });
}

async function getExport(
  producer: string,
  apiKey: { tier: string; permissions: string[] },
  params: URLSearchParams
) {
  // Requires premium tier or export permission
  if (apiKey.tier !== "premium" && !checkPermission(apiKey as Parameters<typeof checkPermission>[0], "export:csv")) {
    return Response.json(
      { error: "Data export requires a premium API key" },
      { status: 403 }
    );
  }

  const format = params.get("format") ?? "json";
  const months = Math.min(parseInt(params.get("months") ?? "12", 10) || 12, 24);
  const since = new Date();
  since.setUTCMonth(since.getUTCMonth() - months);
  since.setUTCDate(1);
  since.setUTCHours(0, 0, 0, 0);

  const [insights, wines, followerCount] = await Promise.all([
    prisma.producerInsight.findMany({
      where: { producerName: producer, month: { gte: since } },
      orderBy: { month: "asc" },
    }),
    prisma.wine.findMany({
      where: { producer },
      select: {
        id: true,
        name: true,
        vintage: true,
        type: true,
        region: true,
        grapes: true,
        priceRange: true,
      },
    }),
    prisma.producerFollow.count({ where: { producerName: producer } }),
  ]);

  const exportData = {
    producer,
    exportedAt: new Date().toISOString(),
    months,
    summary: {
      totalWines: wines.length,
      totalFollowers: followerCount,
    },
    wines,
    monthlyInsights: insights,
  };

  if (format === "csv") {
    // Build CSV from monthly insights
    const headers = "month,followerCount,wineRatings,avgRating,checkInVolume,wishlistAdds";
    const rows = insights.map((i) =>
      `${i.month.toISOString()},${i.followerCount},${i.wineRatings},${i.avgRating ?? ""},${i.checkInVolume},${i.wishlistAdds}`
    );
    const csv = [headers, ...rows].join("\n");

    return new Response(csv, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="${producer}-insights.csv"`,
      },
    });
  }

  return Response.json(exportData);
}
