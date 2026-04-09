#!/usr/bin/env node
/**
 * Import scraped wine data into the database.
 *
 * Usage:
 *   node scripts/import-scraped.mjs scripts/output/scrape-2026-04-08.json
 *
 * Reads the JSON output from scrape-wines.ts and upserts into Wine + Producer + Winery tables.
 */

import "dotenv/config";
import { neon } from "@neondatabase/serverless";
import { readFileSync } from "fs";

const dbUrl = process.env.DATABASE_URL;
if (!dbUrl) {
  console.error("DATABASE_URL is not set");
  process.exit(1);
}

const sql = neon(dbUrl);

// Region center coordinates for auto-geocoding
const REGION_COORDS = {
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

// Appellation → Map region normalization
const REGION_MAP = {
  "pomerol": "Bordeaux", "margaux": "Bordeaux", "pauillac": "Bordeaux", "saint-emilion": "Bordeaux",
  "sauternes": "Bordeaux", "pessac-leognan": "Bordeaux", "medoc": "Bordeaux", "graves": "Bordeaux",
  "gevrey-chambertin": "Burgundy", "puligny-montrachet": "Burgundy", "meursault": "Burgundy",
  "chablis": "Burgundy", "nuits-saint-georges": "Burgundy", "vosne-romanee": "Burgundy",
  "beaune": "Burgundy", "corton": "Burgundy", "bourgogne": "Burgundy",
  "champagne": "Champagne",
  "cote-rotie": "Rhone Valley", "hermitage": "Rhone Valley", "chateauneuf-du-pape": "Rhone Valley",
  "barolo": "Piedmont", "barbaresco": "Piedmont", "langhe": "Piedmont",
  "chianti": "Tuscany", "brunello": "Tuscany", "bolgheri": "Tuscany", "montalcino": "Tuscany",
  "valpolicella": "Veneto", "amarone": "Veneto", "soave": "Veneto",
  "rioja": "Rioja", "ribera del duero": "Ribera del Duero", "priorat": "Priorat",
  "douro": "Douro Valley", "porto": "Douro Valley",
  "mosel": "Mosel", "rheingau": "Rheingau",
  "napa": "Napa Valley", "oakville": "Napa Valley", "rutherford": "Napa Valley",
  "sonoma": "Sonoma", "willamette": "Willamette Valley",
  "mendoza": "Mendoza", "maipo": "Maipo Valley", "colchagua": "Colchagua Valley",
  "barossa": "Barossa Valley", "margaret river": "Margaret River",
  "marlborough": "Marlborough", "stellenbosch": "Stellenbosch",
};

function normalizeRegion(appellation, country) {
  const lower = (appellation || "").toLowerCase();
  for (const [key, value] of Object.entries(REGION_MAP)) {
    if (lower.includes(key)) return value;
  }
  return appellation || country || "Unknown";
}

function slugify(str) {
  return str.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60);
}

function toPgArray(arr) {
  if (!arr || arr.length === 0) return "{}";
  const escaped = arr.map((s) => `"${s.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`);
  return `{${escaped.join(",")}}`;
}

function jitter(coord, spread = 0.08) {
  return coord + (Math.random() - 0.5) * spread;
}

