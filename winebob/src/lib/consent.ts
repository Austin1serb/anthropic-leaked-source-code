"use server";

import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth";

// ── Types ──

export type UserConsentData = {
  analyticsConsent: boolean;
  enhancedConsent: boolean;
  researchConsent: boolean;
  consentUpdatedAt: Date;
};

export type UserDataExport = {
  user: { id: string; email: string; createdAt: Date };
  events: Array<{
    eventType: string;
    wineId?: string;
    metadata?: unknown;
    createdAt: Date;
  }>;
  favorites: Array<{
    wineId: string;
    rating?: number;
    createdAt: Date;
  }>;
  tastings: Array<{
    wineId: string;
    rating?: number;
    tastedAt: Date;
  }>;
  checkIns: Array<{
    wineId: string;
    lat: number;
    lng: number;
    createdAt: Date;
  }>;
  wishlist: Array<{
    wineId: string;
    priority: number;
    createdAt: Date;
  }>;
  producerFollows: Array<{
    producerName: string;
    region: string | null;
    country: string | null;
    createdAt: Date;
  }>;
  tastingFlights: Array<{
    name: string | null;
    path: unknown;
    wines: unknown;
    createdAt: Date;
  }>;
  exportedAt: Date;
};

// ── Helpers ──

function toConsentData(consent: {
  analyticsConsent: boolean;
  enhancedConsent: boolean;
  researchConsent: boolean;
  consentUpdatedAt: Date;
}): UserConsentData {
  return {
    analyticsConsent: consent.analyticsConsent,
    enhancedConsent: consent.enhancedConsent,
    researchConsent: consent.researchConsent,
    consentUpdatedAt: consent.consentUpdatedAt,
  };
}

// ── Server Actions ──

/**
 * Get the current user's consent settings.
 * Creates a default record if none exists.
 */
export async function getUserConsent(): Promise<UserConsentData> {
  const session = await requireAuth();
  const userId = session.user.id;

  const existing = await prisma.userConsent.findUnique({ where: { userId } });
  const consent = existing ?? await prisma.userConsent.create({ data: { userId } });

  return toConsentData(consent);
}

/**
 * Update the current user's consent settings.
 */
export async function updateConsent(data: {
  analyticsConsent?: boolean;
  enhancedConsent?: boolean;
  researchConsent?: boolean;
}): Promise<UserConsentData> {
  const session = await requireAuth();
  const userId = session.user.id;

  const existing = await prisma.userConsent.findUnique({ where: { userId } });
  const consent = existing
    ? await prisma.userConsent.update({
        where: { userId },
        data: {
          ...(data.analyticsConsent !== undefined && {
            analyticsConsent: data.analyticsConsent,
          }),
          ...(data.enhancedConsent !== undefined && {
            enhancedConsent: data.enhancedConsent,
          }),
          ...(data.researchConsent !== undefined && {
            researchConsent: data.researchConsent,
          }),
          consentUpdatedAt: new Date(),
        },
      })
    : await prisma.userConsent.create({
        data: {
          userId,
          analyticsConsent: data.analyticsConsent ?? true,
          enhancedConsent: data.enhancedConsent ?? false,
          researchConsent: data.researchConsent ?? false,
          consentUpdatedAt: new Date(),
        },
      });

  return toConsentData(consent);
}

/**
 * Check if a specific consent level is granted for a user.
 * Used by analytics.ts and other server-side code.
 */
export async function hasConsent(
  userId: string,
  level: "analytics" | "enhanced" | "research"
): Promise<boolean> {
  const consent = await prisma.userConsent.findUnique({
    where: { userId },
  });

  if (!consent) {
    // Default: analytics is true, others false
    return level === "analytics";
  }

  switch (level) {
    case "analytics":
      return consent.analyticsConsent;
    case "enhanced":
      return consent.enhancedConsent;
    case "research":
      return consent.researchConsent;
  }
}

/**
 * Export all of the current user's data (GDPR right of access).
 */
export async function exportUserData(): Promise<UserDataExport> {
  const session = await requireAuth();
  const userId = session.user.id;

  const [user, events, favorites, tastings, checkIns, wishlist, producerFollows, tastingFlights] = await Promise.all([
    prisma.user.findUniqueOrThrow({
      where: { id: userId },
      select: { id: true, email: true, createdAt: true },
    }),
    prisma.wineEvent.findMany({
      where: { userId },
      select: {
        eventType: true,
        wineId: true,
        metadata: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.wineFavorite.findMany({
      where: { userId },
      select: { wineId: true, rating: true, createdAt: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.wineTasting.findMany({
      where: { userId },
      select: { wineId: true, rating: true, tastedAt: true },
      orderBy: { tastedAt: "desc" },
    }),
    prisma.wineCheckIn.findMany({
      where: { userId },
      select: { wineId: true, lat: true, lng: true, createdAt: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.wineWishlist.findMany({
      where: { userId },
      select: { wineId: true, priority: true, createdAt: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.producerFollow.findMany({
      where: { userId },
      select: { producerName: true, region: true, country: true, createdAt: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.tastingFlight.findMany({
      where: { userId },
      select: { name: true, path: true, wines: true, createdAt: true },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  return {
    user,
    events: events.map((e) => ({
      eventType: e.eventType,
      wineId: e.wineId ?? undefined,
      metadata: e.metadata ?? undefined,
      createdAt: e.createdAt,
    })),
    favorites: favorites.map((f) => ({
      wineId: f.wineId,
      rating: f.rating ?? undefined,
      createdAt: f.createdAt,
    })),
    tastings: tastings.map((t) => ({
      wineId: t.wineId,
      rating: t.rating ?? undefined,
      tastedAt: t.tastedAt,
    })),
    checkIns,
    wishlist,
    producerFollows,
    tastingFlights,
    exportedAt: new Date(),
  };
}

/**
 * Delete ALL of the current user's personal data (GDPR right to erasure).
 * Removes analytics events, favorites, tastings, wishlist, check-ins,
 * producer follows, tasting flights, and the consent record itself.
 */
export async function deleteUserData(): Promise<{
  events: number;
  favorites: number;
  tastings: number;
  wishlist: number;
  checkIns: number;
  producerFollows: number;
  tastingFlights: number;
  consent: number;
}> {
  const session = await requireAuth();
  const userId = session.user.id;

  const [events, favorites, tastings, wishlist, checkIns, producerFollows, tastingFlights, consent] =
    await Promise.all([
      prisma.wineEvent.deleteMany({ where: { userId } }),
      prisma.wineFavorite.deleteMany({ where: { userId } }),
      prisma.wineTasting.deleteMany({ where: { userId } }),
      prisma.wineWishlist.deleteMany({ where: { userId } }),
      prisma.wineCheckIn.deleteMany({ where: { userId } }),
      prisma.producerFollow.deleteMany({ where: { userId } }),
      prisma.tastingFlight.deleteMany({ where: { userId } }),
      prisma.userConsent.deleteMany({ where: { userId } }),
    ]);

  return {
    events: events.count,
    favorites: favorites.count,
    tastings: tastings.count,
    wishlist: wishlist.count,
    checkIns: checkIns.count,
    producerFollows: producerFollows.count,
    tastingFlights: tastingFlights.count,
    consent: consent.count,
  };
}
