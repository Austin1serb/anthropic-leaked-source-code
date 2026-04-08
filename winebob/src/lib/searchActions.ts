"use server";

import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { trackWineSearch } from "@/lib/analytics";
import Anthropic from "@anthropic-ai/sdk";

// ============ TYPES ============

type WineResult = {
  id: string;
  name: string;
  producer: string;
  vintage: number | null;
  grapes: string[];
  region: string;
  country: string;
  type: string;
  priceRange: string | null;
  labelImage: string | null;
};

type GrapeResult = {
  id: string;
  name: string;
  color: string;
  aliases: string[];
  originCountry: string | null;
};

type RegionResult = {
  region: string;
  country: string;
  wineCount: number;
};

type ProducerResult = {
  name: string;
  country: string;
  region: string | null;
  wineCount: number;
};

export type SmartSearchResults = {
  wines: WineResult[];
  grapes: GrapeResult[];
  regions: RegionResult[];
  producers: ProducerResult[];
  totalWines: number;
};

export type SearchIndexData = {
  wines: {
    id: string;
    name: string;
    producer: string;
    region: string;
    country: string;
    type: string;
    grapes: string[];
    vintage: number | null;
  }[];
  grapes: { id: string; name: string; aliases: string[]; color: string }[];
  regions: { region: string; country: string }[];
};

export type AIParsedQuery = {
  type?: string;
  country?: string;
  region?: string;
  priceRange?: string;
  grape?: string;
  search?: string;
  description?: string;
};

// ============ SMART SEARCH ============

export async function smartSearch(query: string): Promise<SmartSearchResults> {
  if (!query || query.trim().length < 2) {
    return { wines: [], grapes: [], regions: [], producers: [], totalWines: 0 };
  }

  const q = query.trim();
  const pattern = `%${q}%`;

  // Run all searches in parallel
  const [wines, totalWines, grapes, regionRows, producerRows] =
    await Promise.all([
      // Wine search: name, producer, region, country, description, tastingNotes, grapes
      prisma.wine.findMany({
        where: {
          isPublic: true,
          OR: [
            { name: { contains: q, mode: "insensitive" } },
            { producer: { contains: q, mode: "insensitive" } },
            { region: { contains: q, mode: "insensitive" } },
            { country: { contains: q, mode: "insensitive" } },
            { appellation: { contains: q, mode: "insensitive" } },
            { description: { contains: q, mode: "insensitive" } },
            { tastingNotes: { contains: q, mode: "insensitive" } },
            { foodPairing: { contains: q, mode: "insensitive" } },
            { grapes: { hasSome: [q] } },
          ],
        },
        select: {
          id: true,
          name: true,
          producer: true,
          vintage: true,
          grapes: true,
          region: true,
          country: true,
          type: true,
          priceRange: true,
          labelImage: true,
        },
        take: 5,
        orderBy: { name: "asc" },
      }),

      // Total wine count for this query
      prisma.wine.count({
        where: {
          isPublic: true,
          OR: [
            { name: { contains: q, mode: "insensitive" } },
            { producer: { contains: q, mode: "insensitive" } },
            { region: { contains: q, mode: "insensitive" } },
            { country: { contains: q, mode: "insensitive" } },
            { appellation: { contains: q, mode: "insensitive" } },
            { description: { contains: q, mode: "insensitive" } },
            { tastingNotes: { contains: q, mode: "insensitive" } },
            { foodPairing: { contains: q, mode: "insensitive" } },
            { grapes: { hasSome: [q] } },
          ],
        },
      }),

      // Grape variety search
      prisma.grapeVariety.findMany({
        where: {
          OR: [
            { name: { contains: q, mode: "insensitive" } },
            { aliases: { hasSome: [q] } },
          ],
        },
        select: {
          id: true,
          name: true,
          color: true,
          aliases: true,
          originCountry: true,
        },
        take: 5,
      }),

      // Region search via raw query for distinct regions
      prisma.$queryRaw<{ region: string; country: string; count: bigint }[]>`
        SELECT region, country, COUNT(*)::bigint as count
        FROM "Wine"
        WHERE "isPublic" = true
          AND (region ILIKE ${pattern} OR country ILIKE ${pattern})
        GROUP BY region, country
        ORDER BY count DESC
        LIMIT 5
      `,

      // Producer search via raw query for distinct producers
      prisma.$queryRaw<
        {
          producer: string;
          country: string;
          region: string | null;
          count: bigint;
        }[]
      >`
        SELECT producer, country, MIN(region) as region, COUNT(*)::bigint as count
        FROM "Wine"
        WHERE "isPublic" = true
          AND producer ILIKE ${pattern}
        GROUP BY producer, country
        ORDER BY count DESC
        LIMIT 5
      `,
    ]);

  // Fire-and-forget analytics
  const session = await auth().catch(() => null);
  trackWineSearch(session?.user?.id ?? null, q, totalWines).catch(() => {});

  return {
    wines,
    grapes,
    regions: regionRows.map((r) => ({
      region: r.region,
      country: r.country,
      wineCount: Number(r.count),
    })),
    producers: producerRows.map((p) => ({
      name: p.producer,
      country: p.country,
      region: p.region,
      wineCount: Number(p.count),
    })),
    totalWines,
  };
}

