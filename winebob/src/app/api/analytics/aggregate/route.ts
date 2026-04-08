import { runAllAggregations } from "@/lib/aggregation";

export const dynamic = "force-dynamic";
export const maxDuration = 60; // Allow up to 60s for aggregation

/**
 * Run aggregation with error handling and timing.
 */
async function executeAggregation() {
  const startTime = Date.now();
  const result = await runAllAggregations();
  const durationMs = Date.now() - startTime;

  return Response.json({
    success: true,
    aggregated: result,
    durationMs,
    timestamp: new Date().toISOString(),
  });
}

/**
 * GET /api/analytics/aggregate
 *
 * Handler for Vercel Cron. Vercel sends GET requests to cron endpoints.
 * Authenticated via CRON_SECRET (automatically set by Vercel for cron jobs).
 */
export async function GET(request: Request) {
  try {
    // Vercel Cron sends authorization via CRON_SECRET
    const cronSecret = process.env.CRON_SECRET;
    const authHeader = request.headers.get("authorization");

    if (cronSecret) {
      if (authHeader !== `Bearer ${cronSecret}`) {
        return Response.json({ error: "Unauthorized" }, { status: 401 });
      }
    } else {
      // Fall back to AGGREGATION_SECRET if CRON_SECRET not set
      const secret = process.env.AGGREGATION_SECRET;
      if (!secret) {
        return Response.json(
          { error: "Neither CRON_SECRET nor AGGREGATION_SECRET configured" },
          { status: 500 }
        );
      }
      const providedSecret = authHeader?.startsWith("Bearer ")
        ? authHeader.slice(7)
        : null;
      if (providedSecret !== secret) {
        return Response.json({ error: "Unauthorized" }, { status: 401 });
      }
    }

    return await executeAggregation();
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("Aggregation error (cron):", message);
    return Response.json({ error: message }, { status: 500 });
  }
}

/**
 * POST /api/analytics/aggregate
 *
 * Manual trigger for aggregation. Authenticated via AGGREGATION_SECRET.
 */
export async function POST(request: Request) {
  try {
    const secret = process.env.AGGREGATION_SECRET;
    if (!secret) {
      return Response.json(
        { error: "AGGREGATION_SECRET not configured" },
        { status: 500 }
      );
    }

    const authHeader = request.headers.get("authorization");
    const providedSecret = authHeader?.startsWith("Bearer ")
      ? authHeader.slice(7)
      : null;

    if (providedSecret !== secret) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    return await executeAggregation();
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("Aggregation error:", message);
    return Response.json({ error: message }, { status: 500 });
  }
}
