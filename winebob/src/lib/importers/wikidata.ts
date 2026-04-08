/**
 * Wikidata Wine Import Pipeline (Phase 3)
 *
 * Imports wines, grape varieties, and wine region data from Wikidata's
 * SPARQL endpoint into the Winebob database.
 *
 * Usage:
 *   npx tsx src/lib/importers/wikidata.ts
 *
 * Can also be imported as a module:
 *   import { runWikidataImport } from "@/lib/importers/wikidata";
 */

import "dotenv/config";
import { PrismaNeonHttp } from "@prisma/adapter-neon";
import { PrismaClient } from "../../generated/prisma/client";
import {
  normalizeWineName,
  normalizeProducerName,
  normalizeGrapeName,
} from "./normalize";

// ---------------------------------------------------------------------------
// Prisma client (standalone — cannot use the Next.js singleton from db.ts
// because this runs as a CLI script with tsx, and the @/ alias resolves
// differently at compile time vs runtime for non-Next entry points.
// We mirror the same adapter pattern used in db.ts.)
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

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const WIKIDATA_SPARQL_ENDPOINT = "https://query.wikidata.org/sparql";
const RATE_LIMIT_MS = 1000; // 1 second between SPARQL queries
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 2000;
const BATCH_SIZE = 100; // Prisma createMany batch size

// ---------------------------------------------------------------------------
// SPARQL Queries
// ---------------------------------------------------------------------------

const QUERY_WINES = `
SELECT ?wine ?wineLabel ?producerLabel ?countryLabel ?regionLabel ?grapeLabel ?inception WHERE {
  ?wine wdt:P31/wdt:P279* wd:Q282.
  OPTIONAL { ?wine wdt:P176 ?producer. }
  OPTIONAL { ?wine wdt:P17 ?country. }
  OPTIONAL { ?wine wdt:P276 ?region. }
  OPTIONAL { ?wine wdt:P186 ?grape. }
  OPTIONAL { ?wine wdt:P571 ?inception. }
  SERVICE wikibase:label { bd:serviceParam wikibase:language "en". }
}
LIMIT 10000
`.trim();

const QUERY_WINE_REGIONS = `
SELECT ?region ?regionLabel ?countryLabel ?coord WHERE {
  ?region wdt:P31/wdt:P279* wd:Q1187580.
  OPTIONAL { ?region wdt:P17 ?country. }
  OPTIONAL { ?region wdt:P625 ?coord. }
  SERVICE wikibase:label { bd:serviceParam wikibase:language "en". }
}
LIMIT 5000
`.trim();

const QUERY_GRAPE_VARIETIES = `
SELECT ?grape ?grapeLabel ?colorLabel ?countryLabel WHERE {
  ?grape wdt:P31/wdt:P279* wd:Q10978.
  OPTIONAL { ?grape wdt:P462 ?color. }
  OPTIONAL { ?grape wdt:P495 ?country. }
  SERVICE wikibase:label { bd:serviceParam wikibase:language "en". }
}
LIMIT 5000
`.trim();

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface SparqlBinding {
  [key: string]: { type: string; value: string } | undefined;
}

interface SparqlResponse {
  results: {
    bindings: SparqlBinding[];
  };
}

interface ParsedWine {
  wikidataId: string;
  name: string;
  producer: string;
  country: string;
  region: string;
  grapes: string[];
  type: string;
  vintage: number | null;
}