async function main() {
  const filePath = process.argv[2];
  if (!filePath) {
    console.error("Usage: node scripts/import-scraped.mjs <path-to-json>");
    process.exit(1);
  }

  const wines = JSON.parse(readFileSync(filePath, "utf-8"));
  console.log(`=== Importing ${wines.length} scraped wines ===\n`);

  // Create import batch
  const [batch] = await sql`
    INSERT INTO "ImportBatch" (id, source, status, "startedAt", "recordsFetched", metadata)
    VALUES (gen_random_uuid(), 'wine-searcher-scraper', 'running', NOW(), ${wines.length}, ${JSON.stringify({ file: filePath })})
    RETURNING id
  `;
  const batchId = batch.id;

  let created = 0;
  let updated = 0;
  let failed = 0;
  const seenProducers = new Set();

  for (const wine of wines) {
    try {
      const region = normalizeRegion(wine.appellation, wine.country);
      const wineId = slugify(`${wine.name}-${wine.vintage || "nv"}`).slice(0, 50);
      const producerSlug = slugify(wine.producer || "unknown");
      const grapes = toPgArray(wine.grapes || []);

      // Upsert producer
      if (wine.producer && !seenProducers.has(producerSlug)) {
        seenProducers.add(producerSlug);
        await sql`
          INSERT INTO "Producer" (id, name, country, region, description, verified, "createdAt", "updatedAt")
          VALUES (${"ws-" + producerSlug}, ${wine.producer}, ${wine.country || ""}, ${region}, ${"Scraped from Wine-Searcher"}, false, NOW(), NOW())
          ON CONFLICT (id) DO UPDATE SET region = COALESCE(EXCLUDED.region, "Producer".region), "updatedAt" = NOW()
        `;

        // Upsert winery for map pin
        const coords = REGION_COORDS[region];
        if (coords) {
          await sql`
            INSERT INTO "Winery" (id, name, slug, description, region, country, lat, lng, "grapeVarieties", "wineStyles", verified, featured, "createdAt", "updatedAt")
            VALUES (gen_random_uuid(), ${wine.producer}, ${producerSlug}, ${wine.producer + " — scraped from Wine-Searcher"}, ${region}, ${wine.country || ""}, ${jitter(coords[1])}, ${jitter(coords[0])}, ${grapes}::text[], ${toPgArray([wine.type || "red"])}::text[], false, false, NOW(), NOW())
            ON CONFLICT (slug) DO UPDATE SET region = EXCLUDED.region, "updatedAt" = NOW()
          `;
        }
      }

      // Look up winery ID
      const wineryRows = await sql`SELECT id FROM "Winery" WHERE slug = ${producerSlug} LIMIT 1`;
      const wineryId = wineryRows[0]?.id || null;

      // Upsert wine
      const existing = await sql`SELECT id FROM "Wine" WHERE id = ${wineId}`;

      if (existing.length > 0) {
        await sql`
          UPDATE "Wine" SET
            name = ${wine.name}, producer = ${wine.producer || ""}, "producerId" = ${"ws-" + producerSlug},
            "wineryId" = ${wineryId}, vintage = ${wine.vintage}, grapes = ${grapes}::text[],
            region = ${region}, country = ${wine.country || ""}, appellation = ${wine.appellation || null},
            type = ${wine.type || "red"}, description = ${wine.description || null},
            "priceRange" = ${wine.priceRange || "mid"}, abv = ${wine.abv || null},
            "tastingNotes" = ${wine.tastingNotes || null}, "foodPairing" = ${wine.foodPairing || null},
            lwin = ${wine.lwin || null}, source = 'wine-searcher', confidence = ${wine.criticScore ? wine.criticScore / 100 : 0.7},
            "importBatchId" = ${batchId}, "externalIds" = ${JSON.stringify({
              wineSearcherUrl: wine.wineSearcherUrl, vivinoUrl: wine.vivinoUrl,
              criticScore: wine.criticScore, vivinoRating: wine.vivinoRating,
              priceAmount: wine.priceAmount, priceCurrency: wine.priceCurrency,
              popularity: wine.popularity, offersCount: wine.offersCount,
            })},
            "updatedAt" = NOW()
          WHERE id = ${wineId}
        `;
        updated++;
      } else {
        await sql`
          INSERT INTO "Wine" (
            id, name, producer, "producerId", "wineryId", vintage, grapes, region, country,
            appellation, type, description, "priceRange", abv, "tastingNotes", "foodPairing",
            lwin, source, confidence, "isPublic", "importBatchId", "externalIds", "createdAt", "updatedAt"
          ) VALUES (
            ${wineId}, ${wine.name}, ${wine.producer || ""}, ${"ws-" + producerSlug}, ${wineryId},
            ${wine.vintage}, ${grapes}::text[], ${region}, ${wine.country || ""},
            ${wine.appellation || null}, ${wine.type || "red"}, ${wine.description || null},
            ${wine.priceRange || "mid"}, ${wine.abv || null}, ${wine.tastingNotes || null}, ${wine.foodPairing || null},
            ${wine.lwin || null}, 'wine-searcher', ${wine.criticScore ? wine.criticScore / 100 : 0.7},
            true, ${batchId}, ${JSON.stringify({
              wineSearcherUrl: wine.wineSearcherUrl, vivinoUrl: wine.vivinoUrl,
              criticScore: wine.criticScore, vivinoRating: wine.vivinoRating,
              priceAmount: wine.priceAmount, priceCurrency: wine.priceCurrency,
              popularity: wine.popularity, offersCount: wine.offersCount,
            })},
            NOW(), NOW()
          )
        `;
        created++;
      }

      console.log(`  ✓ ${wine.name} → ${region}`);
    } catch (err) {
      failed++;
      console.error(`  ✗ ${wine.name}: ${err.message}`);
    }
  }

  // Update batch
  await sql`
    UPDATE "ImportBatch" SET
      status = 'completed', "completedAt" = NOW(),
      "recordsCreated" = ${created}, "recordsUpdated" = ${updated}, "recordsFailed" = ${failed}
    WHERE id = ${batchId}
  `;

  // Update producer wine counts
  await sql`UPDATE "Producer" p SET "wineCount" = (SELECT COUNT(*) FROM "Wine" w WHERE w."producerId" = p.id)`;

  console.log(`\n=== Import Complete ===`);
  console.log(`Created: ${created} | Updated: ${updated} | Failed: ${failed}`);
}

main().catch((e) => {
  console.error("Fatal:", e);
  process.exit(1);
});
