"use server";

import { prisma } from "@/lib/db";
import { Prisma } from "@/generated/prisma/client";

// ============ CONSENT CHECK ============

type ConsentLevel = "basic" | "enhanced";

async function shouldTrack(
  userId: string | null | undefined,
  level: ConsentLevel = "basic"
): Promise<boolean> {
  // Anonymous users: allow basic analytics only
  if (!userId) return level === "basic";

  try {
    const consent = await prisma.userConsent.findUnique({
      where: { userId },
    });

    // No consent record => default to allowing basic analytics
    if (!consent) return level === "basic";

    if (level === "enhanced") return consent.enhancedConsent;
    return consent.analyticsConsent;
  } catch {
    // If we can't check consent, default to allowing basic analytics only
    return level === "basic";
  }
}

// ============ CORE EVENT LOGGER ============

export async function trackEvent(params: {
  eventType: string;
  userId?: string | null;
  wineId?: string | null;
  metadata?: Record<string, Prisma.InputJsonValue | undefined>;
  sessionId?: string;
}): Promise<void> {
  try {
    const allowed = await shouldTrack(params.userId);
    if (!allowed) return;

    await prisma.wineEvent.create({
      data: {
        eventType: params.eventType,
        userId: params.userId ?? null,
        wineId: params.wineId ?? null,
        metadata: params.metadata
          ? (params.metadata as Prisma.InputJsonValue)
          : Prisma.DbNull,
        sessionId: params.sessionId ?? null,
      },
    });
  } catch (err) {
    console.error("[analytics] Failed to track event:", err);
  }
}

// ============ CONVENIENCE WRAPPERS ============
// All use fire-and-forget pattern: call trackEvent without awaiting,
// errors are caught silently inside trackEvent.

export async function trackWineView(
  userId: string | null,
  wineId: string,
  source?: string
): Promise<void> {
  trackEvent({
    eventType: "wine_view",
    userId,
    wineId,
    metadata: source ? { source } : undefined,
  }).catch(() => {});
}

export async function trackWineSearch(
  userId: string | null,
  query: string,
  resultCount: number,
  filters?: Record<string, unknown>
): Promise<void> {
  trackEvent({
    eventType: "wine_search",
    userId,
    metadata: { query, resultCount, ...filters },
  }).catch(() => {});
}

export async function trackWineFavorite(
  userId: string,
  wineId: string,
  rating?: number
): Promise<void> {
  trackEvent({
    eventType: "wine_favorite",
    userId,
    wineId,
    metadata: rating !== undefined ? { rating } : undefined,
  }).catch(() => {});
}

export async function trackWineTaste(
  userId: string,
  wineId: string,
  rating?: number,
  eventId?: string
): Promise<void> {
  trackEvent({
    eventType: "wine_taste",
    userId,
    wineId,
    metadata: { ...(rating !== undefined && { rating }), ...(eventId && { eventId }) },
  }).catch(() => {});
}

export async function trackWineCheckin(
  userId: string,
  wineId: string,
  city?: string,
  country?: string
): Promise<void> {
  trackEvent({
    eventType: "wine_checkin",
    userId,
    wineId,
    metadata: { ...(city && { city }), ...(country && { country }) },
  }).catch(() => {});
}

export async function trackWineWishlist(
  userId: string,
  wineId: string
): Promise<void> {
  trackEvent({
    eventType: "wine_wishlist",
    userId,
    wineId,
  }).catch(() => {});
}

export async function trackRegionExplore(
  userId: string | null,
  region: string,
  country: string
): Promise<void> {
  trackEvent({
    eventType: "region_explore",
    userId,
    metadata: { region, country },
  }).catch(() => {});
}

export async function trackLayerToggle(
  userId: string | null,
  layerName: string,
  enabled: boolean
): Promise<void> {
  trackEvent({
    eventType: "layer_toggle",
    userId,
    metadata: { layerName, enabled },
  }).catch(() => {});
}

export async function trackProducerFollow(
  userId: string,
  producerName: string
): Promise<void> {
  trackEvent({
    eventType: "producer_follow",
    userId,
    metadata: { producerName },
  }).catch(() => {});
}

// ============ ENHANCED TRACKING WRAPPERS ============

export async function trackPageView(
  userId: string | null,
  path: string,
  referrer?: string,
  sessionId?: string
): Promise<void> {
  trackEvent({
    eventType: "page_view",
    userId,
    metadata: { path, ...(referrer && { referrer }) },
    sessionId,
  }).catch(() => {});
}

export async function trackEngagement(
  userId: string | null,
  wineId: string | null,
  action: string,
  durationMs: number,
  sessionId?: string
): Promise<void> {
  trackEvent({
    eventType: "engagement",
    userId,
    wineId,
    metadata: { action, durationMs },
    sessionId,
  }).catch(() => {});
}

export async function trackWineShare(
  userId: string | null,
  wineId: string,
  platform: string
): Promise<void> {
  trackEvent({
    eventType: "wine_share",
    userId,
    wineId,
    metadata: { platform },
  }).catch(() => {});
}

export async function trackPriceInteraction(
  userId: string | null,
  priceRange: string,
  resultCount: number
): Promise<void> {
  trackEvent({
    eventType: "price_filter",
    userId,
    metadata: { priceRange, resultCount },
  }).catch(() => {});
}

export async function trackFunnelStep(
  userId: string | null,
  wineId: string | null,
  step: string,
  sessionId?: string
): Promise<void> {
  trackEvent({
    eventType: "funnel_step",
    userId,
    wineId,
    metadata: { step },
    sessionId,
  }).catch(() => {});
}
