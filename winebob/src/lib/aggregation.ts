import { prisma } from "@/lib/db";
import { computeAllSegments } from "@/lib/segmentation";

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
 * Aggregate demographic wine trends for a given week.
 * Joins WineEvent with UserSegment to group interactions by ageGroup, wineType, priceRange.
 * Only includes users with enhancedConsent.
 * Returns the count of rows upserted.
 */
export async function aggregateDemographicTrends(
  weekStart: Date
): Promise<number> {
  const start = new Date(weekStart);
  start.setUTCHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + 7);

  // Get users with enhanced consent
  const consentedUsers = await prisma.userConsent.findMany({
    where: { enhancedConsent: true },
    select: { userId: true },
  });
  const consentedIds = new Set(consentedUsers.map((u) => u.userId));

  if (consentedIds.size === 0) return 0;

  // Fetch wine events for consented users
  const events = await prisma.wineEvent.findMany({
    where: {
      createdAt: { gte: start, lt: end },
      eventType: { in: ["wine_view", "wine_favorite", "wine_taste"] },
      wineId: { not: null },
      userId: { in: [...consentedIds] },
    },
    select: {
      eventType: true,
      userId: true,
      metadata: true,
      wine: { select: { type: true, priceRange: true } },
    },
  });

  // Load segments for these users
  const userIds = [...new Set(events.map((e) => e.userId).filter(Boolean))] as string[];
  const segments = await prisma.userSegment.findMany({
    where: { userId: { in: userIds } },
  });
  const segmentMap = new Map(segments.map((s) => [s.userId, s]));

  // Pivot into demographic buckets
  const bucketMap = new Map<
    string,
    { viewCount: number; favoriteCount: number; tastingCount: number; ratingSum: number; ratingCount: number }
  >();

  for (const evt of events) {
    if (!evt.userId || !evt.wine) continue;
    const seg = segmentMap.get(evt.userId);
    const ageGroup = seg?.ageGroup ?? "unknown";
    const wineType = evt.wine.type;
    const priceRange = evt.wine.priceRange ?? "unknown";

    const key = `${ageGroup}|${wineType}|${priceRange}`;
    if (!bucketMap.has(key)) {
      bucketMap.set(key, { viewCount: 0, favoriteCount: 0, tastingCount: 0, ratingSum: 0, ratingCount: 0 });
    }
    const bucket = bucketMap.get(key)!;

    switch (evt.eventType) {
      case "wine_view":
        bucket.viewCount++;
        break;
      case "wine_favorite":
        bucket.favoriteCount++;
        break;
      case "wine_taste": {
        bucket.tastingCount++;
        const meta = evt.metadata as Record<string, unknown> | null;
        const rating = meta?.rating;
        if (typeof rating === "number") {
          bucket.ratingSum += rating;
          bucket.ratingCount++;
        }
        break;
      }
    }
  }

  let upserted = 0;
  for (const [key, data] of bucketMap) {
    const [ageGroup, wineType, priceRange] = key.split("|");
    const avgRating = data.ratingCount > 0 ? data.ratingSum / data.ratingCount : null;
    // Use empty string for unknown price range since the unique constraint requires non-null
    const pr = priceRange === "unknown" ? "" : priceRange;

    await prisma.demographicWineTrend.upsert({
      where: {
        weekStart_ageGroup_wineType_priceRange: {
          weekStart: start,
          ageGroup,
          wineType,
          priceRange: pr,
        },
      },
      create: {
        weekStart: start,
        ageGroup,
        wineType,
        priceRange: pr,
        viewCount: data.viewCount,
        favoriteCount: data.favoriteCount,
        tastingCount: data.tastingCount,
        avgRating,
      },
      update: {
        viewCount: data.viewCount,
        favoriteCount: data.favoriteCount,
        tastingCount: data.tastingCount,
        avgRating,
      },
    });
    upserted++;
  }

  return upserted;
}

/**
 * Aggregate price insights for a given week.
 * Groups wine interactions by priceRange, region, and wineType.
 * Computes conversion rates (view-to-favorite, view-to-wishlist).
 * Returns the count of rows upserted.
 */
