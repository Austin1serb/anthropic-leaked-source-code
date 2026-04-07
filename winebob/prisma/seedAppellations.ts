import "dotenv/config";
import { neon } from "@neondatabase/serverless";

const dbUrl = process.env.DATABASE_URL;
if (!dbUrl) {
  console.error("DATABASE_URL is not set");
  process.exit(1);
}

const sql = neon(dbUrl);

interface Appellation {
  name: string;
  country: string;
  region: string;
  level: string;
  grapeVarieties: string[];
  established: number | null;
  description: string;
}

function makeId(name: string, country: string): string {
  return `${name}-${country}`.toLowerCase().replace(/[^a-z0-9]/g, "-");
}

const appellations: Appellation[] = [
  // ─── FRANCE (AOC) ───
  { name: "Bordeaux AOC", country: "France", region: "Bordeaux", level: "AOC", grapeVarieties: ["Cabernet Sauvignon", "Merlot", "Cabernet Franc"], established: 1936, description: "Umbrella appellation for the Bordeaux region" },
  { name: "Margaux", country: "France", region: "Bordeaux", level: "AOC", grapeVarieties: ["Cabernet Sauvignon", "Merlot"], established: 1954, description: "Elegant Left Bank communal appellation" },
  { name: "Pauillac", country: "France", region: "Bordeaux", level: "AOC", grapeVarieties: ["Cabernet Sauvignon", "Merlot"], established: 1936, description: "Home to three First Growths" },
  { name: "Saint-Julien", country: "France", region: "Bordeaux", level: "AOC", grapeVarieties: ["Cabernet Sauvignon", "Merlot"], established: 1936, description: "Most consistent Médoc commune" },
  { name: "Saint-Estèphe", country: "France", region: "Bordeaux", level: "AOC", grapeVarieties: ["Cabernet Sauvignon", "Merlot"], established: 1936, description: "Sturdy, long-lived Left Bank wines" },
  { name: "Pessac-Léognan", country: "France", region: "Bordeaux", level: "AOC", grapeVarieties: ["Cabernet Sauvignon", "Merlot", "Sauvignon Blanc"], established: 1987, description: "Graves subregion with reds and whites" },
  { name: "Pomerol", country: "France", region: "Bordeaux", level: "AOC", grapeVarieties: ["Merlot", "Cabernet Franc"], established: 1936, description: "Small Right Bank, Merlot-dominated" },
  { name: "Saint-Émilion Grand Cru", country: "France", region: "Bordeaux", level: "AOC", grapeVarieties: ["Merlot", "Cabernet Franc"], established: 1954, description: "Classified Right Bank estates" },
  { name: "Sauternes", country: "France", region: "Bordeaux", level: "AOC", grapeVarieties: ["Sémillon", "Sauvignon Blanc"], established: 1936, description: "Noble rot dessert wines" },
  { name: "Entre-Deux-Mers", country: "France", region: "Bordeaux", level: "AOC", grapeVarieties: ["Sauvignon Blanc", "Sémillon"], established: 1937, description: "Dry whites between two rivers" },
  { name: "Médoc", country: "France", region: "Bordeaux", level: "AOC", grapeVarieties: ["Cabernet Sauvignon", "Merlot"], established: 1936, description: "Left Bank red wine region" },
  { name: "Haut-Médoc", country: "France", region: "Bordeaux", level: "AOC", grapeVarieties: ["Cabernet Sauvignon", "Merlot"], established: 1936, description: "Upper Médoc, home to famous communes" },
  { name: "Graves", country: "France", region: "Bordeaux", level: "AOC", grapeVarieties: ["Cabernet Sauvignon", "Merlot", "Sauvignon Blanc"], established: 1937, description: "Gravelly soils south of the city" },
  { name: "Chablis", country: "France", region: "Burgundy", level: "AOC", grapeVarieties: ["Chardonnay"], established: 1938, description: "Mineral, unoaked Chardonnay" },
  { name: "Chablis Grand Cru", country: "France", region: "Burgundy", level: "AOC", grapeVarieties: ["Chardonnay"], established: 1938, description: "Seven Grand Cru vineyards" },
  { name: "Gevrey-Chambertin", country: "France", region: "Burgundy", level: "AOC", grapeVarieties: ["Pinot Noir"], established: 1936, description: "Powerful Côte de Nuits Pinot" },
  { name: "Chambolle-Musigny", country: "France", region: "Burgundy", level: "AOC", grapeVarieties: ["Pinot Noir"], established: 1936, description: "Elegant, perfumed Burgundy" },
  { name: "Vosne-Romanée", country: "France", region: "Burgundy", level: "AOC", grapeVarieties: ["Pinot Noir"], established: 1936, description: "Home to DRC, pinnacle of Pinot" },
  { name: "Nuits-Saint-Georges", country: "France", region: "Burgundy", level: "AOC", grapeVarieties: ["Pinot Noir"], established: 1936, description: "Firm, structured Côte de Nuits" },
  { name: "Meursault", country: "France", region: "Burgundy", level: "AOC", grapeVarieties: ["Chardonnay"], established: 1937, description: "Rich, buttery white Burgundy" },
  { name: "Puligny-Montrachet", country: "France", region: "Burgundy", level: "AOC", grapeVarieties: ["Chardonnay"], established: 1937, description: "Mineral, precise Grand Cru whites" },
  { name: "Pommard", country: "France", region: "Burgundy", level: "AOC", grapeVarieties: ["Pinot Noir"], established: 1936, description: "Sturdy Côte de Beaune red" },
  { name: "Beaune", country: "France", region: "Burgundy", level: "AOC", grapeVarieties: ["Pinot Noir", "Chardonnay"], established: 1936, description: "Wine capital of Burgundy" },
  { name: "Bourgogne", country: "France", region: "Burgundy", level: "AOC", grapeVarieties: ["Pinot Noir", "Chardonnay"], established: 1937, description: "Regional Burgundy appellation" },
  { name: "Mâcon", country: "France", region: "Burgundy", level: "AOC", grapeVarieties: ["Chardonnay"], established: 1937, description: "Southern Burgundy whites" },
  { name: "Côtes du Rhône", country: "France", region: "Rhône Valley", level: "AOC", grapeVarieties: ["Grenache", "Syrah", "Mourvèdre"], established: 1937, description: "Regional Rhône blend" },
  { name: "Châteauneuf-du-Pape", country: "France", region: "Rhône Valley", level: "AOC", grapeVarieties: ["Grenache", "Syrah", "Mourvèdre"], established: 1936, description: "13 permitted varieties, powerful reds" },
  { name: "Hermitage", country: "France", region: "Rhône Valley", level: "AOC", grapeVarieties: ["Syrah", "Marsanne", "Roussanne"], established: 1937, description: "Iconic Northern Rhône Syrah" },
  { name: "Côte-Rôtie", country: "France", region: "Rhône Valley", level: "AOC", grapeVarieties: ["Syrah", "Viognier"], established: 1940, description: "Steep slopes, co-fermented Syrah" },
  { name: "Crozes-Hermitage", country: "France", region: "Rhône Valley", level: "AOC", grapeVarieties: ["Syrah"], established: 1937, description: "Largest Northern Rhône appellation" },
  { name: "Gigondas", country: "France", region: "Rhône Valley", level: "AOC", grapeVarieties: ["Grenache", "Syrah"], established: 1971, description: "Southern Rhône power" },
  { name: "Condrieu", country: "France", region: "Rhône Valley", level: "AOC", grapeVarieties: ["Viognier"], established: 1940, description: "Aromatic white-only appellation" },
  { name: "Sancerre", country: "France", region: "Loire Valley", level: "AOC", grapeVarieties: ["Sauvignon Blanc", "Pinot Noir"], established: 1936, description: "Crisp Sauvignon with flinty mineral" },
  { name: "Pouilly-Fumé", country: "France", region: "Loire Valley", level: "AOC", grapeVarieties: ["Sauvignon Blanc"], established: 1937, description: "Smoky, gun-flint Sauvignon" },
  { name: "Vouvray", country: "France", region: "Loire Valley", level: "AOC", grapeVarieties: ["Chenin Blanc"], established: 1936, description: "Dry to sweet Chenin Blanc" },
  { name: "Chinon", country: "France", region: "Loire Valley", level: "AOC", grapeVarieties: ["Cabernet Franc"], established: 1937, description: "Loire Cabernet Franc at its best" },
  { name: "Muscadet", country: "France", region: "Loire Valley", level: "AOC", grapeVarieties: ["Melon de Bourgogne"], established: 1936, description: "Briny, lees-aged Atlantic white" },
  { name: "Anjou", country: "France", region: "Loire Valley", level: "AOC", grapeVarieties: ["Chenin Blanc", "Cabernet Franc"], established: 1936, description: "Versatile Loire appellation" },
  { name: "Alsace", country: "France", region: "Alsace", level: "AOC", grapeVarieties: ["Riesling", "Gewürztraminer", "Pinot Gris"], established: 1962, description: "Aromatic whites in Germanic style" },
  { name: "Alsace Grand Cru", country: "France", region: "Alsace", level: "AOC", grapeVarieties: ["Riesling", "Gewürztraminer", "Pinot Gris", "Muscat"], established: 1975, description: "51 named vineyard sites" },
  { name: "Crémant d'Alsace", country: "France", region: "Alsace", level: "AOC", grapeVarieties: ["Pinot Blanc", "Riesling", "Chardonnay"], established: 1976, description: "Traditional method sparkling" },
  { name: "Champagne", country: "France", region: "Champagne", level: "AOC", grapeVarieties: ["Chardonnay", "Pinot Noir", "Pinot Meunier"], established: 1936, description: "The world's most famous sparkling wine" },
  { name: "Côtes de Provence", country: "France", region: "Provence", level: "AOC", grapeVarieties: ["Grenache", "Cinsault", "Mourvèdre"], established: 1977, description: "France's rosé heartland" },
  { name: "Bandol", country: "France", region: "Provence", level: "AOC", grapeVarieties: ["Mourvèdre"], established: 1941, description: "Mourvèdre-based reds and rosés" },

  // ─── ITALY ───
  { name: "Barolo", country: "Italy", region: "Piedmont", level: "DOCG", grapeVarieties: ["Nebbiolo"], established: 1980, description: "The King of Italian wines" },
  { name: "Barbaresco", country: "Italy", region: "Piedmont", level: "DOCG", grapeVarieties: ["Nebbiolo"], established: 1980, description: "Elegant Nebbiolo, Barolo's sibling" },
  { name: "Brunello di Montalcino", country: "Italy", region: "Tuscany", level: "DOCG", grapeVarieties: ["Sangiovese"], established: 1980, description: "Montalcino's age-worthy Sangiovese" },
  { name: "Chianti Classico", country: "Italy", region: "Tuscany", level: "DOCG", grapeVarieties: ["Sangiovese"], established: 1984, description: "Historic heart of Chianti" },
  { name: "Chianti", country: "Italy", region: "Tuscany", level: "DOCG", grapeVarieties: ["Sangiovese"], established: 1984, description: "Tuscany's most famous red" },
  { name: "Vino Nobile di Montepulciano", country: "Italy", region: "Tuscany", level: "DOCG", grapeVarieties: ["Sangiovese"], established: 1980, description: "Noble wine from Montepulciano" },
  { name: "Amarone della Valpolicella", country: "Italy", region: "Veneto", level: "DOCG", grapeVarieties: ["Corvina", "Rondinella"], established: 2009, description: "Dried grape method, rich and powerful" },
  { name: "Franciacorta", country: "Italy", region: "Lombardy", level: "DOCG", grapeVarieties: ["Chardonnay", "Pinot Noir"], established: 1995, description: "Italy's premier traditional method sparkling" },
  { name: "Prosecco", country: "Italy", region: "Veneto", level: "DOC", grapeVarieties: ["Glera"], established: 2009, description: "Italy's beloved sparkling wine" },
  { name: "Soave", country: "Italy", region: "Veneto", level: "DOC", grapeVarieties: ["Garganega"], established: 1968, description: "Almond-scented Veneto white" },
  { name: "Bolgheri", country: "Italy", region: "Tuscany", level: "DOC", grapeVarieties: ["Cabernet Sauvignon", "Merlot"], established: 1983, description: "Coastal Super Tuscan territory" },
  { name: "Toscana", country: "Italy", region: "Tuscany", level: "IGT", grapeVarieties: ["Sangiovese", "Cabernet Sauvignon"], established: 1992, description: "Flexible IGT for Super Tuscans" },
  { name: "Etna", country: "Italy", region: "Sicily", level: "DOC", grapeVarieties: ["Nerello Mascalese", "Carricante"], established: 1968, description: "Volcanic wines from Mount Etna" },

  // ─── SPAIN ───
  { name: "Rioja", country: "Spain", region: "Rioja", level: "DOCa", grapeVarieties: ["Tempranillo", "Garnacha", "Graciano"], established: 1925, description: "Spain's most prestigious wine region" },
  { name: "Ribera del Duero", country: "Spain", region: "Castilla y León", level: "DO", grapeVarieties: ["Tempranillo"], established: 1982, description: "Powerful Tempranillo at altitude" },
  { name: "Priorat", country: "Spain", region: "Catalonia", level: "DOCa", grapeVarieties: ["Garnacha", "Cariñena"], established: 1954, description: "Slate soils, intense old-vine reds" },
  { name: "Rías Baixas", country: "Spain", region: "Galicia", level: "DO", grapeVarieties: ["Albariño"], established: 1988, description: "Crisp Atlantic Albariño" },
  { name: "Penedès", country: "Spain", region: "Catalonia", level: "DO", grapeVarieties: ["Macabeo", "Xarel·lo", "Parellada"], established: 1960, description: "Cava country and still wines" },
  { name: "Cava", country: "Spain", region: "Catalonia", level: "DO", grapeVarieties: ["Macabeo", "Xarel·lo", "Parellada"], established: 1972, description: "Spanish traditional method sparkling" },
  { name: "Jerez", country: "Spain", region: "Andalusia", level: "DO", grapeVarieties: ["Palomino", "Pedro Ximénez"], established: 1933, description: "Sherry: fino, manzanilla, oloroso" },
  { name: "Rueda", country: "Spain", region: "Castilla y León", level: "DO", grapeVarieties: ["Verdejo"], established: 1980, description: "Herbal, refreshing Verdejo whites" },
  { name: "Toro", country: "Spain", region: "Castilla y León", level: "DO", grapeVarieties: ["Tempranillo"], established: 1987, description: "Powerful, sun-baked Tempranillo" },
  { name: "Jumilla", country: "Spain", region: "Murcia", level: "DO", grapeVarieties: ["Monastrell"], established: 1966, description: "Monastrell heartland" },

  // ─── PORTUGAL (DOC) ───
  { name: "Douro", country: "Portugal", region: "Douro Valley", level: "DOC", grapeVarieties: ["Touriga Nacional", "Touriga Franca", "Tinta Roriz"], established: 1982, description: "Stunning terraced valley, table and port wines" },
  { name: "Porto", country: "Portugal", region: "Douro Valley", level: "DOC", grapeVarieties: ["Touriga Nacional", "Touriga Franca"], established: 1756, description: "World's oldest demarcated wine region" },
  { name: "Alentejo", country: "Portugal", region: "Alentejo", level: "DOC", grapeVarieties: ["Aragonez", "Trincadeira", "Antão Vaz"], established: 1988, description: "Sun-drenched southern plains" },
  { name: "Vinho Verde", country: "Portugal", region: "Minho", level: "DOC", grapeVarieties: ["Loureiro", "Alvarinho", "Arinto"], established: 1908, description: "Light, fresh, slightly fizzy" },
  { name: "Dão", country: "Portugal", region: "Dão", level: "DOC", grapeVarieties: ["Touriga Nacional", "Encruzado"], established: 1908, description: "Elegant, granite-grown wines" },
  { name: "Bairrada", country: "Portugal", region: "Bairrada", level: "DOC", grapeVarieties: ["Baga"], established: 1979, description: "Tannic Baga reds, sparkling" },
  { name: "Madeira", country: "Portugal", region: "Madeira", level: "DOC", grapeVarieties: ["Sercial", "Verdelho", "Bual", "Malmsey"], established: 1913, description: "Fortified wine with extraordinary longevity" },

  // ─── GERMANY (Qualitätswein) ───
  { name: "Mosel", country: "Germany", region: "Mosel", level: "Qualitätswein", grapeVarieties: ["Riesling"], established: 1971, description: "Steep slate slopes, crystalline Riesling" },
  { name: "Rheingau", country: "Germany", region: "Rheingau", level: "Qualitätswein", grapeVarieties: ["Riesling"], established: 1971, description: "Grand Riesling on Rhine's north bank" },
  { name: "Pfalz", country: "Germany", region: "Pfalz", level: "Qualitätswein", grapeVarieties: ["Riesling", "Dornfelder"], established: 1971, description: "Germany's warmest, largest region" },
  { name: "Rheinhessen", country: "Germany", region: "Rheinhessen", level: "Qualitätswein", grapeVarieties: ["Riesling", "Silvaner"], established: 1971, description: "Germany's largest wine region" },
  { name: "Nahe", country: "Germany", region: "Nahe", level: "Qualitätswein", grapeVarieties: ["Riesling"], established: 1971, description: "Diverse soils, mineral Riesling" },
  { name: "Baden", country: "Germany", region: "Baden", level: "Qualitätswein", grapeVarieties: ["Spätburgunder", "Grauburgunder"], established: 1971, description: "Germany's warmest, Pinot country" },

  // ─── USA (AVA) ───
  { name: "Napa Valley", country: "USA", region: "California", level: "AVA", grapeVarieties: ["Cabernet Sauvignon", "Chardonnay"], established: 1981, description: "America's most famous wine region" },
  { name: "Sonoma Coast", country: "USA", region: "California", level: "AVA", grapeVarieties: ["Pinot Noir", "Chardonnay"], established: 1987, description: "Cool Pacific-influenced vineyards" },
  { name: "Russian River Valley", country: "USA", region: "California", level: "AVA", grapeVarieties: ["Pinot Noir", "Chardonnay"], established: 1983, description: "Fog-cooled, world-class Pinot" },
  { name: "Willamette Valley", country: "USA", region: "Oregon", level: "AVA", grapeVarieties: ["Pinot Noir", "Pinot Gris"], established: 1984, description: "Oregon's premier Pinot Noir region" },
  { name: "Paso Robles", country: "USA", region: "California", level: "AVA", grapeVarieties: ["Cabernet Sauvignon", "Zinfandel", "Rhône varieties"], established: 1983, description: "Central Coast warmth and diversity" },
  { name: "Walla Walla Valley", country: "USA", region: "Washington", level: "AVA", grapeVarieties: ["Cabernet Sauvignon", "Merlot", "Syrah"], established: 1984, description: "Premium Columbia Valley sub-region" },
  { name: "Oakville", country: "USA", region: "California", level: "AVA", grapeVarieties: ["Cabernet Sauvignon"], established: 1993, description: "Napa's premier Cabernet district" },
  { name: "Rutherford", country: "USA", region: "California", level: "AVA", grapeVarieties: ["Cabernet Sauvignon"], established: 1993, description: "Famous 'Rutherford dust' terroir" },
  { name: "Stags Leap District", country: "USA", region: "California", level: "AVA", grapeVarieties: ["Cabernet Sauvignon"], established: 1989, description: "1976 Judgment of Paris winner" },
  { name: "Santa Barbara County", country: "USA", region: "California", level: "AVA", grapeVarieties: ["Pinot Noir", "Chardonnay"], established: 1981, description: "Transverse ranges, cool climate" },

  // ─── AUSTRALIA (GI) ───
  { name: "Barossa Valley", country: "Australia", region: "South Australia", level: "GI", grapeVarieties: ["Shiraz", "Grenache"], established: 1997, description: "Old-vine Shiraz powerhouse" },
  { name: "Margaret River", country: "Australia", region: "Western Australia", level: "GI", grapeVarieties: ["Cabernet Sauvignon", "Chardonnay"], established: 1999, description: "Maritime Bordeaux-style reds and whites" },
  { name: "McLaren Vale", country: "Australia", region: "South Australia", level: "GI", grapeVarieties: ["Shiraz", "Grenache"], established: 1997, description: "Mediterranean climate, diverse styles" },
  { name: "Hunter Valley", country: "Australia", region: "New South Wales", level: "GI", grapeVarieties: ["Sémillon", "Shiraz"], established: 1997, description: "Age-worthy Sémillon and Shiraz" },
  { name: "Yarra Valley", country: "Australia", region: "Victoria", level: "GI", grapeVarieties: ["Pinot Noir", "Chardonnay"], established: 1997, description: "Cool-climate elegance near Melbourne" },
  { name: "Eden Valley", country: "Australia", region: "South Australia", level: "GI", grapeVarieties: ["Riesling", "Shiraz"], established: 1997, description: "High-altitude Riesling" },

  // ─── NEW ZEALAND (GI) ───
  { name: "Marlborough", country: "New Zealand", region: "South Island", level: "GI", grapeVarieties: ["Sauvignon Blanc", "Pinot Noir"], established: 1997, description: "World benchmark for Sauvignon Blanc" },
  { name: "Central Otago", country: "New Zealand", region: "South Island", level: "GI", grapeVarieties: ["Pinot Noir"], established: 1997, description: "World's southernmost wine region" },
  { name: "Hawke's Bay", country: "New Zealand", region: "North Island", level: "GI", grapeVarieties: ["Cabernet Sauvignon", "Merlot", "Syrah"], established: 1997, description: "NZ's Bordeaux-style region" },

  // ─── SOUTH AFRICA (WO) ───
  { name: "Stellenbosch", country: "South Africa", region: "Western Cape", level: "WO", grapeVarieties: ["Cabernet Sauvignon", "Pinotage"], established: 1973, description: "South Africa's premium red wine region" },
  { name: "Swartland", country: "South Africa", region: "Western Cape", level: "WO", grapeVarieties: ["Syrah", "Chenin Blanc", "Grenache"], established: 1973, description: "Old-vine revolution, natural wine hotspot" },
  { name: "Constantia", country: "South Africa", region: "Western Cape", level: "WO", grapeVarieties: ["Sauvignon Blanc", "Muscat"], established: 1973, description: "Historic sweet wine, cool maritime" },

  // ─── ARGENTINA ───
  { name: "Mendoza", country: "Argentina", region: "Mendoza", level: "DOC", grapeVarieties: ["Malbec", "Cabernet Sauvignon"], established: 1999, description: "Andes foothills, Malbec capital" },
  { name: "Luján de Cuyo", country: "Argentina", region: "Mendoza", level: "DOC", grapeVarieties: ["Malbec"], established: 1989, description: "Historic Malbec heartland" },
  { name: "Valle de Uco", country: "Argentina", region: "Mendoza", level: "GI", grapeVarieties: ["Malbec", "Pinot Noir"], established: null, description: "High-altitude, cool-climate frontier" },

  // ─── CHILE (DO) ───
  { name: "Maipo Valley", country: "Chile", region: "Central Valley", level: "DO", grapeVarieties: ["Cabernet Sauvignon"], established: null, description: "Chile's most prestigious Cabernet" },
  { name: "Colchagua Valley", country: "Chile", region: "Rapel Valley", level: "DO", grapeVarieties: ["Carménère", "Cabernet Sauvignon"], established: null, description: "Rich reds, warm interior valley" },
  { name: "Casablanca Valley", country: "Chile", region: "Aconcagua", level: "DO", grapeVarieties: ["Sauvignon Blanc", "Chardonnay", "Pinot Noir"], established: null, description: "Cool coastal whites and Pinot" },
];

async function main() {
  console.log(`Seeding ${appellations.length} appellations...`);

  for (const a of appellations) {
    const id = makeId(a.name, a.country);
    await sql`
      INSERT INTO "Appellation" (id, name, country, region, level, "grapeVarieties", established, description, "createdAt")
      VALUES (${id}, ${a.name}, ${a.country}, ${a.region}, ${a.level}, ${a.grapeVarieties}, ${a.established}, ${a.description}, NOW())
      ON CONFLICT (name, country) DO NOTHING
    `;
  }

  console.log(`Seeded ${appellations.length} appellations.`);
  console.log("Done!");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
