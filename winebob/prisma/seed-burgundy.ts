/**
 * Burgundy Region Seed — Curated producers + their key wines
 *
 * Run: npx tsx prisma/seed-burgundy.ts
 *
 * Populates: Winery table (producers on the map) + Wine table (their wines)
 */
import { PrismaNeonHttp } from "@prisma/adapter-neon";
import { PrismaClient } from "../src/generated/prisma/client";

const adapter = new PrismaNeonHttp(process.env.DATABASE_URL!, {});
const prisma = new PrismaClient({ adapter } as any);

// ═══════════════════════════════════════════
// BURGUNDY WINERIES (producers on the map)
// ═══════════════════════════════════════════

const BURGUNDY_WINERIES = [
  // ── Côte de Nuits ──
  {
    name: "Domaine Armand Rousseau",
    slug: "domaine-armand-rousseau",
    description: "The benchmark for Gevrey-Chambertin, producing Chambertin and Clos de Bèze of extraordinary depth and finesse since 1902.",
    founded: 1902,
    owner: "Cyrielle Rousseau",
    region: "Burgundy",
    country: "France",
    lat: 47.2278,
    lng: 4.9680,
    address: "1 Rue de l'Aumônerie, 21220 Gevrey-Chambertin",
    grapeVarieties: ["Pinot Noir"],
    wineStyles: ["red"],
    featured: true,
    vineyardSize: "15 hectares",
    annualBottles: 65000,
  },
  {
    name: "Domaine Dugat-Py",
    slug: "domaine-dugat-py",
    description: "Old-vine specialist in Gevrey-Chambertin producing intensely concentrated, deeply colored Pinot Noir.",
    founded: 1975,
    owner: "Loïc Dugat",
    region: "Burgundy",
    country: "France",
    lat: 47.2270,
    lng: 4.9695,
    address: "Cour de l'Aumône, 21220 Gevrey-Chambertin",
    grapeVarieties: ["Pinot Noir"],
    wineStyles: ["red"],
    featured: false,
    vineyardSize: "10 hectares",
    annualBottles: 40000,
  },
  {
    name: "Domaine Ponsot",
    slug: "domaine-ponsot",
    description: "Historic Morey-Saint-Denis estate famous for Clos de la Roche and never using new oak barrels.",
    founded: 1872,
    owner: "Laurent Ponsot (until 2017), now Rose-Marie Ponsot",
    region: "Burgundy",
    country: "France",
    lat: 47.2005,
    lng: 4.9610,
    address: "21 Rue de la Montagne, 21220 Morey-Saint-Denis",
    grapeVarieties: ["Pinot Noir", "Chardonnay"],
    wineStyles: ["red", "white"],
    featured: false,
    vineyardSize: "10 hectares",
    annualBottles: 50000,
  },
  {
    name: "Domaine Dujac",
    slug: "domaine-dujac",
    description: "Founded by Jacques Seysses, pioneering whole-cluster fermentation in Burgundy with silky, aromatic Pinot Noir.",
    founded: 1968,
    owner: "Seysses Family",
    region: "Burgundy",
    country: "France",
    lat: 47.1998,
    lng: 4.9615,
    address: "7 Rue de la Bussière, 21220 Morey-Saint-Denis",
    grapeVarieties: ["Pinot Noir", "Chardonnay"],
    wineStyles: ["red", "white"],
    featured: true,
    vineyardSize: "15 hectares",
    annualBottles: 50000,
  },
  {
    name: "Domaine Comte Georges de Vogüé",
    slug: "domaine-de-vogue",
    description: "The largest owner of Musigny Grand Cru, producing some of Burgundy's most ethereal and age-worthy Pinot Noir.",
    founded: 1450,
    owner: "de Vogüé Family",
    region: "Burgundy",
    country: "France",
    lat: 47.1862,
    lng: 4.9540,
    address: "7 Rue Sainte-Barbe, 21220 Chambolle-Musigny",
    grapeVarieties: ["Pinot Noir", "Chardonnay"],
    wineStyles: ["red", "white"],
    featured: true,
    vineyardSize: "12 hectares",
    annualBottles: 35000,
  },
  {
    name: "Domaine Georges Roumier",
    slug: "domaine-georges-roumier",
    description: "Cult producer of Bonnes-Mares and Musigny, renowned for purity and precision under Christophe Roumier.",
    founded: 1924,
    owner: "Christophe Roumier",
    region: "Burgundy",
    country: "France",
    lat: 47.1858,
    lng: 4.9550,
    address: "4 Rue de Vergy, 21220 Chambolle-Musigny",
    grapeVarieties: ["Pinot Noir"],
    wineStyles: ["red"],
    featured: true,
    vineyardSize: "12 hectares",
    annualBottles: 40000,
  },
  {
    name: "Domaine Méo-Camuzet",
    slug: "domaine-meo-camuzet",
    description: "Premier Vosne-Romanée estate with holdings in Richebourg, Corton, and Clos de Vougeot. Mentored by Henri Jayer.",
    founded: 1740,
    owner: "Jean-Nicolas Méo",
    region: "Burgundy",
    country: "France",
    lat: 47.1655,
    lng: 4.9470,
    address: "11 Rue des Grands Crus, 21700 Vosne-Romanée",
    grapeVarieties: ["Pinot Noir", "Chardonnay"],
    wineStyles: ["red", "white"],
    featured: false,
    vineyardSize: "15 hectares",
    annualBottles: 55000,
  },
  {
    name: "Domaine de la Romanée-Conti",
    slug: "domaine-de-la-romanee-conti",
    description: "The most prestigious wine estate on earth, producing tiny quantities of transcendent Pinot Noir from monopole Grand Cru vineyards.",
    founded: 1232,
    owner: "de Villaine & Roch Families",
    region: "Burgundy",
    country: "France",
    lat: 47.1570,
    lng: 4.9500,
    address: "1 Place de l'Église, 21700 Vosne-Romanée",
    grapeVarieties: ["Pinot Noir", "Chardonnay"],
    wineStyles: ["red", "white"],
    featured: true,
    vineyardSize: "28 hectares",
    annualBottles: 80000,
  },
  {
    name: "Domaine Leroy",
    slug: "domaine-leroy",
    description: "Lalou Bize-Leroy's biodynamic domaine producing profoundly concentrated wines from the finest Burgundy vineyards.",
    founded: 1988,
    owner: "Lalou Bize-Leroy",
    region: "Burgundy",
    country: "France",
    lat: 47.1645,
    lng: 4.9488,
    address: "15 Rue de la Fontaine, 21700 Vosne-Romanée",
    grapeVarieties: ["Pinot Noir", "Chardonnay"],
    wineStyles: ["red", "white"],
    featured: true,
    vineyardSize: "22 hectares",
    annualBottles: 25000,
  },
  {
    name: "Domaine Faiveley",
    slug: "domaine-faiveley",
    description: "One of Burgundy's largest domaine holders with exceptional Grands Crus across the Côte de Nuits, run by the seventh generation.",
    founded: 1825,
    owner: "Erwan Faiveley",
    region: "Burgundy",
    country: "France",
    lat: 47.1370,
    lng: 4.9505,
    address: "8 Rue du Tribourg, 21700 Nuits-Saint-Georges",
    grapeVarieties: ["Pinot Noir", "Chardonnay"],
    wineStyles: ["red", "white"],
    featured: false,
    vineyardSize: "120 hectares",
    annualBottles: 800000,
  },

  // ── Côte de Beaune ──
  {
    name: "Maison Louis Jadot",
    slug: "maison-louis-jadot",
    description: "Major Burgundy négociant-éleveur with holdings across the region's finest vineyards, from Chablis to Beaujolais.",
    founded: 1859,
    owner: "Kopf Family",
    region: "Burgundy",
    country: "France",
    lat: 47.0376,
    lng: 4.8406,
    address: "62 Route de Savigny, 21200 Beaune",
    grapeVarieties: ["Pinot Noir", "Chardonnay"],
    wineStyles: ["red", "white"],
    featured: true,
    vineyardSize: "240 hectares",
    annualBottles: 1200000,
  },
  {
    name: "Maison Joseph Drouhin",
    slug: "maison-joseph-drouhin",
    description: "Historic Beaune négociant housed in the cellars of the Dukes of Burgundy, pioneering organic and biodynamic viticulture.",
    founded: 1880,
    owner: "Drouhin Family",
    region: "Burgundy",
    country: "France",
    lat: 47.0248,
    lng: 4.8398,
    address: "7 Rue d'Enfer, 21200 Beaune",
    grapeVarieties: ["Pinot Noir", "Chardonnay"],
    wineStyles: ["red", "white"],
    featured: true,
    vineyardSize: "73 hectares",
    annualBottles: 3000000,
  },
  {
    name: "Bouchard Père & Fils",
    slug: "bouchard-pere-fils",
    description: "Burgundy's largest vineyard owner, based in the medieval Château de Beaune with exceptional Grand Cru holdings.",
    founded: 1731,
    owner: "Henriot Family",
    region: "Burgundy",
    country: "France",
    lat: 47.0217,
    lng: 4.8378,
    address: "15 Rue du Château, 21200 Beaune",
    grapeVarieties: ["Pinot Noir", "Chardonnay"],
    wineStyles: ["red", "white"],
    featured: true,
    vineyardSize: "130 hectares",
    annualBottles: 2500000,
  },
  {
    name: "Domaine Marquis d'Angerville",
    slug: "domaine-marquis-dangerville",
    description: "Volnay's most revered estate, a pioneer of domaine bottling in the 1930s, producing silky, perfumed Pinot Noir.",
    founded: 1906,
    owner: "d'Angerville Family",
    region: "Burgundy",
    country: "France",
    lat: 46.9940,
    lng: 4.7800,
    address: "Rue de Mont, 21190 Volnay",
    grapeVarieties: ["Pinot Noir", "Chardonnay"],
    wineStyles: ["red", "white"],
    featured: false,
    vineyardSize: "15 hectares",
    annualBottles: 55000,
  },
  {
    name: "Domaine Coche-Dury",
    slug: "domaine-coche-dury",
    description: "The world's most sought-after white Burgundy producer. Jean-François Coche crafts Meursault and Corton-Charlemagne of unmatched intensity.",
    founded: 1920,
    owner: "Raphaël Coche",
    region: "Burgundy",
    country: "France",
    lat: 46.9785,
    lng: 4.7695,
    address: "9 Rue Charles Giraud, 21190 Meursault",
    grapeVarieties: ["Chardonnay", "Pinot Noir"],
    wineStyles: ["white", "red"],
    featured: true,
    vineyardSize: "10 hectares",
    annualBottles: 35000,
  },
  {
    name: "Domaine Roulot",
    slug: "domaine-roulot",
    description: "Jean-Marc Roulot produces crystalline, mineral-driven Meursault that defines the modern style of white Burgundy.",
    founded: 1820,
    owner: "Jean-Marc Roulot",
    region: "Burgundy",
    country: "France",
    lat: 46.9778,
    lng: 4.7688,
    address: "1 Rue Charles Giraud, 21190 Meursault",
    grapeVarieties: ["Chardonnay"],
    wineStyles: ["white"],
    featured: false,
    vineyardSize: "12 hectares",
    annualBottles: 55000,
  },
  {
    name: "Domaine des Comtes Lafon",
    slug: "domaine-des-comtes-lafon",
    description: "Dominique Lafon's biodynamic estate producing the most powerful, long-lived white Burgundies from Meursault's finest vineyards.",
    founded: 1894,
    owner: "Dominique Lafon",
    region: "Burgundy",
    country: "France",
    lat: 46.9790,
    lng: 4.7710,
    address: "Clos de la Barre, 21190 Meursault",
    grapeVarieties: ["Chardonnay", "Pinot Noir"],
    wineStyles: ["white", "red"],
    featured: true,
    vineyardSize: "14 hectares",
    annualBottles: 45000,
  },
  {
    name: "Domaine Leflaive",
    slug: "domaine-leflaive",
    description: "The greatest white Burgundy estate in Puligny-Montrachet. Biodynamic pioneer producing definitive Bâtard- and Chevalier-Montrachet.",
    founded: 1717,
    owner: "Leflaive Family",
    region: "Burgundy",
    country: "France",
    lat: 46.9470,
    lng: 4.7540,
    address: "10 Place du Monument, 21190 Puligny-Montrachet",
    grapeVarieties: ["Chardonnay"],
    wineStyles: ["white"],
    featured: true,
    vineyardSize: "25 hectares",
    annualBottles: 100000,
  },

  // ── Chablis ──
  {
    name: "Domaine Raveneau",
    slug: "domaine-raveneau",
    description: "The undisputed king of Chablis. Tiny production of profoundly mineral, long-lived Chardonnay from Grand Cru slopes.",
    founded: 1948,
    owner: "Raveneau Family",
    region: "Burgundy",
    country: "France",
    lat: 47.8145,
    lng: 3.8015,
    address: "9 Rue de Chichée, 89800 Chablis",
    grapeVarieties: ["Chardonnay"],
    wineStyles: ["white"],
    featured: true,
    vineyardSize: "9 hectares",
    annualBottles: 40000,
  },
  {
    name: "Domaine William Fèvre",
    slug: "domaine-william-fevre",
    description: "The largest Grand Cru owner in Chablis, producing pristine, terroir-driven Chardonnay across all classifications.",
    founded: 1959,
    owner: "Henriot Family",
    region: "Burgundy",
    country: "France",
    lat: 47.8155,
    lng: 3.8030,
    address: "21 Avenue d'Oberwesel, 89800 Chablis",
    grapeVarieties: ["Chardonnay"],
    wineStyles: ["white"],
    featured: false,
    vineyardSize: "78 hectares",
    annualBottles: 600000,
  },
];

