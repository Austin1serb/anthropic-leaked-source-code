export type FlavorProfile = {
  region: string;
  country: string;
  acidity: number;  // 0-1
  tannin: number;
  body: number;
  fruit: number;
  earth: number;
  floral: number;
};

export const FLAVOR_AXES: (keyof Omit<FlavorProfile, "region" | "country">)[] = [
  "acidity", "tannin", "body", "fruit", "earth", "floral",
];

export const FLAVOR_LABELS: Record<string, string> = {
  acidity: "Acidity",
  tannin: "Tannin",
  body: "Body",
  fruit: "Fruit",
  earth: "Earth",
  floral: "Floral",
};

export const REGION_FLAVORS: FlavorProfile[] = [
  // ── France ──
  { region: "Bordeaux", country: "France", acidity: 0.6, tannin: 0.8, body: 0.8, fruit: 0.6, earth: 0.5, floral: 0.3 },
  { region: "Burgundy", country: "France", acidity: 0.8, tannin: 0.5, body: 0.5, fruit: 0.7, earth: 0.7, floral: 0.6 },
  { region: "Champagne", country: "France", acidity: 0.9, tannin: 0.1, body: 0.3, fruit: 0.6, earth: 0.3, floral: 0.7 },
  { region: "Rhone Valley", country: "France", acidity: 0.5, tannin: 0.7, body: 0.85, fruit: 0.7, earth: 0.6, floral: 0.4 },
  { region: "Loire Valley", country: "France", acidity: 0.85, tannin: 0.2, body: 0.35, fruit: 0.7, earth: 0.4, floral: 0.75 },
  { region: "Alsace", country: "France", acidity: 0.8, tannin: 0.1, body: 0.4, fruit: 0.7, earth: 0.3, floral: 0.85 },
  { region: "Provence", country: "France", acidity: 0.65, tannin: 0.2, body: 0.35, fruit: 0.75, earth: 0.25, floral: 0.8 },

  // ── Italy ──
  { region: "Tuscany", country: "Italy", acidity: 0.75, tannin: 0.75, body: 0.7, fruit: 0.6, earth: 0.6, floral: 0.35 },
  { region: "Piedmont", country: "Italy", acidity: 0.8, tannin: 0.9, body: 0.8, fruit: 0.5, earth: 0.7, floral: 0.5 },
  { region: "Veneto", country: "Italy", acidity: 0.6, tannin: 0.6, body: 0.75, fruit: 0.75, earth: 0.4, floral: 0.3 },
  { region: "Sicily", country: "Italy", acidity: 0.55, tannin: 0.55, body: 0.7, fruit: 0.8, earth: 0.5, floral: 0.35 },

  // ── Spain ──
  { region: "Rioja", country: "Spain", acidity: 0.6, tannin: 0.65, body: 0.7, fruit: 0.6, earth: 0.55, floral: 0.35 },
  { region: "Ribera del Duero", country: "Spain", acidity: 0.55, tannin: 0.8, body: 0.85, fruit: 0.55, earth: 0.6, floral: 0.25 },
  { region: "Priorat", country: "Spain", acidity: 0.5, tannin: 0.75, body: 0.9, fruit: 0.65, earth: 0.7, floral: 0.2 },

  // ── Portugal ──
  { region: "Douro Valley", country: "Portugal", acidity: 0.5, tannin: 0.7, body: 0.85, fruit: 0.75, earth: 0.55, floral: 0.25 },
  { region: "Alentejo", country: "Portugal", acidity: 0.45, tannin: 0.6, body: 0.8, fruit: 0.7, earth: 0.5, floral: 0.3 },

  // ── Germany ──
  { region: "Mosel", country: "Germany", acidity: 0.95, tannin: 0.05, body: 0.2, fruit: 0.8, earth: 0.4, floral: 0.8 },
  { region: "Rheingau", country: "Germany", acidity: 0.85, tannin: 0.05, body: 0.35, fruit: 0.75, earth: 0.45, floral: 0.7 },

  // ── USA ──
  { region: "Napa Valley", country: "USA", acidity: 0.5, tannin: 0.8, body: 0.9, fruit: 0.85, earth: 0.3, floral: 0.2 },
  { region: "Sonoma", country: "USA", acidity: 0.6, tannin: 0.6, body: 0.7, fruit: 0.8, earth: 0.35, floral: 0.4 },
  { region: "Willamette Valley", country: "USA", acidity: 0.8, tannin: 0.4, body: 0.45, fruit: 0.7, earth: 0.6, floral: 0.55 },

  // ── South America ──
  { region: "Mendoza", country: "Argentina", acidity: 0.5, tannin: 0.7, body: 0.85, fruit: 0.8, earth: 0.4, floral: 0.3 },
  { region: "Maipo Valley", country: "Chile", acidity: 0.55, tannin: 0.75, body: 0.8, fruit: 0.7, earth: 0.45, floral: 0.25 },
  { region: "Colchagua Valley", country: "Chile", acidity: 0.5, tannin: 0.65, body: 0.8, fruit: 0.8, earth: 0.35, floral: 0.3 },

  // ── Australia ──
  { region: "Barossa Valley", country: "Australia", acidity: 0.45, tannin: 0.75, body: 0.9, fruit: 0.85, earth: 0.45, floral: 0.2 },
  { region: "Margaret River", country: "Australia", acidity: 0.6, tannin: 0.7, body: 0.75, fruit: 0.7, earth: 0.4, floral: 0.35 },

  // ── New Zealand ──
  { region: "Marlborough", country: "New Zealand", acidity: 0.9, tannin: 0.05, body: 0.3, fruit: 0.9, earth: 0.2, floral: 0.8 },

  // ── South Africa ──
  { region: "Stellenbosch", country: "South Africa", acidity: 0.55, tannin: 0.7, body: 0.8, fruit: 0.7, earth: 0.5, floral: 0.3 },
];
