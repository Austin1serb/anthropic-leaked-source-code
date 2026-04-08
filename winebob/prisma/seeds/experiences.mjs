/**
 * Seed wine experiences — bookable tastings, tours, dinners linked to wineries.
 *
 * Usage: node prisma/seeds/experiences.mjs
 * Requires wineries to be seeded first (references winery slugs).
 */

import "dotenv/config";
import { neon } from "@neondatabase/serverless";

const dbUrl = process.env.DATABASE_URL;
if (!dbUrl) {
  console.error("DATABASE_URL is not set");
  process.exit(1);
}

const sql = neon(dbUrl);

function toPgArray(arr) {
  if (!arr || arr.length === 0) return "{}";
  const escaped = arr.map((s) => `"${s.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`);
  return `{${escaped.join(",")}}`;
}

function toPgIntArray(arr) {
  if (!arr || arr.length === 0) return "{}";
  return `{${arr.join(",")}}`;
}

const experiences = [
  // BORDEAUX
  {
    winerySlug: "chateau-margaux",
    title: "Grand Cru Classé Tasting & Estate Tour",
    slug: "chateau-margaux-grand-cru-tasting",
    description: "A rare opportunity to taste current and library vintages of Château Margaux, guided by our head sommelier. Tour the historic chai and barrel rooms, and learn about the estate's 400-year winemaking legacy.\n\nThe experience concludes with a vertical tasting of three vintages paired with aged cheeses from the region.",
    type: "tasting",
    duration: 120,
    maxGuests: 8,
    pricePerPerson: 25000,
    currency: "EUR",
    recurring: true,
    daysOfWeek: [1, 3, 5],
    startTime: "14:00",
    seasonStart: 4,
    seasonEnd: 10,
    includes: ["Guided estate tour", "3-vintage vertical tasting", "Cheese pairing", "Souvenir tasting glass"],
    languages: ["English", "French"],
    highlights: "One of only a few First Growths offering private tastings — an unforgettable Bordeaux experience.",
    meetingPoint: "Main gate, Château Margaux, Margaux 33460",
    featured: true,
  },
  // BURGUNDY
  {
    winerySlug: "louis-jadot",
    title: "Burgundy Terroir Walk & Cellar Tasting",
    slug: "louis-jadot-terroir-walk",
    description: "Walk through the vineyards of the Côte de Beaune with our viticulturist, learning how soil, slope, and microclimate shape each cru. Return to the 15th-century cellar to taste six wines from Village to Grand Cru, experiencing terroir in the glass.\n\nPerfect for both beginners and serious Burgundy enthusiasts.",
    type: "tour",
    duration: 150,
    maxGuests: 12,
    pricePerPerson: 9500,
    currency: "EUR",
    recurring: true,
    daysOfWeek: [2, 4, 6],
    startTime: "10:00",
    seasonStart: 3,
    seasonEnd: 11,
    includes: ["Vineyard walk", "6-wine tasting", "Terroir map", "Light local snacks"],
    languages: ["English", "French"],
    highlights: "Taste the difference between Village, Premier Cru, and Grand Cru Burgundy — side by side.",
    meetingPoint: "Maison Louis Jadot, 21 Rue Eugène Spuller, Beaune",
    featured: true,
  },
  // TUSCANY
  {
    winerySlug: "antinori",
    title: "Sunset Dinner in the Vineyards",
    slug: "antinori-sunset-dinner",
    description: "Dine among the vines of Tignanello as the Tuscan sun sets over the Chianti hills. Our chef prepares a five-course menu showcasing the best of Tuscan cuisine, each course paired with a different Antinori wine.\n\nThe evening begins with aperitivo and a short walk through the iconic Tignanello vineyard.",
    type: "dinner",
    duration: 240,
    maxGuests: 20,
    pricePerPerson: 18000,
    currency: "EUR",
    recurring: true,
    daysOfWeek: [5, 6],
    startTime: "19:00",
    seasonStart: 5,
    seasonEnd: 9,
    includes: ["Welcome aperitivo", "Vineyard walk", "5-course dinner", "Wine pairing", "Digestif"],
    languages: ["English", "Italian"],
    highlights: "Dine where Tignanello was born — 26 generations of Antinori hospitality.",
    meetingPoint: "Antinori nel Chianti Classico, Via Cassia per Siena 133, Bargino",
    featured: true,
  },
  // PIEDMONT
  {
    winerySlug: "gaja",
    title: "Barbaresco Masterclass with Gaja",
    slug: "gaja-barbaresco-masterclass",
    description: "A deep dive into the Nebbiolo grape through the lens of Gaja's legendary Barbaresco wines. Taste current releases alongside older vintages to understand how these wines evolve.\n\nIncludes discussion of viticulture philosophy and the revolution Angelo Gaja brought to Piedmont.",
    type: "workshop",
    duration: 90,
    maxGuests: 6,
    pricePerPerson: 20000,
    currency: "EUR",
    recurring: false,
    daysOfWeek: [],
    startTime: "11:00",
    seasonStart: null,
    seasonEnd: null,
    includes: ["5-wine masterclass tasting", "Tasting notes booklet", "Q&A with winemaker"],
    languages: ["English", "Italian"],
    highlights: "An intimate masterclass limited to just 6 guests — taste Gaja wines rarely available outside the estate.",
    meetingPoint: "Gaja Winery, Via Torino 18, Barbaresco",
    featured: false,
  },
  // RIOJA
  {
    winerySlug: "lopez-de-heredia",
    title: "Time Travel Tasting: 30 Years of Viña Tondonia",
    slug: "lopez-de-heredia-time-travel",
    description: "Step into the cellars where wines rest for decades. Taste four Viña Tondonia releases spanning 30 years — from youthful Reserva to ethereal Gran Reserva — and experience the magic of traditionally-made Rioja.\n\nThe century-old cobwebbed cellars are an experience in themselves.",
    type: "tasting",
    duration: 90,
    maxGuests: 10,
    pricePerPerson: 7500,
    currency: "EUR",
    recurring: true,
    daysOfWeek: [1, 2, 3, 4, 5],
    startTime: "12:00",
    seasonStart: null,
    seasonEnd: null,
    includes: ["Historic cellar tour", "4-wine vertical tasting", "Tapas pairing"],
    languages: ["English", "Spanish"],
    highlights: "The only place in the world to taste a 30-year Tondonia vertical — straight from the source.",
    meetingPoint: "R. López de Heredia Viña Tondonia, Avenida de Vizcaya 3, Haro",
    featured: true,
  },
  // BAROSSA
  {
    winerySlug: "penfolds",
    title: "Make Your Own Blend Workshop",
    slug: "penfolds-blend-workshop",
    description: "Channel your inner Max Schubert at Penfolds' legendary blending bench. Work with component wines from different vineyards and vintages to create your own personal Shiraz blend.\n\nYour finished wine is bottled, labeled, and yours to take home — a truly unique souvenir.",
    type: "workshop",
    duration: 120,
    maxGuests: 8,
    pricePerPerson: 15000,
    currency: "AUD",
    recurring: true,
    daysOfWeek: [3, 5, 6],
    startTime: "10:00",
    seasonStart: null,
    seasonEnd: null,
    includes: ["Blending components", "Guided workshop", "Your custom bottle", "Light lunch"],
    languages: ["English"],
    highlights: "Create and bottle your own wine at one of the world's most iconic wineries.",
    meetingPoint: "Penfolds Barossa Valley Cellar Door, Tanunda Road, Nuriootpa",
    featured: true,
  },
  // NAPA VALLEY
  {
    winerySlug: "opus-one",
    title: "Opus One: The Art of the Blend",
    slug: "opus-one-art-of-blend",
    description: "Experience Opus One as the founders intended — a dialogue between Bordeaux tradition and Napa Valley terroir. Tour the architecturally stunning winery, taste the current vintage alongside a library selection, and learn the art of assembling a world-class blend.\n\nSeated in the private salon with panoramic vineyard views.",
    type: "tasting",
    duration: 90,
    maxGuests: 6,
    pricePerPerson: 40000,
    currency: "USD",
    recurring: true,
    daysOfWeek: [1, 2, 3, 4, 5],
    startTime: "11:00",
    seasonStart: null,
    seasonEnd: null,
    includes: ["Private salon tasting", "Current + library vintage", "Winery tour", "Artisan cheese selection"],
    languages: ["English"],
    highlights: "A private seated tasting at Napa's most iconic address — limited to 6 guests.",
    meetingPoint: "Opus One Winery, 7900 St Helena Highway, Oakville",
    featured: false,
  },
  // DOURO
  {
    winerySlug: "quinta-do-noval",
    title: "Harvest Experience: Pick, Press & Port",
    slug: "quinta-do-noval-harvest",
    description: "Join the harvest at one of the Douro's most historic quintas. Spend a morning picking grapes on the terraced hillsides, participate in the traditional foot-treading of grapes in granite lagares, and taste the resulting must alongside aged Ports.\n\nLunch overlooking the Douro river included.",
    type: "harvest",
    duration: 360,
    maxGuests: 12,
    pricePerPerson: 12000,
    currency: "EUR",
    recurring: false,
    daysOfWeek: [],
    startTime: "08:00",
    seasonStart: 9,
    seasonEnd: 10,
    includes: ["Grape picking", "Foot treading", "Port tasting", "Traditional Douro lunch", "Transport from Pinhão"],
    languages: ["English", "Portuguese"],
    highlights: "One of the few quintas still using traditional foot-treading — a once-in-a-lifetime harvest experience.",
    meetingPoint: "Quinta do Noval, Pinhão train station pickup",
    featured: true,
  },
  // MARLBOROUGH
  {
    winerySlug: "cloudy-bay",
    title: "Sauvignon Blanc Garden Lunch",
    slug: "cloudy-bay-garden-lunch",
    description: "A long, relaxed lunch in Cloudy Bay's sculpture garden with views of the Wairau Valley. Three courses of seasonal New Zealand cuisine paired with the full Cloudy Bay range — from the iconic Sauvignon Blanc to the Te Koko oak-aged expression and the Pelorus sparkling.\n\nThe most beautiful way to spend a Marlborough afternoon.",
    type: "dinner",
    duration: 180,
    maxGuests: 16,
    pricePerPerson: 9500,
    currency: "NZD",
    recurring: true,
    daysOfWeek: [4, 5, 6, 0],
    startTime: "12:30",
    seasonStart: 10,
    seasonEnd: 4,
    includes: ["3-course lunch", "Full wine pairing", "Garden setting", "Espresso & petits fours"],
    languages: ["English"],
    highlights: "The definitive Marlborough lunch — seasonal cuisine paired with the wines that put New Zealand on the map.",
    meetingPoint: "Cloudy Bay Cellar Door, Jacksons Road, Blenheim",
    featured: false,
  },
  // STELLENBOSCH
  {
    winerySlug: "kanonkop",
    title: "Pinotage Heritage Tasting & Braai",
    slug: "kanonkop-pinotage-braai",
    description: "Discover South Africa's signature grape at its spiritual home. Taste the full Kanonkop range from bush vine Pinotage to the legendary Paul Sauer blend, then join us for a traditional South African braai (barbecue) under the Simonsberg mountain.\n\nA celebration of Cape wine culture at its most authentic.",
    type: "tasting",
    duration: 150,
    maxGuests: 14,
    pricePerPerson: 3500,
    currency: "ZAR",
    recurring: true,
    daysOfWeek: [5, 6],
    startTime: "11:00",
    seasonStart: null,
    seasonEnd: null,
    includes: ["5-wine guided tasting", "Traditional braai lunch", "Estate walk"],
    languages: ["English", "Afrikaans"],
    highlights: "Braai and Pinotage on the slopes of the Simonsberg — this is the real South Africa.",
    meetingPoint: "Kanonkop Wine Estate, R44, Stellenbosch",
    featured: false,
  },
];

