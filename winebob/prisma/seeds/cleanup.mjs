/**
 * Database cleanup script.
 *
 * Removes low-quality imported wines (wikidata, openfoodfacts, ttb)
 * and replaces "Unknown" values with empty strings in remaining records.
 *
 * Usage:
 *   node prisma/seeds/cleanup.mjs
 */

import "dotenv/config";
import { neon } from "@neondatabase/serverless";

const dbUrl = process.env.DATABASE_URL;
if (!dbUrl) {
  console.error("DATABASE_URL is not set");
  process.exit(1);
}

const sql = neon(dbUrl);

async function main() {
  console.log("=== Database Cleanup ===\n");

  // 1. Count current state
  const [{ count: totalWines }] = await sql`SELECT COUNT(*) as count FROM "Wine"`;
  const [{ count: wikidataWines }] = await sql`SELECT COUNT(*) as count FROM "Wine" WHERE source = 'wikidata'`;
  const [{ count: offWines }] = await sql`SELECT COUNT(*) as count FROM "Wine" WHERE source = 'openfoodfacts'`;
  const [{ count: ttbWines }] = await sql`SELECT COUNT(*) as count FROM "Wine" WHERE source = 'ttb'`;
  const [{ count: unknownProducers }] = await sql`SELECT COUNT(*) as count FROM "Wine" WHERE producer = 'Unknown'`;
  const [{ count: unknownRegions }] = await sql`SELECT COUNT(*) as count FROM "Wine" WHERE region = 'Unknown'`;

  console.log(`Current state:`);
  console.log(`  Total wines: ${totalWines}`);
  console.log(`  Wikidata imports: ${wikidataWines}`);
  console.log(`  OpenFoodFacts imports: ${offWines}`);
  console.log(`  TTB imports: ${ttbWines}`);
  console.log(`  Wines with "Unknown" producer: ${unknownProducers}`);
  console.log(`  Wines with "Unknown" region: ${unknownRegions}`);
  console.log();

  // 2. Delete imported wines (they'll be replaced by curated data)
  console.log("Removing imported wines...");
  const deleted = await sql`DELETE FROM "Wine" WHERE source IN ('wikidata', 'openfoodfacts', 'ttb') RETURNING id`;
  console.log(`  Deleted ${deleted.length} imported wines.`);

  // 3. Clean up "Unknown" values in remaining wines
  console.log("\nCleaning 'Unknown' values in remaining wines...");
  await sql`UPDATE "Wine" SET producer = '' WHERE producer = 'Unknown'`;
  await sql`UPDATE "Wine" SET region = '' WHERE region = 'Unknown'`;
  await sql`UPDATE "Wine" SET country = '' WHERE country = 'Unknown'`;

  // 4. Clean up orphaned ImportBatch records
  console.log("Cleaning orphaned import batches...");
  const deletedBatches = await sql`DELETE FROM "ImportBatch" RETURNING id`;
  console.log(`  Deleted ${deletedBatches.length} import batch records.`);

  // 5. Final count
  const [{ count: remaining }] = await sql`SELECT COUNT(*) as count FROM "Wine"`;
  console.log(`\nDone. ${remaining} wines remaining in database.`);
  console.log("Run 'node prisma/seeds/seed-all.mjs' to seed curated data.");
}

main().catch((e) => {
  console.error("Fatal error:", e);
  process.exit(1);
});
