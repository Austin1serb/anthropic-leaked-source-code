import { runAllAggregations } from "@/lib/aggregation";

export const dynamic = "force-dynamic";

/**
 * POST /api/analytics/aggregate
 *
 * Triggers aggregation of all analytics rollups. Designed to be called
 * by a cron job (Vercel Cron or external scheduler).
 *
 * Authentication: requires either a valid admin session or the
 * AGGREGATION_SECRET header matching the env variable.
 */
export async function POST(request: Request) {
  try {
    // Verify authorization via secret key
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

    const startTime = Date.now();
    const result = await runAllAggregations();
    const durationMs = Date.now() - startTime;

    return Response.json({
      success: true,
      aggregated: result,
      durationMs,
      timestamp: new Date().toISOString(),
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("Aggregation error:", message);
    return Response.json({ error: message }, { status: 500 });
  }
}
