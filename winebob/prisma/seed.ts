/**
 * Wine Database Seed
 *
 * Seeds the database with a curated selection of well-known wines
 * across different regions, styles, and price points.
 */

// This seed file can be run with: npx prisma db seed
// Requires the Prisma client to be generated first

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
  { name: "Pingus", producer: "Dominio de Pingus", vintage: 2019, grapes: ["Tempranillo"], region: "Ribera del Duero", country: "Spain", appellation: "Ribera del Duero DO", type: "red" },
  { name: "La Rioja Alta Gran Reserva 904", producer: "La Rioja Alta", vintage: 2015, grapes: ["Tempranillo", "Graciano"], region: "Rioja", country: "Spain", appellation: "Rioja DOCa", type: "red" },

  // USA
  { name: "Opus One", producer: "Opus One", vintage: 2019, grapes: ["Cabernet Sauvignon", "Merlot", "Cabernet Franc"], region: "Napa Valley", country: "USA", appellation: "Oakville AVA", type: "red" },
  { name: "Screaming Eagle", producer: "Screaming Eagle", vintage: 2019, grapes: ["Cabernet Sauvignon"], region: "Napa Valley", country: "USA", appellation: "Oakville AVA", type: "red" },
  { name: "Ridge Monte Bello", producer: "Ridge Vineyards", vintage: 2019, grapes: ["Cabernet Sauvignon", "Merlot", "Petit Verdot"], region: "Santa Cruz Mountains", country: "USA", appellation: "Santa Cruz Mountains AVA", type: "red" },

  // Australia
  { name: "Penfolds Grange", producer: "Penfolds", vintage: 2018, grapes: ["Syrah/Shiraz"], region: "South Australia", country: "Australia", appellation: null, type: "red" },
  { name: "Henschke Hill of Grace", producer: "Henschke", vintage: 2018, grapes: ["Syrah/Shiraz"], region: "Eden Valley", country: "Australia", appellation: null, type: "red" },

  // Germany
  { name: "Scharzhofberger Riesling Auslese", producer: "Egon Müller", vintage: 2021, grapes: ["Riesling"], region: "Mosel", country: "Germany", appellation: "Wiltinger Scharzhofberger", type: "white" },
  { name: "Erdener Prälat Riesling Spätlese", producer: "Dr. Loosen", vintage: 2022, grapes: ["Riesling"], region: "Mosel", country: "Germany", appellation: "Erdener Prälat", type: "white" },

  // New Zealand
  { name: "Cloudy Bay Sauvignon Blanc", producer: "Cloudy Bay", vintage: 2023, grapes: ["Sauvignon Blanc"], region: "Marlborough", country: "New Zealand", appellation: null, type: "white" },
  { name: "Felton Road Block 5 Pinot Noir", producer: "Felton Road", vintage: 2021, grapes: ["Pinot Noir"], region: "Central Otago", country: "New Zealand", appellation: null, type: "red" },

  // Portugal
  { name: "Barca Velha", producer: "Casa Ferreirinha", vintage: 2015, grapes: ["Touriga Nacional", "Touriga Franca", "Tinta Roriz"], region: "Douro", country: "Portugal", appellation: "Douro DOC", type: "red" },
  { name: "Pêra-Manca Tinto", producer: "Eugénio de Almeida", vintage: 2018, grapes: ["Aragonez", "Trincadeira"], region: "Alentejo", country: "Portugal", appellation: "Alentejo DOC", type: "red" },

  // South Africa
  { name: "Kanonkop Paul Sauer", producer: "Kanonkop", vintage: 2019, grapes: ["Cabernet Sauvignon", "Cabernet Franc", "Merlot"], region: "Stellenbosch", country: "South Africa", appellation: null, type: "red" },

  // Austria
  { name: "Grüner Veltliner Smaragd Kellerberg", producer: "F.X. Pichler", vintage: 2022, grapes: ["Grüner Veltliner"], region: "Wachau", country: "Austria", appellation: "Wachau DAC", type: "white" },

  // Argentina
  { name: "Catena Zapata Malbec Argentino", producer: "Catena Zapata", vintage: 2020, grapes: ["Malbec"], region: "Mendoza", country: "Argentina", appellation: null, type: "red" },

  // Chile
  { name: "Almaviva", producer: "Almaviva", vintage: 2020, grapes: ["Cabernet Sauvignon", "Carménère", "Cabernet Franc"], region: "Maipo Valley", country: "Chile", appellation: null, type: "red" },

  // Rosé
  { name: "Whispering Angel", producer: "Caves d'Esclans", vintage: 2023, grapes: ["Grenache", "Cinsault", "Rolle"], region: "Provence", country: "France", appellation: "Côtes de Provence AOC", type: "rosé" },

  // Dessert
  { name: "Château d'Yquem", producer: "Château d'Yquem", vintage: 2019, grapes: ["Sémillon", "Sauvignon Blanc"], region: "Sauternes", country: "France", appellation: "Sauternes AOC", type: "dessert" },

  // Natural / Orange
  { name: "Radikon Ribolla Gialla", producer: "Radikon", vintage: 2018, grapes: ["Ribolla Gialla"], region: "Friuli", country: "Italy", appellation: "Venezia Giulia IGT", type: "orange" },

  // Danish-market favorites (accessible wines)
  { name: "Chablis", producer: "Louis Jadot", vintage: 2022, grapes: ["Chardonnay"], region: "Chablis", country: "France", appellation: "Chablis AOC", type: "white" },
  { name: "Sancerre", producer: "Domaine Vacheron", vintage: 2022, grapes: ["Sauvignon Blanc"], region: "Loire", country: "France", appellation: "Sancerre AOC", type: "white" },
  { name: "Barolo", producer: "Prunotto", vintage: 2019, grapes: ["Nebbiolo"], region: "Barolo", country: "Italy", appellation: "Barolo DOCG", type: "red" },
  { name: "Chianti Classico Riserva", producer: "Fontodi", vintage: 2019, grapes: ["Sangiovese"], region: "Chianti", country: "Italy", appellation: "Chianti Classico DOCG", type: "red" },
  { name: "Côtes du Rhône", producer: "E. Guigal", vintage: 2021, grapes: ["Grenache", "Syrah", "Mourvèdre"], region: "Rhône", country: "France", appellation: "Côtes du Rhône AOC", type: "red" },
  { name: "Rioja Reserva", producer: "CVNE Imperial", vintage: 2018, grapes: ["Tempranillo", "Graciano", "Mazuelo"], region: "Rioja", country: "Spain", appellation: "Rioja DOCa", type: "red" },
  { name: "Grüner Veltliner", producer: "Loimer", vintage: 2023, grapes: ["Grüner Veltliner"], region: "Kamptal", country: "Austria", appellation: "Kamptal DAC", type: "white" },
  { name: "Albariño", producer: "Pazo de Señorans", vintage: 2022, grapes: ["Albariño"], region: "Rías Baixas", country: "Spain", appellation: "Rías Baixas DO", type: "white" },
];

