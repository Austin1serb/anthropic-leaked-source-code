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

// Map Wine-Searcher appellations/sub-regions to our 28 map region names
const REGION_MAP: Record<string, string> = {
  // France — Bordeaux appellations
  "margaux": "Bordeaux", "pauillac": "Bordeaux", "saint-emilion": "Bordeaux", "st-emilion": "Bordeaux",
  "pomerol": "Bordeaux", "sauternes": "Bordeaux", "pessac-leognan": "Bordeaux", "medoc": "Bordeaux",
  "haut-medoc": "Bordeaux", "saint-julien": "Bordeaux", "graves": "Bordeaux", "listrac": "Bordeaux",
  "moulis": "Bordeaux", "barsac": "Bordeaux", "entre-deux-mers": "Bordeaux", "fronsac": "Bordeaux",
  // France — Burgundy
  "gevrey-chambertin": "Burgundy", "vosne-romanee": "Burgundy", "nuits-saint-georges": "Burgundy",
  "meursault": "Burgundy", "puligny-montrachet": "Burgundy", "chassagne-montrachet": "Burgundy",
  "chablis": "Burgundy", "beaune": "Burgundy", "pommard": "Burgundy", "volnay": "Burgundy",
  "corton": "Burgundy", "cote de nuits": "Burgundy", "cote de beaune": "Burgundy",
  "bourgogne": "Burgundy", "macon": "Burgundy", "pouilly-fuisse": "Burgundy",
  // France — Champagne
  "champagne": "Champagne",
  // France — Rhone
  "cote-rotie": "Rhone Valley", "hermitage": "Rhone Valley", "chateauneuf-du-pape": "Rhone Valley",
  "crozes-hermitage": "Rhone Valley", "gigondas": "Rhone Valley", "vacqueyras": "Rhone Valley",
  "condrieu": "Rhone Valley", "saint-joseph": "Rhone Valley", "cornas": "Rhone Valley",
  "cotes du rhone": "Rhone Valley", "rhone": "Rhone Valley",
  // France — Loire
  "sancerre": "Loire Valley", "vouvray": "Loire Valley", "muscadet": "Loire Valley",
  "chinon": "Loire Valley", "bourgueil": "Loire Valley", "savennieres": "Loire Valley",
  "pouilly-fume": "Loire Valley", "anjou": "Loire Valley", "loire": "Loire Valley",
  // France — Alsace / Provence
  "alsace": "Alsace", "provence": "Provence", "bandol": "Provence",
  // Italy
  "barolo": "Piedmont", "barbaresco": "Piedmont", "langhe": "Piedmont", "asti": "Piedmont",
  "chianti": "Tuscany", "brunello di montalcino": "Tuscany", "bolgheri": "Tuscany",
  "montalcino": "Tuscany", "montepulciano": "Tuscany", "toscana": "Tuscany",
  "valpolicella": "Veneto", "amarone": "Veneto", "soave": "Veneto", "prosecco": "Veneto",
  "etna": "Sicily", "sicilia": "Sicily", "nero d'avola": "Sicily",
  // Spain
  "rioja": "Rioja", "ribera del duero": "Ribera del Duero", "priorat": "Priorat",
  // Portugal
  "douro": "Douro Valley", "porto": "Douro Valley", "port": "Douro Valley", "alentejo": "Alentejo",
  // Germany
  "mosel": "Mosel", "rheingau": "Rheingau", "pfalz": "Rheingau",
  // USA
  "napa valley": "Napa Valley", "napa": "Napa Valley", "oakville": "Napa Valley",
  "rutherford": "Napa Valley", "st. helena": "Napa Valley", "stags leap": "Napa Valley",
  "sonoma": "Sonoma", "russian river": "Sonoma", "alexander valley": "Sonoma",
  "willamette valley": "Willamette Valley", "willamette": "Willamette Valley",
  // South America
  "mendoza": "Mendoza", "uco valley": "Mendoza",
  "maipo valley": "Maipo Valley", "maipo": "Maipo Valley",
  "colchagua": "Colchagua Valley", "colchagua valley": "Colchagua Valley",
  // Australia
  "barossa valley": "Barossa Valley", "barossa": "Barossa Valley", "eden valley": "Barossa Valley",
  "margaret river": "Margaret River",
  // NZ
  "marlborough": "Marlborough", "central otago": "Marlborough",
  // South Africa
  "stellenbosch": "Stellenbosch", "franschhoek": "Stellenbosch", "paarl": "Stellenbosch",
};