// ═══════════════════════════════════════════
// BURGUNDY WINES (key wines per producer)
// ═══════════════════════════════════════════

const BURGUNDY_WINES: {
  name: string;
  producer: string;
  type: string;
  grapes: string[];
  region: string;
  country: string;
  appellation?: string;
  description: string;
  priceRange: string;
}[] = [
  // ── Domaine Armand Rousseau ──
  { name: "Chambertin Grand Cru", producer: "Domaine Armand Rousseau", type: "red", grapes: ["Pinot Noir"], region: "Burgundy", country: "France", appellation: "Chambertin", description: "The king of Burgundy Grand Crus. Power and finesse in perfect balance.", priceRange: "luxury" },
  { name: "Chambertin Clos de Bèze Grand Cru", producer: "Domaine Armand Rousseau", type: "red", grapes: ["Pinot Noir"], region: "Burgundy", country: "France", appellation: "Chambertin Clos de Bèze", description: "Marginally more elegant than Chambertin with extraordinary complexity.", priceRange: "luxury" },
  { name: "Gevrey-Chambertin Clos Saint-Jacques 1er Cru", producer: "Domaine Armand Rousseau", type: "red", grapes: ["Pinot Noir"], region: "Burgundy", country: "France", appellation: "Gevrey-Chambertin 1er Cru", description: "Often considered Grand Cru quality. One of Burgundy's greatest Premier Crus.", priceRange: "luxury" },

  // ── Domaine Dujac ──
  { name: "Clos de la Roche Grand Cru", producer: "Domaine Dujac", type: "red", grapes: ["Pinot Noir"], region: "Burgundy", country: "France", appellation: "Clos de la Roche", description: "Whole-cluster fermented, deeply perfumed Morey-Saint-Denis Grand Cru.", priceRange: "luxury" },
  { name: "Clos Saint-Denis Grand Cru", producer: "Domaine Dujac", type: "red", grapes: ["Pinot Noir"], region: "Burgundy", country: "France", appellation: "Clos Saint-Denis", description: "Silky and aromatic, the signature Grand Cru of Morey-Saint-Denis.", priceRange: "luxury" },
  { name: "Morey-Saint-Denis 1er Cru", producer: "Domaine Dujac", type: "red", grapes: ["Pinot Noir"], region: "Burgundy", country: "France", appellation: "Morey-Saint-Denis 1er Cru", description: "An accessible entry to Dujac's ethereal, whole-cluster style.", priceRange: "premium" },

  // ── Domaine Comte Georges de Vogüé ──
  { name: "Musigny Grand Cru", producer: "Domaine Comte Georges de Vogüé", type: "red", grapes: ["Pinot Noir"], region: "Burgundy", country: "France", appellation: "Musigny", description: "The most ethereal Grand Cru — 'the iron fist in a velvet glove.'", priceRange: "luxury" },
  { name: "Bonnes-Mares Grand Cru", producer: "Domaine Comte Georges de Vogüé", type: "red", grapes: ["Pinot Noir"], region: "Burgundy", country: "France", appellation: "Bonnes-Mares", description: "More structured and powerful than Musigny, built to age for decades.", priceRange: "luxury" },
  { name: "Chambolle-Musigny 1er Cru", producer: "Domaine Comte Georges de Vogüé", type: "red", grapes: ["Pinot Noir"], region: "Burgundy", country: "France", appellation: "Chambolle-Musigny 1er Cru", description: "Declassified from young Grand Cru vines — exceptional value.", priceRange: "premium" },

  // ── Domaine Georges Roumier ──
  { name: "Musigny Grand Cru", producer: "Domaine Georges Roumier", type: "red", grapes: ["Pinot Noir"], region: "Burgundy", country: "France", appellation: "Musigny", description: "Tiny production of transcendent Pinot Noir from Chambolle's greatest vineyard.", priceRange: "luxury" },
  { name: "Bonnes-Mares Grand Cru", producer: "Domaine Georges Roumier", type: "red", grapes: ["Pinot Noir"], region: "Burgundy", country: "France", appellation: "Bonnes-Mares", description: "Rich and structured, with Roumier's signature purity and precision.", priceRange: "luxury" },
  { name: "Chambolle-Musigny Les Amoureuses 1er Cru", producer: "Domaine Georges Roumier", type: "red", grapes: ["Pinot Noir"], region: "Burgundy", country: "France", appellation: "Chambolle-Musigny 1er Cru", description: "A Premier Cru that consistently rivals Grand Cru quality. Perfumed and silky.", priceRange: "luxury" },

  // ── Domaine de la Romanée-Conti ──
  { name: "Romanée-Conti Grand Cru", producer: "Domaine de la Romanée-Conti", type: "red", grapes: ["Pinot Noir"], region: "Burgundy", country: "France", appellation: "Romanée-Conti", description: "The world's most expensive wine. Monopole Grand Cru of otherworldly complexity.", priceRange: "luxury" },
  { name: "La Tâche Grand Cru", producer: "Domaine de la Romanée-Conti", type: "red", grapes: ["Pinot Noir"], region: "Burgundy", country: "France", appellation: "La Tâche", description: "Monopole Grand Cru. More powerful and spicy than Romanée-Conti.", priceRange: "luxury" },
  { name: "Richebourg Grand Cru", producer: "Domaine de la Romanée-Conti", type: "red", grapes: ["Pinot Noir"], region: "Burgundy", country: "France", appellation: "Richebourg", description: "Opulent and voluptuous. The most sensual of DRC's Grand Crus.", priceRange: "luxury" },
  { name: "Montrachet Grand Cru", producer: "Domaine de la Romanée-Conti", type: "red", grapes: ["Chardonnay"], region: "Burgundy", country: "France", appellation: "Montrachet", description: "DRC's legendary white. The greatest Chardonnay vineyard on earth.", priceRange: "luxury" },

  // ── Domaine Leroy ──
  { name: "Musigny Grand Cru", producer: "Domaine Leroy", type: "red", grapes: ["Pinot Noir"], region: "Burgundy", country: "France", appellation: "Musigny", description: "Biodynamic Musigny of extraordinary depth. Among the most expensive Burgundies.", priceRange: "luxury" },
  { name: "Chambertin Grand Cru", producer: "Domaine Leroy", type: "red", grapes: ["Pinot Noir"], region: "Burgundy", country: "France", appellation: "Chambertin", description: "Dense, concentrated Chambertin from biodynamic old vines.", priceRange: "luxury" },
  { name: "Vosne-Romanée Les Beaux Monts 1er Cru", producer: "Domaine Leroy", type: "red", grapes: ["Pinot Noir"], region: "Burgundy", country: "France", appellation: "Vosne-Romanée 1er Cru", description: "A Premier Cru that outperforms most Grand Crus in the right hands.", priceRange: "luxury" },

  // ── Maison Louis Jadot ──
  { name: "Corton-Charlemagne Grand Cru", producer: "Maison Louis Jadot", type: "white", grapes: ["Chardonnay"], region: "Burgundy", country: "France", appellation: "Corton-Charlemagne", description: "Steely, mineral-driven Grand Cru white from the hill of Corton.", priceRange: "premium" },
  { name: "Gevrey-Chambertin Clos Saint-Jacques 1er Cru", producer: "Maison Louis Jadot", type: "red", grapes: ["Pinot Noir"], region: "Burgundy", country: "France", appellation: "Gevrey-Chambertin 1er Cru", description: "From one of Burgundy's most revered Premier Cru vineyards.", priceRange: "premium" },
  { name: "Beaune Clos des Ursules 1er Cru", producer: "Maison Louis Jadot", type: "red", grapes: ["Pinot Noir"], region: "Burgundy", country: "France", appellation: "Beaune 1er Cru", description: "Jadot's monopole vineyard — quintessential Beaune Pinot Noir.", priceRange: "mid" },

  // ── Maison Joseph Drouhin ──
  { name: "Musigny Grand Cru", producer: "Maison Joseph Drouhin", type: "red", grapes: ["Pinot Noir"], region: "Burgundy", country: "France", appellation: "Musigny", description: "Drouhin's crown jewel. Elegant, perfumed Grand Cru from old vines.", priceRange: "luxury" },
  { name: "Beaune Clos des Mouches 1er Cru", producer: "Maison Joseph Drouhin", type: "white", grapes: ["Chardonnay"], region: "Burgundy", country: "France", appellation: "Beaune 1er Cru", description: "The most famous white Beaune. Rich and complex Chardonnay.", priceRange: "premium" },
  { name: "Chablis Grand Cru Les Clos", producer: "Maison Joseph Drouhin", type: "white", grapes: ["Chardonnay"], region: "Burgundy", country: "France", appellation: "Chablis Grand Cru", description: "Steely, mineral Chablis from the most prestigious Grand Cru slope.", priceRange: "premium" },

  // ── Bouchard Père & Fils ──
  { name: "Montrachet Grand Cru", producer: "Bouchard Père & Fils", type: "white", grapes: ["Chardonnay"], region: "Burgundy", country: "France", appellation: "Montrachet", description: "From the greatest white wine vineyard in the world. Rich, layered, eternal.", priceRange: "luxury" },
  { name: "Beaune Grèves Vigne de l'Enfant Jésus 1er Cru", producer: "Bouchard Père & Fils", type: "red", grapes: ["Pinot Noir"], region: "Burgundy", country: "France", appellation: "Beaune 1er Cru", description: "Iconic monopole. A wine of grace, named for its celestial purity.", priceRange: "premium" },

  // ── Domaine Coche-Dury ──
  { name: "Corton-Charlemagne Grand Cru", producer: "Domaine Coche-Dury", type: "white", grapes: ["Chardonnay"], region: "Burgundy", country: "France", appellation: "Corton-Charlemagne", description: "The holy grail of white Burgundy. Impossibly concentrated and age-worthy.", priceRange: "luxury" },
  { name: "Meursault Perrières 1er Cru", producer: "Domaine Coche-Dury", type: "white", grapes: ["Chardonnay"], region: "Burgundy", country: "France", appellation: "Meursault 1er Cru", description: "Mineral-laden, complex Meursault from the finest Premier Cru vineyard.", priceRange: "luxury" },
  { name: "Meursault", producer: "Domaine Coche-Dury", type: "white", grapes: ["Chardonnay"], region: "Burgundy", country: "France", appellation: "Meursault", description: "Village-level Meursault that outperforms most producers' Premier Crus.", priceRange: "premium" },

  // ── Domaine des Comtes Lafon ──
  { name: "Montrachet Grand Cru", producer: "Domaine des Comtes Lafon", type: "white", grapes: ["Chardonnay"], region: "Burgundy", country: "France", appellation: "Montrachet", description: "Biodynamic Montrachet of extraordinary power and refinement.", priceRange: "luxury" },
  { name: "Meursault Charmes 1er Cru", producer: "Domaine des Comtes Lafon", type: "white", grapes: ["Chardonnay"], region: "Burgundy", country: "France", appellation: "Meursault 1er Cru", description: "Rich, honeyed Chardonnay from Meursault's most generous Premier Cru.", priceRange: "premium" },
  { name: "Volnay Santenots du Milieu 1er Cru", producer: "Domaine des Comtes Lafon", type: "red", grapes: ["Pinot Noir"], region: "Burgundy", country: "France", appellation: "Volnay 1er Cru", description: "Lafon's finest red — silky Pinot Noir from the Meursault side of Volnay.", priceRange: "premium" },

  // ── Domaine Leflaive ──
  { name: "Chevalier-Montrachet Grand Cru", producer: "Domaine Leflaive", type: "white", grapes: ["Chardonnay"], region: "Burgundy", country: "France", appellation: "Chevalier-Montrachet", description: "Pure, steely, and devastatingly precise. The ultimate expression of Chardonnay terroir.", priceRange: "luxury" },
  { name: "Bâtard-Montrachet Grand Cru", producer: "Domaine Leflaive", type: "white", grapes: ["Chardonnay"], region: "Burgundy", country: "France", appellation: "Bâtard-Montrachet", description: "Rich and powerful Grand Cru, broader-shouldered than Chevalier.", priceRange: "luxury" },
  { name: "Puligny-Montrachet Les Pucelles 1er Cru", producer: "Domaine Leflaive", type: "white", grapes: ["Chardonnay"], region: "Burgundy", country: "France", appellation: "Puligny-Montrachet 1er Cru", description: "Adjacent to Bâtard-Montrachet. Often indistinguishable from Grand Cru quality.", priceRange: "premium" },

  // ── Domaine Raveneau ──
  { name: "Chablis Grand Cru Les Clos", producer: "Domaine Raveneau", type: "white", grapes: ["Chardonnay"], region: "Burgundy", country: "France", appellation: "Chablis Grand Cru", description: "The greatest Chablis in existence. Mineral purity that ages for decades.", priceRange: "luxury" },
  { name: "Chablis Grand Cru Blanchot", producer: "Domaine Raveneau", type: "white", grapes: ["Chardonnay"], region: "Burgundy", country: "France", appellation: "Chablis Grand Cru", description: "The most delicate of Raveneau's Grand Crus. Floral and ethereal.", priceRange: "luxury" },
  { name: "Chablis 1er Cru Montée de Tonnerre", producer: "Domaine Raveneau", type: "white", grapes: ["Chardonnay"], region: "Burgundy", country: "France", appellation: "Chablis 1er Cru", description: "Premier Cru of Grand Cru quality. Intense and mineral-driven.", priceRange: "premium" },
];

