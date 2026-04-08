/**
 * Open Food Facts Wine Import Pipeline
 *
 * Fetches wine products from the Open Food Facts API and imports them
 * into the Winebob database. Handles pagination, deduplication, rate
 * limiting, and retry logic.
 *
 * Usage:
 *   npx tsx src/lib/importers/openfoodfacts.ts
 */

import "dotenv/config";
import { PrismaNeonHttp } from "@prisma/adapter-neon";
import { PrismaClient } from "../../generated/prisma/client";

// ---------------------------------------------------------------------------
// Prisma client (standalone — for CLI usage with `npx tsx`)
// ---------------------------------------------------------------------------

function createPrismaClient(): PrismaClient {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    throw new Error("DATABASE_URL is not set");
  }
  const adapter = new PrismaNeonHttp(dbUrl, {});
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return new PrismaClient({ adapter } as any);
}

const prisma = createPrismaClient();

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface OFFProduct {
  product_name?: string;
  brands?: string;
  code?: string;
  categories_tags?: string[];
  origins?: string;
  countries?: string;
  labels?: string;
  quantity?: string;
  nutriments?: { alcohol_100g?: number };
  image_url?: string;
  generic_name?: string;
  ingredients_text?: string;
}

interface OFFSearchResponse {
  count: number;
  page: number;
  page_count: number;
  page_size: number;
  products: OFFProduct[];
}

