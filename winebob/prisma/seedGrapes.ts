import "dotenv/config";
import { neon } from "@neondatabase/serverless";

const dbUrl = process.env.DATABASE_URL;
if (!dbUrl) {
  console.error("DATABASE_URL is not set");
  process.exit(1);
}

const sql = neon(dbUrl);

type Grape = {
  name: string;
  aliases: string[];
  color: "red" | "white";
  originCountry: string | null;
  description: string;
  acreageHa: number | null;
};

const grapes: Grape[] = [
  // ── RED GRAPES ──
  { name: "Cabernet Sauvignon", aliases: ["Cab Sav"], color: "red", originCountry: "France", description: "Full-bodied with blackcurrant and cedar", acreageHa: 340000 },
  { name: "Merlot", aliases: ["Merlò"], color: "red", originCountry: "France", description: "Soft, plummy, and approachable", acreageHa: 266000 },
  { name: "Pinot Noir", aliases: ["Spätburgunder", "Pinot Nero"], color: "red", originCountry: "France", description: "Elegant with red fruit and earthy complexity", acreageHa: 115000 },
  { name: "Syrah", aliases: ["Shiraz", "Hermitage"], color: "red", originCountry: "France", description: "Dark fruit, pepper, and smoky notes", acreageHa: 190000 },
  { name: "Grenache", aliases: ["Garnacha", "Cannonau"], color: "red", originCountry: "Spain", description: "Ripe strawberry and spice with high alcohol", acreageHa: 163000 },
  { name: "Tempranillo", aliases: ["Tinta Roriz", "Tinto Fino", "Cencibel", "Aragonez"], color: "red", originCountry: "Spain", description: "Leather, cherry, and tobacco", acreageHa: 231000 },
  { name: "Sangiovese", aliases: ["Brunello", "Prugnolo Gentile", "Morellino"], color: "red", originCountry: "Italy", description: "Bright cherry, tomato leaf, and firm tannins", acreageHa: 71000 },
  { name: "Nebbiolo", aliases: ["Spanna", "Chiavennasca"], color: "red", originCountry: "Italy", description: "Tar, roses, and powerful tannins", acreageHa: 6000 },
  { name: "Malbec", aliases: ["Côt", "Auxerrois"], color: "red", originCountry: "France", description: "Inky dark fruit with velvety texture", acreageHa: 55000 },
  { name: "Cabernet Franc", aliases: ["Bouchet", "Breton"], color: "red", originCountry: "France", description: "Raspberry, violet, and graphite", acreageHa: 53000 },
  { name: "Zinfandel", aliases: ["Primitivo", "Tribidrag"], color: "red", originCountry: "Croatia", description: "Jammy blackberry with peppery spice", acreageHa: 32000 },
  { name: "Mourvèdre", aliases: ["Monastrell", "Mataro"], color: "red", originCountry: "Spain", description: "Meaty, dark, and tannic with wild herbs", acreageHa: 69000 },
  { name: "Barbera", aliases: [], color: "red", originCountry: "Italy", description: "High acidity with dark cherry and low tannin", acreageHa: 21000 },
  { name: "Touriga Nacional", aliases: [], color: "red", originCountry: "Portugal", description: "Intense violet, dark fruit, and structure", acreageHa: 14000 },
  { name: "Carménère", aliases: [], color: "red", originCountry: "France", description: "Green pepper, dark fruit, and smoky", acreageHa: 12000 },
  { name: "Petit Verdot", aliases: [], color: "red", originCountry: "France", description: "Intense color, violet, and firm tannin", acreageHa: 10000 },
  { name: "Tannat", aliases: ["Harriague"], color: "red", originCountry: "France", description: "Massive tannins with dark fruit", acreageHa: 7000 },
  { name: "Aglianico", aliases: [], color: "red", originCountry: "Italy", description: "Volcanic minerality with dark cherry", acreageHa: 10000 },
  { name: "Corvina", aliases: [], color: "red", originCountry: "Italy", description: "Sour cherry with almond notes, key grape of Amarone", acreageHa: 7000 },
  { name: "Dolcetto", aliases: [], color: "red", originCountry: "Italy", description: "Soft, fruity, and low acidity", acreageHa: 5000 },
  { name: "Gamay", aliases: ["Gamay Noir"], color: "red", originCountry: "France", description: "Light, fresh, with crunchy red fruit", acreageHa: 30000 },
  { name: "Nero d'Avola", aliases: ["Calabrese"], color: "red", originCountry: "Italy", description: "Rich dark fruit with chocolate and spice", acreageHa: 16000 },
  { name: "Pinotage", aliases: [], color: "red", originCountry: "South Africa", description: "Smoky, earthy, with dark fruit", acreageHa: 6000 },
  { name: "Touriga Franca", aliases: ["Touriga Francesa"], color: "red", originCountry: "Portugal", description: "Floral and fruity, key port grape", acreageHa: 13000 },
  { name: "Carignan", aliases: ["Cariñena", "Mazuelo", "Carignane"], color: "red", originCountry: "Spain", description: "High yield, rustic with dark fruit", acreageHa: 65000 },
  { name: "Cinsault", aliases: ["Cinsaut"], color: "red", originCountry: "France", description: "Light, fragrant, perfect for rosé", acreageHa: 23000 },
  { name: "Mencía", aliases: [], color: "red", originCountry: "Spain", description: "Floral, mineral, Atlantic character", acreageHa: 9000 },
  { name: "Graciano", aliases: [], color: "red", originCountry: "Spain", description: "Aromatic with great aging potential", acreageHa: 2000 },
  { name: "Nerello Mascalese", aliases: [], color: "red", originCountry: "Italy", description: "Etna's elegant, ethereal red grape", acreageHa: 3000 },
  { name: "Sagrantino", aliases: [], color: "red", originCountry: "Italy", description: "Enormous tannins with blackberry", acreageHa: 1500 },
  { name: "Lagrein", aliases: [], color: "red", originCountry: "Italy", description: "Deep color with chocolate and berry", acreageHa: 500 },
  { name: "Blaufränkisch", aliases: ["Kékfrankos", "Lemberger", "Frankovka"], color: "red", originCountry: "Austria", description: "Spicy dark cherry with firm structure", acreageHa: 4000 },
  { name: "Zweigelt", aliases: [], color: "red", originCountry: "Austria", description: "Juicy cherry, Austria's most planted red", acreageHa: 6000 },
  { name: "St. Laurent", aliases: [], color: "red", originCountry: "Austria", description: "Pinot-like with dark fruit", acreageHa: 800 },
  { name: "Kadarka", aliases: [], color: "red", originCountry: "Hungary", description: "Light, spicy, traditional Hungarian red", acreageHa: 1000 },
  { name: "Xinomavro", aliases: [], color: "red", originCountry: "Greece", description: "Greece's Nebbiolo — tomato, olive, roses", acreageHa: 2000 },
  { name: "Agiorgitiko", aliases: [], color: "red", originCountry: "Greece", description: "Velvety red fruit from Nemea", acreageHa: 2500 },
  { name: "Mavrud", aliases: [], color: "red", originCountry: "Bulgaria", description: "Deep, tannic Balkan red", acreageHa: 1000 },
  { name: "Plavac Mali", aliases: [], color: "red", originCountry: "Croatia", description: "Zinfandel's Croatian cousin, powerful", acreageHa: 1500 },
  { name: "Bonarda", aliases: ["Douce Noir"], color: "red", originCountry: "Argentina", description: "Juicy, fruity, easy-drinking", acreageHa: 18000 },
  { name: "País", aliases: ["Listán Prieto", "Mission"], color: "red", originCountry: "Spain", description: "Light, rustic Chilean heritage grape", acreageHa: 7000 },
  { name: "Petit Sirah", aliases: ["Durif"], color: "red", originCountry: "France", description: "Inky, tannic, with blueberry", acreageHa: 4000 },
  { name: "Norton", aliases: [], color: "red", originCountry: "USA", description: "American native grape, robust", acreageHa: 800 },
  { name: "Saperavi", aliases: [], color: "red", originCountry: "Georgia", description: "Ancient Georgian grape, deep and tannic", acreageHa: 5000 },
  { name: "Montepulciano", aliases: [], color: "red", originCountry: "Italy", description: "Soft, dark, and plummy from Abruzzo", acreageHa: 35000 },
  { name: "Refosco", aliases: ["Refosco dal Peduncolo Rosso"], color: "red", originCountry: "Italy", description: "Tart dark fruit with rustic charm", acreageHa: 2000 },
  { name: "Teroldego", aliases: [], color: "red", originCountry: "Italy", description: "Deeply colored with berry and almond", acreageHa: 500 },
  { name: "Negroamaro", aliases: [], color: "red", originCountry: "Italy", description: "Dark, bitter-sweet Puglian red", acreageHa: 12000 },
  { name: "Frappato", aliases: [], color: "red", originCountry: "Italy", description: "Light, strawberry-scented Sicilian", acreageHa: 800 },
  { name: "Counoise", aliases: [], color: "red", originCountry: "France", description: "Peppery, spicy Rhône blending grape", acreageHa: 300 },
  { name: "Trousseau", aliases: ["Bastardo"], color: "red", originCountry: "France", description: "Delicate, pale, aromatic Jura red", acreageHa: 300 },
  { name: "Poulsard", aliases: ["Ploussard"], color: "red", originCountry: "France", description: "Translucent, delicate Jura red", acreageHa: 300 },
  { name: "Dornfelder", aliases: [], color: "red", originCountry: "Germany", description: "Deep-colored German red, fruity", acreageHa: 8000 },
  { name: "Portugieser", aliases: [], color: "red", originCountry: "Austria", description: "Light, everyday Central European red", acreageHa: 3000 },
  { name: "Prokupac", aliases: [], color: "red", originCountry: "Serbia", description: "Serbian heritage grape, spicy red", acreageHa: 3000 },
  { name: "Rufete", aliases: [], color: "red", originCountry: "Portugal", description: "Light, perfumed Dão red", acreageHa: 1000 },
  { name: "Baga", aliases: [], color: "red", originCountry: "Portugal", description: "Tannic, age-worthy Bairrada red", acreageHa: 5000 },
  { name: "Castelão", aliases: ["Periquita", "João de Santarém"], color: "red", originCountry: "Portugal", description: "Soft berry fruit, southern Portugal", acreageHa: 9000 },
  { name: "Trincadeira", aliases: ["Tinta Amarela"], color: "red", originCountry: "Portugal", description: "Plummy, aromatic Portuguese red", acreageHa: 8000 },
  { name: "Alicante Bouschet", aliases: ["Garnacha Tintorera"], color: "red", originCountry: "France", description: "Teinturier with red flesh, deeply colored", acreageHa: 25000 },
  { name: "Bobal", aliases: [], color: "red", originCountry: "Spain", description: "Spain's 3rd most planted, dark and sturdy", acreageHa: 55000 },
  { name: "Listán Negro", aliases: [], color: "red", originCountry: "Spain", description: "Canary Islands heritage red", acreageHa: 4000 },
  { name: "Mavrodaphne", aliases: [], color: "red", originCountry: "Greece", description: "Sweet, fortified Greek red", acreageHa: 500 },
  { name: "Feteasca Neagra", aliases: [], color: "red", originCountry: "Romania", description: "Romania's finest native red", acreageHa: 2000 },
  { name: "Rondinella", aliases: [], color: "red", originCountry: "Italy", description: "Supporting Valpolicella grape", acreageHa: 3000 },
  { name: "Molinara", aliases: [], color: "red", originCountry: "Italy", description: "Light Valpolicella blending grape", acreageHa: 1000 },
  { name: "Cesanese", aliases: [], color: "red", originCountry: "Italy", description: "Lazio's native red grape", acreageHa: 500 },
  { name: "Schiava", aliases: ["Vernatsch", "Trollinger"], color: "red", originCountry: "Italy", description: "Light, almondy Alto Adige red", acreageHa: 2000 },
  { name: "Raboso", aliases: [], color: "red", originCountry: "Italy", description: "Fiercely tannic Veneto red", acreageHa: 1000 },

  // ── WHITE GRAPES ──
  { name: "Chardonnay", aliases: ["Morillon"], color: "white", originCountry: "France", description: "Versatile, from crisp to buttery", acreageHa: 210000 },
  { name: "Sauvignon Blanc", aliases: ["Fumé Blanc"], color: "white", originCountry: "France", description: "Herbaceous, citrus, and mineral", acreageHa: 124000 },
  { name: "Riesling", aliases: [], color: "white", originCountry: "Germany", description: "Aromatic with petrol, lime, and sweetness", acreageHa: 51000 },
  { name: "Pinot Grigio", aliases: ["Pinot Gris", "Grauburgunder", "Ruländer"], color: "white", originCountry: "France", description: "Light, crisp, with pear and citrus", acreageHa: 44000 },
  { name: "Gewürztraminer", aliases: ["Traminer"], color: "white", originCountry: "Germany", description: "Intensely aromatic with lychee and rose", acreageHa: 12000 },
  { name: "Viognier", aliases: [], color: "white", originCountry: "France", description: "Rich, floral, with apricot and peach", acreageHa: 16000 },
  { name: "Chenin Blanc", aliases: ["Steen"], color: "white", originCountry: "France", description: "Honeyed, versatile, from dry to sweet", acreageHa: 32000 },
  { name: "Sémillon", aliases: [], color: "white", originCountry: "France", description: "Waxy, honeyed, key Sauternes grape", acreageHa: 22000 },
  { name: "Muscat", aliases: ["Moscato", "Muskateller", "Moscatel"], color: "white", originCountry: "Greece", description: "Grapey, floral, often sweet or sparkling", acreageHa: 45000 },
  { name: "Albariño", aliases: ["Alvarinho"], color: "white", originCountry: "Spain", description: "Crisp, peachy, Atlantic white", acreageHa: 6000 },
  { name: "Verdejo", aliases: [], color: "white", originCountry: "Spain", description: "Herbal, fennel-scented Spanish white", acreageHa: 8000 },
  { name: "Grüner Veltliner", aliases: [], color: "white", originCountry: "Austria", description: "Peppery, fresh, Austrian flagship", acreageHa: 15000 },
  { name: "Torrontés", aliases: [], color: "white", originCountry: "Argentina", description: "Floral, aromatic Argentine white", acreageHa: 6000 },
  { name: "Vermentino", aliases: ["Rolle"], color: "white", originCountry: "Italy", description: "Mediterranean herb and citrus", acreageHa: 8000 },
  { name: "Trebbiano", aliases: ["Ugni Blanc"], color: "white", originCountry: "Italy", description: "Neutral, high-acid, also for brandy", acreageHa: 110000 },
  { name: "Garganega", aliases: [], color: "white", originCountry: "Italy", description: "Almond-scented, key grape of Soave", acreageHa: 11000 },
  { name: "Cortese", aliases: [], color: "white", originCountry: "Italy", description: "Delicate, mineral Piedmont white", acreageHa: 3000 },
  { name: "Fiano", aliases: [], color: "white", originCountry: "Italy", description: "Nutty, honeyed southern Italian", acreageHa: 3000 },
  { name: "Greco", aliases: [], color: "white", originCountry: "Italy", description: "Mineral, citrus, Campanian white", acreageHa: 2000 },
  { name: "Falanghina", aliases: [], color: "white", originCountry: "Italy", description: "Fresh, floral Campanian white", acreageHa: 2000 },
  { name: "Arneis", aliases: [], color: "white", originCountry: "Italy", description: "Pear and white flower from Roero", acreageHa: 1200 },
  { name: "Pecorino", aliases: [], color: "white", originCountry: "Italy", description: "Zesty, herbal Adriatic white", acreageHa: 1500 },
  { name: "Verdicchio", aliases: [], color: "white", originCountry: "Italy", description: "Citrus and almond from Le Marche", acreageHa: 3500 },
  { name: "Friulano", aliases: ["Sauvignonasse", "Tai"], color: "white", originCountry: "Italy", description: "Almond and white flower from Friuli", acreageHa: 3000 },
  { name: "Ribolla Gialla", aliases: [], color: "white", originCountry: "Italy", description: "Mineral, often made as orange wine", acreageHa: 500 },
  { name: "Glera", aliases: ["Prosecco"], color: "white", originCountry: "Italy", description: "Apple and pear, the Prosecco grape", acreageHa: 25000 },
  { name: "Müller-Thurgau", aliases: ["Rivaner"], color: "white", originCountry: "Switzerland", description: "Soft, floral, easy-drinking", acreageHa: 12000 },
  { name: "Silvaner", aliases: ["Sylvaner"], color: "white", originCountry: "Austria", description: "Earthy, understated German white", acreageHa: 5000 },
  { name: "Scheurebe", aliases: [], color: "white", originCountry: "Germany", description: "Aromatic German crossing, grapefruit", acreageHa: 1500 },
  { name: "Bacchus", aliases: [], color: "white", originCountry: "Germany", description: "Floral, Muscat-like German white", acreageHa: 2000 },
  { name: "Kerner", aliases: [], color: "white", originCountry: "Germany", description: "Riesling-like German crossing", acreageHa: 3000 },
  { name: "Welschriesling", aliases: ["Olaszrizling", "Laški Rizling"], color: "white", originCountry: "Austria", description: "Not related to Riesling, crisp and light", acreageHa: 8000 },
  { name: "Furmint", aliases: [], color: "white", originCountry: "Hungary", description: "Smoky, mineral, key Tokaji grape", acreageHa: 4000 },
  { name: "Hárslevelű", aliases: [], color: "white", originCountry: "Hungary", description: "Floral, linden blossom, Tokaji blend", acreageHa: 2000 },
  { name: "Assyrtiko", aliases: [], color: "white", originCountry: "Greece", description: "Volcanic minerality from Santorini", acreageHa: 2000 },
  { name: "Malagousia", aliases: [], color: "white", originCountry: "Greece", description: "Aromatic, rescued Greek variety", acreageHa: 300 },
  { name: "Moschofilero", aliases: [], color: "white", originCountry: "Greece", description: "Pink-skinned, aromatic, high altitude", acreageHa: 1000 },
  { name: "Godello", aliases: [], color: "white", originCountry: "Spain", description: "Rich, mineral Galician white", acreageHa: 1500 },
  { name: "Macabeo", aliases: ["Viura"], color: "white", originCountry: "Spain", description: "Neutral, key Cava grape", acreageHa: 35000 },
  { name: "Xarel·lo", aliases: [], color: "white", originCountry: "Spain", description: "Full-bodied Cava grape with earth", acreageHa: 8000 },
  { name: "Parellada", aliases: [], color: "white", originCountry: "Spain", description: "Light, floral Cava grape", acreageHa: 8000 },
  { name: "Loureiro", aliases: [], color: "white", originCountry: "Portugal", description: "Floral, citrus Vinho Verde grape", acreageHa: 3000 },
  { name: "Arinto", aliases: [], color: "white", originCountry: "Portugal", description: "High-acid, versatile Portuguese white", acreageHa: 4000 },
  { name: "Encruzado", aliases: [], color: "white", originCountry: "Portugal", description: "Complex, mineral Dão white", acreageHa: 500 },
  { name: "Fernão Pires", aliases: ["Maria Gomes"], color: "white", originCountry: "Portugal", description: "Aromatic, Portugal's most planted white", acreageHa: 8000 },
  { name: "Palomino", aliases: ["Listán Blanco"], color: "white", originCountry: "Spain", description: "Neutral, the sherry grape", acreageHa: 15000 },
  { name: "Pedro Ximénez", aliases: ["PX"], color: "white", originCountry: "Spain", description: "Sweet, raisined dessert wine grape", acreageHa: 10000 },
  { name: "Chasselas", aliases: ["Fendant", "Gutedel"], color: "white", originCountry: "Switzerland", description: "Neutral, delicate Swiss white", acreageHa: 6000 },
  { name: "Petit Manseng", aliases: [], color: "white", originCountry: "France", description: "Intensely sweet potential with tropical fruit", acreageHa: 1500 },
  { name: "Gros Manseng", aliases: [], color: "white", originCountry: "France", description: "Dry to sweet, Jurançon white", acreageHa: 3000 },
  { name: "Roussanne", aliases: [], color: "white", originCountry: "France", description: "Herbal, rich Rhône white", acreageHa: 2500 },
  { name: "Marsanne", aliases: [], color: "white", originCountry: "France", description: "Full-bodied, nutty Rhône white", acreageHa: 2000 },
  { name: "Clairette", aliases: [], color: "white", originCountry: "France", description: "Soft, low-acid southern French", acreageHa: 3000 },
  { name: "Picpoul", aliases: ["Piquepoul"], color: "white", originCountry: "France", description: "Briny, citrus Mediterranean white", acreageHa: 1500 },
  { name: "Melon de Bourgogne", aliases: ["Muscadet"], color: "white", originCountry: "France", description: "Mineral, lees-aged Loire white", acreageHa: 10000 },
  { name: "Savagnin", aliases: [], color: "white", originCountry: "France", description: "Nutty, oxidative Jura white", acreageHa: 500 },
  { name: "Aligoté", aliases: [], color: "white", originCountry: "France", description: "Crisp, tart Burgundy white", acreageHa: 5000 },
  { name: "Colombard", aliases: [], color: "white", originCountry: "France", description: "Fruity, also for Armagnac", acreageHa: 25000 },
  { name: "Pinot Blanc", aliases: ["Weissburgunder", "Pinot Bianco"], color: "white", originCountry: "France", description: "Gentle, apple-scented white", acreageHa: 8000 },
  { name: "Rkatsiteli", aliases: [], color: "white", originCountry: "Georgia", description: "Crisp, ancient Georgian white", acreageHa: 25000 },
  { name: "Mtsvane", aliases: [], color: "white", originCountry: "Georgia", description: "Fresh, aromatic Georgian white", acreageHa: 1000 },
  { name: "Kisi", aliases: [], color: "white", originCountry: "Georgia", description: "Tropical, Georgian white often in qvevri", acreageHa: 500 },
  { name: "Vidal Blanc", aliases: [], color: "white", originCountry: "France", description: "Hybrid, key Canadian ice wine grape", acreageHa: 1000 },
  { name: "Seyval Blanc", aliases: [], color: "white", originCountry: "France", description: "Hardy hybrid, English wine staple", acreageHa: 500 },
];

function makeId(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]/g, "-").replace(/-+/g, "-").slice(0, 50);
}

/** Convert a JS string array to a PostgreSQL array literal, e.g. {"Cab Sav","Cabernet"} */
function toPgArray(arr: string[]): string {
  const escaped = arr.map((s) => `"${s.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`);
  return `{${escaped.join(",")}}`;
}

async function main() {
  console.log(`Seeding ${grapes.length} grape varieties...`);

  for (const g of grapes) {
    const id = makeId(g.name);
    const aliases = toPgArray(g.aliases);
    await sql`
      INSERT INTO "GrapeVariety" (id, name, aliases, color, "originCountry", description, "acreageHa", "createdAt")
      VALUES (${id}, ${g.name}, ${aliases}::text[], ${g.color}, ${g.originCountry}, ${g.description}, ${g.acreageHa}, NOW())
      ON CONFLICT (name) DO NOTHING
    `;
  }

  console.log(`Seeded ${grapes.length} grape varieties.`);
  console.log("Done!");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
