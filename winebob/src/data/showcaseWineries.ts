// Showcase wineries with detailed data, estate polygons, and card content.
// These are hand-curated entries for premium winery experiences on the map.

export type ShowcaseWineryPage = {
  title: string;
  content: string;       // markdown-ish, rendered as paragraphs
  stats?: { label: string; value: string }[];
};

export type ShowcaseWine = {
  name: string;
  vintage: number | null;
  type: "red" | "white" | "rosé";
  grape: string;
  description: string;
  rating?: string;
};

export type ShowcaseWinery = {
  id: string;
  name: string;
  slug: string;
  tagline: string;
  region: string;
  country: string;
  appellation: string;
  founded: number;
  owner: string;
  winemaker: string;
  center: [number, number];          // [lng, lat]
  polygon: [number, number][];       // estate footprint
  accentColor: string;               // for highlight
  pages: ShowcaseWineryPage[];
  wines: ShowcaseWine[];
};

export const SHOWCASE_WINERIES: ShowcaseWinery[] = [
  {
    id: "chateau-margaux",
    name: "Château Margaux",
    slug: "chateau-margaux",
    tagline: "Premier Grand Cru Classé since 1855",
    region: "Bordeaux",
    country: "France",
    appellation: "Margaux AOC",
    founded: 1590,
    owner: "Corinne Mentzelopoulos",
    winemaker: "Philippe Bascaules",
    center: [-0.6687, 45.0444],
    // Approximate estate footprint (château + immediate grounds)
    // Based on actual Château Margaux coordinates from mockWineries
    polygon: [
      [-0.6710, 45.0460],
      [-0.6660, 45.0462],
      [-0.6650, 45.0450],
      [-0.6648, 45.0435],
      [-0.6660, 45.0425],
      [-0.6705, 45.0425],
      [-0.6715, 45.0440],
      [-0.6710, 45.0460],
    ],
    accentColor: "#8B1A2B",
    pages: [
      {
        title: "The Estate",
        content:
          "Château Margaux stands as one of Bordeaux's five First Growths, classified in the legendary 1855 Classification. The estate's neoclassical château, built in 1810, is an architectural masterpiece and one of the few Bordeaux estates whose building is as famous as its wine.\n\nThe 262-hectare estate lies on a unique gravel outcrop in the commune of Margaux, producing wines of extraordinary elegance, complexity, and longevity.",
        stats: [
          { label: "Classification", value: "Premier Grand Cru Classé" },
          { label: "Total Estate", value: "262 ha" },
          { label: "Vineyard", value: "87 ha" },
          { label: "Founded", value: "1590" },
          { label: "Annual Production", value: "~130,000 bottles" },
          { label: "Soil", value: "Deep Günzian gravel" },
        ],
      },
      {
        title: "Terroir",
        content:
          "The magic of Margaux lies in its terroir. Deep beds of Quaternary gravel — some of the finest in all of Bordeaux — provide exceptional drainage and force vine roots deep into the subsoil. This stressed, mineral-rich environment produces grapes of incredible concentration.\n\nThe vineyard is planted to 75% Cabernet Sauvignon, 20% Merlot, 3% Petit Verdot, and 2% Cabernet Franc. Average vine age is 40 years, with some parcels exceeding 80 years.",
        stats: [
          { label: "Cabernet Sauvignon", value: "75%" },
          { label: "Merlot", value: "20%" },
          { label: "Petit Verdot", value: "3%" },
          { label: "Cabernet Franc", value: "2%" },
          { label: "Avg. Vine Age", value: "40 years" },
          { label: "Density", value: "10,000 vines/ha" },
        ],
      },
      {
        title: "Winemaking",
        content:
          "Under the direction of Philippe Bascaules, Château Margaux combines centuries of tradition with precision viticulture. Each of the estate's 80+ parcels is vinified separately in a mix of oak vats and stainless steel tanks.\n\nThe grand vin ages for 18-24 months in 100% new French oak barrels, crafted in the estate's own cooperage — one of very few in Bordeaux. The result is a wine of unparalleled finesse, with silk-like tannins and an aromatic profile that unfolds over decades.",
        stats: [
          { label: "Fermentation", value: "Parcel-by-parcel" },
          { label: "Aging", value: "18-24 months" },
          { label: "Oak", value: "100% new French" },
          { label: "Cooperage", value: "Estate-owned" },
          { label: "Fining", value: "Egg white" },
          { label: "Filtering", value: "Light, if any" },
        ],
      },
      {
        title: "Visit",
        content:
          "Château Margaux welcomes visitors by appointment only. The estate offers guided tours of the historic cellars, barrel rooms, and the newly renovated winery designed by Norman Foster.\n\nTastings include the grand vin and Pavillon Rouge, the estate's celebrated second wine. The architectural tour showcases the stunning interplay between 19th-century heritage and 21st-century innovation.",
        stats: [
          { label: "Visits", value: "By appointment" },
          { label: "Season", value: "April – October" },
          { label: "Duration", value: "~90 minutes" },
          { label: "Includes", value: "Tour + Tasting" },
        ],
      },
    ],
    wines: [
      {
        name: "Château Margaux",
        vintage: 2020,
        type: "red",
        grape: "Cabernet Sauvignon blend",
        description: "The grand vin. Silk, power, and infinite complexity. Dark cassis, violet, graphite, with extraordinary length.",
        rating: "99/100",
      },
      {
        name: "Pavillon Rouge",
        vintage: 2020,
        type: "red",
        grape: "Cabernet Sauvignon blend",
        description: "The second wine, yet a masterpiece in its own right. Approachable, refined, with plush dark fruit and fine-grained tannins.",
        rating: "94/100",
      },
      {
        name: "Pavillon Blanc",
        vintage: 2021,
        type: "white",
        grape: "Sauvignon Blanc",
        description: "One of Bordeaux's greatest dry whites. Citrus blossom, white peach, and a laser-like mineral finish.",
        rating: "96/100",
      },
      {
        name: "Margaux du Château Margaux",
        vintage: 2019,
        type: "red",
        grape: "Cabernet Sauvignon blend",
        description: "The estate's third wine, offering an accessible entry to the Margaux style with bright fruit and supple structure.",
      },
    ],
  },
];
