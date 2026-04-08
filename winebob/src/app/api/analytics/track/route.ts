import { trackEvent } from "@/lib/analytics";
import type { Prisma } from "@/generated/prisma/client";

export const dynamic = "force-dynamic";

// Simple in-memory rate limiter (per serverless instance)
const ipBuckets = new Map<string, { count: number; resetAt: number }>();

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const bucket = ipBuckets.get(ip);
  if (!bucket || now > bucket.resetAt) {
    ipBuckets.set(ip, { count: 1, resetAt: now + 60_000 });
    return false;
  }
  bucket.count++;
  return bucket.count > 100;
}

/**
 * POST /api/analytics/track
 *
 * Lightweight endpoint for client-side event ingestion.
 * Accepts batched events (max 20 per request).
 * No auth required — uses existing consent checks in trackEvent().
 */
export async function POST(request: Request) {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    "unknown";

  if (isRateLimited(ip)) {
    return Response.json(
      { error: "Rate limit exceeded" },
      { status: 429 }
    );
  }

  try {
    const body = await request.json();
    const events = body?.events;

    if (!Array.isArray(events) || events.length === 0) {
      return Response.json(
        { error: "Missing or empty events array" },
        { status: 400 }
      );
    }

    // Cap at 20 events per request
    const batch = events.slice(0, 20);

    // Fire all tracking calls in parallel, fire-and-forget style
    await Promise.allSettled(
      batch.map(
        (evt: {
          eventType?: string;
          wineId?: string;
          metadata?: Record<string, unknown>;
          sessionId?: string;
        }) => {
          if (!evt.eventType || typeof evt.eventType !== "string") {
            return Promise.resolve();
          }
          return trackEvent({
            eventType: evt.eventType,
            wineId: evt.wineId ?? null,
            metadata: evt.metadata as Record<string, Prisma.InputJsonValue | undefined> | undefined,
            sessionId: evt.sessionId,
          });
        }
      )
    );

    return Response.json({ tracked: batch.length });
  } catch {
    return Response.json({ error: "Invalid request body" }, { status: 400 });
  }
}
