/**
 * Winebob MVP Seed
 *
 * Seeds the database with:
 * 1. A curated wine database for hosts to pick from
 * 2. Starter event templates for quick event creation
 */

const wines = [
  // Bordeaux, France
  { name: "Château Margaux", producer: "Château Margaux", vintage: 2019, grapes: ["Cabernet Sauvignon", "Merlot", "Petit Verdot"], region: "Margaux", country: "France", appellation: "Margaux AOC", type: "red" },
  { name: "Château Lafite Rothschild", producer: "Domaines Barons de Rothschild", vintage: 2018, grapes: ["Cabernet Sauvignon", "Merlot"], region: "Pauillac", country: "France", appellation: "Pauillac AOC", type: "red" },
  { name: "Petrus", producer: "Petrus", vintage: 2020, grapes: ["Merlot"], region: "Pomerol", country: "France", appellation: "Pomerol AOC", type: "red" },
  { name: "Château Haut-Brion", producer: "Domaine Clarence Dillon", vintage: 2019, grapes: ["Cabernet Sauvignon", "Merlot", "Cabernet Franc"], region: "Pessac-Léognan", country: "France", appellation: "Pessac-Léognan AOC", type: "red" },

  // Burgundy, France
  { name: "Romanée-Conti", producer: "Domaine de la Romanée-Conti", vintage: 2019, grapes: ["Pinot Noir"], region: "Vosne-Romanée", country: "France", appellation: "Romanée-Conti Grand Cru", type: "red" },
  { name: "Chambertin", producer: "Domaine Armand Rousseau", vintage: 2020, grapes: ["Pinot Noir"], region: "Gevrey-Chambertin", country: "France", appellation: "Chambertin Grand Cru", type: "red" },
  { name: "Meursault Les Perrières", producer: "Domaine Coche-Dury", vintage: 2020, grapes: ["Chardonnay"], region: "Meursault", country: "France", appellation: "Meursault 1er Cru", type: "white" },
  { name: "Chablis Grand Cru Les Clos", producer: "Domaine Raveneau", vintage: 2021, grapes: ["Chardonnay"], region: "Chablis", country: "France", appellation: "Chablis Grand Cru", type: "white" },

  // Rhône, France
  { name: "Hermitage La Chapelle", producer: "Paul Jaboulet Aîné", vintage: 2019, grapes: ["Syrah"], region: "Hermitage", country: "France", appellation: "Hermitage AOC", type: "red" },
  { name: "Châteauneuf-du-Pape", producer: "Château Rayas", vintage: 2019, grapes: ["Grenache"], region: "Châteauneuf-du-Pape", country: "France", appellation: "Châteauneuf-du-Pape AOC", type: "red" },

  // Champagne
  { name: "Dom Pérignon", producer: "Moët & Chandon", vintage: 2013, grapes: ["Chardonnay", "Pinot Noir"], region: "Champagne", country: "France", appellation: "Champagne AOC", type: "sparkling" },
  { name: "Krug Grande Cuvée", producer: "Krug", vintage: null, grapes: ["Chardonnay", "Pinot Noir", "Pinot Meunier"], region: "Champagne", country: "France", appellation: "Champagne AOC", type: "sparkling" },

  // Italy
  { name: "Barolo Monfortino", producer: "Giacomo Conterno", vintage: 2015, grapes: ["Nebbiolo"], region: "Barolo", country: "Italy", appellation: "Barolo DOCG", type: "red" },
  { name: "Brunello di Montalcino", producer: "Biondi-Santi", vintage: 2017, grapes: ["Sangiovese"], region: "Montalcino", country: "Italy", appellation: "Brunello di Montalcino DOCG", type: "red" },
  { name: "Sassicaia", producer: "Tenuta San Guido", vintage: 2020, grapes: ["Cabernet Sauvignon", "Cabernet Franc"], region: "Bolgheri", country: "Italy", appellation: "Bolgheri DOC", type: "red" },
  { name: "Tignanello", producer: "Marchesi Antinori", vintage: 2020, grapes: ["Sangiovese", "Cabernet Sauvignon", "Cabernet Franc"], region: "Tuscany", country: "Italy", appellation: "Toscana IGT", type: "red" },
  { name: "Amarone della Valpolicella", producer: "Giuseppe Quintarelli", vintage: 2015, grapes: ["Corvina", "Rondinella", "Molinara"], region: "Valpolicella", country: "Italy", appellation: "Amarone della Valpolicella DOCG", type: "red" },

  // Spain
  { name: "Vega Sicilia Único", producer: "Vega Sicilia", vintage: 2012, grapes: ["Tempranillo", "Cabernet Sauvignon"], region: "Ribera del Duero", country: "Spain", appellation: "Ribera del Duero DO", type: "red" },
  { name: "La Rioja Alta Gran Reserva 904", producer: "La Rioja Alta", vintage: 2015, grapes: ["Tempranillo", "Graciano"], region: "Rioja", country: "Spain", appellation: "Rioja DOCa", type: "red" },

  // USA
  { name: "Opus One", producer: "Opus One", vintage: 2019, grapes: ["Cabernet Sauvignon", "Merlot", "Cabernet Franc"], region: "Napa Valley", country: "USA", appellation: "Oakville AVA", type: "red" },
  { name: "Ridge Monte Bello", producer: "Ridge Vineyards", vintage: 2019, grapes: ["Cabernet Sauvignon", "Merlot", "Petit Verdot"], region: "Santa Cruz Mountains", country: "USA", appellation: "Santa Cruz Mountains AVA", type: "red" },

  // Australia
  { name: "Penfolds Grange", producer: "Penfolds", vintage: 2018, grapes: ["Syrah/Shiraz"], region: "South Australia", country: "Australia", appellation: null, type: "red" },

  // Germany
  { name: "Scharzhofberger Riesling Auslese", producer: "Egon Müller", vintage: 2021, grapes: ["Riesling"], region: "Mosel", country: "Germany", appellation: "Wiltinger Scharzhofberger", type: "white" },

  // New Zealand
  { name: "Cloudy Bay Sauvignon Blanc", producer: "Cloudy Bay", vintage: 2023, grapes: ["Sauvignon Blanc"], region: "Marlborough", country: "New Zealand", appellation: null, type: "white" },
  { name: "Felton Road Block 5 Pinot Noir", producer: "Felton Road", vintage: 2021, grapes: ["Pinot Noir"], region: "Central Otago", country: "New Zealand", appellation: null, type: "red" },

  // Portugal
  { name: "Barca Velha", producer: "Casa Ferreirinha", vintage: 2015, grapes: ["Touriga Nacional", "Touriga Franca", "Tinta Roriz"], region: "Douro", country: "Portugal", appellation: "Douro DOC", type: "red" },

  // Rosé
  { name: "Whispering Angel", producer: "Caves d'Esclans", vintage: 2023, grapes: ["Grenache", "Cinsault", "Rolle"], region: "Provence", country: "France", appellation: "Côtes de Provence AOC", type: "rosé" },

  // Dessert
  { name: "Château d'Yquem", producer: "Château d'Yquem", vintage: 2019, grapes: ["Sémillon", "Sauvignon Blanc"], region: "Sauternes", country: "France", appellation: "Sauternes AOC", type: "dessert" },

  // Orange
  { name: "Radikon Ribolla Gialla", producer: "Radikon", vintage: 2018, grapes: ["Ribolla Gialla"], region: "Friuli", country: "Italy", appellation: "Venezia Giulia IGT", type: "orange" },

  // Accessible / everyday wines
  { name: "Chablis", producer: "Louis Jadot", vintage: 2022, grapes: ["Chardonnay"], region: "Chablis", country: "France", appellation: "Chablis AOC", type: "white" },
  { name: "Sancerre", producer: "Domaine Vacheron", vintage: 2022, grapes: ["Sauvignon Blanc"], region: "Loire", country: "France", appellation: "Sancerre AOC", type: "white" },
  { name: "Barolo", producer: "Prunotto", vintage: 2019, grapes: ["Nebbiolo"], region: "Barolo", country: "Italy", appellation: "Barolo DOCG", type: "red" },
  { name: "Chianti Classico Riserva", producer: "Fontodi", vintage: 2019, grapes: ["Sangiovese"], region: "Chianti", country: "Italy", appellation: "Chianti Classico DOCG", type: "red" },
  { name: "Côtes du Rhône", producer: "E. Guigal", vintage: 2021, grapes: ["Grenache", "Syrah", "Mourvèdre"], region: "Rhône", country: "France", appellation: "Côtes du Rhône AOC", type: "red" },
  { name: "Rioja Reserva", producer: "CVNE Imperial", vintage: 2018, grapes: ["Tempranillo", "Graciano", "Mazuelo"], region: "Rioja", country: "Spain", appellation: "Rioja DOCa", type: "red" },
  { name: "Grüner Veltliner", producer: "Loimer", vintage: 2023, grapes: ["Grüner Veltliner"], region: "Kamptal", country: "Austria", appellation: "Kamptal DAC", type: "white" },
  { name: "Albariño", producer: "Pazo de Señorans", vintage: 2022, grapes: ["Albariño"], region: "Rías Baixas", country: "Spain", appellation: "Rías Baixas DO", type: "white" },
];

