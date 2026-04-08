import { prisma } from "@/lib/db";

/**
 * Aggregate wine popularity for a given date (YYYY-MM-DD).
 * Counts wine_view, wine_favorite, wine_taste, wine_checkin, wine_wishlist
 * events per wineId for the given date. Upserts on the unique [wineId, date] constraint.
 * Returns the count of rows upserted.
 */
export async function aggregateWinePopularity(date: Date): Promise<number> {
  const dayStart = new Date(date);
  dayStart.setUTCHours(0, 0, 0, 0);
  const dayEnd = new Date(dayStart);
  dayEnd.setUTCDate(dayEnd.getUTCDate() + 1);

  const eventTypes = [
    "wine_view",
    "wine_favorite",
    "wine_taste",
    "wine_checkin",
    "wine_wishlist",
  ] as const;

  const grouped = await prisma.wineEvent.groupBy({
    by: ["wineId", "eventType"],
    where: {
      createdAt: { gte: dayStart, lt: dayEnd },
      eventType: { in: [...eventTypes] },
      wineId: { not: null },
    },
    _count: { id: true },
  });

  // Pivot into per-wine counts
  const wineMap = new Map<
    string,
    {
      views: number;
      favorites: number;
      tastings: number;
      checkIns: number;
      wishlistAdds: number;
    }
  >();

  for (const row of grouped) {
    const wineId = row.wineId!;
    if (!wineMap.has(wineId)) {
      wineMap.set(wineId, {
        views: 0,
        favorites: 0,
        tastings: 0,
        checkIns: 0,
        wishlistAdds: 0,
      });
    }
    const entry = wineMap.get(wineId)!;
    switch (row.eventType) {
      case "wine_view":
        entry.views = row._count.id;
        break;
      case "wine_favorite":
        entry.favorites = row._count.id;
        break;
      case "wine_taste":
        entry.tastings = row._count.id;
        break;
      case "wine_checkin":
        entry.checkIns = row._count.id;
        break;
      case "wine_wishlist":
        entry.wishlistAdds = row._count.id;
        break;
    }
  }

  // Compute avg rating from wine_taste events that have a rating in metadata
  const tasteEvents = await prisma.wineEvent.findMany({
    where: {
      createdAt: { gte: dayStart, lt: dayEnd },
      eventType: "wine_taste",
      wineId: { not: null },
    },
    select: { wineId: true, metadata: true },
  });

  const ratingMap = new Map<string, { sum: number; count: number }>();
  for (const evt of tasteEvents) {
    if (!evt.wineId) continue;
    const meta = evt.metadata as Record<string, unknown> | null;
    const rating = meta?.rating;
    if (typeof rating === "number") {
      const entry = ratingMap.get(evt.wineId) ?? { sum: 0, count: 0 };
      entry.sum += rating;
      entry.count += 1;
      ratingMap.set(evt.wineId, entry);
    }
  }

  let upserted = 0;
  for (const [wineId, counts] of wineMap) {
    const ratingEntry = ratingMap.get(wineId);
    const avgRating = ratingEntry
      ? ratingEntry.sum / ratingEntry.count
      : null;

    await prisma.winePopularity.upsert({
      where: { wineId_date: { wineId, date: dayStart } },
      create: {
        wineId,
        date: dayStart,
        views: counts.views,
        favorites: counts.favorites,
        tastings: counts.tastings,
        checkIns: counts.checkIns,
        wishlistAdds: counts.wishlistAdds,
        avgRating,
      },
      update: {
        views: counts.views,
        favorites: counts.favorites,
        tastings: counts.tastings,
        checkIns: counts.checkIns,
        wishlistAdds: counts.wishlistAdds,
        avgRating,
      },
    });
    upserted++;
  }

  return upserted;
}

/**
 * Aggregate region trends for a given week (starting Monday).
 * Counts region_explore and wine_checkin events per region for the week.
 * Upserts on [region, weekStart].
 * Returns the count of rows upserted.
 */
