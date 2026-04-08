#!/usr/bin/env npx tsx
/**
 * Wine-Searcher + Vivino Scraper
 *
 * Scrapes wine data from Wine-Searcher.com and enriches with Vivino ratings.
 * Outputs JSON matching the winebob Prisma schema exactly.
 *
 * Usage:
 *   npx tsx scripts/scrape-wines.ts --names "Petrus 2015" "Opus One 2019"
 *   npx tsx scripts/scrape-wines.ts --file wines.txt
 *   npx tsx scripts/scrape-wines.ts --file wines.txt --import   # also writes to DB
 *
 * Output: scripts/output/scrape-{timestamp}.json
 */

import * as cheerio from "cheerio";
import { writeFileSync, readFileSync, mkdirSync, existsSync } from "fs";
import { join } from "path";

// ── Config ──

const WINE_SEARCHER_BASE = "https://www.wine-searcher.com";
const VIVINO_SEARCH = "https://www.vivino.com/search/wines?q=";
const DELAY_MS = 2000; // polite delay between requests
const MAX_RETRIES = 3;

const USER_AGENTS = [
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0",
];

// ── Types ──

interface ScrapedWine {
  // Core identification
  name: string;
  vintage: number | null;
  producer: string;
  // Classification
  grapes: string[];
  region: string;
  country: string;
  appellation: string;
  type: "red" | "white" | "rosé" | "sparkling" | "dessert" | "fortified" | "orange";
  style: string; // e.g. "Savory and Classic"
  // Scores & pricing
  criticScore: number | null;
  vivinoRating: number | null;
  vivinoRatings: number | null; // number of ratings
  priceAmount: number | null;
  priceCurrency: string;
  priceRange: "budget" | "mid" | "premium" | "luxury";
  // Details
  abv: number | null;
  description: string | null;
  tastingNotes: string | null;
  foodPairing: string | null;
  // Meta
  lwin: string | null;
  wineSearcherUrl: string;
  vivinoUrl: string | null;
  imageUrl: string | null;
  popularity: string | null;
  offersCount: number | null;
  // Source tracking
  source: "wine-searcher";
  scrapedAt: string;
}

// ── Helpers ──

function randomUA(): string {
  return USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
}

function delay(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

async function fetchPage(url: string, retries = MAX_RETRIES): Promise<string | null> {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url, {
        headers: {
          "User-Agent": randomUA(),
          "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
          "Accept-Language": "en-US,en;q=0.9",
          "Accept-Encoding": "gzip, deflate, br",
          "Referer": "https://www.google.com/",
          "DNT": "1",
        },
      });

      if (res.status === 403 || res.status === 429) {
        console.warn(`  ⚠ ${res.status} on attempt ${attempt}/${retries} — waiting ${attempt * 3}s`);
        await delay(attempt * 3000);
        continue;
      }

      if (!res.ok) {
        console.warn(`  ⚠ HTTP ${res.status} for ${url}`);
        return null;
      }

      return await res.text();
    } catch (err) {
      console.warn(`  ⚠ Fetch error (attempt ${attempt}): ${err instanceof Error ? err.message : err}`);
      await delay(attempt * 2000);
    }
  }
  return null;
}

function parseVintage(name: string): number | null {
  const match = name.match(/\b(19\d{2}|20[0-2]\d)\b/);
  return match ? parseInt(match[1]) : null;
}