interface ImportStats {
  fetched: number;
  created: number;
  skipped: number;
  failed: number;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const BASE_URL = "https://world.openfoodfacts.org";
const PAGE_SIZE = 100;
const MAX_PAGES_PER_CATEGORY = 50;
const BATCH_INSERT_SIZE = 50;
const REQUEST_DELAY_MS = 1050; // slightly over 1s to respect rate limits
const MAX_RETRIES = 3;
const SOURCE = "openfoodfacts";
const CONFIDENCE = 0.6;

const WINE_CATEGORIES = [
  "wines",
  "red wines",
  "white wines",
  "rosé wines",
  "sparkling wines",
  "champagne",
  "dessert wines",
  "fortified wines",
];

// ---------------------------------------------------------------------------
// Normalization helpers (inline since normalize.ts does not exist yet)
// ---------------------------------------------------------------------------

function cleanString(s: string | undefined | null): string {
  if (!s) return "";
  return s.replace(/\s+/g, " ").trim();
}

function titleCase(s: string): string {
  return s
    .toLowerCase()
    .replace(/(^|\s)\S/g, (ch) => ch.toUpperCase());
}

function extractFirstBrand(brands: string | undefined): string {
  if (!brands) return "";
  // Brands field often uses comma-separated values
  const first = brands.split(/[,;]/).map((b) => b.trim()).filter(Boolean)[0];
  return first ? titleCase(cleanString(first)) : "";
}

function inferWineType(categoryTags: string[] | undefined): string {
  if (!categoryTags || categoryTags.length === 0) return "red"; // default
  const joined = categoryTags.join(" ").toLowerCase();
  if (joined.includes("sparkling") || joined.includes("champagne") || joined.includes("cava") || joined.includes("prosecco") || joined.includes("cremant")) {
    return "sparkling";
  }
  if (joined.includes("fortified") || joined.includes("port") || joined.includes("sherry") || joined.includes("madeira") || joined.includes("marsala")) {
    return "fortified";
  }
  if (joined.includes("dessert") || joined.includes("sweet") || joined.includes("ice-wine") || joined.includes("sauternes") || joined.includes("tokaji")) {
    return "dessert";
  }
  if (joined.includes("rosé") || joined.includes("rose-wine") || joined.includes("rose ")) {
    return "rosé";
  }
  if (joined.includes("white") || joined.includes("blanc")) {
    return "white";
  }
  if (joined.includes("orange")) {
    return "orange";
  }
  // Default to red
  return "red";
}

function extractCountry(countriesField: string | undefined): string {
  if (!countriesField) return "Unknown";
  // Countries field may be comma-separated or contain "en:france" style tags
  const cleaned = countriesField
    .split(/[,;]/)
    .map((c) => c.replace(/^[a-z]{2}:/, "").trim())
    .filter(Boolean)[0];
  return cleaned ? titleCase(cleaned) : "Unknown";
}

function extractRegion(originsField: string | undefined): string {
  if (!originsField) return "Unknown";
  const cleaned = originsField
    .split(/[,;]/)
    .map((r) => r.replace(/^[a-z]{2}:/, "").trim())
    .filter(Boolean)[0];
  return cleaned ? titleCase(cleaned) : "Unknown";
}

function extractGrapes(
  ingredientsText: string | undefined,
  genericName: string | undefined,
): string[] {
  const source = [ingredientsText, genericName].filter(Boolean).join(" ").toLowerCase();
  if (!source) return [];

  // Common grape varieties to look for
  const knownGrapes = [
    "cabernet sauvignon", "merlot", "pinot noir", "syrah", "shiraz",
    "tempranillo", "sangiovese", "nebbiolo", "grenache", "garnacha",
    "malbec", "zinfandel", "primitivo", "mourvèdre", "monastrell",
    "barbera", "gamay", "carménère", "petit verdot", "cabernet franc",
    "chardonnay", "sauvignon blanc", "riesling", "pinot grigio",
    "pinot gris", "gewürztraminer", "viognier", "chenin blanc",
    "sémillon", "semillon", "muscadet", "muscat", "moscato",
    "grüner veltliner", "albariño", "albarino", "verdejo",
    "torrontés", "marsanne", "roussanne", "trebbiano", "vermentino",
    "garganega", "cortese", "fiano", "greco", "arneis", "prosecco",
    "glera", "cava", "touriga nacional", "tinta roriz",
  ];

  const found: string[] = [];
  for (const grape of knownGrapes) {
    if (source.includes(grape)) {
      found.push(titleCase(grape));
    }
  }
  return Array.from(new Set(found));
}

function extractAbv(nutriments: OFFProduct["nutriments"]): number | null {
  if (!nutriments?.alcohol_100g) return null;
  const val = Number(nutriments.alcohol_100g);
  // Sanity check: ABV should be between 0 and 25 for wine
  if (isNaN(val) || val < 0 || val > 25) return null;
  return Math.round(val * 10) / 10; // one decimal
}

// ---------------------------------------------------------------------------
// Rate-limited fetcher with retry
// ---------------------------------------------------------------------------

let lastRequestTime = 0;

async function rateLimitedFetch(url: string): Promise<Response> {
  const now = Date.now();
  const elapsed = now - lastRequestTime;
  if (elapsed < REQUEST_DELAY_MS) {
    await sleep(REQUEST_DELAY_MS - elapsed);
  }
  lastRequestTime = Date.now();

  let lastError: Error | null = null;
  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      const res = await fetch(url, {
        headers: {
          "User-Agent": "Winebob Wine App - wine data import - contact@winebob.com",
        },
      });
      if (res.status === 429 || res.status >= 500) {
        const backoff = Math.pow(2, attempt + 1) * 1000;
        console.warn(`  [retry] HTTP ${res.status} — waiting ${backoff}ms (attempt ${attempt + 1}/${MAX_RETRIES})`);
        await sleep(backoff);
        continue;
      }
      return res;
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      const backoff = Math.pow(2, attempt + 1) * 1000;
      console.warn(`  [retry] Network error — waiting ${backoff}ms (attempt ${attempt + 1}/${MAX_RETRIES}): ${lastError.message}`);
      await sleep(backoff);
    }
  }
  throw lastError ?? new Error("Fetch failed after retries");
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ---------------------------------------------------------------------------
// Search one page of results
// ---------------------------------------------------------------------------