export async function aggregateRegionTrends(
  weekStart: Date
): Promise<number> {
  const start = new Date(weekStart);
  start.setUTCHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + 7);

  // region_explore events: region is in metadata.region
  const exploreEvents = await prisma.wineEvent.findMany({
    where: {
      createdAt: { gte: start, lt: end },
      eventType: "region_explore",
    },
    select: { metadata: true },
  });

  const regionMap = new Map<
    string,
    {
      country: string;
      searches: number;
      explorations: number;
      checkIns: number;
      newWines: number;
    }
  >();

  for (const evt of exploreEvents) {
    const meta = evt.metadata as Record<string, unknown> | null;
    const region = meta?.region as string | undefined;
    const country = (meta?.country as string) ?? "Unknown";
    if (!region) continue;
    if (!regionMap.has(region)) {
      regionMap.set(region, {
        country,
        searches: 0,
        explorations: 0,
        checkIns: 0,
        newWines: 0,
      });
    }
    regionMap.get(region)!.explorations++;
  }

  // wine_search events with region in metadata
  const searchEvents = await prisma.wineEvent.findMany({
    where: {
      createdAt: { gte: start, lt: end },
      eventType: "wine_search",
    },
    select: { metadata: true },
  });

  for (const evt of searchEvents) {
    const meta = evt.metadata as Record<string, unknown> | null;
    const region = meta?.region as string | undefined;
    const country = (meta?.country as string) ?? "Unknown";
    if (!region) continue;
    if (!regionMap.has(region)) {
      regionMap.set(region, {
        country,
        searches: 0,
        explorations: 0,
        checkIns: 0,
        newWines: 0,
      });
    }
    regionMap.get(region)!.searches++;
  }

  // wine_checkin events: join with Wine to get region
  const checkinEvents = await prisma.wineEvent.findMany({
    where: {
      createdAt: { gte: start, lt: end },
      eventType: "wine_checkin",
      wineId: { not: null },
    },
    select: {
      wine: { select: { region: true, country: true } },
    },
  });

  for (const evt of checkinEvents) {
    if (!evt.wine) continue;
    const region = evt.wine.region;
    const country = evt.wine.country;
    if (!regionMap.has(region)) {
      regionMap.set(region, {
        country,
        searches: 0,
        explorations: 0,
        checkIns: 0,
        newWines: 0,
      });
    }
    regionMap.get(region)!.checkIns++;
  }

  // Count new wines added per region in this week
  const newWines = await prisma.wine.groupBy({
    by: ["region"],
    where: {
      createdAt: { gte: start, lt: end },
    },
    _count: { id: true },
  });

  for (const row of newWines) {
    if (regionMap.has(row.region)) {
      regionMap.get(row.region)!.newWines = row._count.id;
    }
  }

  let upserted = 0;
  for (const [region, data] of regionMap) {
    await prisma.regionTrend.upsert({
      where: { region_weekStart: { region, weekStart: start } },
      create: {
        region,
        country: data.country,
        weekStart: start,
        searches: data.searches,
        explorations: data.explorations,
        checkIns: data.checkIns,
        newWines: data.newWines,
      },
      update: {
        searches: data.searches,
        explorations: data.explorations,
        checkIns: data.checkIns,
        newWines: data.newWines,
      },
    });
    upserted++;
  }

  return upserted;
}

/**
 * Aggregate grape trends for a given week.
 * Queries WineEvent -> Wine -> grapes array, unnests/flattens grapes.
 * Upserts on [grape, weekStart].
 * Returns the count of rows upserted.
 */