export async function aggregatePriceInsights(
  weekStart: Date
): Promise<number> {
  const start = new Date(weekStart);
  start.setUTCHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + 7);

  const events = await prisma.wineEvent.findMany({
    where: {
      createdAt: { gte: start, lt: end },
      eventType: {
        in: ["wine_view", "wine_search", "wine_favorite", "wine_wishlist", "wine_taste"],
      },
      wineId: { not: null },
    },
    select: {
      eventType: true,
      metadata: true,
      wine: { select: { priceRange: true, region: true, type: true } },
    },
  });

  const bucketMap = new Map<
    string,
    { searches: number; views: number; favorites: number; wishlists: number; ratingSum: number; ratingCount: number }
  >();

  for (const evt of events) {
    if (!evt.wine) continue;
    const priceRange = evt.wine.priceRange ?? "unknown";
    const region = evt.wine.region;
    const wineType = evt.wine.type;

    const key = `${priceRange}|${region}|${wineType}`;
    if (!bucketMap.has(key)) {
      bucketMap.set(key, { searches: 0, views: 0, favorites: 0, wishlists: 0, ratingSum: 0, ratingCount: 0 });
    }
    const bucket = bucketMap.get(key)!;

    switch (evt.eventType) {
      case "wine_search":
        bucket.searches++;
        break;
      case "wine_view":
        bucket.views++;
        break;
      case "wine_favorite":
        bucket.favorites++;
        break;
      case "wine_wishlist":
        bucket.wishlists++;
        break;
      case "wine_taste": {
        const meta = evt.metadata as Record<string, unknown> | null;
        const rating = meta?.rating;
        if (typeof rating === "number") {
          bucket.ratingSum += rating;
          bucket.ratingCount++;
        }
        break;
      }
    }
  }

  let upserted = 0;
  for (const [key, data] of bucketMap) {
    const [priceRange, region, wineType] = key.split("|");
    if (priceRange === "unknown") continue;

    const favoriteRate = data.views > 0 ? data.favorites / data.views : null;
    const wishlistRate = data.views > 0 ? data.wishlists / data.views : null;
    const avgRating = data.ratingCount > 0 ? data.ratingSum / data.ratingCount : null;

    await prisma.priceInsight.upsert({
      where: {
        weekStart_priceRange_region_wineType: {
          weekStart: start,
          priceRange,
          region,
          wineType,
        },
      },
      create: {
        weekStart: start,
        priceRange,
        region,
        wineType,
        searchVolume: data.searches,
        viewVolume: data.views,
        favoriteRate,
        wishlistRate,
        avgRating,
      },
      update: {
        searchVolume: data.searches,
        viewVolume: data.views,
        favoriteRate,
        wishlistRate,
        avgRating,
      },
    });
    upserted++;
  }

  return upserted;
}

/**
 * Aggregate funnel metrics for a given week.
 * Counts distinct users for each event type in the funnel.
 * Computes conversion rates between steps.
 * Returns the count of rows upserted.
 */
