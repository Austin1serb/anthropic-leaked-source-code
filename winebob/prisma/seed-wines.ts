import { PrismaNeonHttp } from "@prisma/adapter-neon";
import { PrismaClient } from "../src/generated/prisma/client";

const adapter = new PrismaNeonHttp(process.env.DATABASE_URL!, {});
const prisma = new PrismaClient({ adapter } as any);

type W = { name: string; producer: string; vintage: number | null; grapes: string[]; region: string; country: string; type: string; description: string; priceRange: string; isPublic: boolean };

const wines: W[] = [
// FRANCE - BORDEAUX
{name:"Château Margaux",producer:"Château Margaux",vintage:2018,grapes:["Cabernet Sauvignon","Merlot"],region:"Bordeaux",country:"France",type:"red",description:"First Growth with elegance and power.",priceRange:"luxury",isPublic:true},
{name:"Château Lafite Rothschild",producer:"Château Lafite Rothschild",vintage:2019,grapes:["Cabernet Sauvignon","Merlot"],region:"Bordeaux",country:"France",type:"red",description:"First Growth Pauillac, refined and age-worthy.",priceRange:"luxury",isPublic:true},
{name:"Château Mouton Rothschild",producer:"Château Mouton Rothschild",vintage:2018,grapes:["Cabernet Sauvignon","Merlot","Cabernet Franc"],region:"Bordeaux",country:"France",type:"red",description:"First Growth Pauillac with opulent fruit.",priceRange:"luxury",isPublic:true},
{name:"Château Haut-Brion",producer:"Château Haut-Brion",vintage:2017,grapes:["Merlot","Cabernet Sauvignon"],region:"Bordeaux",country:"France",type:"red",description:"First Growth Pessac-Léognan, smoky and complex.",priceRange:"luxury",isPublic:true},
{name:"Pétrus",producer:"Pétrus",vintage:2018,grapes:["Merlot"],region:"Bordeaux",country:"France",type:"red",description:"Iconic Pomerol, pure Merlot perfection.",priceRange:"luxury",isPublic:true},
{name:"Château Latour",producer:"Château Latour",vintage:2016,grapes:["Cabernet Sauvignon","Merlot"],region:"Bordeaux",country:"France",type:"red",description:"First Growth Pauillac, structured and long-lived.",priceRange:"luxury",isPublic:true},
{name:"Château Lynch-Bages",producer:"Château Lynch-Bages",vintage:2019,grapes:["Cabernet Sauvignon","Merlot"],region:"Bordeaux",country:"France",type:"red",description:"Fifth Growth Pauillac punching above its weight.",priceRange:"premium",isPublic:true},
{name:"Château Pontet-Canet",producer:"Château Pontet-Canet",vintage:2016,grapes:["Cabernet Sauvignon","Merlot"],region:"Bordeaux",country:"France",type:"red",description:"Biodynamic Pauillac with depth and precision.",priceRange:"premium",isPublic:true},
{name:"Château Cheval Blanc",producer:"Château Cheval Blanc",vintage:2018,grapes:["Merlot","Cabernet Franc"],region:"Bordeaux",country:"France",type:"red",description:"Premier Grand Cru Saint-Émilion, silky and complex.",priceRange:"luxury",isPublic:true},
{name:"Château d'Yquem",producer:"Château d'Yquem",vintage:2017,grapes:["Sémillon","Sauvignon Blanc"],region:"Bordeaux",country:"France",type:"dessert",description:"The world's greatest sweet wine from Sauternes.",priceRange:"luxury",isPublic:true},
// FRANCE - BURGUNDY
{name:"Romanée-Conti",producer:"Domaine de la Romanée-Conti",vintage:2019,grapes:["Pinot Noir"],region:"Burgundy",country:"France",type:"red",description:"The most sought-after Pinot Noir on earth.",priceRange:"luxury",isPublic:true},
{name:"Musigny Grand Cru",producer:"Domaine Leroy",vintage:2018,grapes:["Pinot Noir"],region:"Burgundy",country:"France",type:"red",description:"Biodynamic Burgundy of extraordinary purity.",priceRange:"luxury",isPublic:true},
{name:"Gevrey-Chambertin",producer:"Louis Jadot",vintage:2020,grapes:["Pinot Noir"],region:"Burgundy",country:"France",type:"red",description:"Classic village Burgundy, structured and earthy.",priceRange:"premium",isPublic:true},
{name:"Clos de Vougeot",producer:"Joseph Drouhin",vintage:2019,grapes:["Pinot Noir"],region:"Burgundy",country:"France",type:"red",description:"Grand Cru with depth and silky tannins.",priceRange:"premium",isPublic:true},
{name:"Puligny-Montrachet",producer:"Domaine Leflaive",vintage:2020,grapes:["Chardonnay"],region:"Burgundy",country:"France",type:"white",description:"Benchmark white Burgundy, mineral and precise.",priceRange:"luxury",isPublic:true},
{name:"Meursault",producer:"Coche-Dury",vintage:2019,grapes:["Chardonnay"],region:"Burgundy",country:"France",type:"white",description:"The most coveted Meursault producer.",priceRange:"luxury",isPublic:true},
// FRANCE - CHAMPAGNE
{name:"Dom Pérignon",producer:"Dom Pérignon",vintage:2013,grapes:["Chardonnay","Pinot Noir"],region:"Champagne",country:"France",type:"sparkling",description:"Iconic prestige cuvée Champagne.",priceRange:"luxury",isPublic:true},
{name:"Grande Cuvée",producer:"Krug",vintage:null,grapes:["Chardonnay","Pinot Noir","Pinot Meunier"],region:"Champagne",country:"France",type:"sparkling",description:"Multi-vintage blend of extraordinary complexity.",priceRange:"luxury",isPublic:true},
{name:"La Grande Année",producer:"Bollinger",vintage:2014,grapes:["Pinot Noir","Chardonnay"],region:"Champagne",country:"France",type:"sparkling",description:"Rich, Pinot-driven vintage Champagne.",priceRange:"premium",isPublic:true},
{name:"La Grande Dame",producer:"Veuve Clicquot",vintage:2015,grapes:["Pinot Noir","Chardonnay"],region:"Champagne",country:"France",type:"sparkling",description:"Prestige cuvée with power and finesse.",priceRange:"premium",isPublic:true},
// FRANCE - RHÔNE
{name:"La Landonne",producer:"E. Guigal",vintage:2017,grapes:["Syrah"],region:"Rhone Valley",country:"France",type:"red",description:"Single-vineyard Côte-Rôtie of immense depth.",priceRange:"luxury",isPublic:true},
{name:"Hermitage La Chapelle",producer:"Paul Jaboulet Aîné",vintage:2018,grapes:["Syrah"],region:"Rhone Valley",country:"France",type:"red",description:"Legendary Northern Rhône Syrah.",priceRange:"premium",isPublic:true},
{name:"Châteauneuf-du-Pape",producer:"Château de Beaucastel",vintage:2019,grapes:["Grenache","Mourvèdre","Syrah"],region:"Rhone Valley",country:"France",type:"red",description:"All 13 varieties, rich and complex.",priceRange:"premium",isPublic:true},
// FRANCE - LOIRE
{name:"Vouvray Le Haut-Lieu",producer:"Domaine Huet",vintage:2020,grapes:["Chenin Blanc"],region:"Loire Valley",country:"France",type:"white",description:"Biodynamic Vouvray of great purity.",priceRange:"premium",isPublic:true},
{name:"Silex",producer:"Didier Dagueneau",vintage:2020,grapes:["Sauvignon Blanc"],region:"Loire Valley",country:"France",type:"white",description:"The greatest Pouilly-Fumé, from flint soils.",priceRange:"premium",isPublic:true},
// ITALY - PIEDMONT
{name:"Barolo Monfortino",producer:"Giacomo Conterno",vintage:2015,grapes:["Nebbiolo"],region:"Piedmont",country:"Italy",type:"red",description:"Italy's most legendary Barolo, decades of aging potential.",priceRange:"luxury",isPublic:true},
{name:"Barolo Falletto",producer:"Bruno Giacosa",vintage:2016,grapes:["Nebbiolo"],region:"Piedmont",country:"Italy",type:"red",description:"Traditional Barolo of extraordinary elegance.",priceRange:"luxury",isPublic:true},
{name:"Barbaresco",producer:"Gaja",vintage:2018,grapes:["Nebbiolo"],region:"Piedmont",country:"Italy",type:"red",description:"Modernist Barbaresco with international acclaim.",priceRange:"luxury",isPublic:true},
{name:"Barolo Ravera",producer:"Vietti",vintage:2017,grapes:["Nebbiolo"],region:"Piedmont",country:"Italy",type:"red",description:"Single-vineyard Barolo with power and finesse.",priceRange:"premium",isPublic:true},
{name:"Barolo Bussia",producer:"Prunotto",vintage:2019,grapes:["Nebbiolo"],region:"Piedmont",country:"Italy",type:"red",description:"Classic Barolo from a historic cru.",priceRange:"premium",isPublic:true},
// ITALY - TUSCANY
{name:"Sassicaia",producer:"Tenuta San Guido",vintage:2019,grapes:["Cabernet Sauvignon","Cabernet Franc"],region:"Tuscany",country:"Italy",type:"red",description:"The original Super Tuscan from Bolgheri.",priceRange:"luxury",isPublic:true},
{name:"Tignanello",producer:"Antinori",vintage:2018,grapes:["Sangiovese","Cabernet Sauvignon"],region:"Tuscany",country:"Italy",type:"red",description:"The wine that started the Super Tuscan revolution.",priceRange:"premium",isPublic:true},
{name:"Ornellaia",producer:"Tenuta dell'Ornellaia",vintage:2019,grapes:["Cabernet Sauvignon","Merlot","Cabernet Franc"],region:"Tuscany",country:"Italy",type:"red",description:"Bolgheri masterpiece of elegance.",priceRange:"luxury",isPublic:true},
{name:"Brunello di Montalcino Riserva",producer:"Biondi-Santi",vintage:2016,grapes:["Sangiovese"],region:"Tuscany",country:"Italy",type:"red",description:"The original Brunello, pure Sangiovese tradition.",priceRange:"luxury",isPublic:true},
{name:"Chianti Classico Gran Selezione",producer:"Castello di Ama",vintage:2019,grapes:["Sangiovese"],region:"Tuscany",country:"Italy",type:"red",description:"Top-tier Chianti Classico with art-label.",priceRange:"premium",isPublic:true},
// ITALY - VENETO & SICILY
{name:"Amarone della Valpolicella",producer:"Giuseppe Quintarelli",vintage:2012,grapes:["Corvina","Rondinella"],region:"Veneto",country:"Italy",type:"red",description:"Legendary traditional Amarone, years of aging.",priceRange:"luxury",isPublic:true},
{name:"Amarone Classico",producer:"Allegrini",vintage:2017,grapes:["Corvina","Rondinella","Oseleta"],region:"Veneto",country:"Italy",type:"red",description:"Modern Amarone with concentrated fruit.",priceRange:"premium",isPublic:true},
{name:"Santa Cecilia",producer:"Planeta",vintage:2019,grapes:["Nero d'Avola"],region:"Sicily",country:"Italy",type:"red",description:"Rich Sicilian red from top producer.",priceRange:"mid",isPublic:true},
{name:"Ben Ryé",producer:"Donnafugata",vintage:2020,grapes:["Zibibbo"],region:"Sicily",country:"Italy",type:"dessert",description:"Passito from Pantelleria, liquid gold.",priceRange:"premium",isPublic:true},
// SPAIN - RIOJA
{name:"Viña Tondonia Reserva",producer:"López de Heredia",vintage:2010,grapes:["Tempranillo","Garnacha"],region:"Rioja",country:"Spain",type:"red",description:"Traditional Rioja aged decades in barrel.",priceRange:"premium",isPublic:true},
{name:"Gran Reserva 904",producer:"La Rioja Alta",vintage:2015,grapes:["Tempranillo"],region:"Rioja",country:"Spain",type:"red",description:"Elegant Gran Reserva, long barrel aging.",priceRange:"premium",isPublic:true},
{name:"Prado Enea Gran Reserva",producer:"Muga",vintage:2016,grapes:["Tempranillo","Garnacha"],region:"Rioja",country:"Spain",type:"red",description:"Benchmark traditional Rioja Gran Reserva.",priceRange:"premium",isPublic:true},
{name:"Imperial Gran Reserva",producer:"CVNE",vintage:2017,grapes:["Tempranillo"],region:"Rioja",country:"Spain",type:"red",description:"Classic Rioja from a historic bodega.",priceRange:"premium",isPublic:true},
// SPAIN - RIBERA & PRIORAT
{name:"Único",producer:"Vega Sicilia",vintage:2013,grapes:["Tempranillo","Cabernet Sauvignon"],region:"Ribera del Duero",country:"Spain",type:"red",description:"Spain's most iconic wine.",priceRange:"luxury",isPublic:true},
{name:"Pingus",producer:"Dominio de Pingus",vintage:2019,grapes:["Tempranillo"],region:"Ribera del Duero",country:"Spain",type:"red",description:"Cult garage wine of extraordinary concentration.",priceRange:"luxury",isPublic:true},
{name:"L'Ermita",producer:"Álvaro Palacios",vintage:2019,grapes:["Garnacha"],region:"Priorat",country:"Spain",type:"red",description:"Spain's greatest Garnacha from old vines.",priceRange:"luxury",isPublic:true},
// PORTUGAL
{name:"Nacional Vintage Port",producer:"Quinta do Noval",vintage:2017,grapes:["Touriga Nacional"],region:"Douro Valley",country:"Portugal",type:"fortified",description:"Ungrafted vines, rarest port wine.",priceRange:"luxury",isPublic:true},
{name:"Batuta",producer:"Niepoort",vintage:2018,grapes:["Touriga Nacional","Tinta Roriz"],region:"Douro Valley",country:"Portugal",type:"red",description:"Elegant Douro red from old vines.",priceRange:"premium",isPublic:true},
{name:"Barca Velha",producer:"Casa Ferreirinha",vintage:2015,grapes:["Touriga Nacional","Tinta Roriz"],region:"Douro Valley",country:"Portugal",type:"red",description:"Portugal's most famous table wine.",priceRange:"luxury",isPublic:true},
{name:"Reserva",producer:"Herdade do Esporão",vintage:2019,grapes:["Aragonez","Trincadeira"],region:"Alentejo",country:"Portugal",type:"red",description:"Benchmark Alentejo red, rich and approachable.",priceRange:"mid",isPublic:true},
{name:"Pêra-Manca",producer:"Cartuxa",vintage:2017,grapes:["Aragonez","Trincadeira"],region:"Alentejo",country:"Portugal",type:"red",description:"One of Portugal's finest reds.",priceRange:"premium",isPublic:true},
// GERMANY
{name:"Wehlener Sonnenuhr Auslese",producer:"Joh. Jos. Prüm",vintage:2020,grapes:["Riesling"],region:"Mosel",country:"Germany",type:"white",description:"Legendary Mosel Riesling, perfect balance.",priceRange:"premium",isPublic:true},
{name:"Erdener Prälat Riesling GG",producer:"Dr. Loosen",vintage:2019,grapes:["Riesling"],region:"Mosel",country:"Germany",type:"white",description:"Top Mosel site, intense mineral Riesling.",priceRange:"premium",isPublic:true},
{name:"Scharzhofberger Riesling Auslese",producer:"Egon Müller",vintage:2020,grapes:["Riesling"],region:"Mosel",country:"Germany",type:"white",description:"The most expensive German wine.",priceRange:"luxury",isPublic:true},
{name:"Kiedricher Gräfenberg Riesling GG",producer:"Robert Weil",vintage:2020,grapes:["Riesling"],region:"Rheingau",country:"Germany",type:"white",description:"Grand Cru level Rheingau Riesling.",priceRange:"premium",isPublic:true},
// USA - NAPA
{name:"Opus One",producer:"Opus One",vintage:2019,grapes:["Cabernet Sauvignon","Merlot","Cabernet Franc"],region:"Napa Valley",country:"United States",type:"red",description:"Mondavi-Rothschild Napa icon.",priceRange:"luxury",isPublic:true},
{name:"Screaming Eagle",producer:"Screaming Eagle",vintage:2019,grapes:["Cabernet Sauvignon"],region:"Napa Valley",country:"United States",type:"red",description:"America's most exclusive cult Cabernet.",priceRange:"luxury",isPublic:true},
{name:"Special Selection Cabernet",producer:"Caymus",vintage:2019,grapes:["Cabernet Sauvignon"],region:"Napa Valley",country:"United States",type:"red",description:"Rich, ripe Napa Cabernet benchmark.",priceRange:"premium",isPublic:true},
{name:"Cask 23 Cabernet",producer:"Stag's Leap Wine Cellars",vintage:2018,grapes:["Cabernet Sauvignon"],region:"Napa Valley",country:"United States",type:"red",description:"Historic Napa estate, Judgment of Paris fame.",priceRange:"premium",isPublic:true},
{name:"Reserve Cabernet",producer:"Robert Mondavi",vintage:2018,grapes:["Cabernet Sauvignon"],region:"Napa Valley",country:"United States",type:"red",description:"Napa pioneer's flagship reserve.",priceRange:"premium",isPublic:true},
{name:"Dominus",producer:"Dominus Estate",vintage:2019,grapes:["Cabernet Sauvignon","Cabernet Franc"],region:"Napa Valley",country:"United States",type:"red",description:"Christian Moueix's Napa masterwork.",priceRange:"luxury",isPublic:true},
// USA - SONOMA & OREGON
{name:"Sonoma Mountain Chardonnay",producer:"Kistler",vintage:2020,grapes:["Chardonnay"],region:"Sonoma",country:"United States",type:"white",description:"California's finest Burgundian-style Chardonnay.",priceRange:"premium",isPublic:true},
{name:"Pinot Noir Sonoma Coast",producer:"Williams Selyem",vintage:2020,grapes:["Pinot Noir"],region:"Sonoma",country:"United States",type:"red",description:"Cult Sonoma Pinot of exceptional quality.",priceRange:"premium",isPublic:true},
{name:"Dundee Hills Pinot Noir",producer:"Domaine Drouhin Oregon",vintage:2020,grapes:["Pinot Noir"],region:"Willamette Valley",country:"United States",type:"red",description:"Burgundian finesse in Oregon terroir.",priceRange:"premium",isPublic:true},
{name:"Original Vines Pinot Noir",producer:"Eyrie Vineyards",vintage:2019,grapes:["Pinot Noir"],region:"Willamette Valley",country:"United States",type:"red",description:"Oregon's pioneering Pinot Noir estate.",priceRange:"premium",isPublic:true},
// ARGENTINA
{name:"Malbec Argentino",producer:"Catena Zapata",vintage:2019,grapes:["Malbec"],region:"Mendoza",country:"Argentina",type:"red",description:"Argentina's greatest Malbec producer.",priceRange:"premium",isPublic:true},
{name:"Finca Altamira Malbec",producer:"Achaval-Ferrer",vintage:2018,grapes:["Malbec"],region:"Mendoza",country:"Argentina",type:"red",description:"Single-vineyard altitude Malbec.",priceRange:"premium",isPublic:true},
{name:"Privada",producer:"Bodega Norton",vintage:2019,grapes:["Malbec","Merlot","Cabernet Sauvignon"],region:"Mendoza",country:"Argentina",type:"red",description:"Elegant Argentine blend.",priceRange:"mid",isPublic:true},
{name:"José Malbec",producer:"Zuccardi",vintage:2019,grapes:["Malbec"],region:"Mendoza",country:"Argentina",type:"red",description:"Uco Valley Malbec of remarkable finesse.",priceRange:"premium",isPublic:true},
// CHILE
{name:"Don Melchor",producer:"Concha y Toro",vintage:2019,grapes:["Cabernet Sauvignon"],region:"Maipo Valley",country:"Chile",type:"red",description:"Chile's first icon wine.",priceRange:"premium",isPublic:true},
{name:"Almaviva",producer:"Almaviva",vintage:2019,grapes:["Cabernet Sauvignon","Carmenère"],region:"Maipo Valley",country:"Chile",type:"red",description:"Mouton Rothschild-Concha y Toro joint venture.",priceRange:"luxury",isPublic:true},
{name:"Alpha M",producer:"Montes",vintage:2018,grapes:["Cabernet Sauvignon","Cabernet Franc"],region:"Colchagua Valley",country:"Chile",type:"red",description:"Chile's Colchagua benchmark.",priceRange:"premium",isPublic:true},
{name:"Seña",producer:"Viña Seña",vintage:2019,grapes:["Cabernet Sauvignon","Carmenère","Malbec"],region:"Colchagua Valley",country:"Chile",type:"red",description:"Biodynamic Chilean icon from Eduardo Chadwick.",priceRange:"luxury",isPublic:true},
// AUSTRALIA
{name:"Grange",producer:"Penfolds",vintage:2018,grapes:["Shiraz"],region:"Barossa Valley",country:"Australia",type:"red",description:"Australia's most iconic wine.",priceRange:"luxury",isPublic:true},
{name:"Hill of Grace",producer:"Henschke",vintage:2017,grapes:["Shiraz"],region:"Barossa Valley",country:"Australia",type:"red",description:"Single-vineyard old-vine Shiraz masterpiece.",priceRange:"luxury",isPublic:true},
{name:"RunRig",producer:"Torbreck",vintage:2019,grapes:["Shiraz","Viognier"],region:"Barossa Valley",country:"Australia",type:"red",description:"Co-fermented Shiraz-Viognier, Northern Rhône style.",priceRange:"premium",isPublic:true},
{name:"Art Series Chardonnay",producer:"Leeuwin Estate",vintage:2020,grapes:["Chardonnay"],region:"Margaret River",country:"Australia",type:"white",description:"Australia's greatest Chardonnay.",priceRange:"premium",isPublic:true},
{name:"Diana Madeline",producer:"Cullen",vintage:2019,grapes:["Cabernet Sauvignon","Merlot"],region:"Margaret River",country:"Australia",type:"red",description:"Biodynamic Margaret River Bordeaux blend.",priceRange:"premium",isPublic:true},
// NEW ZEALAND
{name:"Sauvignon Blanc",producer:"Cloudy Bay",vintage:2022,grapes:["Sauvignon Blanc"],region:"Marlborough",country:"New Zealand",type:"white",description:"The wine that put NZ on the map.",priceRange:"mid",isPublic:true},
{name:"Reserve Sauvignon Blanc",producer:"Villa Maria",vintage:2022,grapes:["Sauvignon Blanc"],region:"Marlborough",country:"New Zealand",type:"white",description:"New Zealand's largest family-owned winery.",priceRange:"mid",isPublic:true},
{name:"Te Muna Road Pinot Noir",producer:"Craggy Range",vintage:2020,grapes:["Pinot Noir"],region:"Marlborough",country:"New Zealand",type:"red",description:"Elegant cool-climate Pinot Noir.",priceRange:"premium",isPublic:true},
// SOUTH AFRICA
{name:"Pinotage",producer:"Kanonkop",vintage:2019,grapes:["Pinotage"],region:"Stellenbosch",country:"South Africa",type:"red",description:"South Africa's signature grape at its best.",priceRange:"mid",isPublic:true},
{name:"Rubicon",producer:"Meerlust",vintage:2018,grapes:["Cabernet Sauvignon","Merlot","Cabernet Franc"],region:"Stellenbosch",country:"South Africa",type:"red",description:"Iconic Stellenbosch Bordeaux blend.",priceRange:"premium",isPublic:true},
{name:"V",producer:"Vergelegen",vintage:2017,grapes:["Cabernet Sauvignon","Merlot"],region:"Stellenbosch",country:"South Africa",type:"red",description:"Flagship red from a historic estate.",priceRange:"premium",isPublic:true},
{name:"Syrah",producer:"Boekenhoutskloof",vintage:2019,grapes:["Syrah"],region:"Stellenbosch",country:"South Africa",type:"red",description:"Top South African Syrah, Rhône-inspired.",priceRange:"premium",isPublic:true},
// ═══ BATCH 2: 85 MORE WINES ═══
// FRANCE - BORDEAUX (more)
{name:"Château Ausone",producer:"Château Ausone",vintage:2019,grapes:["Merlot","Cabernet Franc"],region:"Bordeaux",country:"France",type:"red",description:"Premier Grand Cru Saint-Émilion, limestone terroir.",priceRange:"luxury",isPublic:true},
{name:"Château Cos d'Estournel",producer:"Château Cos d'Estournel",vintage:2018,grapes:["Cabernet Sauvignon","Merlot"],region:"Bordeaux",country:"France",type:"red",description:"Super Second from Saint-Estèphe, exotic and rich.",priceRange:"luxury",isPublic:true},
{name:"Château Léoville-Las Cases",producer:"Château Léoville-Las Cases",vintage:2018,grapes:["Cabernet Sauvignon","Merlot"],region:"Bordeaux",country:"France",type:"red",description:"Super Second rivaling First Growths.",priceRange:"luxury",isPublic:true},
{name:"Château Palmer",producer:"Château Palmer",vintage:2019,grapes:["Merlot","Cabernet Sauvignon"],region:"Bordeaux",country:"France",type:"red",description:"Margaux's other star, silky and perfumed.",priceRange:"luxury",isPublic:true},
{name:"Château Ducru-Beaucaillou",producer:"Château Ducru-Beaucaillou",vintage:2018,grapes:["Cabernet Sauvignon","Merlot"],region:"Bordeaux",country:"France",type:"red",description:"Classic Saint-Julien with precision.",priceRange:"premium",isPublic:true},
{name:"Château Pichon Baron",producer:"Château Pichon Baron",vintage:2019,grapes:["Cabernet Sauvignon","Merlot"],region:"Bordeaux",country:"France",type:"red",description:"Powerful Pauillac Super Second.",priceRange:"premium",isPublic:true},
{name:"Château Figeac",producer:"Château Figeac",vintage:2020,grapes:["Cabernet Sauvignon","Cabernet Franc","Merlot"],region:"Bordeaux",country:"France",type:"red",description:"Newly elevated Premier Grand Cru.",priceRange:"luxury",isPublic:true},
// FRANCE - BURGUNDY (more)
{name:"Chambertin Grand Cru",producer:"Domaine Armand Rousseau",vintage:2019,grapes:["Pinot Noir"],region:"Burgundy",country:"France",type:"red",description:"King of Burgundy Grand Crus.",priceRange:"luxury",isPublic:true},
{name:"Corton-Charlemagne",producer:"Domaine Bonneau du Martray",vintage:2020,grapes:["Chardonnay"],region:"Burgundy",country:"France",type:"white",description:"Monopole Grand Cru white of great finesse.",priceRange:"luxury",isPublic:true},
{name:"Vosne-Romanée Les Suchots",producer:"Domaine de l'Arlot",vintage:2019,grapes:["Pinot Noir"],region:"Burgundy",country:"France",type:"red",description:"Premier Cru from a top Vosne estate.",priceRange:"premium",isPublic:true},
{name:"Beaune Premier Cru Grèves",producer:"Domaine Tollot-Beaut",vintage:2020,grapes:["Pinot Noir"],region:"Burgundy",country:"France",type:"red",description:"Generous, friendly Beaune from family estate.",priceRange:"mid",isPublic:true},
{name:"Chablis Grand Cru Les Clos",producer:"Domaine William Fèvre",vintage:2020,grapes:["Chardonnay"],region:"Burgundy",country:"France",type:"white",description:"The finest Chablis Grand Cru site.",priceRange:"premium",isPublic:true},
// FRANCE - RHÔNE (more)
{name:"Ermitage Le Pavillon",producer:"M. Chapoutier",vintage:2019,grapes:["Syrah"],region:"Rhone Valley",country:"France",type:"red",description:"Biodynamic Hermitage of immense depth.",priceRange:"luxury",isPublic:true},
{name:"Hermitage",producer:"Jean-Louis Chave",vintage:2018,grapes:["Syrah"],region:"Rhone Valley",country:"France",type:"red",description:"Artisan Hermitage, the benchmark.",priceRange:"luxury",isPublic:true},
{name:"Côte-Rôtie La Mouline",producer:"E. Guigal",vintage:2018,grapes:["Syrah","Viognier"],region:"Rhone Valley",country:"France",type:"red",description:"One of the legendary La-La's.",priceRange:"luxury",isPublic:true},
{name:"Gigondas",producer:"Domaine Santa Duc",vintage:2019,grapes:["Grenache","Mourvèdre"],region:"Rhone Valley",country:"France",type:"red",description:"Top Gigondas, Southern Rhône gem.",priceRange:"mid",isPublic:true},
// FRANCE - ALSACE & PROVENCE
{name:"Riesling Clos Sainte Hune",producer:"Trimbach",vintage:2017,grapes:["Riesling"],region:"Alsace",country:"France",type:"white",description:"France's greatest dry Riesling.",priceRange:"luxury",isPublic:true},
{name:"Gewürztraminer Hengst",producer:"Domaine Zind-Humbrecht",vintage:2019,grapes:["Gewürztraminer"],region:"Alsace",country:"France",type:"white",description:"Biodynamic Alsace from a Grand Cru.",priceRange:"premium",isPublic:true},
{name:"Bandol Rosé",producer:"Domaine Tempier",vintage:2022,grapes:["Mourvèdre","Grenache","Cinsault"],region:"Provence",country:"France",type:"rosé",description:"The benchmark Provence rosé.",priceRange:"mid",isPublic:true},
{name:"Château Simone Rosé",producer:"Château Simone",vintage:2021,grapes:["Grenache","Mourvèdre"],region:"Provence",country:"France",type:"rosé",description:"Unique Palette appellation rosé.",priceRange:"premium",isPublic:true},
// ITALY - PIEDMONT (more)
{name:"Barolo Parussi",producer:"Massolino",vintage:2017,grapes:["Nebbiolo"],region:"Piedmont",country:"Italy",type:"red",description:"Serralunga d'Alba single vineyard Barolo.",priceRange:"premium",isPublic:true},
{name:"Barolo Gran Bussia",producer:"Aldo Conterno",vintage:2016,grapes:["Nebbiolo"],region:"Piedmont",country:"Italy",type:"red",description:"Three-vineyard blend, traditional style.",priceRange:"luxury",isPublic:true},
{name:"Barbaresco Rabajà",producer:"Bruno Giacosa",vintage:2018,grapes:["Nebbiolo"],region:"Piedmont",country:"Italy",type:"red",description:"Exceptional single-vineyard Barbaresco.",priceRange:"luxury",isPublic:true},
{name:"Barolo Cannubi",producer:"Marchesi di Barolo",vintage:2018,grapes:["Nebbiolo"],region:"Piedmont",country:"Italy",type:"red",description:"Historic cru in the heart of Barolo.",priceRange:"premium",isPublic:true},
{name:"Gavi di Gavi",producer:"La Scolca",vintage:2021,grapes:["Cortese"],region:"Piedmont",country:"Italy",type:"white",description:"Italy's finest Cortese, crisp and mineral.",priceRange:"mid",isPublic:true},
// ITALY - TUSCANY (more)
{name:"Flaccianello della Pieve",producer:"Fontodi",vintage:2018,grapes:["Sangiovese"],region:"Tuscany",country:"Italy",type:"red",description:"100% Sangiovese IGT of great intensity.",priceRange:"premium",isPublic:true},
{name:"Solaia",producer:"Antinori",vintage:2019,grapes:["Cabernet Sauvignon","Sangiovese"],region:"Tuscany",country:"Italy",type:"red",description:"Super Tuscan sibling of Tignanello.",priceRange:"luxury",isPublic:true},
{name:"Masseto",producer:"Tenuta dell'Ornellaia",vintage:2019,grapes:["Merlot"],region:"Tuscany",country:"Italy",type:"red",description:"Italy's answer to Pétrus, pure Merlot.",priceRange:"luxury",isPublic:true},
{name:"Vernaccia di San Gimignano",producer:"Teruzzi & Puthod",vintage:2021,grapes:["Vernaccia"],region:"Tuscany",country:"Italy",type:"white",description:"Crisp Tuscan white from medieval towers.",priceRange:"budget",isPublic:true},
// SPAIN (more)
{name:"Castillo Ygay Gran Reserva",producer:"Marqués de Murrieta",vintage:2012,grapes:["Tempranillo","Mazuelo"],region:"Rioja",country:"Spain",type:"red",description:"Decades of aging, legendary Rioja.",priceRange:"luxury",isPublic:true},
{name:"Pesquera Reserva",producer:"Alejandro Fernández",vintage:2018,grapes:["Tempranillo"],region:"Ribera del Duero",country:"Spain",type:"red",description:"The man who put Ribera on the map.",priceRange:"premium",isPublic:true},
{name:"Alión",producer:"Vega Sicilia",vintage:2019,grapes:["Tempranillo"],region:"Ribera del Duero",country:"Spain",type:"red",description:"Vega Sicilia's modern, earlier-drinking wine.",priceRange:"premium",isPublic:true},
{name:"Clos Mogador",producer:"René Barbier",vintage:2018,grapes:["Garnacha","Cariñena","Syrah"],region:"Priorat",country:"Spain",type:"red",description:"Pioneer of the Priorat renaissance.",priceRange:"premium",isPublic:true},
{name:"Clos Erasmus",producer:"Daphne Glorian",vintage:2019,grapes:["Garnacha","Syrah"],region:"Priorat",country:"Spain",type:"red",description:"Tiny production, immense Priorat.",priceRange:"luxury",isPublic:true},
{name:"Albariño",producer:"Pazo de Señorans",vintage:2022,grapes:["Albariño"],region:"Rías Baixas",country:"Spain",type:"white",description:"Benchmark Albariño from Galicia.",priceRange:"mid",isPublic:true},
// PORTUGAL (more)
{name:"Quinta do Crasto Reserva",producer:"Quinta do Crasto",vintage:2019,grapes:["Touriga Nacional","Tinta Roriz"],region:"Douro Valley",country:"Portugal",type:"red",description:"Structured Douro red, great value.",priceRange:"mid",isPublic:true},
{name:"Quinta do Vale Meão",producer:"Quinta do Vale Meão",vintage:2018,grapes:["Touriga Nacional","Touriga Franca"],region:"Douro Valley",country:"Portugal",type:"red",description:"Original Barca Velha estate.",priceRange:"premium",isPublic:true},
{name:"Mouchão Tonel 3-4",producer:"Herdade do Mouchão",vintage:2016,grapes:["Alicante Bouschet"],region:"Alentejo",country:"Portugal",type:"red",description:"Cult Alentejo from ancient vines.",priceRange:"premium",isPublic:true},
// GERMANY (more)
{name:"Bernkasteler Doctor Riesling",producer:"Markus Molitor",vintage:2019,grapes:["Riesling"],region:"Mosel",country:"Germany",type:"white",description:"From the most famous Mosel vineyard.",priceRange:"premium",isPublic:true},
{name:"Riesling Spätlese",producer:"Schloss Johannisberg",vintage:2019,grapes:["Riesling"],region:"Rheingau",country:"Germany",type:"white",description:"The birthplace of Riesling.",priceRange:"mid",isPublic:true},
{name:"Riesling GG Kirchenstück",producer:"Reichsrat von Buhl",vintage:2020,grapes:["Riesling"],region:"Rheingau",country:"Germany",type:"white",description:"Grand Cru Pfalz Riesling.",priceRange:"premium",isPublic:true},
// USA (more)
{name:"Silver Oak Cabernet",producer:"Silver Oak",vintage:2018,grapes:["Cabernet Sauvignon"],region:"Napa Valley",country:"United States",type:"red",description:"America's favorite Cabernet.",priceRange:"premium",isPublic:true},
{name:"Harlan Estate",producer:"Harlan Estate",vintage:2018,grapes:["Cabernet Sauvignon","Merlot"],region:"Napa Valley",country:"United States",type:"red",description:"Napa's cult Bordeaux blend.",priceRange:"luxury",isPublic:true},
{name:"Scarecrow Cabernet",producer:"Scarecrow",vintage:2019,grapes:["Cabernet Sauvignon"],region:"Napa Valley",country:"United States",type:"red",description:"Rutherford cult wine, tiny production.",priceRange:"luxury",isPublic:true},
{name:"Flowers Pinot Noir",producer:"Flowers",vintage:2020,grapes:["Pinot Noir"],region:"Sonoma",country:"United States",type:"red",description:"Extreme Sonoma Coast Pinot.",priceRange:"premium",isPublic:true},
{name:"Beaux Frères Pinot Noir",producer:"Beaux Frères",vintage:2020,grapes:["Pinot Noir"],region:"Willamette Valley",country:"United States",type:"red",description:"Robert Parker's Oregon estate.",priceRange:"premium",isPublic:true},
{name:"Ridge Monte Bello",producer:"Ridge Vineyards",vintage:2019,grapes:["Cabernet Sauvignon","Merlot"],region:"Santa Cruz Mountains",country:"United States",type:"red",description:"California's longest-running icon.",priceRange:"luxury",isPublic:true},
// ARGENTINA (more)
{name:"Nicolás Catena Zapata",producer:"Catena Zapata",vintage:2018,grapes:["Cabernet Sauvignon","Malbec"],region:"Mendoza",country:"Argentina",type:"red",description:"Flagship Bordeaux-style blend.",priceRange:"luxury",isPublic:true},
{name:"Cheval des Andes",producer:"Cheval des Andes",vintage:2019,grapes:["Malbec","Cabernet Sauvignon"],region:"Mendoza",country:"Argentina",type:"red",description:"Cheval Blanc's Argentine venture.",priceRange:"premium",isPublic:true},
{name:"Malbec Reserva",producer:"Bodega Colomé",vintage:2019,grapes:["Malbec"],region:"Mendoza",country:"Argentina",type:"red",description:"High-altitude Salta Malbec.",priceRange:"mid",isPublic:true},
// CHILE (more)
{name:"Don Maximiano",producer:"Errazuriz",vintage:2019,grapes:["Cabernet Sauvignon"],region:"Maipo Valley",country:"Chile",type:"red",description:"Chile's first premium wine.",priceRange:"premium",isPublic:true},
{name:"Clos Apalta",producer:"Casa Lapostolle",vintage:2018,grapes:["Carmenère","Merlot","Cabernet Sauvignon"],region:"Colchagua Valley",country:"Chile",type:"red",description:"Biodynamic star of Colchagua.",priceRange:"premium",isPublic:true},
{name:"Carmenère Reserva",producer:"Concha y Toro",vintage:2021,grapes:["Carmenère"],region:"Colchagua Valley",country:"Chile",type:"red",description:"Chile's signature grape, great value.",priceRange:"budget",isPublic:true},
// AUSTRALIA (more)
{name:"Ares Shiraz",producer:"Two Hands",vintage:2019,grapes:["Shiraz"],region:"Barossa Valley",country:"Australia",type:"red",description:"Rich Barossa Shiraz from top sites.",priceRange:"premium",isPublic:true},
{name:"Heytesbury",producer:"Vasse Felix",vintage:2019,grapes:["Cabernet Sauvignon"],region:"Margaret River",country:"Australia",type:"red",description:"Margaret River's founding estate flagship.",priceRange:"premium",isPublic:true},
{name:"Riesling Watervale",producer:"Jim Barry",vintage:2022,grapes:["Riesling"],region:"Clare Valley",country:"Australia",type:"white",description:"Classic Clare Valley dry Riesling.",priceRange:"mid",isPublic:true},
{name:"Semillon",producer:"Tyrrell's Vat 1",vintage:2017,grapes:["Semillon"],region:"Hunter Valley",country:"Australia",type:"white",description:"Australia's most awarded white wine.",priceRange:"premium",isPublic:true},
// NEW ZEALAND (more)
{name:"Greywacke Sauvignon Blanc",producer:"Greywacke",vintage:2022,grapes:["Sauvignon Blanc"],region:"Marlborough",country:"New Zealand",type:"white",description:"From Cloudy Bay's original winemaker.",priceRange:"mid",isPublic:true},
{name:"Felton Road Pinot Noir",producer:"Felton Road",vintage:2020,grapes:["Pinot Noir"],region:"Central Otago",country:"New Zealand",type:"red",description:"New Zealand's finest Pinot Noir.",priceRange:"premium",isPublic:true},
{name:"Kumeu River Chardonnay",producer:"Kumeu River",vintage:2020,grapes:["Chardonnay"],region:"Auckland",country:"New Zealand",type:"white",description:"Burgundian Chardonnay from Auckland.",priceRange:"premium",isPublic:true},
// SOUTH AFRICA (more)
{name:"FMC Chenin Blanc",producer:"Ken Forrester",vintage:2020,grapes:["Chenin Blanc"],region:"Stellenbosch",country:"South Africa",type:"white",description:"South Africa's greatest Chenin Blanc.",priceRange:"premium",isPublic:true},
{name:"Columella",producer:"Sadie Family",vintage:2019,grapes:["Syrah","Mourvèdre"],region:"Swartland",country:"South Africa",type:"red",description:"South Africa's most acclaimed red blend.",priceRange:"premium",isPublic:true},
{name:"Palladius",producer:"Sadie Family",vintage:2020,grapes:["Chenin Blanc","Viognier"],region:"Swartland",country:"South Africa",type:"white",description:"Groundbreaking Swartland white blend.",priceRange:"premium",isPublic:true},
// REST OF WORLD
{name:"Grüner Veltliner Smaragd",producer:"Domäne Wachau",vintage:2021,grapes:["Grüner Veltliner"],region:"Wachau",country:"Austria",type:"white",description:"Top-tier Austrian Grüner Veltliner.",priceRange:"premium",isPublic:true},
{name:"Blaufränkisch",producer:"Moric",vintage:2019,grapes:["Blaufränkisch"],region:"Burgenland",country:"Austria",type:"red",description:"Austria's answer to great Pinot Noir.",priceRange:"premium",isPublic:true},
{name:"Assyrtiko",producer:"Domaine Sigalas",vintage:2021,grapes:["Assyrtiko"],region:"Santorini",country:"Greece",type:"white",description:"Volcanic Santorini white of great minerality.",priceRange:"mid",isPublic:true},
{name:"Château Musar",producer:"Château Musar",vintage:2017,grapes:["Cabernet Sauvignon","Cinsault","Carignan"],region:"Bekaa Valley",country:"Lebanon",type:"red",description:"Lebanon's legendary wine, made through conflict.",priceRange:"premium",isPublic:true},
{name:"Tokaji Aszú 5 Puttonyos",producer:"Royal Tokaji",vintage:2017,grapes:["Furmint","Hárslevelű"],region:"Tokaj",country:"Hungary",type:"dessert",description:"Hungary's historic sweet wine.",priceRange:"premium",isPublic:true},
{name:"Saperavi",producer:"Pheasant's Tears",vintage:2020,grapes:["Saperavi"],region:"Kakheti",country:"Georgia",type:"red",description:"Natural Georgian wine from qvevri.",priceRange:"mid",isPublic:true},
];

async function main() {
  console.log(`Seeding ${wines.length} wines...`);
  let created = 0;
  for (const w of wines) {
    const existing = await prisma.wine.findFirst({ where: { name: w.name, producer: w.producer } });
    if (!existing) {
      await prisma.wine.create({ data: w });
      created++;
      console.log(`  ✓ ${w.name} (${w.producer})`);
    } else {
      console.log(`  - ${w.name} already exists`);
    }
  }
  console.log(`\nDone. Created ${created} new wines out of ${wines.length} total.`);
}

main().catch(console.error).finally(() => process.exit());