async function fetchPage(category: string, page: number): Promise<OFFSearchResponse> {
  // Use the Open Food Facts search endpoint with search_terms for broad matching
  const url =
    `${BASE_URL}/cgi/search.pl?search_terms=${encodeURIComponent(category)}` +
    `&page_size=${PAGE_SIZE}&page=${page}&json=true`;

  const res = await rateLimitedFetch(url);
  if (!res.ok) {
    throw new Error(`OFF API returned HTTP ${res.status} for category "${category}" page ${page}`);
  }
  return (await res.json()) as OFFSearchResponse;
}

// ---------------------------------------------------------------------------
// Map OFF product to our Wine create input
// ---------------------------------------------------------------------------

function mapProduct(product: OFFProduct, importBatchId: string) {
  const name = cleanString(product.product_name);
  const producer = extractFirstBrand(product.brands);

  if (!name) return null; // skip unnamed products

  return {
    name,
    producer: producer || "Unknown",
    barcode: product.code || null,
    country: extractCountry(product.countries),
    region: extractRegion(product.origins),
    type: inferWineType(product.categories_tags),
    grapes: extractGrapes(product.ingredients_text, product.generic_name),
    abv: extractAbv(product.nutriments),
    labelImage: product.image_url || null,
    source: SOURCE,
    confidence: CONFIDENCE,
    externalIds: product.code ? { openfoodfacts: product.code } : undefined,
    importBatchId,
  };
}

// ---------------------------------------------------------------------------
// Dedup check
// ---------------------------------------------------------------------------

async function isDuplicate(
  barcode: string | null,
  name: string,
  producer: string,
): Promise<boolean> {
  // Check barcode first (fast path)
  if (barcode) {
    const existing = await prisma.wine.findFirst({
      where: { barcode },
      select: { id: true },
    });
    if (existing) return true;
  }

  // Check name + producer match
  const existing = await prisma.wine.findFirst({
    where: { name, producer },
    select: { id: true },
  });
  return !!existing;
}

// ---------------------------------------------------------------------------
// Batch insert wines
// ---------------------------------------------------------------------------

async function batchInsertWines(
  wines: ReturnType<typeof mapProduct>[],
): Promise<{ created: number; failed: number }> {
  let created = 0;
  let failed = 0;

  // Filter out nulls
  const valid = wines.filter(
    (w): w is NonNullable<typeof w> => w !== null,
  );

  for (const wine of valid) {
    try {
      await prisma.wine.create({ data: wine });
      created++;
    } catch (err) {
      failed++;
      const msg = err instanceof Error ? err.message : String(err);
      // Log but continue — partial failures are expected
      if (!msg.includes("Unique constraint")) {
        console.warn(`  [skip] Failed to insert "${wine.name}": ${msg}`);
      }
    }
  }
  return { created, failed };
}

// ---------------------------------------------------------------------------
// Main import function
// ---------------------------------------------------------------------------

