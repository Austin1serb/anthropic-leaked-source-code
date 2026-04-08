/**
 * US TTB COLA (Certificate of Label Approval) Import Pipeline
 *
 * Imports wine label data from the TTB Public COLA Registry into the
 * Winebob database. Supports both the TTB search API and CSV bulk
 * download fallback.
 *
 * Usage:
 *   npx tsx src/lib/importers/ttb.ts
 *   npx tsx src/lib/importers/ttb.ts --csv /path/to/cola_data.csv
 *
 * Can also be imported as a module:
 *   import { runTtbImport } from "@/lib/importers/ttb";
 */

import "dotenv/config";
import { createReadStream } from "fs";
import { createInterface } from "readline";
import { PrismaNeonHttp } from "@prisma/adapter-neon";
import { PrismaClient } from "../../generated/prisma/client";
import {
  normalizeWineName,
  normalizeProducerName,
  normalizeGrapeName,
  generateWineFingerprint,
} from "./normalize";

// ---------------------------------------------------------------------------
// Prisma client (standalone — mirrors wikidata.ts pattern for CLI usage)
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

// WARNING: The TTB Public COLA API endpoint below is EXPERIMENTAL/UNTESTED.
// The TTB does not publish a stable public REST API for COLA data. This URL
// is a best-guess based on their website; it may not exist or may change
// without notice. The RELIABLE path for bulk import is CSV mode:
//   npx tsx src/lib/importers/ttb.ts --csv /path/to/cola_data.csv
// CSV bulk downloads are available at: https://www.ttb.gov/foia/xls/frl-spirits-702010.zip
const TTB_API_URL = "https://www.ttb.gov/public-cola/api/search";
const RATE_LIMIT_MS = 500;
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 2000;
const BATCH_SIZE = 100;
const API_PAGE_SIZE = 100;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface TtbApiRecord {
  permitId?: string;
  serialNumber?: string;
  brandName?: string;
  fancifulName?: string;
  classType?: string;
  appellation?: string;
  grapePct?: Array<{ grape: string; percentage: number }>;
  alcoholContent?: string;
  netContents?: string;
  origin?: string;
  vintageDate?: string;
  approvalDate?: string;
}

interface TtbApiResponse {
  totalResults?: number;
  results?: TtbApiRecord[];
}

