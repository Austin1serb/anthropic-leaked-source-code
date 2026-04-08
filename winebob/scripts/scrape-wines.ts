#!/usr/bin/env npx tsx
/**
 * Wine-Searcher + Vivino Scraper (Playwright edition)
 *
 * Uses a headless browser to render Wine-Searcher pages fully,
 * extracting all visible data just like a real user sees it.
 *
 * Usage:
 *   npx tsx scripts/scrape-wines.ts --names "Petrus 2015" "Opus One 2019"
 *   npx tsx scripts/scrape-wines.ts --winery "Domaine Leflaive"
 *   npx tsx scripts/scrape-wines.ts --file wines.txt
 *
 * First-time setup:
 *   npm install playwright
 *   npx playwright install chromium
 */

import { chromium, type Page } from "playwright";
import { writeFileSync, readFileSync, mkdirSync, existsSync } from "fs";
import { join } from "path";

// ── Config ──

const WINE_SEARCHER_BASE = "https://www.wine-searcher.com";
const DELAY_MS = 2500;

// ── Types ──

interface ScrapedWine {
  name: string;
  vintage: number | null;
  producer: string;
  grapes: string[];
  region: string;
  country: string;
  appellation: string;
  type: "red" | "white" | "rosé" | "sparkling" | "dessert" | "fortified" | "orange";
  style: string;
  criticScore: number | null;
  criticReviews: number | null;
  userRating: number | null;
  userRatings: number | null;
  priceAmount: number | null;
  priceCurrency: string;
  priceRange: "budget" | "mid" | "premium" | "luxury";
  abv: number | null;
  description: string | null;
  tastingNotes: string | null;
  foodPairing: string | null;
  lwin: string | null;
  wineSearcherUrl: string;
  imageUrl: string | null;
  popularity: string | null;
  offersCount: number | null;
  source: "wine-searcher";
  scrapedAt: string;
}

// ── Helpers ──

