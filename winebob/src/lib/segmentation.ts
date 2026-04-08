import { prisma } from "@/lib/db";

/**
 * Compute the behavioral segment for a single user.
 * Derives userType, engagementTier, affinities from WineEvent/WineFavorite/WineTasting data.
 */
export async function computeUserSegment(userId: string): Promise<void> {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setUTCDate(thirtyDaysAgo.getUTCDate() - 30);

  // Fetch data in parallel
  const [
    eventCount,
    favoriteCount,
    tastingCount,
    sommelierProfile,
    recentCheckin,
    favorites,
    guestParticipant,
  ] = await Promise.all([
    prisma.wineEvent.count({
      where: { userId, createdAt: { gte: thirtyDaysAgo } },
    }),
    prisma.wineFavorite.count({ where: { userId } }),
    prisma.wineTasting.count({ where: { userId } }),
    prisma.sommelierProfile.findUnique({ where: { userId } }),
    prisma.wineCheckIn.findFirst({
      where: { userId },
      orderBy: { createdAt: "desc" },
      select: { city: true, country: true },
    }),
    prisma.wineFavorite.findMany({
      where: { userId },
      select: { wineId: true },
      take: 100,
    }),
    // Try to get birthYear from GuestParticipant records linked to this user
    prisma.guestParticipant.findFirst({
      where: { userId },
      select: { birthYear: true },
      orderBy: { joinedAt: "desc" },
    }),
  ]);

  // Determine userType
  let userType = "casual";
  if (sommelierProfile) {
    userType = "sommelier";
  } else if (tastingCount > 20 && favoriteCount > 10) {
    userType = "power_user";
  } else if (tastingCount > 5 || favoriteCount > 5) {
    userType = "enthusiast";
  }

  // Determine engagementTier from last 30 days event count
  let engagementTier = "low";
  if (eventCount > 50) {
    engagementTier = "power";
  } else if (eventCount > 20) {
    engagementTier = "high";
  } else if (eventCount > 5) {
    engagementTier = "medium";
  }

  // Compute affinities from favorited wines
  let priceAffinity: string | null = null;
  let typeAffinity: string | null = null;
  let regionAffinity: string | null = null;

  if (favorites.length > 0) {
    const wineIds = favorites.map((f) => f.wineId);
    const wines = await prisma.wine.findMany({
      where: { id: { in: wineIds } },
      select: { priceRange: true, type: true, region: true },
    });

    // Mode calculation helper
    function mode(values: (string | null)[]): string | null {
      const counts = new Map<string, number>();
      for (const v of values) {
        if (v) counts.set(v, (counts.get(v) ?? 0) + 1);
      }
      let max = 0;
      let result: string | null = null;
      for (const [k, c] of counts) {
        if (c > max) {
          max = c;
          result = k;
        }
      }
      return result;
    }

    priceAffinity = mode(wines.map((w) => w.priceRange));
    typeAffinity = mode(wines.map((w) => w.type));
    regionAffinity = mode(wines.map((w) => w.region));
  }

  // Compute ageGroup from birthYear
  let ageGroup: string | null = null;
  if (guestParticipant?.birthYear) {
    const age = new Date().getFullYear() - guestParticipant.birthYear;
    if (age < 25) ageGroup = "18-24";
    else if (age < 35) ageGroup = "25-34";
    else if (age < 45) ageGroup = "35-44";
    else if (age < 55) ageGroup = "45-54";
    else if (age < 65) ageGroup = "55-64";
    else ageGroup = "65+";
  }

  // Get last active timestamp
  const lastEvent = await prisma.wineEvent.findFirst({
    where: { userId },
    orderBy: { createdAt: "desc" },
    select: { createdAt: true },
  });

  await prisma.userSegment.upsert({
    where: { userId },
    create: {
      userId,
      userType,
      ageGroup,
      country: recentCheckin?.country ?? null,
      city: recentCheckin?.city ?? null,
      engagementTier,
      priceAffinity,
      typeAffinity,
      regionAffinity,
      lastActiveAt: lastEvent?.createdAt ?? null,
      computedAt: new Date(),
    },
    update: {
      userType,
      ageGroup,
      country: recentCheckin?.country ?? null,
      city: recentCheckin?.city ?? null,
      engagementTier,
      priceAffinity,
      typeAffinity,
      regionAffinity,
      lastActiveAt: lastEvent?.createdAt ?? null,
      computedAt: new Date(),
    },
  });
}

/**
 * Batch-compute segments for all users active in the last 90 days.
 * Returns the number of segments computed.
 */
export async function computeAllSegments(): Promise<number> {
  const ninetyDaysAgo = new Date();
  ninetyDaysAgo.setUTCDate(ninetyDaysAgo.getUTCDate() - 90);

  // Find distinct userIds with recent activity
  const activeUsers = await prisma.wineEvent.findMany({
    where: {
      userId: { not: null },
      createdAt: { gte: ninetyDaysAgo },
    },
    select: { userId: true },
    distinct: ["userId"],
  });

  let computed = 0;
  for (const { userId } of activeUsers) {
    if (!userId) continue;
    try {
      await computeUserSegment(userId);
      computed++;
    } catch (err) {
      console.error(`[segmentation] Failed for user ${userId}:`, err);
    }
  }

  return computed;
}