export async function aggregateGrapeTrends(
  weekStart: Date
): Promise<number> {
  const start = new Date(weekStart);
  start.setUTCHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + 7);

  const relevantEvents = await prisma.wineEvent.findMany({
    where: {
      createdAt: { gte: start, lt: end },
      eventType: {
        in: ["wine_taste", "wine_favorite", "wine_view", "wine_search"],
      },
      wineId: { not: null },
    },
    select: {
      eventType: true,
      metadata: true,
      wine: { select: { grapes: true } },
    },
  });

  const grapeMap = new Map<
    string,
    { searches: number; tastings: number; favorites: number; ratingSum: number; ratingCount: number }
  >();

  for (const evt of relevantEvents) {
    const grapes = evt.wine?.grapes ?? [];
    for (const grape of grapes) {
      if (!grapeMap.has(grape)) {
        grapeMap.set(grape, {
          searches: 0,
          tastings: 0,
          favorites: 0,
          ratingSum: 0,
          ratingCount: 0,
        });
      }
      const entry = grapeMap.get(grape)!;
      switch (evt.eventType) {
        case "wine_search":
          entry.searches++;
          break;
        case "wine_taste": {
          entry.tastings++;
          const meta = evt.metadata as Record<string, unknown> | null;
          const rating = meta?.rating;
          if (typeof rating === "number") {
            entry.ratingSum += rating;
            entry.ratingCount++;
          }
          break;
        }
        case "wine_favorite":
          entry.favorites++;
          break;
        // wine_view counted but not mapped to a specific field
      }
    }
  }

  let upserted = 0;
  for (const [grape, data] of grapeMap) {
    const avgRating =
      data.ratingCount > 0 ? data.ratingSum / data.ratingCount : null;

    await prisma.grapeTrend.upsert({
      where: { grape_weekStart: { grape, weekStart: start } },
      create: {
        grape,
        weekStart: start,
        searches: data.searches,
        tastings: data.tastings,
        favorites: data.favorites,
        avgRating,
      },
      update: {
        searches: data.searches,
        tastings: data.tastings,
        favorites: data.favorites,
        avgRating,
      },
    });
    upserted++;
  }

  return upserted;
}

/**
 * Aggregate producer insights for a given month (first of month).
 * Counts producer_follow events, aggregates ratings from wine_taste events.
 * Upserts on [producerName, month].
 * Returns the count of rows upserted.
 */