async function main() {
  console.log("=== Seeding Wine Experiences ===\n");

  let created = 0;
  let skipped = 0;

  for (const exp of experiences) {
    try {
      // Look up the winery ID by slug
      const wineryRows = await sql`SELECT id FROM "Winery" WHERE slug = ${exp.winerySlug}`;
      if (wineryRows.length === 0) {
        console.warn(`  Skipping "${exp.title}" — winery "${exp.winerySlug}" not found`);
        skipped++;
        continue;
      }
      const wineryId = wineryRows[0].id;

      const includes = toPgArray(exp.includes);
      const languages = toPgArray(exp.languages);
      const images = toPgArray([]);
      const daysOfWeek = toPgIntArray(exp.daysOfWeek);

      await sql`
        INSERT INTO "WineExperience" (
          id, "wineryId", title, slug, description, type, duration, "maxGuests",
          "pricePerPerson", currency, recurring, "daysOfWeek", "startTime",
          "seasonStart", "seasonEnd", image, images, includes, languages,
          highlights, "meetingPoint", active, featured, "createdAt", "updatedAt"
        )
        VALUES (
          gen_random_uuid(), ${wineryId}, ${exp.title}, ${exp.slug}, ${exp.description},
          ${exp.type}, ${exp.duration}, ${exp.maxGuests}, ${exp.pricePerPerson},
          ${exp.currency}, ${exp.recurring}, ${daysOfWeek}::int[], ${exp.startTime || null},
          ${exp.seasonStart || null}, ${exp.seasonEnd || null}, null, ${images}::text[],
          ${includes}::text[], ${languages}::text[], ${exp.highlights || null},
          ${exp.meetingPoint || null}, true, ${exp.featured}, NOW(), NOW()
        )
        ON CONFLICT (slug) DO UPDATE SET
          title = EXCLUDED.title,
          description = EXCLUDED.description,
          type = EXCLUDED.type,
          duration = EXCLUDED.duration,
          "maxGuests" = EXCLUDED."maxGuests",
          "pricePerPerson" = EXCLUDED."pricePerPerson",
          includes = EXCLUDED.includes,
          languages = EXCLUDED.languages,
          highlights = EXCLUDED.highlights,
          "meetingPoint" = EXCLUDED."meetingPoint",
          featured = EXCLUDED.featured,
          "updatedAt" = NOW()
      `;
      console.log(`  ✓ ${exp.title} (${exp.winerySlug})`);
      created++;
    } catch (err) {
      console.error(`  ✗ Failed "${exp.title}": ${err.message}`);
      skipped++;
    }
  }

  console.log(`\n=== Done: ${created} created, ${skipped} skipped ===`);
}

main().catch((e) => {
  console.error("Fatal:", e);
  process.exit(1);
});