// Starter event templates
const templates = [
  {
    name: "Bordeaux vs Burgundy",
    description: "The classic French showdown. Can your guests tell Left Bank power from Burgundian elegance?",
    theme: "region_battle",
    difficulty: "intermediate",
    wineCount: 6,
    guessFields: ["grape", "region", "vintage"],
    category: "region_vs_region",
    scoringConfig: { grape: 30, region: 35, vintage: 20, country: 15 },
    suggestedWines: [
      { name: "Château Margaux", region: "Margaux", country: "France", type: "red" },
      { name: "Château Haut-Brion", region: "Pessac-Léognan", country: "France", type: "red" },
      { name: "Petrus", region: "Pomerol", country: "France", type: "red" },
      { name: "Romanée-Conti", region: "Vosne-Romanée", country: "France", type: "red" },
      { name: "Chambertin", region: "Gevrey-Chambertin", country: "France", type: "red" },
      { name: "Meursault Les Perrières", region: "Meursault", country: "France", type: "white" },
    ],
  },
  {
    name: "Italian Reds Deep Dive",
    description: "From Nebbiolo to Sangiovese — explore Italy's greatest red grapes blind.",
    theme: "grape_exploration",
    difficulty: "advanced",
    wineCount: 5,
    guessFields: ["grape", "region", "vintage", "producer"],
    category: "grape_deep_dive",
    scoringConfig: { grape: 30, region: 25, vintage: 15, producer: 15, country: 15 },
    suggestedWines: [
      { name: "Barolo Monfortino", region: "Barolo", country: "Italy", type: "red" },
      { name: "Brunello di Montalcino", region: "Montalcino", country: "Italy", type: "red" },
      { name: "Sassicaia", region: "Bolgheri", country: "Italy", type: "red" },
      { name: "Tignanello", region: "Tuscany", country: "Italy", type: "red" },
      { name: "Amarone della Valpolicella", region: "Valpolicella", country: "Italy", type: "red" },
    ],
  },
  {
    name: "New World vs Old World",
    description: "Can you tell a Napa Cab from a Bordeaux? Australia from Rhône? Test your instincts.",
    theme: "region_battle",
    difficulty: "intermediate",
    wineCount: 6,
    guessFields: ["country", "grape", "region"],
    category: "region_vs_region",
    scoringConfig: { country: 30, grape: 30, region: 25, vintage: 15 },
    suggestedWines: [
      { name: "Opus One", region: "Napa Valley", country: "USA", type: "red" },
      { name: "Penfolds Grange", region: "South Australia", country: "Australia", type: "red" },
      { name: "Cloudy Bay Sauvignon Blanc", region: "Marlborough", country: "New Zealand", type: "white" },
      { name: "Château Margaux", region: "Margaux", country: "France", type: "red" },
      { name: "Hermitage La Chapelle", region: "Hermitage", country: "France", type: "red" },
      { name: "Sancerre", region: "Loire", country: "France", type: "white" },
    ],
  },
  {
    name: "Beginner Friendly: Red or White?",
    description: "Perfect for first-timers. Start simple — just identify the basics.",
    theme: "introduction",
    difficulty: "beginner",
    wineCount: 4,
    guessFields: ["type", "country"],
    category: "beginner",
    scoringConfig: { type: 50, country: 50 },
    suggestedWines: [
      { name: "Côtes du Rhône", region: "Rhône", country: "France", type: "red" },
      { name: "Chablis", region: "Chablis", country: "France", type: "white" },
      { name: "Rioja Reserva", region: "Rioja", country: "Spain", type: "red" },
      { name: "Albariño", region: "Rías Baixas", country: "Spain", type: "white" },
    ],
  },
  {
    name: "Grape Roulette",
    description: "Every glass is a different grape. How many can you name?",
    theme: "grape_exploration",
    difficulty: "intermediate",
    wineCount: 6,
    guessFields: ["grape", "country"],
    category: "grape_deep_dive",
    scoringConfig: { grape: 50, country: 30, region: 20 },
    suggestedWines: [
      { name: "Barolo", region: "Barolo", country: "Italy", type: "red" },
      { name: "Hermitage La Chapelle", region: "Hermitage", country: "France", type: "red" },
      { name: "Vega Sicilia Único", region: "Ribera del Duero", country: "Spain", type: "red" },
      { name: "Grüner Veltliner", region: "Kamptal", country: "Austria", type: "white" },
      { name: "Scharzhofberger Riesling Auslese", region: "Mosel", country: "Germany", type: "white" },
      { name: "Whispering Angel", region: "Provence", country: "France", type: "rosé" },
    ],
  },
  {
    name: "Sparkling Showdown",
    description: "Champagne vs the world. Prosecco, Cava, Crémant — can you tell them apart?",
    theme: "category_focus",
    difficulty: "intermediate",
    wineCount: 4,
    guessFields: ["region", "country", "grape"],
    category: "category_focus",
    scoringConfig: { region: 35, country: 30, grape: 35 },
    suggestedWines: [
      { name: "Dom Pérignon", region: "Champagne", country: "France", type: "sparkling" },
      { name: "Krug Grande Cuvée", region: "Champagne", country: "France", type: "sparkling" },
    ],
  },
  {
    name: "Freestyle — Build Your Own",
    description: "Complete flexibility. Pick any wines, configure any guess fields. Your tasting, your rules.",
    theme: "freestyle",
    difficulty: "intermediate",
    wineCount: 6,
    guessFields: ["grape", "region", "country", "vintage", "producer", "type"],
    category: "freestyle",
    scoringConfig: { grape: 25, region: 20, country: 15, vintage: 15, producer: 15, type: 10 },
    suggestedWines: null,
  },
];

export { wines, templates };