function delay(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

function parseVintage(name: string): number | null {
  const match = name.match(/\b(19\d{2}|20[0-2]\d)\b/);
  return match ? parseInt(match[1]) : null;
}

function mapPriceRange(amount: number | null): ScrapedWine["priceRange"] {
  if (!amount || amount <= 0) return "mid";
  if (amount < 15) return "budget";
  if (amount < 40) return "mid";
  if (amount < 100) return "premium";
  return "luxury";
}

function mapWineType(style: string): ScrapedWine["type"] {
  const lower = style.toLowerCase();
  if (lower.startsWith("red")) return "red";
  if (lower.startsWith("white")) return "white";
  if (lower.includes("rosé") || lower.startsWith("rose")) return "rosé";
  if (lower.includes("sparkling")) return "sparkling";
  if (lower.includes("dessert") || lower.includes("sweet")) return "dessert";
  if (lower.includes("fortified") || lower.includes("port") || lower.includes("sherry")) return "fortified";
  if (lower.includes("orange")) return "orange";
  return "red";
}

// ── Wine-Searcher Scraper (Playwright) ──

async function scrapeWineSearcher(page: Page, query: string): Promise<Partial<ScrapedWine> | null> {
  const searchUrl = `${WINE_SEARCHER_BASE}/find/${encodeURIComponent(query.replace(/ /g, "+"))}`;
  console.log(`  🍷 Wine-Searcher: ${query}`);

  try {
    await page.goto(searchUrl, { waitUntil: "domcontentloaded", timeout: 30000 });
    // Wait a bit for JS to render
    await delay(2000);
  } catch (err) {
    console.log(`    ✗ Failed to load: ${err instanceof Error ? err.message : err}`);
    return null;
  }

  // Accept cookies if dialog appears
  try {
    const cookieBtn = page.locator('button:has-text("Accept"), button:has-text("Continue")').first();
    if (await cookieBtn.isVisible({ timeout: 1000 })) {
      await cookieBtn.click();
      await delay(500);
    }
  } catch { /* no cookie dialog */ }

  // ── Extract wine name (h1) ──
  const wineName = await page.locator("h1").first().textContent().catch(() => null);
  if (!wineName || wineName.includes("Wine-Searcher") || wineName.includes("Search")) {
    console.log(`    ✗ Wine not found for: ${query}`);
    return null;
  }
  const name = wineName.trim();

  // ── Extract subtitle: "Piedmont, Italy" ──
  let region = "";
  let country = "";
  let appellation = "";
  // The subtitle is usually right after h1, showing "Region, Country"
  const subtitle = await page.locator("h1 + *").textContent().catch(() => null)
    || await page.locator('[class*="sub-title"], [class*="subtitle"]').first().textContent().catch(() => null);
  if (subtitle) {
    const parts = subtitle.trim().split(",").map((s: string) => s.trim());
    if (parts.length >= 2) {
      region = parts[0];
      country = parts[parts.length - 1];
      appellation = parts.slice(0, -1).join(", ");
    } else if (parts.length === 1) {
      region = parts[0];
    }
  }

  // ── Critic score: look for "XX / 100" pattern ──
  let criticScore: number | null = null;
  let criticReviews: number | null = null;
  const pageText = await page.textContent("body") || "";

  const scoreMatch = pageText.match(/(\d{2})\s*\/\s*100/);
  if (scoreMatch) criticScore = parseInt(scoreMatch[1]);

  const reviewsMatch = pageText.match(/(\d+)\s*Critic\s*Review/i);
  if (reviewsMatch) criticReviews = parseInt(reviewsMatch[1]);

  // ── User rating: "4.5 from 17 User Ratings" ──
  let userRating: number | null = null;
  let userRatings: number | null = null;
  const userMatch = pageText.match(/(\d\.\d)\s*(?:from\s+)?(\d+)\s*User\s*Rating/i);
  if (userMatch) {
    userRating = parseFloat(userMatch[1]);
    userRatings = parseInt(userMatch[2]);
  }

  // ── Style: "Red - Savory and Classic" ──
  let style = "";
  const styleEl = await page.locator('text=/^(Red|White|Rosé|Sparkling|Dessert|Fortified|Orange)\s*[-–]/').first().textContent().catch(() => null);
  if (styleEl) {
    style = styleEl.trim();
  } else {
    // Fallback: search in page text
    const styleMatch = pageText.match(/((?:Red|White|Rosé|Rose|Sparkling|Dessert|Fortified|Orange)\s*[-–]\s*[A-Z][a-z]+(?:\s+and\s+[A-Z][a-z]+)?)/);
    if (styleMatch) style = styleMatch[1];
  }

  // ── Price: "1,722 kr / 750ml" or "€ 234" ──
  let priceAmount: number | null = null;
  let priceCurrency = "EUR";
  const priceMatch = pageText.match(/(?:Avg\s*Price[^)]*\)?\s*)?(?:€|EUR)\s*([\d,]+(?:\.\d{2})?)/i)
    || pageText.match(/([\d,]+(?:\.\d{2})?)\s*(?:€|EUR)/i);
  if (priceMatch) {
    priceAmount = parseFloat(priceMatch[1].replace(",", ""));
    priceCurrency = "EUR";
  } else {
    // Try other currencies
    const otherPrice = pageText.match(/(?:\$|USD)\s*([\d,]+)/i) || pageText.match(/([\d,]+)\s*(?:kr|DKK|SEK)/i);
    if (otherPrice) {
      priceAmount = parseFloat(otherPrice[1].replace(",", ""));
      if (pageText.includes("kr") || pageText.includes("DKK")) {
        priceCurrency = "DKK";
        // Convert DKK to EUR approximately
        priceAmount = Math.round(priceAmount / 7.5);
        priceCurrency = "EUR";
      } else if (pageText.includes("$") || pageText.includes("USD")) {
        priceCurrency = "USD";
      }
    }
  }

  // ── Grapes: from the Profile tab or visible grape info ──
  const grapes: string[] = [];
  // Look for grape variety links/text near "Grape" label
  const grapeEls = await page.locator('a[href*="/grape-"]').allTextContents().catch(() => [] as string[]);
  for (const g of grapeEls) {
    const cleaned = g.trim();
    if (cleaned.length > 2 && cleaned.length < 40 && !grapes.includes(cleaned)
      && !["Grapes", "Grapes Home", "Home"].includes(cleaned)) {
      grapes.push(cleaned);
    }
  }
  // Fallback: regex on page text for "Grape Variety" section
  if (grapes.length === 0 || grapes.length > 10) {
    grapes.length = 0; // reset if we got nav items
    const grapeTextMatch = pageText.match(/Grape\s*(?:Variety|Varieties?)\s*[:\n]+\s*([A-Z][a-zé]+(?: [A-Z][a-zé]+)*(?:\s*[-,/]\s*[A-Z][a-zé]+(?: [A-Z][a-zé]+)*)*)/);
    if (grapeTextMatch) {
      grapeTextMatch[1].split(/\s*[-,/]\s*/).forEach((g: string) => {
        const cleaned = g.trim();
        if (cleaned.length > 2) grapes.push(cleaned);
      });
    }
  }

  // ── Producer: from merchant link ──
  let producer = "";
  const producerEl = await page.locator('a[href*="/merchant/"]').first().textContent().catch(() => null);
  if (producerEl) {
    const cleaned = producerEl.trim();
    if (cleaned.length > 1 && cleaned.length < 60 && !cleaned.includes("Store") && !cleaned.includes("Buy")) {
      producer = cleaned;
    }
  }
  // Fallback: extract from wine name
  if (!producer) {
    const nameWithoutVintage = name.replace(/^\d{4}\s+/, "");
    const prodMatch = nameWithoutVintage.match(/^((?:Château|Chateau|Domaine|Tenuta|Bodega|Weingut|Maison|Casa)\s+[A-Za-zÀ-ÿ'-]+(?:\s+[A-Za-zÀ-ÿ'-]+)?)/i);
    if (prodMatch) producer = prodMatch[1];
    else producer = nameWithoutVintage.split(/\s+(?:DOCG|DOC|AOC|AVA|Barbaresco|Barolo|Premier|Grand)/i)[0].trim();
  }

  // ── ABV ──
  let abv: number | null = null;
  const abvMatch = pageText.match(/(\d{1,2}(?:\.\d{1,2})?)\s*%\s*(?:ABV|alcohol|vol)/i)
    || pageText.match(/(?:ABV|Alcohol)[:\s]*(\d{1,2}(?:\.\d{1,2})?)\s*%/i);
  if (abvMatch) abv = parseFloat(abvMatch[1]);

  // ── Tasting notes ──
  let tastingNotes: string | null = null;
  const noteMatch = pageText.match(/(?:Critic tasting note|Expert tasting note|tasting note)[^"]*"([^"]{40,600})"/i);
  if (noteMatch) tastingNotes = noteMatch[1].trim();

  // ── Food pairing ──
  let foodPairing: string | null = null;
  const foodMatch = pageText.match(/(?:food pairing|pairs? with|serve with)[:\s]+([A-Z][^.]{10,200}\.)/i);
  if (foodMatch) foodPairing = foodMatch[1].trim();

  // ── Offers count ──
  let offersCount: number | null = null;
  const offersMatch = pageText.match(/(\d+)\s*(?:Prices?|offers?|stores?)/i);
  if (offersMatch) offersCount = parseInt(offersMatch[1]);

  // ── Image ──
  let imageUrl: string | null = null;
  const imgSrc = await page.locator('img[src*="label"]').first().getAttribute("src").catch(() => null);
  if (imgSrc) imageUrl = imgSrc.startsWith("http") ? imgSrc : `${WINE_SEARCHER_BASE}${imgSrc}`;

  // ── LWIN ──
  let lwin: string | null = null;
  const urlLwin = searchUrl.match(/lwin(\d+)/i);
  if (urlLwin) lwin = urlLwin[1];
  const pageLwin = pageText.match(/LWIN[:\s]*(\d{6,})/i);
  if (pageLwin) lwin = pageLwin[1];

  const result: Partial<ScrapedWine> = {
    name,
    vintage: parseVintage(name) || parseVintage(query),
    producer,
    grapes,
    region,
    country,
    appellation,
    style,
    type: mapWineType(style),
    criticScore,
    criticReviews,
    userRating,
    userRatings,
    priceAmount,
    priceCurrency,
    priceRange: mapPriceRange(priceAmount),
    abv,
    tastingNotes,
    foodPairing,
    lwin,
    wineSearcherUrl: searchUrl,
    imageUrl,
    offersCount,
    source: "wine-searcher",
  };

  console.log(`    ✓ ${name}`);
  console.log(`      Producer: ${producer || "–"} | Region: ${region || "–"}, ${country || "–"}`);
  console.log(`      Score: ${criticScore ?? "–"}/100 | User: ${userRating ?? "–"}/5 | ${priceCurrency} ${priceAmount ?? "–"}`);
  console.log(`      Grapes: ${grapes.length > 0 ? grapes.join(", ") : "–"} | Style: ${style || "–"}`);

  return result;
}

// ── Winery Discovery ──

async function scrapeWineryWines(page: Page, wineryQuery: string, maxWines: number): Promise<string[]> {
  console.log(`\n🏠 Discovering wines for: ${wineryQuery}`);

  // Strategy 1: Search Wine-Searcher for the producer name
  // This usually lands on the producer's main wine, which has vintage tabs
  const searchUrl = `${WINE_SEARCHER_BASE}/find/${encodeURIComponent(wineryQuery.replace(/ /g, "+"))}`;

  try {
    await page.goto(searchUrl, { waitUntil: "domcontentloaded", timeout: 30000 });
    await delay(3000); // extra wait for JS rendering
  } catch {
    console.log(`  ✗ Failed to load search page`);
    return [];
  }

  // Accept cookies
  try {
    const cookieBtn = page.locator('button:has-text("Accept"), button:has-text("Continue")').first();
    if (await cookieBtn.isVisible({ timeout: 2000 })) {
      await cookieBtn.click();
      await delay(1000);
    }
  } catch { /* ok */ }

  const wineNames: string[] = [];
  const seen = new Set<string>();

  // Debug: check what page we're on
  const pageTitle = await page.title().catch(() => "");
  const currentUrl = page.url();
  console.log(`  🌐 URL: ${currentUrl}`);
  console.log(`  📄 Title: ${pageTitle}`);

  // Take screenshot for debugging
  const debugDir = join(process.cwd(), "scripts", "output");
  if (!existsSync(debugDir)) mkdirSync(debugDir, { recursive: true });
  await page.screenshot({ path: join(debugDir, "debug-winery.png") }).catch(() => {});
  console.log(`  📸 Screenshot saved: scripts/output/debug-winery.png`);

  // Get the base wine name from h1 (e.g., "Gaja Barbaresco DOCG")
  const h1 = await page.locator("h1").first().textContent().catch(() => null);
  const baseWineName = h1?.replace(/^\d{4}\s*/, "").trim() || "";
  console.log(`  🔗 Main wine: ${h1?.trim() || "–"}`);

  // Strategy 2: Collect vintage tabs — each year is a wine we can scrape
  // Wine-Searcher shows: All, 2023, 2022, 2021, ... 2009
  const allLinks = await page.locator("a").allTextContents().catch(() => [] as string[]);
  for (const text of allLinks) {
    const year = text.trim();
    if (year.match(/^(19|20)\d{2}$/) && !seen.has(year)) {
      seen.add(year);
      if (baseWineName) {
        wineNames.push(`${baseWineName} ${year}`);
      }
    }
  }
  if (wineNames.length > 0) {
    console.log(`  📅 Found ${wineNames.length} vintages for "${baseWineName}"`);
  }

  // Strategy 3: Look for "other wines" or related wines from the same producer
  // Check for links that contain the producer name
  const producerLower = wineryQuery.toLowerCase();
  const findLinks = await page.locator('a[href*="/find/"]').all();
  for (const link of findLinks) {
    const text = (await link.textContent().catch(() => ""))?.trim() || "";
    const href = (await link.getAttribute("href").catch(() => "")) || "";

    // Must look like a wine name (not navigation)
    if (text.length > 5 && text.length < 100
      && (text.toLowerCase().includes(producerLower) || href.toLowerCase().includes(producerLower.replace(/ /g, "+")))
      && !text.includes("Search") && !text.includes("Home")
      && !text.includes("Region") && !text.includes("Grape")
      && !text.includes("See all") && !text.includes("Find")
      && !seen.has(text)) {
      seen.add(text);
      wineNames.push(text);
    }
  }

  // Strategy 4: Try the merchant/winery page for a wine list
  const merchantLink = await page.locator('a[href*="/merchant/"]').first().getAttribute("href").catch(() => null);
  if (merchantLink) {
    const wineryUrl = merchantLink.startsWith("http") ? merchantLink : `${WINE_SEARCHER_BASE}${merchantLink}`;
    console.log(`  🏭 Checking winery page: ${wineryUrl}`);

    try {
      await page.goto(wineryUrl, { waitUntil: "domcontentloaded", timeout: 30000 });
      await delay(3000);

      // Look for wine links on the winery page
      const wineryLinks = await page.locator('a[href*="/find/"]').all();
      for (const link of wineryLinks) {
        const text = (await link.textContent().catch(() => ""))?.trim() || "";
        if (text.length > 8 && text.length < 100
          && !text.includes("Search") && !text.includes("Home")
          && !text.includes("Region") && !text.includes("Grape")
          && !seen.has(text)) {
          seen.add(text);
          wineNames.push(text);
        }
      }
    } catch {
      console.log(`  ⚠ Could not load winery page`);
    }
  }

  // Deduplicate and limit
  const unique = [...new Set(wineNames)];
  const limited = unique.slice(0, maxWines);

  console.log(`  📦 Total: ${unique.length} wines found, will scrape ${limited.length}`);
  if (limited.length > 0) {
    for (const w of limited.slice(0, 8)) console.log(`     • ${w}`);
    if (limited.length > 8) console.log(`     ... and ${limited.length - 8} more`);
  }

  return limited;
}

// ── Main Pipeline ──

async function main() {
  const args = process.argv.slice(2);

  let wineNames: string[] = [];
  let wineryNames: string[] = [];
  let shouldImport = false;
  let maxWinesPerWinery = 20;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--names") {
      while (i + 1 < args.length && !args[i + 1].startsWith("--")) wineNames.push(args[++i]);
    } else if (args[i] === "--winery") {
      while (i + 1 < args.length && !args[i + 1].startsWith("--")) wineryNames.push(args[++i]);
    } else if (args[i] === "--file") {
      const filePath = args[++i];
      if (!filePath || !existsSync(filePath)) { console.error(`File not found: ${filePath}`); process.exit(1); }
      wineNames.push(...readFileSync(filePath, "utf-8").split("\n").map((l) => l.trim()).filter(Boolean));
    } else if (args[i] === "--import") {
      shouldImport = true;
    } else if (args[i] === "--max") {
      maxWinesPerWinery = parseInt(args[++i]) || 20;
    }
  }

  if (wineNames.length === 0 && wineryNames.length === 0) {
    console.log(`
Wine Scraper (Playwright)

Usage:
  npx tsx scripts/scrape-wines.ts --names "Petrus 2015" "Opus One 2019"
  npx tsx scripts/scrape-wines.ts --winery "Gaja" "Domaine Leflaive"
  npx tsx scripts/scrape-wines.ts --winery "Château Margaux" --max 10
  npx tsx scripts/scrape-wines.ts --file wines.txt

Options:
  --names <wine1> <wine2>       Scrape specific wines
  --winery <name1> <name2>      Discover + scrape all wines from producers
  --max <number>                Max wines per winery (default: 20)
  --file <path>                 File with one wine name per line
  --import                      Also import results to database

Output: scripts/output/scrape-{timestamp}.json
`);
    process.exit(0);
  }

  // Launch browser
  console.log(`\n=== Wine Scraper (Playwright) ===`);
  console.log(`Launching headless browser...\n`);
  const browser = await chromium.launch({
    headless: false,  // Use headed mode — less likely to be blocked
    args: ["--disable-blink-features=AutomationControlled"],
  });
  const context = await browser.newContext({
    userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
    locale: "en-US",
    viewport: { width: 1440, height: 900 },
    javaScriptEnabled: true,
  });
  const page = await context.newPage();

  // Winery discovery mode
  if (wineryNames.length > 0) {
    console.log(`Wineries to scan: ${wineryNames.length}`);
    console.log(`Max wines per winery: ${maxWinesPerWinery}\n`);

    for (const winery of wineryNames) {
      const wines = await scrapeWineryWines(page, winery, maxWinesPerWinery);
      wineNames.push(...wines);
      await delay(DELAY_MS);
    }
  }

  if (wineNames.length === 0) {
    console.log(`\n✗ No wines to scrape.`);
    await browser.close();
    process.exit(0);
  }

  console.log(`\nWines to scrape: ${wineNames.length}\n`);

  const results: ScrapedWine[] = [];
  let succeeded = 0;
  let failed = 0;

  for (let i = 0; i < wineNames.length; i++) {
    console.log(`\n[${i + 1}/${wineNames.length}] ${wineNames[i]}`);

    const wsData = await scrapeWineSearcher(page, wineNames[i]);
    if (!wsData?.name) {
      failed++;
      continue;
    }

    const wine: ScrapedWine = {
      name: wsData.name || wineNames[i],
      vintage: wsData.vintage ?? null,
      producer: wsData.producer || "",
      grapes: wsData.grapes || [],
      region: wsData.region || "",
      country: wsData.country || "",
      appellation: wsData.appellation || "",
      type: wsData.type || "red",
      style: wsData.style || "",
      criticScore: wsData.criticScore ?? null,
      criticReviews: wsData.criticReviews ?? null,
      userRating: wsData.userRating ?? null,
      userRatings: wsData.userRatings ?? null,
      priceAmount: wsData.priceAmount ?? null,
      priceCurrency: wsData.priceCurrency || "EUR",
      priceRange: wsData.priceRange || "mid",
      abv: wsData.abv ?? null,
      description: wsData.style ? wsData.style.split(/[-–]/).pop()?.trim() || null : null,
      tastingNotes: wsData.tastingNotes || null,
      foodPairing: wsData.foodPairing || null,
      lwin: wsData.lwin ?? null,
      wineSearcherUrl: wsData.wineSearcherUrl || "",
      imageUrl: wsData.imageUrl ?? null,
      popularity: null,
      offersCount: wsData.offersCount ?? null,
      source: "wine-searcher",
      scrapedAt: new Date().toISOString(),
    };

    results.push(wine);
    succeeded++;

    await delay(DELAY_MS);
  }

  await browser.close();

  // Save output
  const outputDir = join(process.cwd(), "scripts", "output");
  if (!existsSync(outputDir)) mkdirSync(outputDir, { recursive: true });
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
  const outputPath = join(outputDir, `scrape-${timestamp}.json`);
  writeFileSync(outputPath, JSON.stringify(results, null, 2));

  console.log(`\n=== Results ===`);
  console.log(`Succeeded: ${succeeded}`);
  console.log(`Failed: ${failed}`);
  console.log(`Output: ${outputPath}`);

  if (shouldImport && results.length > 0) {
    console.log(`\nTo import: npm run scrape:import ${outputPath}`);
  }

  console.log(`\nDone.`);
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