export async function aggregateProducerInsights(
  month: Date
): Promise<number> {
  const start = new Date(month);
  start.setUTCDate(1);
  start.setUTCHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setUTCMonth(end.getUTCMonth() + 1);

  // producer_follow events: producer name is in metadata.producerName
  const followEvents = await prisma.wineEvent.findMany({
    where: {
      createdAt: { gte: start, lt: end },
      eventType: "producer_follow",
    },
    select: { metadata: true },
  });

  const producerMap = new Map<
    string,
    {
      followerCount: number;
      wineRatings: number;
      ratingSum: number;
      checkInVolume: number;
      wishlistAdds: number;
    }
  >();

  for (const evt of followEvents) {
    const meta = evt.metadata as Record<string, unknown> | null;
    const producer = meta?.producerName as string | undefined;
    if (!producer) continue;
    if (!producerMap.has(producer)) {
      producerMap.set(producer, {
        followerCount: 0,
        wineRatings: 0,
        ratingSum: 0,
        checkInVolume: 0,
        wishlistAdds: 0,
      });
    }
    producerMap.get(producer)!.followerCount++;
  }

  // wine_taste events: join with Wine to get producer, extract rating from metadata
  const tasteEvents = await prisma.wineEvent.findMany({
    where: {
      createdAt: { gte: start, lt: end },
      eventType: "wine_taste",
      wineId: { not: null },
    },
    select: {
      metadata: true,
      wine: { select: { producer: true } },
    },
  });

  for (const evt of tasteEvents) {
    if (!evt.wine) continue;
    const producer = evt.wine.producer;
    if (!producerMap.has(producer)) {
      producerMap.set(producer, {
        followerCount: 0,
        wineRatings: 0,
        ratingSum: 0,
        checkInVolume: 0,
        wishlistAdds: 0,
      });
    }
    const entry = producerMap.get(producer)!;
    entry.wineRatings++;
    const meta = evt.metadata as Record<string, unknown> | null;
    const rating = meta?.rating;
    if (typeof rating === "number") {
      entry.ratingSum += rating;
    }
  }

  // wine_checkin events: join with Wine to get producer
  const checkinEvents = await prisma.wineEvent.findMany({
    where: {
      createdAt: { gte: start, lt: end },
      eventType: "wine_checkin",
      wineId: { not: null },
    },
    select: {
      wine: { select: { producer: true } },
    },
  });

  for (const evt of checkinEvents) {
    if (!evt.wine) continue;
    const producer = evt.wine.producer;
    if (!producerMap.has(producer)) {
      producerMap.set(producer, {
        followerCount: 0,
        wineRatings: 0,
        ratingSum: 0,
        checkInVolume: 0,
        wishlistAdds: 0,
      });
    }
    producerMap.get(producer)!.checkInVolume++;
  }

  // wine_wishlist events: join with Wine to get producer
  const wishlistEvents = await prisma.wineEvent.findMany({
    where: {
      createdAt: { gte: start, lt: end },
      eventType: "wine_wishlist",
      wineId: { not: null },
    },
    select: {
      wine: { select: { producer: true } },
    },
  });

  for (const evt of wishlistEvents) {
    if (!evt.wine) continue;
    const producer = evt.wine.producer;
    if (!producerMap.has(producer)) {
      producerMap.set(producer, {
        followerCount: 0,
        wineRatings: 0,
        ratingSum: 0,
        checkInVolume: 0,
        wishlistAdds: 0,
      });
    }
    producerMap.get(producer)!.wishlistAdds++;
  }

  let upserted = 0;
  for (const [producerName, data] of producerMap) {
    const avgRating =
      data.wineRatings > 0 ? data.ratingSum / data.wineRatings : null;

    await prisma.producerInsight.upsert({
      where: {
        producerName_month: { producerName, month: start },
      },
      create: {
        producerName,
        month: start,
        followerCount: data.followerCount,
        wineRatings: data.wineRatings,
        avgRating,
        checkInVolume: data.checkInVolume,
        wishlistAdds: data.wishlistAdds,
      },
      update: {
        followerCount: data.followerCount,
        wineRatings: data.wineRatings,
        avgRating,
        checkInVolume: data.checkInVolume,
        wishlistAdds: data.wishlistAdds,
      },
    });
    upserted++;
  }

  return upserted;
}

/**
 * Helper: get the Monday of the current week (UTC).
 */
function getCurrentWeekStart(): Date {
  const now = new Date();
  const day = now.getUTCDay(); // 0=Sun, 1=Mon, ...
  const diff = day === 0 ? 6 : day - 1; // days since Monday
  const monday = new Date(now);
  monday.setUTCDate(now.getUTCDate() - diff);
  monday.setUTCHours(0, 0, 0, 0);
  return monday;
}

/**
 * Helper: get the first day of the current month (UTC).
 */
function getCurrentMonthStart(): Date {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
}

/**
 * Run all aggregations for the current period.
 * - Wine popularity: today
 * - Region trends: current week (Monday)
 * - Grape trends: current week (Monday)
 * - Producer insights: current month (1st)
 */
export async function runAllAggregations(): Promise<{
  wine: number;
  region: number;
  grape: number;
  producer: number;
}> {
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  const weekStart = getCurrentWeekStart();
  const monthStart = getCurrentMonthStart();

  const [wine, region, grape, producer] = await Promise.all([
    aggregateWinePopularity(today),
    aggregateRegionTrends(weekStart),
    aggregateGrapeTrends(weekStart),
    aggregateProducerInsights(monthStart),
  ]);

  return { wine, region, grape, producer };
}