interface ImportStats {
  recordsFetched: number;
  recordsCreated: number;
  recordsUpdated: number;
  recordsSkipped: number;
  recordsFailed: number;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Extract Wikidata Q-ID from an entity URI.
 * e.g. "http://www.wikidata.org/entity/Q123" -> "Q123"
 */
function extractQId(uri: string): string {
  const match = uri.match(/Q\d+$/);
  return match ? match[0] : "";
}

/**
 * Check if a label is just a Q-ID (meaning Wikidata had no English label).
 */
function isQId(label: string): boolean {
  return /^Q\d+$/.test(label.trim());
}

/**
 * Get the string value from a SPARQL binding, or empty string.
 */
function val(binding: SparqlBinding, key: string): string {
  return binding[key]?.value ?? "";
}

/**
 * Try to infer wine type from grape color label.
 */
function inferTypeFromColor(colorLabel: string): string {
  const lower = colorLabel.toLowerCase();
  if (lower.includes("red") || lower.includes("noir") || lower.includes("black")) return "red";
  if (lower.includes("white") || lower.includes("blanc") || lower.includes("green") || lower.includes("yellow")) return "white";
  if (lower.includes("pink") || lower.includes("rosé") || lower.includes("rose") || lower.includes("grey") || lower.includes("gris")) return "rosé";
  return "";
}

// ---------------------------------------------------------------------------
// SPARQL Fetch with retry
// ---------------------------------------------------------------------------

async function querySparql(query: string, label: string): Promise<SparqlResponse> {
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      console.log(`  [${label}] Attempt ${attempt}/${MAX_RETRIES}...`);

      const url = new URL(WIKIDATA_SPARQL_ENDPOINT);
      url.searchParams.set("query", query);

      const response = await fetch(url.toString(), {
        headers: {
          Accept: "application/json",
          "User-Agent": "WinebobImporter/1.0 (https://winebob.app; data-import)",
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = (await response.json()) as SparqlResponse;
      console.log(`  [${label}] Got ${data.results.bindings.length} results.`);
      return data;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error(`  [${label}] Attempt ${attempt} failed: ${message}`);

      if (attempt < MAX_RETRIES) {
        const delay = RETRY_DELAY_MS * attempt;
        console.log(`  [${label}] Retrying in ${delay}ms...`);
        await sleep(delay);
      } else {
        throw new Error(`[${label}] All ${MAX_RETRIES} attempts failed. Last error: ${message}`);
      }
    }
  }

  // Unreachable, but TypeScript needs it
  throw new Error("Unreachable");
}

// ---------------------------------------------------------------------------
// Processing
// ---------------------------------------------------------------------------

/**
 * Group raw SPARQL wine bindings by Wikidata Q-ID,
 * collecting multiple grape varieties per wine.
 */
function processWineBindings(bindings: SparqlBinding[]): ParsedWine[] {
  const wineMap = new Map<string, ParsedWine>();

  for (const binding of bindings) {
    const uri = val(binding, "wine");
    const qId = extractQId(uri);
    if (!qId) continue;

    const label = val(binding, "wineLabel");
    // Skip entries with no label or where label is just a Q-ID
    if (!label || isQId(label)) continue;

    const grape = val(binding, "grapeLabel");
    const inception = val(binding, "inception");

    let vintage: number | null = null;
    if (inception) {
      const yearMatch = inception.match(/^(\d{4})/);
      if (yearMatch) {
        vintage = parseInt(yearMatch[1], 10);
      }
    }

    const existing = wineMap.get(qId);
    if (existing) {
      // Add grape if not already present and not a Q-ID
      if (grape && !isQId(grape) && !existing.grapes.includes(normalizeGrapeName(grape))) {
        existing.grapes.push(normalizeGrapeName(grape));
      }
    } else {
      const grapes: string[] = [];
      if (grape && !isQId(grape)) {
        grapes.push(normalizeGrapeName(grape));
      }

      wineMap.set(qId, {
        wikidataId: qId,
        name: normalizeWineName(label),
        producer: normalizeProducerName(val(binding, "producerLabel") || "Unknown"),
        country: val(binding, "countryLabel") || "Unknown",
        region: val(binding, "regionLabel") || "Unknown",
        grapes,
        type: "red", // default, will be refined if grape color info available
        vintage,
      });
    }
  }

  return Array.from(wineMap.values());
}

/**
 * Build a map of grape -> color from the grape varieties query,
 * used to infer wine type.
 */
function buildGrapeColorMap(bindings: SparqlBinding[]): Map<string, string> {
  const map = new Map<string, string>();

  for (const binding of bindings) {
    const label = val(binding, "grapeLabel");
    const color = val(binding, "colorLabel");
    if (label && !isQId(label) && color && !isQId(color)) {
      const normalizedGrape = normalizeGrapeName(label);
      const inferredType = inferTypeFromColor(color);
      if (inferredType) {
        map.set(normalizedGrape.toLowerCase(), inferredType);
      }
    }
  }

  return map;
}

/**
 * Refine wine types using grape color data.
 */
function refineWineTypes(wines: ParsedWine[], grapeColorMap: Map<string, string>): void {
  for (const wine of wines) {
    if (wine.grapes.length > 0) {
      // Use the first grape's color as the wine type
      const firstGrape = wine.grapes[0].toLowerCase();
      const inferred = grapeColorMap.get(firstGrape);
      if (inferred) {
        wine.type = inferred;
      }
    }
  }
}

// ---------------------------------------------------------------------------
// Database operations
// ---------------------------------------------------------------------------

async function importWines(
  prisma: PrismaClient,
  wines: ParsedWine[],
  importBatchId: string
): Promise<ImportStats> {
  const stats: ImportStats = {
    recordsFetched: wines.length,
    recordsCreated: 0,
    recordsUpdated: 0,
    recordsSkipped: 0,
    recordsFailed: 0,
  };

  // Load existing wines for dedup — only wines whose name appears in the
  // current import batch (avoids loading the entire wines table into memory).
  console.log("  Loading existing wines for deduplication...");
  const batchNames = [...new Set(wines.map((w) => w.name))];
  const existingSet = new Set<string>();

  // Query in batches of 500 names to avoid overly large IN clauses
  const NAME_BATCH_SIZE = 500;
  for (let i = 0; i < batchNames.length; i += NAME_BATCH_SIZE) {
    const nameBatch = batchNames.slice(i, i + NAME_BATCH_SIZE);
    const existingWines = await prisma.wine.findMany({
      where: { name: { in: nameBatch } },
      select: { name: true, producer: true },
    });
    for (const w of existingWines) {
      existingSet.add(`${w.name.toLowerCase()}|${w.producer.toLowerCase()}`);
    }
  }
  console.log(`  Found ${existingSet.size} existing wines matching this batch.`);

  // Filter out duplicates
  const toInsert: ParsedWine[] = [];
  for (const wine of wines) {
    const key = `${wine.name.toLowerCase()}|${wine.producer.toLowerCase()}`;
    if (existingSet.has(key)) {
      stats.recordsSkipped++;
    } else {
      toInsert.push(wine);
      // Add to set so we don't insert duplicates from the same batch
      existingSet.add(key);
    }
  }

  console.log(`  ${toInsert.length} new wines to insert, ${stats.recordsSkipped} skipped (duplicates).`);

  // Insert wines one-by-one (Neon HTTP adapter doesn't support transactions,
  // so createMany fails. Individual creates are slower but reliable.)
  for (let i = 0; i < toInsert.length; i++) {
    const wine = toInsert[i];
    try {
      await prisma.wine.create({
        data: {
          name: wine.name,
          producer: wine.producer,
          vintage: wine.vintage,
          grapes: wine.grapes,
          region: wine.region,
          country: wine.country,
          type: wine.type,
          source: "wikidata",
          confidence: 0.7,
          externalIds: { wikidata: wine.wikidataId },
          importBatchId,
          isPublic: true,
        },
      });
      stats.recordsCreated++;
    } catch {
      stats.recordsFailed++;
    }

    // Progress log every 50 wines
    if ((i + 1) % 50 === 0 || i === toInsert.length - 1) {
      console.log(`  Progress: ${i + 1}/${toInsert.length} (${stats.recordsCreated} created, ${stats.recordsFailed} failed)`);
    }
  }

  return stats;
}

async function importGrapeVarieties(
  prisma: PrismaClient,
  bindings: SparqlBinding[]
): Promise<{ created: number; skipped: number }> {
  const result = { created: 0, skipped: 0 };

  // Deduplicate grapes by normalized name
  const grapeMap = new Map<
    string,
    { name: string; color: string; country: string; wikidataId: string }
  >();

  for (const binding of bindings) {
    const label = val(binding, "grapeLabel");
    if (!label || isQId(label)) continue;

    const name = normalizeGrapeName(label);
    const key = name.toLowerCase();

    if (grapeMap.has(key)) continue;

    const colorLabel = val(binding, "colorLabel");
    const country = val(binding, "countryLabel");
    const uri = val(binding, "grape");
    const qId = extractQId(uri);

    let color = "red"; // default
    if (colorLabel && !isQId(colorLabel)) {
      const inferred = inferTypeFromColor(colorLabel);
      if (inferred) color = inferred;
    }

    grapeMap.set(key, {
      name,
      color,
      country: country && !isQId(country) ? country : "",
      wikidataId: qId,
    });
  }

  console.log(`  Processing ${grapeMap.size} unique grape varieties...`);

  // Upsert each grape variety
  for (const grape of Array.from(grapeMap.values())) {
    try {
      await prisma.grapeVariety.upsert({
        where: { name: grape.name },
        create: {
          name: grape.name,
          color: grape.color,
          originCountry: grape.country || null,
          aliases: [],
        },
        update: {
          // Update color/country if we have better data
          color: grape.color,
          originCountry: grape.country || undefined,
        },
      });
      result.created++;
    } catch {
      result.skipped++;
    }
  }

  return result;
}

// ---------------------------------------------------------------------------
// Main import pipeline
// ---------------------------------------------------------------------------

export interface WikidataImportResult {
  importBatchId: string;
  stats: ImportStats;
  grapesImported: number;
}

export async function runWikidataImport(): Promise<WikidataImportResult> {
  const prisma = createPrismaClient();

  console.log("=== Wikidata Wine Import Pipeline ===");
  console.log(`Started at: ${new Date().toISOString()}\n`);

  // 1. Create ImportBatch
  console.log("Step 1: Creating import batch...");
  const batch = await prisma.importBatch.create({
    data: {
      source: "wikidata",
      status: "running",
      createdBy: "system",
      metadata: {
        sparqlEndpoint: WIKIDATA_SPARQL_ENDPOINT,
        queries: ["wines", "wine_regions", "grape_varieties"],
      },
    },
  });
  console.log(`  Import batch created: ${batch.id}\n`);

  let stats: ImportStats = {
    recordsFetched: 0,
    recordsCreated: 0,
    recordsUpdated: 0,
    recordsSkipped: 0,
    recordsFailed: 0,
  };
  let grapesImported = 0;

  try {
    // 2. Query Wikidata SPARQL endpoint
    console.log("Step 2: Querying Wikidata SPARQL endpoint...");

    console.log("\n  Query 1: Wines...");
    const wineResults = await querySparql(QUERY_WINES, "Wines");

    await sleep(RATE_LIMIT_MS);

    console.log("\n  Query 2: Wine regions...");
    const _regionResults = await querySparql(QUERY_WINE_REGIONS, "Wine Regions");

    await sleep(RATE_LIMIT_MS);

    console.log("\n  Query 3: Grape varieties...");
    const grapeResults = await querySparql(QUERY_GRAPE_VARIETIES, "Grape Varieties");

    // 3. Process results
    console.log("\nStep 3: Processing results...");

    const grapeColorMap = buildGrapeColorMap(grapeResults.results.bindings);
    console.log(`  Built grape color map with ${grapeColorMap.size} entries.`);

    const wines = processWineBindings(wineResults.results.bindings);
    console.log(`  Processed ${wines.length} unique wines from ${wineResults.results.bindings.length} SPARQL rows.`);

    refineWineTypes(wines, grapeColorMap);
    console.log("  Refined wine types using grape color data.");

    // 4 & 5. Dedup + insert wines
    console.log("\nStep 4: Importing wines...");
    stats = await importWines(prisma, wines, batch.id);

    // 7. Import grape varieties
    console.log("\nStep 5: Importing grape varieties...");
    const grapeStats = await importGrapeVarieties(
      prisma,
      grapeResults.results.bindings
    );
    grapesImported = grapeStats.created;
    console.log(`  Grapes imported: ${grapeStats.created}, skipped: ${grapeStats.skipped}`);

    // 6. Update ImportBatch with final counts
    console.log("\nStep 6: Finalizing import batch...");
    await prisma.importBatch.update({
      where: { id: batch.id },
      data: {
        status: "completed",
        completedAt: new Date(),
        recordsFetched: stats.recordsFetched,
        recordsCreated: stats.recordsCreated,
        recordsUpdated: stats.recordsUpdated,
        recordsSkipped: stats.recordsSkipped,
        recordsFailed: stats.recordsFailed,
        metadata: {
          sparqlEndpoint: WIKIDATA_SPARQL_ENDPOINT,
          queries: ["wines", "wine_regions", "grape_varieties"],
          grapesImported,
          wineBindingsTotal: wineResults.results.bindings.length,
        },
      },
    });

    console.log("\n=== Import Complete ===");
    console.log(`  Wines fetched:  ${stats.recordsFetched}`);
    console.log(`  Wines created:  ${stats.recordsCreated}`);
    console.log(`  Wines skipped:  ${stats.recordsSkipped}`);
    console.log(`  Wines failed:   ${stats.recordsFailed}`);
    console.log(`  Grapes imported: ${grapesImported}`);
    console.log(`  Batch ID:       ${batch.id}`);
    console.log(`  Completed at:   ${new Date().toISOString()}`);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`\n!!! Import failed: ${message}`);

    await prisma.importBatch.update({
      where: { id: batch.id },
      data: {
        status: "failed",
        completedAt: new Date(),
        recordsFetched: stats.recordsFetched,
        recordsCreated: stats.recordsCreated,
        recordsUpdated: stats.recordsUpdated,
        recordsSkipped: stats.recordsSkipped,
        recordsFailed: stats.recordsFailed,
        errorLog: message,
      },
    });

    throw err;
  }

  return {
    importBatchId: batch.id,
    stats,
    grapesImported,
  };
}

// ---------------------------------------------------------------------------
// CLI entry point
// ---------------------------------------------------------------------------

const isMainModule =
  typeof process !== "undefined" &&
  process.argv[1] &&
  (process.argv[1].endsWith("wikidata.ts") ||
    process.argv[1].endsWith("wikidata.js"));

if (isMainModule) {
  runWikidataImport()
    .then((result) => {
      console.log("\nDone. Result:", JSON.stringify(result, null, 2));
      process.exit(0);
    })
    .catch((err) => {
      console.error("Fatal error:", err);
      process.exit(1);
    });
}
