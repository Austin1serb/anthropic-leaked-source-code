"use server";

import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { revalidatePath } from "next/cache";

// ── Types for Wine-Searcher scraper output ──

type WineSearcherRecord = {
  wineName?: string;
  wine_name?: string;
  name?: string;
  vintage?: number | string | null;
  producer?: string;
  winery?: string;
  producerUrl?: string;
  winery_url?: string;
  region?: string;
  appellation?: string;
  country?: string;
  type?: string;
  style?: string;
  grapes?: string | string[];
  grape_variety?: string;
  criticScore?: number | string;
  critic_score?: number | string;
  averageScore?: number | string;
  reviewCount?: number | string;
  price?: number | string;
  lowestPrice?: number | string;
  lowest_price?: string;
  currency?: string;
  priceNumeric?: number;
  merchants?: number | string;
  popularity?: number | string;
  popularityRank?: number | string;
  lwin?: string;
  url?: string;
  wine_searcher_url?: string;
  imageUrl?: string;
  image_url?: string;
  description?: string;
  foodPairing?: string;
  food_pairing?: string;
  tastingNotes?: string;
  tasting_notes?: string;
  abv?: number | string;
  notFound?: boolean;
  not_found?: boolean;
  cachedAt?: string;
  [key: string]: unknown;
};

// ── Helpers ──

function extractName(r: WineSearcherRecord): string {
  return (r.wineName || r.wine_name || r.name || "").trim();
}

function extractProducer(r: WineSearcherRecord): string {
  return (r.producer || r.winery || "").trim();
}

function extractVintage(r: WineSearcherRecord): number | null {
  const v = r.vintage;
  if (!v) return null;
  const n = typeof v === "string" ? parseInt(v) : v;
  return n >= 1900 && n <= 2030 ? n : null;
}

function extractGrapes(r: WineSearcherRecord): string[] {
  if (Array.isArray(r.grapes)) return r.grapes.filter(Boolean);
  const raw = r.grapes || r.grape_variety || "";
  if (!raw) return [];
  return raw.split(/[,/]/).map((g) => g.trim()).filter(Boolean);
}

function extractType(r: WineSearcherRecord): string {
  const raw = (r.type || r.style || "").toLowerCase();
  if (raw.includes("red")) return "red";
  if (raw.includes("white")) return "white";
  if (raw.includes("rosé") || raw.includes("rose")) return "rosé";
  if (raw.includes("sparkling") || raw.includes("champagne") || raw.includes("cava") || raw.includes("prosecco")) return "sparkling";
  if (raw.includes("dessert") || raw.includes("sweet") || raw.includes("sauternes") || raw.includes("tokaj")) return "dessert";
  if (raw.includes("fortified") || raw.includes("port") || raw.includes("sherry") || raw.includes("madeira")) return "fortified";
  if (raw.includes("orange")) return "orange";
  return "red"; // default
}

function extractPrice(r: WineSearcherRecord): { priceRange: string; priceNumeric: number | null } {
  let amount: number | null = null;
  const raw = r.price || r.lowestPrice || r.lowest_price || r.priceNumeric;
  if (typeof raw === "number") {
    amount = raw;
  } else if (typeof raw === "string") {
    const match = raw.match(/[\d,.]+/);
    if (match) amount = parseFloat(match[0].replace(",", ""));
  }

  if (!amount) return { priceRange: "mid", priceNumeric: null };

  // Map to winebob price ranges (approximate USD)
  let priceRange = "mid";
  if (amount < 15) priceRange = "budget";
  else if (amount < 40) priceRange = "mid";
  else if (amount < 100) priceRange = "premium";
  else priceRange = "luxury";

  return { priceRange, priceNumeric: amount };
}

function extractScore(r: WineSearcherRecord): number | null {
  const raw = r.criticScore || r.critic_score || r.averageScore;
  if (!raw) return null;
  const n = typeof raw === "string" ? parseFloat(raw) : raw;
  return n >= 0 && n <= 100 ? n : null;
}

function makeWineId(name: string, vintage: number | null): string {
  const base = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 40);
  const suffix = vintage ? `-${vintage}` : "";
  return `ws-${base}${suffix}`;
}

function makeProducerId(name: string, country: string): string {
  const base = `${name}-${country}`.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 50);
  return `ws-prod-${base}`;
}

// ── Main import function ──