// Badge seeds
const badges = [
  { name: "First Sip", description: "Rate your first wine", icon: "🍷", category: "cellar", tier: "bronze", condition: '{"type":"wines_rated","count":1}' },
  { name: "Wine Explorer", description: "Rate 10 different wines", icon: "🗺️", category: "cellar", tier: "bronze", condition: '{"type":"wines_rated","count":10}' },
  { name: "Grape Explorer", description: "Try wines from 10 different grape varieties", icon: "🍇", category: "cellar", tier: "silver", condition: '{"type":"unique_grapes","count":10}' },
  { name: "Globe Trotter", description: "Try wines from 5 different countries", icon: "🌍", category: "cellar", tier: "silver", condition: '{"type":"unique_countries","count":5}' },
  { name: "First Guess", description: "Complete your first blind tasting", icon: "🎯", category: "arena", tier: "bronze", condition: '{"type":"blind_tastings","count":1}' },
  { name: "Sharp Nose", description: "Score 80+ on a blind tasting", icon: "👃", category: "arena", tier: "silver", condition: '{"type":"blind_score","min":80}' },
  { name: "Arena Champion", description: "Win 5 blind tasting events", icon: "🏆", category: "arena", tier: "gold", condition: '{"type":"events_won","count":5}' },
  { name: "Week Warrior", description: "7-day tasting streak", icon: "🔥", category: "trail", tier: "bronze", condition: '{"type":"streak","count":7}' },
  { name: "Monthly Maven", description: "30-day tasting streak", icon: "🌟", category: "trail", tier: "silver", condition: '{"type":"streak","count":30}' },
  { name: "Social Sipper", description: "Attend 5 tasting events", icon: "👥", category: "trail", tier: "bronze", condition: '{"type":"events_attended","count":5}' },
  { name: "Oracle", description: "Get 5 predictions correct", icon: "🔮", category: "futures", tier: "bronze", condition: '{"type":"predictions_correct","count":5}' },
  { name: "Crystal Ball", description: "Maintain 70%+ prediction accuracy", icon: "🔮", category: "futures", tier: "gold", condition: '{"type":"prediction_accuracy","min":0.7}' },
];

export { wines, badges };
