/**
 * Master wine seed script.
 *
 * Imports curated wine data from regional files, validates quality,
 * and inserts producers + wines into the database.
 *
 * Usage:
 *   node prisma/seeds/seed-all.mjs
 *
 * Requires DATABASE_URL in .env or as environment variable.
 */

import "dotenv/config";
import { neon } from "@neondatabase/serverless";
import { validateDataset } from "./validate.mjs";

const dbUrl = process.env.DATABASE_URL;
if (!dbUrl) {
  console.error("DATABASE_URL is not set");
  process.exit(1);
}

const sql = neon(dbUrl);

// ── Helpers ──

function toPgArray(arr) {
  if (!arr || arr.length === 0) return "{}";
  const escaped = arr.map((s) => `"${s.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`);
  return `{${escaped.join(",")}}`;
}

// ── Import regional data ──

async function loadRegions() {
  const regions = [];

  // Dynamic imports of regional seed files
  try {
    const france = await import("./france.mjs");
    regions.push({ label: "France", producers: france.producers, wines: france.wines });
  } catch (e) {
    console.warn("Skipping France (file not found):", e.message);
  }

  try {
    const italy = await import("./italy.mjs");
    regions.push({ label: "Italy", producers: italy.producers, wines: italy.wines });
  } catch (e) {
    console.warn("Skipping Italy (file not found):", e.message);
  }

  try {
    const europeOther = await import("./europe-other.mjs");
    regions.push({ label: "Europe (Spain/Portugal/Germany/Austria)", producers: europeOther.producers, wines: europeOther.wines });
  } catch (e) {
    console.warn("Skipping Europe Other (file not found):", e.message);
  }

  try {
    const newWorld = await import("./new-world.mjs");
    regions.push({ label: "New World", producers: newWorld.producers, wines: newWorld.wines });
  } catch (e) {
    console.warn("Skipping New World (file not found):", e.message);
  }

  return regions;
}

// ── Insert functions ──

async function insertProducers(producers) {
  let created = 0;
  let skipped = 0;

  for (const p of producers) {
    try {
      await sql`
        INSERT INTO "Producer" (id, name, country, region, website, "foundedYear", description, "wineCount", verified, "createdAt", "updatedAt")
        VALUES (${p.id}, ${p.name}, ${p.country}, ${p.region || null}, ${p.website || null}, ${p.foundedYear || null}, ${p.description || null}, 0, true, NOW(), NOW())
        ON CONFLICT (name, country) DO UPDATE SET
          region = COALESCE(EXCLUDED.region, "Producer".region),
          website = COALESCE(EXCLUDED.website, "Producer".website),
          "foundedYear" = COALESCE(EXCLUDED."foundedYear", "Producer"."foundedYear"),
          description = COALESCE(EXCLUDED.description, "Producer".description),
          verified = true,
          "updatedAt" = NOW()
      `;
      created++;
    } catch (err) {
      console.error(`  Failed to insert producer "${p.name}": ${err.message}`);
      skipped++;
    }
  }

  return { created, skipped };
}

async function insertWines(wines) {
  let created = 0;
  let skipped = 0;

  for (const w of wines) {
    try {
      const grapes = toPgArray(w.grapes);
      await sql`
        INSERT INTO "Wine" (
          id, name, producer, "producerId", vintage, grapes, region, country,
          appellation, type, description, "priceRange", "tastingNotes", "foodPairing",
          source, confidence, "isPublic", "createdAt", "updatedAt"
        )
        VALUES (
          ${w.id}, ${w.name}, ${w.producer}, ${w.producerId}, ${w.vintage},
          ${grapes}::text[], ${w.region}, ${w.country},
          ${w.appellation || null}, ${w.type}, ${w.description || null},
          ${w.priceRange || null}, ${w.tastingNotes || null}, ${w.foodPairing || null},
          'seed', 1.0, true, NOW(), NOW()
        )
        ON CONFLICT (id) DO UPDATE SET
          name = EXCLUDED.name,
          producer = EXCLUDED.producer,
          "producerId" = EXCLUDED."producerId",
          vintage = EXCLUDED.vintage,
          grapes = EXCLUDED.grapes,
          region = EXCLUDED.region,
          country = EXCLUDED.country,
          appellation = EXCLUDED.appellation,
          type = EXCLUDED.type,
          description = EXCLUDED.description,
          "priceRange" = EXCLUDED."priceRange",
          "tastingNotes" = EXCLUDED."tastingNotes",
          "foodPairing" = EXCLUDED."foodPairing",
          source = 'seed',
          confidence = 1.0,
          "updatedAt" = NOW()
      `;
      created++;
    } catch (err) {
      console.error(`  Failed to insert wine "${w.name}": ${err.message}`);
      skipped++;
    }
  }

  return { created, skipped };
}

// ── Main ──

async function main() {
  console.log("=== Winebob Curated Wine Seed ===\n");

  const regions = await loadRegions();

  if (regions.length === 0) {
    console.error("No regional seed files found! Nothing to seed.");
    process.exit(1);
  }

  // Validate all data first
  let allProducers = [];
  let allWines = [];

  for (const region of regions) {
    const validated = validateDataset(region.producers, region.wines, region.label);
    allProducers.push(...validated.producers);
    allWines.push(...validated.wines);
  }

  console.log(`\n── Totals after validation ──`);
  console.log(`  Producers: ${allProducers.length}`);
  console.log(`  Wines: ${allWines.length}\n`);

  // Check for duplicate IDs
  const producerIds = new Set();
  const wineIds = new Set();
  const dupProducers = [];
  const dupWines = [];

  for (const p of allProducers) {
    if (producerIds.has(p.id)) dupProducers.push(p.id);
    producerIds.add(p.id);
  }
  for (const w of allWines) {
    if (wineIds.has(w.id)) dupWines.push(w.id);
    wineIds.add(w.id);
  }

  if (dupProducers.length > 0) {
    console.warn(`  ⚠ Duplicate producer IDs: ${dupProducers.join(", ")}`);
  }
  if (dupWines.length > 0) {
    console.warn(`  ⚠ Duplicate wine IDs: ${dupWines.join(", ")}`);
  }

  // Deduplicate by ID (first occurrence wins)
  const seenPIds = new Set();
  allProducers = allProducers.filter((p) => {
    if (seenPIds.has(p.id)) return false;
    seenPIds.add(p.id);
    return true;
  });
  const seenWIds = new Set();
  allWines = allWines.filter((w) => {
    if (seenWIds.has(w.id)) return false;
    seenWIds.add(w.id);
    return true;
  });

  // Insert producers first (wines reference them)
  console.log("Inserting producers...");
  const pResult = await insertProducers(allProducers);
  console.log(`  Done: ${pResult.created} created, ${pResult.skipped} failed\n`);

  // Insert wines
  console.log("Inserting wines...");
  const wResult = await insertWines(allWines);
  console.log(`  Done: ${wResult.created} created, ${wResult.skipped} failed\n`);

  // Update producer wine counts
  console.log("Updating producer wine counts...");
  await sql`
    UPDATE "Producer" p
    SET "wineCount" = (SELECT COUNT(*) FROM "Wine" w WHERE w."producerId" = p.id)
  `;
  console.log("  Done.\n");

  console.log("=== Seed Complete ===");
  console.log(`  Producers: ${pResult.created}`);
  console.log(`  Wines: ${wResult.created}`);
}

main().catch((e) => {
  console.error("Fatal error:", e);
  process.exit(1);
});