export async function importFromApifyDataset(datasetIdOrUrl: string) {
  const session = await requireAuth();

  // Extract dataset ID from various URL formats
  let datasetId = datasetIdOrUrl.trim();
  // Handle full URLs like https://api.apify.com/v2/datasets/XXX/items
  const urlMatch = datasetId.match(/datasets\/([a-zA-Z0-9]+)/);
  if (urlMatch) datasetId = urlMatch[1];
  // Handle Apify console URLs
  const consoleMatch = datasetId.match(/storage\/datasets\/([a-zA-Z0-9]+)/);
  if (consoleMatch) datasetId = consoleMatch[1];

  // Create import batch
  const batch = await prisma.importBatch.create({
    data: {
      source: "wine-searcher",
      status: "running",
      createdBy: session.user.id,
      metadata: { datasetId, triggeredVia: "admin-ui" },
    },
  });

  try {
    // Fetch the dataset from Apify
    const apiUrl = `https://api.apify.com/v2/datasets/${datasetId}/items?format=json&clean=true`;
    const res = await fetch(apiUrl);

    if (!res.ok) {
      throw new Error(`Apify API returned ${res.status}: ${res.statusText}`);
    }

    const records: WineSearcherRecord[] = await res.json();

    if (!Array.isArray(records) || records.length === 0) {
      throw new Error("No records found in dataset");
    }

    // Filter out not-found records
    const validRecords = records.filter((r) => !r.notFound && !r.not_found && extractName(r));

    let created = 0;
    let updated = 0;
    let skipped = 0;
    let failed = 0;
    const errors: string[] = [];

    // Collect unique producers
    const producerMap = new Map<string, { id: string; name: string; country: string }>();

    for (const record of validRecords) {
      try {
        const name = extractName(record);
        const producer = extractProducer(record);
        const vintage = extractVintage(record);
        const grapes = extractGrapes(record);
        const type = extractType(record);
        const { priceRange, priceNumeric } = extractPrice(record);
        const score = extractScore(record);
        const country = (record.country || "").trim();
        const region = (record.region || record.appellation || "").trim();
        const appellation = (record.appellation || "").trim();
        const lwin = (record.lwin || "").trim() || null;
        const abv = typeof record.abv === "number" ? record.abv : (typeof record.abv === "string" ? parseFloat(record.abv) : null);

        if (!name) {
          skipped++;
          continue;
        }

        const wineId = makeWineId(name, vintage);

        // Ensure producer exists
        if (producer && country) {
          const prodId = makeProducerId(producer, country);
          if (!producerMap.has(prodId)) {
            producerMap.set(prodId, { id: prodId, name: producer, country });
            await prisma.producer.upsert({
              where: { id: prodId },
              create: {
                id: prodId,
                name: producer,
                country,
                region: region || null,
                description: `Imported from Wine-Searcher`,
                verified: false,
              },
              update: {
                region: region || undefined,
              },
            });
          }
        }

        const producerId = producer && country ? makeProducerId(producer, country) : null;

        // Upsert wine
        const existing = await prisma.wine.findUnique({ where: { id: wineId } });

        const wineData = {
          name,
          producer: producer || name.split(" ")[0],
          producerId,
          vintage,
          grapes,
          region: region || country || "Unknown",
          country: country || "Unknown",
          appellation: appellation || null,
          type,
          description: record.description || null,
          priceRange,
          abv: abv && abv > 0 && abv < 100 ? abv : null,
          tastingNotes: record.tastingNotes || record.tasting_notes || null,
          foodPairing: record.foodPairing || record.food_pairing || null,
          lwin,
          source: "wine-searcher" as const,
          confidence: score ? Math.min(score / 100, 1.0) : 0.7,
          isPublic: true,
          importBatchId: batch.id,
          externalIds: {
            wineSearcherUrl: record.url || record.wine_searcher_url || null,
            criticScore: score,
            priceNumeric,
            popularity: record.popularity || record.popularityRank || null,
            merchantCount: record.merchants || null,
          },
        };

        if (existing) {
          await prisma.wine.update({ where: { id: wineId }, data: wineData });
          updated++;
        } else {
          await prisma.wine.create({ data: { id: wineId, ...wineData } });
          created++;
        }
      } catch (err) {
        failed++;
        const msg = err instanceof Error ? err.message : String(err);
        errors.push(`${extractName(record)}: ${msg}`);
      }
    }

    // Link wines to wineries (if matching winery exists)
    await prisma.$executeRawUnsafe(`
      UPDATE "Wine" w
      SET "wineryId" = wy.id
      FROM "Winery" wy
      WHERE w.producer = wy.name
        AND w.country = wy.country
        AND w."wineryId" IS NULL
        AND w."importBatchId" = '${batch.id}'
    `);

    // Update producer wine counts
    await prisma.$executeRawUnsafe(`
      UPDATE "Producer" p
      SET "wineCount" = (SELECT COUNT(*) FROM "Wine" w WHERE w."producerId" = p.id)
      WHERE p.id IN (SELECT DISTINCT "producerId" FROM "Wine" WHERE "importBatchId" = '${batch.id}' AND "producerId" IS NOT NULL)
    `);

    // Update batch
    await prisma.importBatch.update({
      where: { id: batch.id },
      data: {
        status: "completed",
        completedAt: new Date(),
        recordsFetched: records.length,
        recordsCreated: created,
        recordsUpdated: updated,
        recordsSkipped: skipped + (records.length - validRecords.length),
        recordsFailed: failed,
        errorLog: errors.length > 0 ? errors.slice(0, 50).join("\n") : null,
      },
    });

    revalidatePath("/admin/import");
    revalidatePath("/wines");
    revalidatePath("/explore");

    return {
      batchId: batch.id,
      status: "completed",
      fetched: records.length,
      valid: validRecords.length,
      created,
      updated,
      skipped,
      failed,
      errors: errors.slice(0, 10),
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);

    await prisma.importBatch.update({
      where: { id: batch.id },
      data: {
        status: "failed",
        completedAt: new Date(),
        errorLog: msg,
      },
    });

    throw new Error(`Import failed: ${msg}`);
  }
}

// ── Get recent import batches ──

export async function getImportBatches() {
  await requireAuth();
  return prisma.importBatch.findMany({
    orderBy: { startedAt: "desc" },
    take: 20,
  });
}