function mapPriceRange(amount: number | null): "budget" | "mid" | "premium" | "luxury" {
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

// ── Wine-Searcher Scraper ──

async function scrapeWineSearcher(query: string): Promise<Partial<ScrapedWine> | null> {
  const searchUrl = `${WINE_SEARCHER_BASE}/find/${encodeURIComponent(query.replace(/ /g, "+"))}`;
  console.log(`  🍷 Wine-Searcher: ${query}`);

  const html = await fetchPage(searchUrl);
  if (!html) {
    console.log(`    ✗ Failed to fetch`);
    return null;
  }

  console.log(`    HTML: ${html.length} chars`);
  const $ = cheerio.load(html);

  // Wine name — usually in h1 or the main title
  const wineName = $("h1").first().text().trim()
    || $('[class*="wine-name"]').first().text().trim()
    || $("title").text().split("|")[0].trim();

  if (!wineName || wineName.includes("Wine-Searcher")) {
    console.log(`    ✗ Wine not found for query: ${query}`);
    return null;
  }

  // Score — look for critic score elements
  let criticScore: number | null = null;
  $('[class*="score"], [class*="rating"], [class*="critic"]').each((_, el) => {
    const text = $(el).text().trim();
    const match = text.match(/\b(8[0-9]|9[0-9]|100)\b/);
    if (match && !criticScore) criticScore = parseInt(match[1]);
  });
  // Also check meta tags
  const metaScore = $('meta[itemprop="ratingValue"]').attr("content");
  if (metaScore && !criticScore) criticScore = parseInt(metaScore);

  // Price
  let priceAmount: number | null = null;
  let priceCurrency = "EUR";
  // Look for structured price data
  const priceEl = $('[class*="price"], [itemprop="price"]').first();
  const priceText = priceEl.text().trim() || $('[class*="lowest"]').first().text().trim();
  if (priceText) {
    const priceMatch = priceText.match(/[\d,]+(?:\.\d{2})?/);
    if (priceMatch) priceAmount = parseFloat(priceMatch[0].replace(",", ""));
    if (priceText.includes("€") || priceText.includes("EUR")) priceCurrency = "EUR";
    else if (priceText.includes("$") || priceText.includes("USD")) priceCurrency = "USD";
    else if (priceText.includes("£") || priceText.includes("GBP")) priceCurrency = "GBP";
  }

  // ── Use regex on raw HTML for reliable extraction ──
  // Wine-Searcher embeds wine data in specific patterns that CSS selectors miss
  // because navigation elements use similar class names.

  // Style / type — pattern: "Style\n\nRed - Savory and Classic"
  let style = "";
  const styleMatch = html.match(/((?:Red|White|Rosé|Rose|Sparkling|Dessert|Fortified|Orange)\s*[-–]\s*[A-Z][^<"]{5,60})/);
  if (styleMatch) style = styleMatch[1].trim();

  // Grapes — look for "Grape Variety" label followed by actual grape names
  const grapes: string[] = [];
  // Pattern 1: "Grape Variety\n\nMerlot" or "Grape Variety\n\nCabernet Franc - Cabernet Sauvignon"
  const grapeBlockMatch = html.match(/Grape\s*Variety[^<]*?<[^>]*>([^<]+)/i)
    || html.match(/Grape\s*Variety\s+([A-Z][a-zé]+(?: (?:Blanc|Noir|Gris|Grigio|Franc|Sauvignon|Meunier))?(?:\s*[-,/&]\s*[A-Z][a-zé]+(?: (?:Blanc|Noir|Gris|Grigio|Franc|Sauvignon|Meunier))?)*)/);
  if (grapeBlockMatch) {
    const raw = grapeBlockMatch[1].trim();
    // Split on " - " or ", " or " / " or " & "
    raw.split(/\s*[-–,/&]\s*/).forEach((g) => {
      const cleaned = g.trim();
      if (cleaned && cleaned.length > 2 && cleaned.length < 40
        && !cleaned.includes("Home") && !cleaned.includes("Grapes")
        && !cleaned.includes("See") && !cleaned.includes("Region")) {
        grapes.push(cleaned);
      }
    });
  }
  // Fallback: look for the last "grape" link that contains actual grape text
  if (grapes.length === 0) {
    const allGrapeMatches = html.matchAll(/grape[^"]*"[^>]*>([A-Z][a-zé]+(?: (?:Blanc|Noir|Gris|Grigio|Franc|Sauvignon))?)<\/a>/gi);
    for (const m of allGrapeMatches) {
      const g = m[1].trim();
      if (g.length > 3 && g.length < 35 && !grapes.includes(g)) grapes.push(g);
    }
  }

  // Region / Appellation / Country — parse from page title or specific patterns
  let appellation = "";
  let country = "";
  // Pattern: title usually contains "Wine Name, Appellation, Country | Wine-Searcher"
  const titleText = $("title").text();
  const titleParts = titleText.split("|")[0].split(",").map((s: string) => s.trim());
  if (titleParts.length >= 3) {
    // Last part before "|" is often the country or region
    country = titleParts[titleParts.length - 1];
    appellation = titleParts.slice(1, -1).join(", ");
  } else if (titleParts.length === 2) {
    appellation = titleParts[1];
  }
  // Also try regex for appellation pattern in HTML
  if (!appellation || appellation === "Regions") {
    const appellMatch = html.match(/(?:Appellation|Region)[^<]*?<[^>]*>([A-Z][^<]{3,50})<\/a>/i);
    if (appellMatch) appellation = appellMatch[1].trim();
  }
  // Extract country from known list in the HTML
  if (!country) {
    const countries = ["France", "Italy", "Spain", "Portugal", "Germany", "Austria",
      "United States", "Australia", "New Zealand", "Chile", "Argentina", "South Africa",
      "Greece", "Hungary", "Lebanon", "Georgia", "England"];
    for (const c of countries) {
      if (html.includes(`>${c}<`) || titleText.includes(c)) { country = c; break; }
    }
  }
  // Clean up — remove "Regions" nav artifacts
  if (appellation === "Regions" || appellation === "Grapes") appellation = "";

  // Producer / Winery — look for merchant link pattern specific to the wine's producer
  let producer = "";
  const producerMatch = html.match(/merchant\/\d+-([^"]+)"[^>]*>([^<]+)<\/a>/);
  if (producerMatch) {
    producer = producerMatch[2].trim();
  }
  // Fallback: extract from wine name (remove vintage and appellation)
  if (!producer && wineName) {
    const nameWithoutVintage = wineName.replace(/^\d{4}\s+/, "").trim();
    // Common pattern: "Domaine X Wine Name" or "Château X Wine"
    const prodMatch = nameWithoutVintage.match(/^((?:Château|Chateau|Domaine|Tenuta|Bodega|Bodegas|Weingut|Maison)\s+[A-Za-zÀ-ÿ'-]+(?:\s+[A-Za-zÀ-ÿ'-]+)?)/i);
    if (prodMatch) producer = prodMatch[1];
    else producer = nameWithoutVintage.split(" ").slice(0, 2).join(" ");
  }

  // ABV — look for percentage pattern near "alcohol" or "ABV"
  let abv: number | null = null;
  const abvMatch = html.match(/(?:ABV|alcohol|vol\.?)\s*:?\s*(\d{1,2}(?:\.\d{1,2})?)\s*%/i)
    || html.match(/(\d{1,2}\.\d{1,2})\s*%\s*(?:ABV|alcohol|vol)/i);
  if (abvMatch) abv = parseFloat(abvMatch[1]);

  // Tasting notes — look for critic quote blocks (longer text with "vintage" mention)
  let tastingNotes = "";
  $('[class*="tasting"], [class*="description"], [class*="notes"], [class*="review"]').each((_, el) => {
    const text = $(el).text().trim();
    // Real tasting notes are usually 50+ chars with wine vocabulary
    if (text.length > 50 && text.length < 800
      && (text.includes("vintage") || text.includes("aroma") || text.includes("palate")
        || text.includes("finish") || text.includes("fruit") || text.includes("tannin"))
      && !tastingNotes) {
      // Clean: extract just the quoted note if present
      const quoteMatch = text.match(/"([^"]{40,500})"/);
      tastingNotes = quoteMatch ? quoteMatch[1] : text;
    }
  });

  // Food pairing — use regex, skip "See All" links
  let foodPairing = "";
  const foodMatch = html.match(/(?:food pairing|pairs? with|serve with)[^<]*?<[^>]*>([^<]+(?:,\s*[^<]+)*)/i);
  if (foodMatch) {
    const cleaned = foodMatch[1].trim();
    if (!cleaned.includes("See All") && cleaned.length > 5) foodPairing = cleaned;
  }

  // Offers count
  let offersCount: number | null = null;
  const offersMatch = html.match(/(\d+)\s*(?:offers?|stores?|merchants?)/i);
  if (offersMatch) offersCount = parseInt(offersMatch[1]);

  // LWIN
  let lwin: string | null = null;
  const lwinMatch = html.match(/LWIN[:\s]*(\d{6,})/i) || searchUrl.match(/lwin(\d+)/);
  if (lwinMatch) lwin = lwinMatch[1];

  // Image — build full URL
  let imageUrl: string | null = null;
  const imgSrc = $('img[src*="label"]').first().attr("src")
    || $('img[src*="wine"]').first().attr("src");
  if (imgSrc) {
    imageUrl = imgSrc.startsWith("http") ? imgSrc : `https://www.wine-searcher.com${imgSrc}`;
  }

  // Popularity — look for rank pattern
  let popularity: string | null = null;
  const popMatch = html.match(/(?:popularity|search rank|ranked?)\s*(?::|#)?\s*(\d+(?:st|nd|rd|th)?)/i);
  if (popMatch) popularity = popMatch[1];

  const result: Partial<ScrapedWine> = {
    name: wineName,
    vintage: parseVintage(wineName) || parseVintage(query),
    producer,
    grapes,
    appellation,
    country,
    style,
    type: mapWineType(style),
    criticScore,
    priceAmount,
    priceCurrency,
    priceRange: mapPriceRange(priceAmount),
    abv,
    description: style ? style.split("–").pop()?.trim() || null : null,
    tastingNotes: tastingNotes || null,
    foodPairing: foodPairing || null,
    lwin,
    wineSearcherUrl: searchUrl,
    imageUrl,
    popularity,
    offersCount,
  };

  console.log(`    ✓ ${wineName} | Score: ${criticScore ?? "–"} | ${priceCurrency} ${priceAmount ?? "–"} | ${grapes.length} grapes`);
  return result;
}

// ── Vivino Enrichment ──

async function scrapeVivino(wineName: string): Promise<{ vivinoRating: number | null; vivinoRatings: number | null; vivinoUrl: string | null; tastingNotes: string | null; foodPairing: string | null }> {
  const searchUrl = `${VIVINO_SEARCH}${encodeURIComponent(wineName)}`;
  console.log(`  🍇 Vivino: ${wineName}`);

  const html = await fetchPage(searchUrl);
  if (!html) {
    console.log(`    ✗ Failed to fetch`);
    return { vivinoRating: null, vivinoRatings: null, vivinoUrl: null, tastingNotes: null, foodPairing: null };
  }

  const $ = cheerio.load(html);

  // Rating
  let vivinoRating: number | null = null;
  let vivinoRatings: number | null = null;
  $('[class*="rating"], [class*="average"]').each((_, el) => {
    const text = $(el).text().trim();
    const ratingMatch = text.match(/(\d\.\d)/);
    if (ratingMatch && !vivinoRating) vivinoRating = parseFloat(ratingMatch[1]);
    const countMatch = text.match(/([\d,]+)\s*ratings?/i);
    if (countMatch && !vivinoRatings) vivinoRatings = parseInt(countMatch[1].replace(",", ""));
  });

  // Wine URL
  let vivinoUrl: string | null = null;
  $('a[href*="/wines/"]').each((_, el) => {
    const href = $(el).attr("href");
    if (href && !vivinoUrl) vivinoUrl = href.startsWith("http") ? href : `https://www.vivino.com${href}`;
  });

  // Taste notes
  let tastingNotes: string | null = null;
  $('[class*="taste"], [class*="note"], [class*="flavor"]').each((_, el) => {
    const text = $(el).text().trim();
    if (text.length > 20 && text.length < 400 && !tastingNotes) tastingNotes = text;
  });

  // Food pairing
  let foodPairing: string | null = null;
  $('[class*="food"], [class*="pairing"]').each((_, el) => {
    const text = $(el).text().trim();
    if (text.length > 10 && !foodPairing) foodPairing = text;
  });

  if (vivinoRating) {
    console.log(`    ✓ Vivino: ${vivinoRating}/5 (${vivinoRatings ?? "?"} ratings)`);
  } else {
    console.log(`    – No Vivino rating found`);
  }

  return { vivinoRating, vivinoRatings, vivinoUrl, tastingNotes, foodPairing };
}

// ── Main Pipeline ──

async function scrapeWine(query: string): Promise<ScrapedWine | null> {
  // Phase 1: Wine-Searcher
  const wsData = await scrapeWineSearcher(query);
  if (!wsData?.name) return null;

  await delay(DELAY_MS);

  // Phase 2: Vivino enrichment
  const vivData = await scrapeVivino(wsData.name || query);

  await delay(DELAY_MS);

  // Merge: Wine-Searcher is primary, Vivino fills gaps
  const wine: ScrapedWine = {
    name: wsData.name || query,
    vintage: wsData.vintage ?? null,
    producer: wsData.producer || "",
    grapes: wsData.grapes || [],
    region: wsData.appellation || "",
    country: wsData.country || "",
    appellation: wsData.appellation || "",
    type: wsData.type || "red",
    style: wsData.style || "",
    criticScore: wsData.criticScore ?? null,
    vivinoRating: vivData.vivinoRating,
    vivinoRatings: vivData.vivinoRatings,
    priceAmount: wsData.priceAmount ?? null,
    priceCurrency: wsData.priceCurrency || "EUR",
    priceRange: wsData.priceRange || "mid",
    abv: wsData.abv ?? null,
    description: wsData.description || wsData.style?.split("–").pop()?.trim() || null,
    tastingNotes: wsData.tastingNotes || vivData.tastingNotes || null,
    foodPairing: wsData.foodPairing || vivData.foodPairing || null,
    lwin: wsData.lwin ?? null,
    wineSearcherUrl: wsData.wineSearcherUrl || "",
    vivinoUrl: vivData.vivinoUrl,
    imageUrl: wsData.imageUrl ?? null,
    popularity: wsData.popularity ?? null,
    offersCount: wsData.offersCount ?? null,
    source: "wine-searcher",
    scrapedAt: new Date().toISOString(),
  };

  return wine;
}

// ── Winery Scraper — discover all wines from a producer ──

async function scrapeWineryPage(wineryQuery: string): Promise<{ wineryName: string; wineryUrl: string; wineLinks: string[] }> {
  console.log(`\n🏠 Searching winery: ${wineryQuery}`);

  // First, search for a wine to find the merchant/winery link
  const searchUrl = `${WINE_SEARCHER_BASE}/find/${encodeURIComponent(wineryQuery.replace(/ /g, "+"))}`;
  const html = await fetchPage(searchUrl);
  if (!html) {
    console.log(`  ✗ Failed to fetch search page`);
    return { wineryName: wineryQuery, wineryUrl: "", wineLinks: [] };
  }

  const $ = cheerio.load(html);

  // Find the merchant/winery page link
  let wineryUrl = "";
  let wineryName = wineryQuery;
  const merchantMatch = html.match(/href="(\/merchant\/\d+-[^"]+)"/);
  if (merchantMatch) {
    wineryUrl = `${WINE_SEARCHER_BASE}${merchantMatch[1]}`;
  }

  // Also try the producer name from the page
  const prodMatch = html.match(/merchant\/\d+-([^"]+)"[^>]*>([^<]+)<\/a>/);
  if (prodMatch) wineryName = prodMatch[2].trim();

  if (!wineryUrl) {
    // Try direct merchant search
    wineryUrl = `${WINE_SEARCHER_BASE}/find/${encodeURIComponent(wineryQuery.replace(/ /g, "+"))}`;
    console.log(`  ⚠ No winery page found, using search URL`);
  }

  console.log(`  🔗 Winery: ${wineryName}`);
  console.log(`  🔗 URL: ${wineryUrl}`);

  await delay(DELAY_MS);

  // Fetch the winery page to find all their wines
  const wineryHtml = await fetchPage(wineryUrl);
  if (!wineryHtml) {
    console.log(`  ✗ Failed to fetch winery page`);
    return { wineryName, wineryUrl, wineLinks: [] };
  }

  // Find all wine links on the winery page
  const $w = cheerio.load(wineryHtml);
  const wineLinks: string[] = [];
  const seenNames = new Set<string>();

  // Look for wine links — typically /find/wine+name+vintage patterns
  $w('a[href*="/find/"]').each((_, el) => {
    const href = $w(el).attr("href") || "";
    const text = $w(el).text().trim();
    // Filter for actual wine links (not generic search links)
    if (href.includes("/find/") && text.length > 5 && text.length < 100
      && !text.includes("Search") && !text.includes("Home") && !text.includes("Region")
      && !text.includes("Grape") && !text.includes("Store")
      && !seenNames.has(text)) {
      seenNames.add(text);
      wineLinks.push(text);
    }
  });

  // Also look for wine names in table rows or list items
  $w('td a, li a, [class*="wine"] a').each((_, el) => {
    const text = $w(el).text().trim();
    const href = $w(el).attr("href") || "";
    if (text.length > 5 && text.length < 100 && href.includes("/find/")
      && !text.includes("Search") && !text.includes("All")
      && !seenNames.has(text)) {
      seenNames.add(text);
      wineLinks.push(text);
    }
  });

  // Fallback: look for wine names using regex patterns (vintage + name)
  if (wineLinks.length === 0) {
    const wineMatches = wineryHtml.matchAll(/>(\d{4}\s+[A-Z][^<]{10,80})</g);
    for (const m of wineMatches) {
      const name = m[1].trim();
      if (!seenNames.has(name) && name.length < 80) {
        seenNames.add(name);
        wineLinks.push(name);
      }
    }
  }

  console.log(`  📦 Found ${wineLinks.length} wines from ${wineryName}`);
  if (wineLinks.length > 0) {
    console.log(`     First few: ${wineLinks.slice(0, 5).join(", ")}${wineLinks.length > 5 ? "..." : ""}`);
  }

  return { wineryName, wineryUrl, wineLinks };
}

// ── CLI Entry Point ──

async function main() {
  const args = process.argv.slice(2);

  // Parse arguments
  let wineNames: string[] = [];
  let wineryNames: string[] = [];
  let shouldImport = false;
  let maxWinesPerWinery = 20;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--names") {
      while (i + 1 < args.length && !args[i + 1].startsWith("--")) {
        wineNames.push(args[++i]);
      }
    } else if (args[i] === "--winery") {
      while (i + 1 < args.length && !args[i + 1].startsWith("--")) {
        wineryNames.push(args[++i]);
      }
    } else if (args[i] === "--file") {
      const filePath = args[++i];
      if (!filePath || !existsSync(filePath)) {
        console.error(`File not found: ${filePath}`);
        process.exit(1);
      }
      const content = readFileSync(filePath, "utf-8");
      wineNames.push(...content.split("\n").map((l) => l.trim()).filter(Boolean));
    } else if (args[i] === "--import") {
      shouldImport = true;
    } else if (args[i] === "--max") {
      maxWinesPerWinery = parseInt(args[++i]) || 20;
    }
  }

  // Winery mode: discover wines first, then scrape each one
  if (wineryNames.length > 0) {
    console.log(`\n=== Winery Discovery Mode ===`);
    console.log(`Wineries to scan: ${wineryNames.length}`);
    console.log(`Max wines per winery: ${maxWinesPerWinery}\n`);

    for (const winery of wineryNames) {
      const { wineryName, wineLinks } = await scrapeWineryPage(winery);
      const toScrape = wineLinks.slice(0, maxWinesPerWinery);
      console.log(`\n  → Will scrape ${toScrape.length} wines from ${wineryName}`);
      wineNames.push(...toScrape);
      await delay(DELAY_MS);
    }

    if (wineNames.length === 0) {
      console.log(`\n✗ No wines found from any winery. Try --names instead.`);
      process.exit(0);
    }
  }

  if (wineNames.length === 0) {
    console.log(`
Wine-Searcher + Vivino Scraper

Usage:
  npx tsx scripts/scrape-wines.ts --names "Petrus 2015" "Opus One 2019"
  npx tsx scripts/scrape-wines.ts --winery "Domaine Leflaive" "Gaja"
  npx tsx scripts/scrape-wines.ts --winery "Château Margaux" --max 10
  npx tsx scripts/scrape-wines.ts --file wines.txt

Options:
  --names <wine1> <wine2>       Wine names to scrape
  --winery <name1> <name2>      Scrape all wines from a winery
  --max <number>                Max wines per winery (default: 20)
  --file <path>                 File with one wine name per line
  --import                      Also import results to database

Output: scripts/output/scrape-{timestamp}.json
`);
    process.exit(0);
  }

  console.log(`\n=== Wine Scraper ===`);
  console.log(`Wines to scrape: ${wineNames.length}`);
  console.log(`Import to DB: ${shouldImport ? "yes" : "no"}\n`);

  const results: ScrapedWine[] = [];
  let succeeded = 0;
  let failed = 0;

  for (let i = 0; i < wineNames.length; i++) {
    console.log(`\n[${i + 1}/${wineNames.length}] ${wineNames[i]}`);
    const wine = await scrapeWine(wineNames[i]);
    if (wine) {
      results.push(wine);
      succeeded++;
    } else {
      failed++;
    }
  }

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

  // Import to DB if requested
  if (shouldImport && results.length > 0) {
    console.log(`\nImporting ${results.length} wines to database...`);
    console.log(`Use: node prisma/seeds/import-scraped.mjs ${outputPath}`);
    console.log(`Or paste the dataset into /admin/import`);
  }

  console.log(`\nDone.`);
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
