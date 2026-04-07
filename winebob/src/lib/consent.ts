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

  const consent = await prisma.userConsent.upsert({
    where: { userId },
    create: { userId },
    update: {},
  });

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

  const consent = await prisma.userConsent.upsert({
    where: { userId },
    create: {
      userId,
      analyticsConsent: data.analyticsConsent ?? true,
      enhancedConsent: data.enhancedConsent ?? false,
      researchConsent: data.researchConsent ?? false,
      consentUpdatedAt: new Date(),
    },
    update: {
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

  const [user, events, favorites, tastings, checkIns] = await Promise.all([
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
    exportedAt: new Date(),
  };
}

/**
 * Delete the current user's analytics data (GDPR right to erasure).
 * Removes all WineEvent records for the user.
 */
export async function deleteAnalyticsData(): Promise<{ deletedCount: number }> {
  const session = await requireAuth();
  const userId = session.user.id;

  const result = await prisma.wineEvent.deleteMany({
    where: { userId },
  });

  return { deletedCount: result.count };
}
