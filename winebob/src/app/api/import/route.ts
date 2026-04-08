import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";

export const dynamic = "force-dynamic";

const VALID_SOURCES = ["wikidata", "openfoodfacts", "ttb"] as const;
type ImportSource = (typeof VALID_SOURCES)[number];

/**
 * POST /api/import
 *
 * Queue a data import from one of the supported sources.
 * Requires authentication + IMPORT_SECRET env variable.
 *
 * Body: { source: "wikidata" | "openfoodfacts" | "ttb", options?: { csvPath?: string } }
 * Returns: { importBatchId: string, status: "queued" }
 *
 * IMPORTANT: This endpoint does NOT run the import inline. In serverless
 * environments (Vercel, AWS Lambda, etc.), fire-and-forget background work
 * is unreliable — the runtime may freeze or terminate the function as soon
 * as the HTTP response is sent, killing any in-flight promises.
 *
 * Instead, this endpoint creates an ImportBatch record with status "queued"
 * and returns immediately. The actual import should be triggered via:
 *   - CLI: `npx tsx src/lib/importers/wikidata.ts`
 *   - A separate long-running worker process
 *   - A cron job or task queue (e.g., Inngest, QStash, BullMQ)
 */
export async function POST(request: Request) {
  try {
    // Auth check
    const session = await auth();
    if (!session?.user?.id) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    // IMPORT_SECRET check
    const importSecret = process.env.IMPORT_SECRET;
    if (!importSecret) {
      return Response.json(
        { error: "IMPORT_SECRET not configured on server" },
        { status: 500 }
      );
    }

    const authHeader = request.headers.get("x-import-secret");
    if (authHeader !== importSecret) {
      return Response.json({ error: "Invalid import secret" }, { status: 403 });
    }

    const body = await request.json();
    const { source, options } = body as {
      source?: string;
      options?: { csvPath?: string };
    };

    if (!source || !VALID_SOURCES.includes(source as ImportSource)) {
      return Response.json(
        {
          error: `Invalid source. Must be one of: ${VALID_SOURCES.join(", ")}`,
        },
        { status: 400 }
      );
    }

    // Create a queued batch record. A worker or CLI command will pick it up.
    // Fire-and-forget does NOT work in serverless — the runtime will kill the
    // background promise as soon as the response is sent.
    const batch = await prisma.importBatch.create({
      data: {
        source,
        status: "queued",
        createdBy: session.user.id,
        metadata: { triggeredVia: "api", options: options ?? null },
      },
    });

    return Response.json(
      {
        importBatchId: batch.id,
        status: "queued",
        message:
          "Import has been queued. Run the import via CLI " +
          `(\`npx tsx src/lib/importers/${source}.ts\`) or a background worker.`,
      },
      { status: 202 }
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return Response.json({ error: message }, { status: 500 });
  }
}

/**
 * GET /api/import?batchId=xxx
 *
 * Check the status of an import batch.
 * Requires authentication + IMPORT_SECRET env variable.
 */
export async function GET(request: Request) {
  try {
    // Auth check
    const session = await auth();
    if (!session?.user?.id) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    // IMPORT_SECRET check
    const importSecret = process.env.IMPORT_SECRET;
    if (!importSecret) {
      return Response.json(
        { error: "IMPORT_SECRET not configured on server" },
        { status: 500 }
      );
    }

    const authHeader = request.headers.get("x-import-secret");
    if (authHeader !== importSecret) {
      return Response.json({ error: "Invalid import secret" }, { status: 403 });
    }

    const url = new URL(request.url);
    const batchId = url.searchParams.get("batchId");

    if (!batchId) {
      return Response.json(
        { error: "batchId query parameter is required" },
        { status: 400 }
      );
    }

    const batch = await prisma.importBatch.findUnique({
      where: { id: batchId },
      select: {
        id: true,
        source: true,
        status: true,
        startedAt: true,
        completedAt: true,
        recordsFetched: true,
        recordsCreated: true,
        recordsUpdated: true,
        recordsSkipped: true,
        recordsFailed: true,
        errorLog: true,
        metadata: true,
      },
    });

    if (!batch) {
      return Response.json({ error: "Batch not found" }, { status: 404 });
    }

    return Response.json(batch);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return Response.json({ error: message }, { status: 500 });
  }
}
