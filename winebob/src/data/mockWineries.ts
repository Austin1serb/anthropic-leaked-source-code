/** Mock winery data — used until real wineries are in the database */
export type MockWinery = {
  name: string;
  slug: string;
  description: string;
  founded: number;
  owner: string;
  region: string;
  country: string;
  lat: number;
  lng: number;
  grapeVarieties: string[];
  wineStyles: string[];
  featured: boolean;
  vineyardSize: string;
  annualBottles: number;
};

export const mockWineries: MockWinery[] = [
  // BORDEAUX
  { name: "Château Margaux", slug: "chateau-margaux", description: "Premier Grand Cru Classé producing one of the world's most elegant wines since the 16th century.", founded: 1590, owner: "Corinne Mentzelopoulos", region: "Bordeaux", country: "France", lat: 45.04, lng: -0.67, grapeVarieties: ["Cabernet Sauvignon", "Merlot", "Petit Verdot"], wineStyles: ["red"], featured: true, vineyardSize: "87 hectares", annualBottles: 130000 },
  { name: "Château Lafite Rothschild", slug: "chateau-lafite", description: "First Growth estate in Pauillac, epitome of finesse and longevity.", founded: 1234, owner: "Domaines Barons de Rothschild", region: "Bordeaux", country: "France", lat: 45.20, lng: -0.74, grapeVarieties: ["Cabernet Sauvignon", "Merlot"], wineStyles: ["red"], featured: true, vineyardSize: "112 hectares", annualBottles: 200000 },
  { name: "Château Lynch-Bages", slug: "chateau-lynch-bages", description: "Fifth Growth Pauillac consistently punching well above its classification.", founded: 1749, owner: "Cazes Family", region: "Bordeaux", country: "France", lat: 45.20, lng: -0.76, grapeVarieties: ["Cabernet Sauvignon", "Merlot", "Cabernet Franc"], wineStyles: ["red", "white"], featured: false, vineyardSize: "100 hectares", annualBottles: 350000 },
  // BURGUNDY
  { name: "Domaine de la Romanée-Conti", slug: "drc", description: "The most prestigious wine estate on earth, producing tiny quantities of transcendent Pinot Noir.", founded: 1232, owner: "de Villaine & Leroy Families", region: "Burgundy", country: "France", lat: 47.16, lng: 4.96, grapeVarieties: ["Pinot Noir", "Chardonnay"], wineStyles: ["red", "white"], featured: true, vineyardSize: "28 hectares", annualBottles: 80000 },
  { name: "Louis Jadot", slug: "louis-jadot", description: "Major Burgundy négociant-éleveur with holdings across the region's finest vineyards.", founded: 1859, owner: "Kopf Family", region: "Burgundy", country: "France", lat: 47.02, lng: 4.84, grapeVarieties: ["Pinot Noir", "Chardonnay"], wineStyles: ["red", "white"], featured: false, vineyardSize: "240 hectares", annualBottles: 1200000 },
  // CHAMPAGNE
  { name: "Dom Pérignon", slug: "dom-perignon", description: "Moët & Chandon's prestige cuvée, named after the legendary monk.", founded: 1936, owner: "LVMH", region: "Champagne", country: "France", lat: 49.07, lng: 3.95, grapeVarieties: ["Chardonnay", "Pinot Noir"], wineStyles: ["sparkling"], featured: true, vineyardSize: "N/A", annualBottles: 5000000 },
  // PIEDMONT
  { name: "Gaja", slug: "gaja", description: "Angelo Gaja revolutionized Barbaresco and put Piedmont on the world stage.", founded: 1859, owner: "Gaja Family", region: "Piedmont", country: "Italy", lat: 44.73, lng: 8.08, grapeVarieties: ["Nebbiolo", "Barbera", "Chardonnay"], wineStyles: ["red", "white"], featured: true, vineyardSize: "100 hectares", annualBottles: 350000 },
  { name: "Giacomo Conterno", slug: "giacomo-conterno", description: "The most traditional Barolo producer, Monfortino ages for decades.", founded: 1908, owner: "Roberto Conterno", region: "Piedmont", country: "Italy", lat: 44.62, lng: 7.96, grapeVarieties: ["Nebbiolo"], wineStyles: ["red"], featured: true, vineyardSize: "14 hectares", annualBottles: 60000 },
  // TUSCANY
  { name: "Tenuta San Guido", slug: "tenuta-san-guido", description: "Home of Sassicaia, the original Super Tuscan that changed Italian wine.", founded: 1944, owner: "Incisa della Rocchetta Family", region: "Tuscany", country: "Italy", lat: 43.23, lng: 10.61, grapeVarieties: ["Cabernet Sauvignon", "Cabernet Franc"], wineStyles: ["red"], featured: true, vineyardSize: "75 hectares", annualBottles: 200000 },
  { name: "Antinori", slug: "antinori", description: "26 generations of winemaking, creators of Tignanello and Solaia.", founded: 1385, owner: "Antinori Family", region: "Tuscany", country: "Italy", lat: 43.47, lng: 11.25, grapeVarieties: ["Sangiovese", "Cabernet Sauvignon"], wineStyles: ["red", "white", "rosé"], featured: true, vineyardSize: "3000 hectares", annualBottles: 20000000 },
  // RIOJA
  { name: "López de Heredia", slug: "lopez-de-heredia", description: "Time stands still here. Wines aged for decades in barrel, unchanged since 1877.", founded: 1877, owner: "López de Heredia Family", region: "Rioja", country: "Spain", lat: 42.58, lng: -2.85, grapeVarieties: ["Tempranillo", "Garnacha", "Viura"], wineStyles: ["red", "white", "rosé"], featured: true, vineyardSize: "170 hectares", annualBottles: 400000 },
  { name: "Vega Sicilia", slug: "vega-sicilia", description: "Spain's most iconic winery, producing Único since 1915.", founded: 1864, owner: "Álvarez Family", region: "Ribera del Duero", country: "Spain", lat: 41.63, lng: -4.16, grapeVarieties: ["Tempranillo", "Cabernet Sauvignon"], wineStyles: ["red"], featured: true, vineyardSize: "210 hectares", annualBottles: 300000 },
  // NAPA
  { name: "Opus One", slug: "opus-one", description: "The Mondavi-Rothschild dream, Napa's most famous joint venture.", founded: 1979, owner: "Constellation & Rothschild", region: "Napa Valley", country: "United States", lat: 38.41, lng: -122.41, grapeVarieties: ["Cabernet Sauvignon", "Merlot", "Cabernet Franc"], wineStyles: ["red"], featured: true, vineyardSize: "67 hectares", annualBottles: 300000 },
  { name: "Ridge Vineyards", slug: "ridge-vineyards", description: "Monte Bello is California's longest-running icon, minimal intervention since 1962.", founded: 1962, owner: "Otsuka Group", region: "Santa Cruz Mountains", country: "United States", lat: 37.26, lng: -122.12, grapeVarieties: ["Cabernet Sauvignon", "Zinfandel"], wineStyles: ["red"], featured: false, vineyardSize: "32 hectares", annualBottles: 800000 },
  // DOURO
  { name: "Quinta do Noval", slug: "quinta-do-noval", description: "Home of Nacional, the world's rarest port from ungrafted vines.", founded: 1715, owner: "AXA Millésimes", region: "Douro Valley", country: "Portugal", lat: 41.16, lng: -7.52, grapeVarieties: ["Touriga Nacional", "Touriga Franca"], wineStyles: ["red", "fortified"], featured: true, vineyardSize: "145 hectares", annualBottles: 250000 },
  // AUSTRALIA
  { name: "Penfolds", slug: "penfolds", description: "Australia's most famous winery, home of Grange.", founded: 1844, owner: "Treasury Wine Estates", region: "Barossa Valley", country: "Australia", lat: -34.56, lng: 138.95, grapeVarieties: ["Shiraz", "Cabernet Sauvignon"], wineStyles: ["red", "white"], featured: true, vineyardSize: "Multiple", annualBottles: 30000000 },
  // NEW ZEALAND
  { name: "Cloudy Bay", slug: "cloudy-bay", description: "The wine that defined New Zealand Sauvignon Blanc for the world.", founded: 1985, owner: "LVMH", region: "Marlborough", country: "New Zealand", lat: -41.49, lng: 173.92, grapeVarieties: ["Sauvignon Blanc", "Pinot Noir"], wineStyles: ["white", "red", "sparkling"], featured: false, vineyardSize: "240 hectares", annualBottles: 1500000 },
  // SOUTH AFRICA
  { name: "Kanonkop", slug: "kanonkop", description: "South Africa's most awarded estate, benchmark for Pinotage.", founded: 1910, owner: "Krige Family", region: "Stellenbosch", country: "South Africa", lat: -33.88, lng: 18.90, grapeVarieties: ["Pinotage", "Cabernet Sauvignon"], wineStyles: ["red"], featured: false, vineyardSize: "100 hectares", annualBottles: 400000 },
];
