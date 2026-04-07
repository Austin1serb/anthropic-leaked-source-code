import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { runWikidataImport } from "@/lib/importers/wikidata";
import { runOpenFoodFactsImport } from "@/lib/importers/openfoodfacts";
import { runTtbImport } from "@/lib/importers/ttb";

export const dynamic = "force-dynamic";

const VALID_SOURCES = ["wikidata", "openfoodfacts", "ttb"] as const;
type ImportSource = (typeof VALID_SOURCES)[number];

/**
 * POST /api/import
 *
 * Trigger a data import from one of the supported sources.
 * Requires authentication + IMPORT_SECRET env variable.
 *
 * Body: { source: "wikidata" | "openfoodfacts" | "ttb", options?: { csvPath?: string } }
 * Returns: { importBatchId: string }
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

    // Create a placeholder batch immediately so we can return the ID
    const batch = await prisma.importBatch.create({
      data: {
        source,
        status: "running",
        createdBy: session.user.id,
        metadata: { triggeredVia: "api", options: options ?? null },
      },
    });

    // Fire off the import in the background (don't await)
    const importPromise = (async () => {
      try {
        switch (source as ImportSource) {
          case "wikidata":
            await runWikidataImport();
            break;
          case "openfoodfacts":
            await runOpenFoodFactsImport();
            break;
          case "ttb":
            await runTtbImport(options);
            break;
        }

        // Mark the trigger batch as completed (the actual import creates
        // its own batch internally, but we update this trigger record too)
        await prisma.importBatch.update({
          where: { id: batch.id },
          data: {
            status: "completed",
            completedAt: new Date(),
          },
        });
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        await prisma.importBatch.update({
          where: { id: batch.id },
          data: {
            status: "failed",
            completedAt: new Date(),
            errorLog: message,
          },
        });
      }
    })();

    // Prevent unhandled promise rejection warnings
    importPromise.catch(() => {});

    return Response.json({ importBatchId: batch.id }, { status: 202 });
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
