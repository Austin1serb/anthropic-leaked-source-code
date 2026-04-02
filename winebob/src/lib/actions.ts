"use server";

import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  generateFromOnboarding,
  generateProfileVector,
} from "@/lib/services/tasteProfiler";

// ============ ONBOARDING ============

export async function saveTasteProfile(data: {
  body: number;
  sweetness: number;
  grape: string[];
  region: string[];
  adventure: number;
}) {
  const session = await requireAuth();

  const profile = generateFromOnboarding(data);
  const vector = generateProfileVector(profile);

  await prisma.tasteProfile.upsert({
    where: { userId: session.user.id },
    create: {
      userId: session.user.id,
      body: profile.body,
      tannin: profile.tannin,
      acidity: profile.acidity,
      sweetness: profile.sweetness,
      fruitForward: profile.fruitForward,
      oakInfluence: profile.oakInfluence,
      topGrapes: profile.topGrapes,
      topRegions: profile.topRegions,
      profileVector: vector,
    },
    update: {
      body: profile.body,
      tannin: profile.tannin,
      acidity: profile.acidity,
      sweetness: profile.sweetness,
      fruitForward: profile.fruitForward,
      oakInfluence: profile.oakInfluence,
      topGrapes: profile.topGrapes,
      topRegions: profile.topRegions,
      profileVector: vector,
    },
  });

  redirect("/cellar");
}

// ============ WINE SEARCH ============

export async function searchWines(query: string, type?: string) {
  const where: Record<string, unknown> = {};

  if (query && query.trim().length > 0) {
    where.OR = [
      { name: { contains: query, mode: "insensitive" } },
      { producer: { contains: query, mode: "insensitive" } },
      { region: { contains: query, mode: "insensitive" } },
      { country: { contains: query, mode: "insensitive" } },
    ];
  }

  if (type && type !== "All") {
    where.type = type.toLowerCase();
  }

  const wines = await prisma.wine.findMany({
    where,
    orderBy: [{ avgRating: "desc" }, { totalRatings: "desc" }],
    take: 30,
  });

  return wines;
}

// ============ WINE CHECK-IN / REVIEW ============

export async function createReview(data: {
  wineId: string;
  rating: number;
  notes: string;
  tags?: string[];
}) {
  const session = await requireAuth();

  const review = await prisma.wineReview.upsert({
    where: {
      wineId_userId: {
        wineId: data.wineId,
        userId: session.user.id,
      },
    },
    create: {
      wineId: data.wineId,
      userId: session.user.id,
      rating: data.rating,
      notes: data.notes,
      tags: data.tags ?? [],
      photos: [],
      foodPairings: [],
      verifiedUsage: true,
    },
    update: {
      rating: data.rating,
      notes: data.notes,
      tags: data.tags ?? [],
    },
  });

  // Update wine's average rating
  const stats = await prisma.wineReview.aggregate({
    where: { wineId: data.wineId },
    _avg: { rating: true },
    _count: { rating: true },
  });

  await prisma.wine.update({
    where: { id: data.wineId },
    data: {
      avgRating: stats._avg.rating ?? 0,
      totalRatings: stats._count.rating,
    },
  });

  // Create activity for the check-in
  await prisma.activity.create({
    data: {
      userId: session.user.id,
      type: "tasting",
      title: `Checked in a wine`,
      description: data.notes,
      wineIds: [data.wineId],
      isPublic: true,
    },
  });

  revalidatePath("/cellar");
  revalidatePath("/trail");
  revalidatePath("/profile");

  return review;
}

// ============ CELLAR DATA FETCHING ============

export async function getRecommendedWines() {
  // For now, return top-rated wines. With a real taste profile,
  // this would use the recommendation engine.
  return prisma.wine.findMany({
    orderBy: [{ avgRating: "desc" }, { totalRatings: "desc" }],
    take: 10,
  });
}

export async function getRecentCheckins() {
  return prisma.activity.findMany({
    where: { type: "tasting", isPublic: true },
    orderBy: { createdAt: "desc" },
    take: 10,
    include: {
      user: { select: { displayName: true, name: true, image: true } },
    },
  });
}

export async function getUserStats() {
  const session = await requireAuth();
  const userId = session.user.id;

  const [reviewCount, activityCount, tasteProfile] = await Promise.all([
    prisma.wineReview.count({ where: { userId } }),
    prisma.activity.count({ where: { userId } }),
    prisma.tasteProfile.findUnique({ where: { userId } }),
  ]);

  return {
    winesRated: reviewCount,
    activities: activityCount,
    regionsExplored: tasteProfile?.exploredRegions ?? 0,
    hasCompletedOnboarding: !!tasteProfile,
  };
}

// ============ WINE CRUD ============

export async function getWineById(id: string) {
  return prisma.wine.findUnique({
    where: { id },
    include: {
      reviews: {
        include: {
          user: { select: { displayName: true, name: true, image: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 20,
      },
    },
  });
}

export async function findOrCreateWineFromScan(data: {
  name: string;
  producer: string;
  vintage: number | null;
  grapes: string[];
  region: string;
  country: string;
  appellation: string | null;
  type: string;
}) {
  // Try to find existing wine
  const existing = await prisma.wine.findFirst({
    where: {
      name: { contains: data.name, mode: "insensitive" },
      producer: { contains: data.producer, mode: "insensitive" },
      vintage: data.vintage,
    },
  });

  if (existing) return existing;

  // Create new wine entry
  return prisma.wine.create({
    data: {
      name: data.name,
      producer: data.producer,
      vintage: data.vintage,
      grapes: data.grapes,
      region: data.region,
      country: data.country,
      appellation: data.appellation,
      type: data.type,
    },
  });
}