interface ParsedTtbWine {
  serialNumber: string;
  name: string;
  producer: string;
  vintage: number | null;
  grapes: string[];
  region: string;
  country: string;
  appellation: string;
  type: string;
  abv: number | null;
  fingerprint: string;
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
 * Parse vintage year from a date string or year string.
 * Handles formats like "2020", "2020-01-01", "01/01/2020", etc.
 */
function parseVintageYear(dateStr: string | undefined | null): number | null {
  if (!dateStr) return null;
  const trimmed = dateStr.trim();
  if (!trimmed) return null;

  // Try direct 4-digit year
  const yearOnly = trimmed.match(/^(\d{4})$/);
  if (yearOnly) {
    const year = parseInt(yearOnly[1], 10);
    if (year >= 1900 && year <= 2100) return year;
  }

  // Try extracting year from date formats
  const yearInDate = trimmed.match(/(\d{4})/);
  if (yearInDate) {
    const year = parseInt(yearInDate[1], 10);
    if (year >= 1900 && year <= 2100) return year;
  }

  return null;
}

/**
 * Parse ABV from a string like "12.5%", "12.5", "12.5% by volume", etc.
 */
function parseAbv(content: string | undefined | null): number | null {
  if (!content) return null;
  const match = content.match(/([\d.]+)\s*%?/);
  if (match) {
    const val = parseFloat(match[1]);
    if (!isNaN(val) && val > 0 && val <= 100) return val;
  }
  return null;
}

// TTB class/type numeric codes (when classType is a code rather than text).
// See: https://www.ttb.gov/images/pdfs/p51908.pdf
const TTB_CLASS_CODES: Record<string, string> = {
  "2020": "red",       // Table Wine
  "2021": "red",       // Table Wine - Red
  "2022": "white",     // Table Wine - White
  "2023": "rosé",      // Table Wine - Rosé
  "2030": "dessert",   // Dessert Wine
  "2040": "sparkling", // Sparkling Wine / Champagne
  "2050": "fortified", // Fortified Wine
  "2060": "dessert",   // Special Natural Wine
  "2070": "red",       // Aperitif Wine
};

/**
 * Infer wine type from TTB classType string or numeric code.
 */
function inferWineType(classType: string | undefined | null): string {
  if (!classType) return "red"; // default

  const trimmed = classType.trim();

  // Fallback: if classType is a numeric code, use the code mapping
  if (/^\d+$/.test(trimmed)) {
    return TTB_CLASS_CODES[trimmed] ?? "red";
  }

  const upper = trimmed.toUpperCase();

  if (upper.includes("SPARKLING") || upper.includes("CHAMPAGNE")) {
    return "sparkling";
  }
  if (
    upper.includes("DESSERT") ||
    upper.includes("SHERRY") ||
    upper.includes("PORT") ||
    upper.includes("MADEIRA") ||
    upper.includes("MARSALA") ||
    upper.includes("MUSCAT") ||
    upper.includes("TOKAY")
  ) {
    return "dessert";
  }
  if (upper.includes("FORTIFIED")) {
    return "fortified";
  }

  // For TABLE WINE and generic WINE, we cannot distinguish red/white from
  // classType alone. Default to "red" as it is the most common.
  // Grapes or other data could refine this later.
  if (
    upper.includes("WHITE") ||
    upper.includes("SAUVIGNON BLANC") ||
    upper.includes("CHARDONNAY") ||
    upper.includes("RIESLING") ||
    upper.includes("PINOT GRIS") ||
    upper.includes("PINOT GRIGIO")
  ) {
    return "white";
  }
  if (upper.includes("ROSE") || upper.includes("ROSÉ") || upper.includes("BLUSH")) {
    return "rosé";
  }

  return "red";
}

/**
 * Determine country from the origin field.
 * Domestic TTB labels are USA. Imports specify the country of origin.
 */
function parseCountry(origin: string | undefined | null): string {
  if (!origin) return "USA";
  const upper = origin.toUpperCase().trim();
  if (!upper || upper === "DOMESTIC" || upper === "US" || upper === "USA") {
    return "USA";
  }
  // The origin field for imports typically contains the country name
  return normalizeProducerName(origin);
}

/**
 * Parse grape varieties from the API grapePct array or CSV GRAPE_VARIETY column.
 */
function parseGrapes(
  grapePct: Array<{ grape: string; percentage: number }> | undefined | null,
  grapeVarietyStr?: string | null
): string[] {
  const grapes: string[] = [];

  if (grapePct && Array.isArray(grapePct)) {
    for (const entry of grapePct) {
      if (entry.grape) {
        const normalized = normalizeGrapeName(entry.grape);
        if (normalized && !grapes.includes(normalized)) {
          grapes.push(normalized);
        }
      }
    }
  }

  if (grapes.length === 0 && grapeVarietyStr) {
    // CSV format: may be comma-separated or semicolon-separated
    const parts = grapeVarietyStr.split(/[;,]/).map((s) => s.trim());
    for (const part of parts) {
      if (part) {
        const normalized = normalizeGrapeName(part);
        if (normalized && !grapes.includes(normalized)) {
          grapes.push(normalized);
        }
      }
    }
  }

  return grapes;
}

// ---------------------------------------------------------------------------
// API fetch with retry + pagination
// ---------------------------------------------------------------------------

async function fetchApiPage(page: number): Promise<TtbApiResponse> {
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const response = await fetch(TTB_API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "User-Agent": "WinebobImporter/1.0 (https://winebob.app; data-import)",
        },
        body: JSON.stringify({
          productType: "WINE",
          pageSize: API_PAGE_SIZE,
          page,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return (await response.json()) as TtbApiResponse;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error(`  [API page ${page}] Attempt ${attempt}/${MAX_RETRIES} failed: ${message}`);

      if (attempt < MAX_RETRIES) {
        const delay = RETRY_DELAY_MS * attempt;
        console.log(`  [API page ${page}] Retrying in ${delay}ms...`);
        await sleep(delay);
      } else {
        throw new Error(
          `[API page ${page}] All ${MAX_RETRIES} attempts failed. Last error: ${message}`
        );
      }
    }
  }

  throw new Error("Unreachable");
}

/**
 * Fetch all wine records from the TTB COLA search API.
 * Paginates through all results with rate limiting.
 */
async function fetchFromApi(): Promise<TtbApiRecord[]> {
  console.log("  Fetching from TTB COLA API...");

  const allRecords: TtbApiRecord[] = [];
  let page = 1;
  let totalResults = Infinity;

  while (allRecords.length < totalResults) {
    console.log(`  Fetching page ${page}...`);
    const response = await fetchApiPage(page);

    if (page === 1 && response.totalResults != null) {
      totalResults = response.totalResults;
      console.log(`  Total results available: ${totalResults}`);
    }

    const results = response.results ?? [];
    if (results.length === 0) {
      console.log("  No more results, stopping pagination.");
      break;
    }

    allRecords.push(...results);
    console.log(`  Fetched ${allRecords.length}/${totalResults} records.`);

    page++;
    await sleep(RATE_LIMIT_MS);
  }

  console.log(`  API fetch complete: ${allRecords.length} records.`);
  return allRecords;
}

// ---------------------------------------------------------------------------
// CSV fallback
// ---------------------------------------------------------------------------

/**
 * Parse a CSV line handling quoted fields.
 */
function parseCsvLine(line: string): string[] {
  const fields: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && i + 1 < line.length && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === "," && !inQuotes) {
      fields.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }
  fields.push(current.trim());