export async function aggregateFunnelMetrics(
  weekStart: Date
): Promise<number> {
  const start = new Date(weekStart);
  start.setUTCHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + 7);

  const funnelEventTypes = [
    "wine_search",
    "wine_view",
    "wine_favorite",
    "wine_taste",
    "wine_checkin",
    "wine_wishlist",
  ] as const;

  // Count distinct users per event type
  const counts: Record<string, number> = {};
  for (const eventType of funnelEventTypes) {
    const result = await prisma.wineEvent.findMany({
      where: {
        createdAt: { gte: start, lt: end },
        eventType,
        userId: { not: null },
      },
      select: { userId: true },
      distinct: ["userId"],
    });
    counts[eventType] = result.length;
  }

  function rate(num: number, denom: number): number | null {
    return denom > 0 ? num / denom : null;
  }

  // Upsert overall funnel (segment = null)
  await prisma.funnelMetric.upsert({
    where: { weekStart_segment: { weekStart: start, segment: "" } },
    create: {
      weekStart: start,
      segment: "",
      searchCount: counts["wine_search"],
      viewCount: counts["wine_view"],
      favoriteCount: counts["wine_favorite"],
      tastingCount: counts["wine_taste"],
      checkinCount: counts["wine_checkin"],
      wishlistCount: counts["wine_wishlist"],
      searchToView: rate(counts["wine_view"], counts["wine_search"]),
      viewToFavorite: rate(counts["wine_favorite"], counts["wine_view"]),
      favoriteToTaste: rate(counts["wine_taste"], counts["wine_favorite"]),
      tasteToCheckin: rate(counts["wine_checkin"], counts["wine_taste"]),
    },
    update: {
      searchCount: counts["wine_search"],
      viewCount: counts["wine_view"],
      favoriteCount: counts["wine_favorite"],
      tastingCount: counts["wine_taste"],
      checkinCount: counts["wine_checkin"],
      wishlistCount: counts["wine_wishlist"],
      searchToView: rate(counts["wine_view"], counts["wine_search"]),
      viewToFavorite: rate(counts["wine_favorite"], counts["wine_view"]),
      favoriteToTaste: rate(counts["wine_taste"], counts["wine_favorite"]),
      tasteToCheckin: rate(counts["wine_checkin"], counts["wine_taste"]),
    },
  });

  // Also segment by userType if segments exist
  const segmentTypes = ["casual", "enthusiast", "sommelier", "power_user"];
  let upserted = 1;

  for (const segType of segmentTypes) {
    const segUsers = await prisma.userSegment.findMany({
      where: { userType: segType },
      select: { userId: true },
    });
    const segUserIds = segUsers.map((s) => s.userId);
    if (segUserIds.length === 0) continue;

    const segCounts: Record<string, number> = {};
    for (const eventType of funnelEventTypes) {
      const result = await prisma.wineEvent.findMany({
        where: {
          createdAt: { gte: start, lt: end },
          eventType,
          userId: { in: segUserIds },
        },
        select: { userId: true },
        distinct: ["userId"],
      });
      segCounts[eventType] = result.length;
    }

    await prisma.funnelMetric.upsert({
      where: { weekStart_segment: { weekStart: start, segment: segType } },
      create: {
        weekStart: start,
        segment: segType,
        searchCount: segCounts["wine_search"],
        viewCount: segCounts["wine_view"],
        favoriteCount: segCounts["wine_favorite"],
        tastingCount: segCounts["wine_taste"],
        checkinCount: segCounts["wine_checkin"],
        wishlistCount: segCounts["wine_wishlist"],
        searchToView: rate(segCounts["wine_view"], segCounts["wine_search"]),
        viewToFavorite: rate(segCounts["wine_favorite"], segCounts["wine_view"]),
        favoriteToTaste: rate(segCounts["wine_taste"], segCounts["wine_favorite"]),
        tasteToCheckin: rate(segCounts["wine_checkin"], segCounts["wine_taste"]),
      },
      update: {
        searchCount: segCounts["wine_search"],
        viewCount: segCounts["wine_view"],
        favoriteCount: segCounts["wine_favorite"],
        tastingCount: segCounts["wine_taste"],
        checkinCount: segCounts["wine_checkin"],
        wishlistCount: segCounts["wine_wishlist"],
        searchToView: rate(segCounts["wine_view"], segCounts["wine_search"]),
        viewToFavorite: rate(segCounts["wine_favorite"], segCounts["wine_view"]),
        favoriteToTaste: rate(segCounts["wine_taste"], segCounts["wine_favorite"]),
        tasteToCheckin: rate(segCounts["wine_checkin"], segCounts["wine_taste"]),
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
  segments: number;
  demographics: number;
  price: number;
  funnel: number;
}> {
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  const weekStart = getCurrentWeekStart();
  const monthStart = getCurrentMonthStart();

  // Run existing aggregations in parallel
  const [wine, region, grape, producer] = await Promise.all([
    aggregateWinePopularity(today),
    aggregateRegionTrends(weekStart),
    aggregateGrapeTrends(weekStart),
    aggregateProducerInsights(monthStart),
  ]);

  // Compute user segments first (needed by demographic aggregation)
  const segments = await computeAllSegments();

  // Run new aggregations in parallel
  const [demographics, price, funnel] = await Promise.all([
    aggregateDemographicTrends(weekStart),
    aggregatePriceInsights(weekStart),
    aggregateFunnelMetrics(weekStart),
  ]);

  return { wine, region, grape, producer, segments, demographics, price, funnel };
}