// ============ SEARCH INDEX (for client-side Fuse.js) ============

export async function getSearchIndex(): Promise<SearchIndexData> {
  const [wines, grapes, regionRows] = await Promise.all([
    prisma.wine.findMany({
      where: { isPublic: true },
      select: {
        id: true,
        name: true,
        producer: true,
        region: true,
        country: true,
        type: true,
        grapes: true,
        vintage: true,
      },
      orderBy: { name: "asc" },
    }),
    prisma.grapeVariety.findMany({
      select: { id: true, name: true, aliases: true, color: true },
      orderBy: { name: "asc" },
    }),
    prisma.$queryRaw<{ region: string; country: string }[]>`
      SELECT DISTINCT region, country
      FROM "Wine"
      WHERE "isPublic" = true
      ORDER BY region ASC
    `,
  ]);

  return { wines, grapes, regions: regionRows };
}

// ============ POPULAR SEARCHES ============

export async function getPopularSearches(): Promise<string[]> {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const rows = await prisma.$queryRaw<{ query: string; cnt: bigint }[]>`
    SELECT metadata->>'query' as query, COUNT(*)::bigint as cnt
    FROM "WineEvent"
    WHERE "eventType" = 'wine_search'
      AND "createdAt" > ${thirtyDaysAgo}
      AND metadata->>'query' IS NOT NULL
      AND LENGTH(metadata->>'query') >= 2
    GROUP BY metadata->>'query'
    ORDER BY cnt DESC
    LIMIT 8
  `;

  return rows.map((r) => r.query);
}

// ============ AI QUERY PARSING ============

export async function aiParseQuery(query: string): Promise<AIParsedQuery> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    // Fallback: just return raw search
    return { search: query };
  }

  try {
    const client = new Anthropic({ apiKey });

    const response = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 256,
      system: `You are a wine search query parser. Extract structured filters from natural language wine queries.
Return a JSON object with these optional fields:
- type: "red" | "white" | "rosé" | "sparkling" | "orange" | "dessert" | "fortified"
- country: country name (e.g. "France", "Italy", "Spain")
- region: wine region (e.g. "Bordeaux", "Tuscany", "Napa Valley")
- priceRange: "budget" (<$15) | "mid" ($15-40) | "premium" ($40-100) | "luxury" ($100+)
- grape: grape variety name (e.g. "Cabernet Sauvignon", "Pinot Noir")
- search: remaining keywords that don't fit other fields
- description: a brief description of what was requested for display

Only include fields you can confidently extract. Return ONLY valid JSON, no explanation.`,
      messages: [{ role: "user", content: query }],
    });

    const text =
      response.content[0].type === "text" ? response.content[0].text : "";
    const parsed = JSON.parse(text) as AIParsedQuery;
    return parsed;
  } catch {
    // On any failure, fall back to raw search
    return { search: query };
  }
}
