"use server";

import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth";

export async function getJourneyStats() {
  const session = await requireAuth();
  const userId = session.user.id;

  const [
    tastings,
    checkIns,
    favorites,
    flights,
    follows,
    wishlist,
  ] = await Promise.all([
    prisma.wineTasting.findMany({
      where: { userId },
      include: { wine: { select: { id: true, name: true, producer: true, region: true, country: true, type: true, grapes: true } } },
      orderBy: { tastedAt: "desc" },
    }),
    prisma.wineCheckIn.findMany({
      where: { userId },
      include: { wine: { select: { id: true, name: true, type: true, region: true } } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.wineFavorite.findMany({
      where: { userId },
      include: { wine: { select: { id: true, name: true, producer: true, region: true, country: true, type: true, grapes: true } } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.tastingFlight.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    }),
    prisma.producerFollow.findMany({
      where: { userId },
    }),
    prisma.wineWishlist.findMany({
      where: { userId },
      include: { wine: { select: { id: true, name: true, region: true, type: true } } },
    }),
  ]);

  // Compute passport stats
  const allWines = [
    ...tastings.map((t) => t.wine),
    ...favorites.map((f) => f.wine),
  ];

  const regionsExplored = new Set(allWines.map((w) => w.region));
  const countriesVisited = new Set(allWines.map((w) => w.country));
  const grapesTriedMap: Record<string, number> = {};
  const typeCountMap: Record<string, number> = {};

  for (const w of allWines) {
    typeCountMap[w.type] = (typeCountMap[w.type] || 0) + 1;
    for (const g of w.grapes ?? []) {
      grapesTriedMap[g] = (grapesTriedMap[g] || 0) + 1;
    }
  }

  const topGrapes = Object.entries(grapesTriedMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([name, count]) => ({ name, count }));

  const typeBreakdown = Object.entries(typeCountMap)
    .sort((a, b) => b[1] - a[1])
    .map(([type, count]) => ({ type, count }));

  // Monthly activity timeline
  const monthlyActivity: Record<string, { tastings: number; checkIns: number; favorites: number }> = {};
  for (const t of tastings) {
    const key = t.tastedAt.toISOString().slice(0, 7); // "2024-03"
    monthlyActivity[key] = monthlyActivity[key] || { tastings: 0, checkIns: 0, favorites: 0 };
    monthlyActivity[key].tastings++;
  }
  for (const c of checkIns) {
    const key = c.createdAt.toISOString().slice(0, 7);
    monthlyActivity[key] = monthlyActivity[key] || { tastings: 0, checkIns: 0, favorites: 0 };
    monthlyActivity[key].checkIns++;
  }
  for (const f of favorites) {
    const key = f.createdAt.toISOString().slice(0, 7);
    monthlyActivity[key] = monthlyActivity[key] || { tastings: 0, checkIns: 0, favorites: 0 };
    monthlyActivity[key].favorites++;
  }

  const timeline = Object.entries(monthlyActivity)
    .sort((a, b) => a[0].localeCompare(b[0]))
    .slice(-12)
    .map(([month, data]) => ({ month, ...data }));

  return {
    counts: {
      tastings: tastings.length,
      checkIns: checkIns.length,
      favorites: favorites.length,
      flights: flights.length,
      follows: follows.length,
      wishlist: wishlist.length,
    },
    passport: {
      regionsExplored: Array.from(regionsExplored).sort(),
      countriesVisited: Array.from(countriesVisited).sort(),
      topGrapes,
      typeBreakdown,
      uniqueWines: new Set(allWines.map((w) => w.id)).size,
      totalRegions: 28,
    },
    recentTastings: tastings.slice(0, 10),
    recentCheckIns: checkIns.slice(0, 10),
    timeline,
  };
}