  return fields;
}

/**
 * Read TTB COLA data from a local CSV file (bulk download format).
 * Expected columns: PERMIT_NO, SERIAL_NO, BRAND_NAME, FANCIFUL_NAME,
 * CLASS_TYPE, APPELLATION, GRAPE_VARIETY, ALCOHOL_CONTENT, VINTAGE_DATE,
 * APPROVAL_DATE, ORIGIN
 */
async function fetchFromCsv(filePath: string): Promise<TtbApiRecord[]> {
  console.log(`  Reading CSV from: ${filePath}`);

  const records: TtbApiRecord[] = [];

  const rl = createInterface({
    input: createReadStream(filePath, { encoding: "utf-8" }),
    crlfDelay: Infinity,
  });

  let headers: string[] = [];
  let lineNum = 0;

  for await (const line of rl) {
    lineNum++;

    if (lineNum === 1) {
      headers = parseCsvLine(line).map((h) => h.toUpperCase().replace(/\s+/g, "_"));
      continue;
    }

    if (!line.trim()) continue;

    const fields = parseCsvLine(line);
    const row: Record<string, string> = {};
    for (let i = 0; i < headers.length && i < fields.length; i++) {
      row[headers[i]] = fields[i];
    }

    records.push({
      permitId: row["PERMIT_NO"] || undefined,
      serialNumber: row["SERIAL_NO"] || undefined,
      brandName: row["BRAND_NAME"] || undefined,
      fancifulName: row["FANCIFUL_NAME"] || undefined,
      classType: row["CLASS_TYPE"] || undefined,
      appellation: row["APPELLATION"] || undefined,
      grapePct: row["GRAPE_VARIETY"]
        ? row["GRAPE_VARIETY"]
            .split(/[;,]/)
            .filter(Boolean)
            .map((g) => ({ grape: g.trim(), percentage: 0 }))
        : undefined,
      alcoholContent: row["ALCOHOL_CONTENT"] || undefined,
      vintageDate: row["VINTAGE_DATE"] || undefined,
      approvalDate: row["APPROVAL_DATE"] || undefined,
      origin: row["ORIGIN"] || undefined,
    });
  }

  console.log(`  CSV parsing complete: ${records.length} records from ${lineNum - 1} data lines.`);
  return records;
}

// ---------------------------------------------------------------------------
// Record mapping
// ---------------------------------------------------------------------------

/**
 * Map raw TTB COLA records to our internal ParsedTtbWine format.
 */
function mapRecords(records: TtbApiRecord[]): ParsedTtbWine[] {
  const wines: ParsedTtbWine[] = [];

  for (const record of records) {
    const serialNumber = record.serialNumber;
    if (!serialNumber) continue;

    const rawName = record.fancifulName || record.brandName;
    if (!rawName) continue;

    const name = normalizeWineName(rawName);
    const producer = normalizeProducerName(record.brandName || "Unknown");
    const vintage = parseVintageYear(record.vintageDate);
    const grapes = parseGrapes(record.grapePct, undefined);
    const region = record.appellation?.trim() || "";
    const country = parseCountry(record.origin);
    const appellation = record.appellation?.trim() || "";
    const type = inferWineType(record.classType);
    const abv = parseAbv(record.alcoholContent);
    const fingerprint = generateWineFingerprint(name, producer, vintage);

    wines.push({
      serialNumber,
      name,
      producer,
      vintage,
      grapes,
      region,
      country,
      appellation,
      type,
      abv,
      fingerprint,
    });
  }

  return wines;
}

// ---------------------------------------------------------------------------
// Database operations
// ---------------------------------------------------------------------------