// ═══════════════════════════════════════════
// SEED EXECUTION
// ═══════════════════════════════════════════

async function main() {
  console.log("🍷 Seeding Burgundy wineries and wines...\n");

  // 1. Upsert wineries
  let wineryCount = 0;
  for (const w of BURGUNDY_WINERIES) {
    await prisma.winery.upsert({
      where: { slug: w.slug },
      update: {
        name: w.name,
        description: w.description,
        founded: w.founded,
        owner: w.owner,
        lat: w.lat,
        lng: w.lng,
        address: w.address,
        region: w.region,
        country: w.country,
        grapeVarieties: w.grapeVarieties,
        wineStyles: w.wineStyles,
        featured: w.featured,
        vineyardSize: w.vineyardSize,
        annualBottles: w.annualBottles,
        verified: true,
      },
      create: {
        ...w,
        verified: true,
      },
    });
    wineryCount++;
    console.log(`  ✓ ${w.name}`);
  }
  console.log(`\n🏰 ${wineryCount} wineries seeded.\n`);

  // 2. Build winery name → id lookup
  const wineryLookup = new Map<string, string>();
  const allWineries = await prisma.winery.findMany({ where: { region: "Burgundy" }, select: { id: true, name: true } });
  for (const w of allWineries) wineryLookup.set(w.name, w.id);

  // 3. Upsert wines linked to wineries via wineryId
  let wineCount = 0;
  for (const wine of BURGUNDY_WINES) {
    const wineryId = wineryLookup.get(wine.producer) ?? null;

    const existing = await prisma.wine.findFirst({
      where: {
        name: wine.name,
        producer: wine.producer,
        region: wine.region,
      },
    });

    if (existing) {
      await prisma.wine.update({
        where: { id: existing.id },
        data: {
          type: wine.type,
          grapes: wine.grapes,
          country: wine.country,
          appellation: wine.appellation,
          description: wine.description,
          priceRange: wine.priceRange,
          wineryId: wineryId,
          source: "seed",
          confidence: 0.95,
          isPublic: true,
        },
      });
    } else {
      await prisma.wine.create({
        data: {
          name: wine.name,
          producer: wine.producer,
          type: wine.type,
          grapes: wine.grapes,
          region: wine.region,
          country: wine.country,
          appellation: wine.appellation,
          description: wine.description,
          priceRange: wine.priceRange,
          wineryId: wineryId,
          source: "seed",
          confidence: 0.95,
          isPublic: true,
        },
      });
    }
    wineCount++;
  }
  console.log(`🍾 ${wineCount} wines seeded.`);
  console.log("\n✅ Burgundy seed complete!");
}

main()
  .catch((e) => {
    console.error("Seed failed:", e);
    process.exit(1);
  })
  .finally(() => process.exit(0));