function normalizeRegion(appellation: string, region: string, country: string): string {
  // Try appellation first (most specific)
  const appLower = appellation.toLowerCase().trim();
  if (REGION_MAP[appLower]) return REGION_MAP[appLower];

  // Try region
  const regLower = region.toLowerCase().trim();
  if (REGION_MAP[regLower]) return REGION_MAP[regLower];

  // Try partial matches
  for (const [key, value] of Object.entries(REGION_MAP)) {
    if (appLower.includes(key) || regLower.includes(key)) return value;
  }

  // Fallback: return the original region or appellation
  return region || appellation || country;
}

// Region center coordinates for auto-geocoding imported wineries
const REGION_COORDS: Record<string, [number, number]> = {
  "Bordeaux": [-0.58, 44.84], "Burgundy": [4.84, 47.02], "Champagne": [3.96, 49.25],
  "Rhone Valley": [4.83, 44.93], "Loire Valley": [0.69, 47.38], "Alsace": [7.35, 48.08],
  "Provence": [5.93, 43.53], "Piedmont": [7.68, 44.69], "Tuscany": [11.25, 43.77],
  "Veneto": [11.87, 45.44], "Sicily": [13.36, 37.60], "Rioja": [-2.73, 42.47],
  "Ribera del Duero": [-3.69, 41.63], "Priorat": [0.75, 41.20], "Douro Valley": [-7.79, 41.16],
  "Alentejo": [-7.91, 38.57], "Mosel": [6.63, 49.73], "Rheingau": [8.06, 50.01],
  "Napa Valley": [-122.31, 38.50], "Sonoma": [-122.72, 38.44], "Willamette Valley": [-123.09, 45.07],
  "Mendoza": [-68.83, -32.89], "Maipo Valley": [-70.60, -33.73], "Colchagua Valley": [-71.22, -34.66],
  "Barossa Valley": [138.95, -34.56], "Margaret River": [115.04, -33.95],
  "Marlborough": [173.95, -41.51], "Stellenbosch": [18.86, -33.93],
};

function slugify(str: string): string {
  return str.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60);
}

// Small random offset so pins in the same region don't stack
function jitter(coord: number, spread = 0.08): number {
  return coord + (Math.random() - 0.5) * spread;
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
        const rawRegion = (record.region || record.appellation || "").trim();
        const appellation = (record.appellation || "").trim();
        // Normalize to one of our 28 map region names
        const region = normalizeRegion(appellation, rawRegion, country);
        const lwin = (record.lwin || "").trim() || null;
        const abv = typeof record.abv === "number" ? record.abv : (typeof record.abv === "string" ? parseFloat(record.abv) : null);

        if (!name) {
          skipped++;
          continue;
        }

        const wineId = makeWineId(name, vintage);

        // Ensure producer + winery exist
        let wineryId: string | null = null;
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

            // Auto-create Winery record for map pins (if region has coordinates)
            const coords = REGION_COORDS[region];
            if (coords) {
              const winerySlug = slugify(producer);
              try {
                const winery = await prisma.winery.upsert({
                  where: { slug: winerySlug },
                  create: {
                    name: producer,
                    slug: winerySlug,
                    description: `${producer} — imported from Wine-Searcher`,
                    region,
                    country,
                    lat: jitter(coords[1]),
                    lng: jitter(coords[0]),
                    grapeVarieties: grapes.slice(0, 5),
                    wineStyles: [type],
                    verified: false,
                    featured: false,
                  },
                  update: {
                    // Only update grape varieties and styles (accumulate)
                    region,
                  },
                });
                wineryId = winery.id;
              } catch {
                // Slug conflict or other error — try to find existing
                const existing = await prisma.winery.findUnique({ where: { slug: winerySlug } });
                if (existing) wineryId = existing.id;
              }
            }
          } else {
            // Producer already processed — look up winery
            const winerySlug = slugify(producer);
            const existing = await prisma.winery.findUnique({ where: { slug: winerySlug } });
            if (existing) wineryId = existing.id;
          }
        }

        const producerId = producer && country ? makeProducerId(producer, country) : null;

        // Upsert wine
        const existing = await prisma.wine.findUnique({ where: { id: wineId } });

        const wineData = {
          name,
          producer: producer || name.split(" ")[0],
          producerId,
          wineryId,
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