async function importWines(
  prisma: PrismaClient,
  wines: ParsedTtbWine[],
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
  const toInsert: ParsedTtbWine[] = [];
  for (const wine of wines) {
    const key = `${wine.name.toLowerCase()}|${wine.producer.toLowerCase()}`;
    if (existingSet.has(key)) {
      stats.recordsSkipped++;
    } else {
      toInsert.push(wine);
      existingSet.add(key);
    }
  }

  console.log(
    `  ${toInsert.length} new wines to insert, ${stats.recordsSkipped} skipped (duplicates).`
  );

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
          appellation: wine.appellation || null,
          type: wine.type,
          abv: wine.abv,
          source: "ttb",
          confidence: 0.8,
          externalIds: { ttb_cola: wine.serialNumber },
          importBatchId,
          isPublic: true,
        },
      });
      stats.recordsCreated++;
    } catch {
      stats.recordsFailed++;
    }

    if ((i + 1) % 50 === 0 || i === toInsert.length - 1) {
      console.log(`  Progress: ${i + 1}/${toInsert.length} (${stats.recordsCreated} created, ${stats.recordsFailed} failed)`);
    }
  }

  return stats;
}

// ---------------------------------------------------------------------------
// Main import pipeline
// ---------------------------------------------------------------------------

export interface TtbImportOptions {
  csvPath?: string;
}

export interface TtbImportResult {
  importBatchId: string;
  stats: ImportStats;
}

export async function runTtbImport(
  options?: TtbImportOptions
): Promise<TtbImportResult> {
  const prisma = createPrismaClient();

  console.log("=== TTB COLA Wine Import Pipeline ===");
  console.log(`Started at: ${new Date().toISOString()}`);
  console.log(`Mode: ${options?.csvPath ? "CSV file" : "API"}\n`);

  // 1. Create ImportBatch
  console.log("Step 1: Creating import batch...");
  const batch = await prisma.importBatch.create({
    data: {
      source: "ttb",
      status: "running",
      createdBy: "system",
      metadata: {
        mode: options?.csvPath ? "csv" : "api",
        csvPath: options?.csvPath || null,
        apiUrl: TTB_API_URL,
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

  try {
    // 2. Fetch data (API or CSV)
    console.log("Step 2: Fetching TTB COLA data...");
    let rawRecords: TtbApiRecord[];

    if (options?.csvPath) {
      rawRecords = await fetchFromCsv(options.csvPath);
    } else {
      try {
        rawRecords = await fetchFromApi();
      } catch (apiErr) {
        const apiMessage = apiErr instanceof Error ? apiErr.message : String(apiErr);
        console.warn(`  API fetch failed: ${apiMessage}`);
        console.warn("  No CSV fallback path provided. Cannot continue.");
        throw apiErr;
      }
    }

    // 3. Map to wine schema
    console.log("\nStep 3: Mapping records to wine schema...");
    const wines = mapRecords(rawRecords);
    console.log(`  Mapped ${wines.length} valid wine records from ${rawRecords.length} raw records.`);

    // 4. Dedup + batch insert
    console.log("\nStep 4: Importing wines (dedup + batch insert)...");
    stats = await importWines(prisma, wines, batch.id);

    // 5. Update ImportBatch with final counts
    console.log("\nStep 5: Finalizing import batch...");
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
          mode: options?.csvPath ? "csv" : "api",
          csvPath: options?.csvPath || null,
          apiUrl: TTB_API_URL,
        },
      },
    });

    console.log("\n=== Import Complete ===");
    console.log(`  Records fetched:  ${stats.recordsFetched}`);
    console.log(`  Records created:  ${stats.recordsCreated}`);
    console.log(`  Records skipped:  ${stats.recordsSkipped}`);
    console.log(`  Records failed:   ${stats.recordsFailed}`);
    console.log(`  Batch ID:         ${batch.id}`);
    console.log(`  Completed at:     ${new Date().toISOString()}`);
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
  };
}

// ---------------------------------------------------------------------------
// CLI entry point
// ---------------------------------------------------------------------------

const isMainModule =
  typeof process !== "undefined" &&
  process.argv[1] &&
  (process.argv[1].endsWith("ttb.ts") || process.argv[1].endsWith("ttb.js"));

if (isMainModule) {
  // Parse CLI args: --csv <path>
  const csvIdx = process.argv.indexOf("--csv");
  const csvPath = csvIdx !== -1 ? process.argv[csvIdx + 1] : undefined;

  runTtbImport({ csvPath })
    .then((result) => {
      console.log("\nDone. Result:", JSON.stringify(result, null, 2));
      process.exit(0);
    })
    .catch((err) => {
      console.error("Fatal error:", err);
      process.exit(1);
    });
}