export async function runOpenFoodFactsImport(): Promise<{
  batchId: string;
  stats: ImportStats;
}> {
  // 1. Create ImportBatch
  const batch = await prisma.importBatch.create({
    data: {
      source: SOURCE,
      status: "running",
      createdBy: "system",
      metadata: { categories: WINE_CATEGORIES, pageSize: PAGE_SIZE, maxPagesPerCategory: MAX_PAGES_PER_CATEGORY },
    },
  });

  console.log(`[OFF Import] Started batch ${batch.id}`);

  const stats: ImportStats = { fetched: 0, created: 0, skipped: 0, failed: 0 };

  // Track barcodes seen across all categories to prevent cross-category
  // duplicates (e.g., a wine appearing in both "wines" and "red wines")
  const seenBarcodes = new Set<string>();

  try {
    for (const category of WINE_CATEGORIES) {
      console.log(`\n[OFF Import] Searching category: "${category}"`);
      let pendingBatch: ReturnType<typeof mapProduct>[] = [];

      for (let page = 1; page <= MAX_PAGES_PER_CATEGORY; page++) {
        let response: OFFSearchResponse;
        try {
          response = await fetchPage(category, page);
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err);
          console.error(`  [error] Failed to fetch page ${page} for "${category}": ${msg}`);
          stats.failed++;
          break;
        }

        const products = response.products ?? [];
        if (products.length === 0) {
          console.log(`  Page ${page}: no more products. Moving to next category.`);
          break;
        }

        stats.fetched += products.length;

        let newCount = 0;
        let skipCount = 0;

        for (const product of products) {
          try {
            const mapped = mapProduct(product, batch.id);
            if (!mapped) {
              skipCount++;
              stats.skipped++;
              continue;
            }

            // Cross-category dedup: skip if we've already seen this barcode
            // in a previous category during this import run
            if (mapped.barcode && seenBarcodes.has(mapped.barcode)) {
              skipCount++;
              stats.skipped++;
              continue;
            }

            const dup = await isDuplicate(mapped.barcode, mapped.name, mapped.producer);
            if (dup) {
              skipCount++;
              stats.skipped++;
              if (mapped.barcode) seenBarcodes.add(mapped.barcode);
              continue;
            }

            pendingBatch.push(mapped);
            newCount++;
            if (mapped.barcode) seenBarcodes.add(mapped.barcode);

            // Flush batch when it reaches the target size
            if (pendingBatch.length >= BATCH_INSERT_SIZE) {
              const result = await batchInsertWines(pendingBatch);
              stats.created += result.created;
              stats.failed += result.failed;
              pendingBatch = [];
            }
          } catch (err) {
            stats.failed++;
            const msg = err instanceof Error ? err.message : String(err);
            console.warn(`  [skip] Error processing product "${product.product_name}": ${msg}`);
          }
        }

        const totalPages = Math.min(
          MAX_PAGES_PER_CATEGORY,
          Math.ceil((response.count || 0) / PAGE_SIZE),
        );

        console.log(
          `  Page ${page}/${totalPages} for '${category}': ${stats.fetched} products fetched, ${newCount} new wines, ${skipCount} skipped`,
        );

        // If we've gone past the total available pages, stop
        if (page * PAGE_SIZE >= (response.count || 0)) {
          break;
        }
      }

      // Flush remaining batch for this category
      if (pendingBatch.length > 0) {
        const result = await batchInsertWines(pendingBatch);
        stats.created += result.created;
        stats.failed += result.failed;
        pendingBatch = [];
      }
    }

    // 6. Update ImportBatch with final counts
    await prisma.importBatch.update({
      where: { id: batch.id },
      data: {
        status: "completed",
        completedAt: new Date(),
        recordsFetched: stats.fetched,
        recordsCreated: stats.created,
        recordsSkipped: stats.skipped,
        recordsFailed: stats.failed,
      },
    });

    console.log(`\n[OFF Import] Completed batch ${batch.id}`);
    console.log(
      `  Fetched: ${stats.fetched} | Created: ${stats.created} | Skipped: ${stats.skipped} | Failed: ${stats.failed}`,
    );

    return { batchId: batch.id, stats };
  } catch (err) {
    // Cleanup: mark batch as failed
    const errorMessage = err instanceof Error ? err.message : String(err);
    console.error(`\n[OFF Import] FATAL: ${errorMessage}`);

    await prisma.importBatch.update({
      where: { id: batch.id },
      data: {
        status: "failed",
        completedAt: new Date(),
        recordsFetched: stats.fetched,
        recordsCreated: stats.created,
        recordsSkipped: stats.skipped,
        recordsFailed: stats.failed,
        errorLog: errorMessage,
      },
    });

    throw err;
  }
}

// ---------------------------------------------------------------------------
// CLI entry point
// ---------------------------------------------------------------------------

const isMainModule =
  typeof process !== "undefined" &&
  process.argv[1] &&
  (process.argv[1].endsWith("openfoodfacts.ts") ||
    process.argv[1].endsWith("openfoodfacts.js"));

if (isMainModule) {
  runOpenFoodFactsImport()
    .then(({ batchId, stats }) => {
      console.log(`\nDone. Batch ID: ${batchId}`);
      console.log(`Stats: ${JSON.stringify(stats)}`);
      process.exit(0);
    })
    .catch((err) => {
      console.error("Import failed:", err);
      process.exit(1);
    });
}
