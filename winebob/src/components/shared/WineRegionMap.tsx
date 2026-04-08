"use client";

import { useEffect, useRef, useCallback } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { wineRegions } from "@/data/wineRegions";
import { mockWineries, type MockWinery } from "@/data/mockWineries";

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN ?? "";

/** Tour stop content — shown as an info card during cinematic tour */
export type TourStop = {
  name: string;
  coords: [number, number];
  tagline: string;
  grapes: string[];
  notableWines: string[];
};

/** Sub-cities within each wine region for hopping + tour content */
const REGION_SUB_CITIES: Record<string, TourStop[]> = {
  "Bordeaux": [
    { name: "Saint-Émilion", coords: [-0.15, 44.89], tagline: "Medieval village with limestone plateaux producing rich, Merlot-dominant blends", grapes: ["Merlot", "Cabernet Franc"], notableWines: ["Château Cheval Blanc", "Château Ausone", "Château Angélus"] },
    { name: "Pauillac", coords: [-0.75, 45.20], tagline: "Home to three First Growths — the crown jewels of Bordeaux", grapes: ["Cabernet Sauvignon", "Merlot"], notableWines: ["Château Lafite Rothschild", "Château Mouton Rothschild", "Château Latour"] },
    { name: "Margaux", coords: [-0.67, 45.04], tagline: "Elegant, perfumed wines from gravelly terroir along the Gironde", grapes: ["Cabernet Sauvignon", "Merlot"], notableWines: ["Château Margaux", "Château Palmer", "Château Rauzan-Ségla"] },
    { name: "Sauternes", coords: [-0.35, 44.53], tagline: "Golden dessert wines shaped by noble rot (botrytis) from misty mornings", grapes: ["Sémillon", "Sauvignon Blanc"], notableWines: ["Château d'Yquem", "Château Suduiraut", "Château Climens"] },
    { name: "Pessac-Léognan", coords: [-0.68, 44.77], tagline: "Birthplace of Bordeaux wine — gravel soils producing both reds and whites", grapes: ["Cabernet Sauvignon", "Sauvignon Blanc"], notableWines: ["Château Haut-Brion", "Château Smith Haut Lafitte", "Domaine de Chevalier"] },
  ],
  "Burgundy": [
    { name: "Beaune", coords: [4.84, 47.02], tagline: "Wine capital of Burgundy with its famous Hospices charity auction", grapes: ["Pinot Noir", "Chardonnay"], notableWines: ["Bouchard Père & Fils", "Joseph Drouhin", "Louis Jadot"] },
    { name: "Nuits-Saint-Georges", coords: [4.95, 47.14], tagline: "Powerful, structured Pinot Noir from the heart of the Côte de Nuits", grapes: ["Pinot Noir"], notableWines: ["Domaine de la Romanée-Conti", "Henri Jayer", "Domaine Leroy"] },
    { name: "Chablis", coords: [3.80, 47.81], tagline: "Pure, mineral Chardonnay from ancient Kimmeridgian limestone", grapes: ["Chardonnay"], notableWines: ["Domaine Raveneau", "Vincent Dauvissat", "William Fèvre"] },
    { name: "Meursault", coords: [4.77, 46.98], tagline: "Rich, buttery white Burgundy — the gold standard of Chardonnay", grapes: ["Chardonnay"], notableWines: ["Domaine Coche-Dury", "Domaine des Comtes Lafon", "Domaine Roulot"] },
    { name: "Gevrey-Chambertin", coords: [4.97, 47.23], tagline: "Nine Grand Cru vineyards producing Burgundy's most powerful reds", grapes: ["Pinot Noir"], notableWines: ["Domaine Armand Rousseau", "Domaine Denis Mortet", "Domaine Trapet"] },
  ],
  "Champagne": [
    { name: "Reims", coords: [3.88, 49.25], tagline: "Cathedral city with vast underground chalk cellars — Montagne de Reims", grapes: ["Pinot Noir", "Chardonnay"], notableWines: ["Krug", "Veuve Clicquot", "Louis Roederer"] },
    { name: "Épernay", coords: [3.95, 49.04], tagline: "Avenue de Champagne — the most expensive street in the world per square meter", grapes: ["Chardonnay", "Pinot Noir", "Pinot Meunier"], notableWines: ["Moët & Chandon", "Dom Pérignon", "Perrier-Jouët"] },
    { name: "Ay", coords: [3.99, 49.06], tagline: "Grand Cru village on the Marne producing powerful Pinot Noir-based cuvées", grapes: ["Pinot Noir"], notableWines: ["Bollinger", "Deutz", "Gosset"] },
  ],
  "Tuscany": [
    { name: "Montalcino", coords: [11.49, 43.06], tagline: "Sun-drenched hilltop producing Italy's most age-worthy red — Brunello", grapes: ["Sangiovese"], notableWines: ["Biondi-Santi", "Casanova di Neri", "Il Poggione"] },
    { name: "Montepulciano", coords: [11.78, 43.10], tagline: "Renaissance town with Vino Nobile — Sangiovese at its most elegant", grapes: ["Sangiovese", "Canaiolo"], notableWines: ["Avignonesi", "Boscarelli", "Poliziano"] },
    { name: "Chianti", coords: [11.25, 43.47], tagline: "Rolling hills between Florence and Siena — the heart of Tuscan wine", grapes: ["Sangiovese"], notableWines: ["Fontodi", "Fèlsina", "Castello di Ama"] },
    { name: "Bolgheri", coords: [10.61, 43.23], tagline: "Coastal Super Tuscan revolution — Bordeaux varieties on Mediterranean soil", grapes: ["Cabernet Sauvignon", "Merlot"], notableWines: ["Sassicaia", "Ornellaia", "Masseto"] },
    { name: "San Gimignano", coords: [11.04, 43.47], tagline: "Medieval towers and crisp Vernaccia — Tuscany's signature white wine", grapes: ["Vernaccia"], notableWines: ["Panizzi", "Teruzzi & Puthod", "Montenidoli"] },
  ],
  "Piedmont": [
    { name: "Barolo", coords: [7.94, 44.61], tagline: "The King of wines — powerful Nebbiolo needing decades to reveal its depth", grapes: ["Nebbiolo"], notableWines: ["Giacomo Conterno", "Bruno Giacosa", "Bartolo Mascarello"] },
    { name: "Barbaresco", coords: [8.08, 44.73], tagline: "Barolo's elegant sibling — earlier-drinking Nebbiolo with silky tannins", grapes: ["Nebbiolo"], notableWines: ["Gaja", "Bruno Giacosa", "Produttori del Barbaresco"] },
    { name: "Asti", coords: [8.21, 44.90], tagline: "Sweet, sparkling Moscato d'Asti — Piedmont's joyful, low-alcohol fizz", grapes: ["Moscato Bianco"], notableWines: ["Paolo Saracco", "Vietti", "La Spinetta"] },
    { name: "Alba", coords: [8.03, 44.70], tagline: "Truffle capital and gateway to the Langhe — Barbera and Dolcetto country", grapes: ["Barbera", "Dolcetto"], notableWines: ["Elio Altare", "Sandrone", "Aldo Conterno"] },
  ],
  "Rioja": [
    { name: "Haro", coords: [-2.85, 42.58], tagline: "Barrio de la Estación — a railway quarter with legendary bodegas", grapes: ["Tempranillo", "Garnacha"], notableWines: ["López de Heredia", "La Rioja Alta", "CVNE"] },
    { name: "Logroño", coords: [-2.45, 42.47], tagline: "Regional capital famed for its tapas bars on Calle Laurel", grapes: ["Tempranillo"], notableWines: ["Marqués de Murrieta", "Bodegas Ontañón", "Campo Viejo"] },
    { name: "Laguardia", coords: [-2.58, 42.55], tagline: "Medieval hilltop village in Rioja Alavesa with underground cellars", grapes: ["Tempranillo", "Viura"], notableWines: ["Artadi", "Remírez de Ganuza", "Bodegas Ysios"] },
  ],
  "Napa Valley": [
    { name: "St. Helena", coords: [-122.47, 38.51], tagline: "Charming main street lined with world-class tasting rooms", grapes: ["Cabernet Sauvignon"], notableWines: ["Spottswoode", "Duckhorn", "Beringer"] },
    { name: "Yountville", coords: [-122.36, 38.40], tagline: "Culinary epicenter — home to The French Laundry and boutique wineries", grapes: ["Cabernet Sauvignon", "Merlot"], notableWines: ["Dominus", "Cliff Lede", "Jessup Cellars"] },
    { name: "Calistoga", coords: [-122.58, 38.58], tagline: "Hot springs town at the valley's warm northern end — bold, ripe reds", grapes: ["Cabernet Sauvignon", "Petite Sirah"], notableWines: ["Château Montelena", "Araujo", "Eisele Vineyard"] },
    { name: "Rutherford", coords: [-122.42, 38.46], tagline: "Famous 'Rutherford Dust' — the benchmark terroir for Napa Cabernet", grapes: ["Cabernet Sauvignon"], notableWines: ["Caymus", "Inglenook", "Scarecrow"] },
  ],
  "Douro Valley": [
    { name: "Pinhão", coords: [-7.55, 41.19], tagline: "Dramatic terraced vineyards carved into schist slopes above the Douro river", grapes: ["Touriga Nacional", "Tinta Roriz"], notableWines: ["Quinta do Noval", "Quinta do Crasto", "Niepoort"] },
    { name: "Peso da Régua", coords: [-7.79, 41.16], tagline: "Historic port wine trading hub — gateway to the upper Douro", grapes: ["Touriga Nacional", "Touriga Franca"], notableWines: ["Ramos Pinto", "Quinta do Vallado", "Kopke"] },
  ],
  "Mosel": [
    { name: "Bernkastel-Kues", coords: [7.07, 49.92], tagline: "Steep slate slopes producing Germany's most prestigious Rieslings", grapes: ["Riesling"], notableWines: ["Joh. Jos. Prüm", "Dr. Loosen", "Willi Schaefer"] },
    { name: "Piesport", coords: [6.92, 49.88], tagline: "South-facing amphitheater of vines — Goldtröpfchen (little gold drops)", grapes: ["Riesling"], notableWines: ["Haart", "St. Urbans-Hof", "Julian Haart"] },
    { name: "Trittenheim", coords: [6.90, 49.83], tagline: "Dramatic river bend with the Apotheke vineyard rising from the water", grapes: ["Riesling"], notableWines: ["Grans-Fassian", "Clüsserath-Weiler", "Eifel-Pfeiffer"] },
  ],
  "Rhone Valley": [
    { name: "Châteauneuf-du-Pape", coords: [4.83, 44.06], tagline: "13 permitted grape varieties and sun-baked galets roulés stones", grapes: ["Grenache", "Syrah", "Mourvèdre"], notableWines: ["Château Rayas", "Beaucastel", "Clos des Papes"] },
    { name: "Hermitage", coords: [4.84, 45.07], tagline: "The granite hill that produces France's most powerful Syrah", grapes: ["Syrah"], notableWines: ["Jean-Louis Chave", "Jaboulet La Chapelle", "Chapoutier"] },
    { name: "Côte-Rôtie", coords: [4.81, 45.47], tagline: "The 'roasted slope' — steep terraces producing perfumed, elegant Syrah", grapes: ["Syrah", "Viognier"], notableWines: ["Guigal La Mouline", "René Rostaing", "Stéphane Ogier"] },
    { name: "Gigondas", coords: [5.00, 44.17], tagline: "Lace-carved Dentelles mountains and rich Grenache-based reds", grapes: ["Grenache", "Syrah"], notableWines: ["Domaine Santa Duc", "Domaine du Cayron", "Château de Saint Cosme"] },
  ],
  "Loire Valley": [
    { name: "Tours", coords: [0.69, 47.39], tagline: "Gateway city to France's garden — Touraine's diverse wine country", grapes: ["Chenin Blanc", "Cabernet Franc"], notableWines: ["Domaine de la Taille aux Loups", "François Chidaine", "Vincent Carême"] },
    { name: "Sancerre", coords: [2.84, 47.33], tagline: "Hilltop village producing the world's benchmark Sauvignon Blanc", grapes: ["Sauvignon Blanc"], notableWines: ["Domaine Vacheron", "François Cotat", "Lucien Crochet"] },
    { name: "Vouvray", coords: [0.80, 47.41], tagline: "Chenin Blanc in every style — dry, off-dry, sweet, and sparkling", grapes: ["Chenin Blanc"], notableWines: ["Domaine Huet", "Domaine du Clos Naudin", "François Pinon"] },
    { name: "Chinon", coords: [0.24, 47.17], tagline: "Cabernet Franc at its most elegant — violet-scented reds from tuffeau soil", grapes: ["Cabernet Franc"], notableWines: ["Charles Joguet", "Bernard Baudry", "Domaine Alliet"] },
    { name: "Angers", coords: [-0.55, 47.47], tagline: "Capital of Anjou — sweet Coteaux du Layon and dry Savennières", grapes: ["Chenin Blanc"], notableWines: ["Domaine des Baumard", "Nicolas Joly", "Domaine FL"] },
  ],
  "Alsace": [
    { name: "Colmar", coords: [7.36, 48.08], tagline: "Fairy-tale half-timbered town — heart of the Alsace wine route", grapes: ["Riesling", "Gewurztraminer"], notableWines: ["Domaine Weinbach", "Zind-Humbrecht", "Albert Boxler"] },
    { name: "Riquewihr", coords: [7.30, 48.17], tagline: "One of France's most beautiful villages surrounded by Grand Cru vineyards", grapes: ["Riesling", "Pinot Gris"], notableWines: ["Hugel", "Trimbach", "Dopff au Moulin"] },
    { name: "Strasbourg", coords: [7.75, 48.57], tagline: "European capital with Alsatian winstubs and the oldest wine cooperative", grapes: ["Riesling", "Sylvaner"], notableWines: ["Cave de Turckheim", "Wolfberger", "Arthur Metz"] },
    { name: "Kaysersberg", coords: [7.26, 48.14], tagline: "Birthplace of Albert Schweitzer — steep Grand Cru Schlossberg above", grapes: ["Riesling"], notableWines: ["Domaine Weinbach", "Albert Mann", "Marc Tempé"] },
  ],
  "Provence": [
    { name: "Aix-en-Provence", coords: [5.45, 43.53], tagline: "Cultural capital surrounded by rosé producers and Cézanne's landscapes", grapes: ["Grenache", "Cinsault", "Syrah"], notableWines: ["Château Simone", "Domaine de Trévallon", "Château Vignelaure"] },
    { name: "Bandol", coords: [5.75, 43.14], tagline: "Mourvèdre-based reds and rosés from terraced Mediterranean hillsides", grapes: ["Mourvèdre"], notableWines: ["Domaine Tempier", "Château Pibarnon", "Château Pradeaux"] },
    { name: "Cassis", coords: [5.54, 43.21], tagline: "Tiny fishing port with rare, mineral white wines — Marseillais' favorite", grapes: ["Marsanne", "Clairette"], notableWines: ["Clos Sainte Magdeleine", "Château de Fontcreuse", "Domaine du Bagnol"] },
    { name: "Nice", coords: [7.26, 43.70], tagline: "Riviera hillside vineyards of Bellet — one of France's smallest AOCs", grapes: ["Braquet", "Rolle"], notableWines: ["Château de Bellet", "Château de Crémat", "Domaine de Toasc"] },
  ],
  "Veneto": [
    { name: "Verona", coords: [10.99, 45.44], tagline: "City of Romeo & Juliet — gateway to Valpolicella and Amarone", grapes: ["Corvina", "Rondinella"], notableWines: ["Allegrini", "Bertani", "Masi"] },
    { name: "Valpolicella", coords: [10.89, 45.52], tagline: "Cherry orchards and dried-grape Amarone — Veneto's most complex reds", grapes: ["Corvina", "Rondinella", "Molinara"], notableWines: ["Giuseppe Quintarelli", "Dal Forno Romano", "Allegrini"] },
    { name: "Soave", coords: [11.25, 45.39], tagline: "Volcanic soils producing Italy's finest Garganega — crisp and mineral", grapes: ["Garganega"], notableWines: ["Pieropan", "Inama", "Gini"] },
    { name: "Conegliano", coords: [12.30, 45.89], tagline: "Steep hills of Prosecco Superiore DOCG — Italy's sparkling wine heartland", grapes: ["Glera"], notableWines: ["Bisol", "Nino Franco", "Bortolomiol"] },
  ],
  "Sicily": [
    { name: "Etna", coords: [15.00, 37.75], tagline: "Volcanic vineyards at 1000m altitude — Italy's most exciting wine frontier", grapes: ["Nerello Mascalese", "Carricante"], notableWines: ["Benanti", "Passopisciaro", "Tenuta delle Terre Nere"] },
    { name: "Marsala", coords: [12.44, 37.80], tagline: "Fortified wine tradition revived — amber nectar from western Sicily", grapes: ["Grillo", "Catarratto"], notableWines: ["Marco De Bartoli", "Florio", "Pellegrino"] },
    { name: "Noto", coords: [15.07, 36.89], tagline: "Baroque city with sun-drenched Nero d'Avola vineyards", grapes: ["Nero d'Avola"], notableWines: ["Planeta", "Feudo Maccari", "Marabino"] },
    { name: "Palermo", coords: [13.36, 38.12], tagline: "Street food capital with nearby Monreale vineyards and indigenous grapes", grapes: ["Perricone", "Catarratto"], notableWines: ["Guiliana", "Alessandro di Camporeale", "Cusumano"] },
  ],
  "Ribera del Duero": [
    { name: "Peñafiel", coords: [-4.11, 41.60], tagline: "Castle-topped town with Spain's wine museum — Tempranillo heartland", grapes: ["Tempranillo"], notableWines: ["Vega Sicilia", "Protos", "Pesquera"] },
    { name: "Aranda de Duero", coords: [-3.69, 41.67], tagline: "Underground medieval cellars and lamb roasted over vine cuttings", grapes: ["Tempranillo"], notableWines: ["Dominio de Pingus", "Arzuaga", "Pago de los Capellanes"] },
    { name: "Roa", coords: [-3.93, 41.69], tagline: "High-altitude plateau vineyards producing concentrated, powerful reds", grapes: ["Tempranillo"], notableWines: ["Aalto", "Emilio Moro", "Bodegas Alión"] },
  ],
  "Priorat": [
    { name: "Gratallops", coords: [0.77, 41.17], tagline: "Steep llicorella slate slopes — the epicenter of Priorat's renaissance", grapes: ["Garnacha", "Cariñena"], notableWines: ["Álvaro Palacios L'Ermita", "Clos Mogador", "Clos Erasmus"] },
    { name: "Porrera", coords: [0.88, 41.19], tagline: "Ancient Cariñena vines clinging to black slate at extreme altitudes", grapes: ["Cariñena", "Garnacha"], notableWines: ["Cims de Porrera", "Val Llach", "Mas d'en Gil"] },
    { name: "Falset", coords: [0.82, 41.15], tagline: "Market town gateway to Priorat and the neighboring Montsant DO", grapes: ["Garnacha", "Syrah"], notableWines: ["Celler de Capçanes", "Cellers Fuentes", "Ficaria Vins"] },
  ],
  "Alentejo": [
    { name: "Évora", coords: [-7.91, 38.57], tagline: "UNESCO World Heritage city — cork oak plains and clay amphora winemaking", grapes: ["Aragonez", "Trincadeira"], notableWines: ["Herdade do Esporão", "João Portugal Ramos", "Cartuxa"] },
    { name: "Estremoz", coords: [-7.59, 38.84], tagline: "Marble town with high-altitude vineyards and fresh, mineral whites", grapes: ["Antão Vaz", "Arinto"], notableWines: ["Quinta do Mouro", "Herdade do Mouchão", "Susana Esteban"] },
    { name: "Reguengos de Monsaraz", coords: [-7.53, 38.43], tagline: "Lakeside vineyards near the stunning medieval village of Monsaraz", grapes: ["Aragonez", "Alicante Bouschet"], notableWines: ["Herdade do Esporão", "Ervideira", "Herdade da Calada"] },
  ],
  "Rheingau": [
    { name: "Rüdesheim", coords: [7.93, 49.98], tagline: "Tourist gateway with steep Rhine-facing slopes and the Drosselgasse", grapes: ["Riesling"], notableWines: ["Georg Breuer", "Leitz", "Schloss Johannisberg"] },
    { name: "Eltville", coords: [8.12, 50.03], tagline: "Rose gardens and riverside Riesling — birthplace of Gutenberg's printer", grapes: ["Riesling"], notableWines: ["Robert Weil", "Langwerth von Simmern", "J.B. Becker"] },
    { name: "Johannisberg", coords: [8.00, 50.00], tagline: "Schloss Johannisberg — where late-harvest Riesling was accidentally invented", grapes: ["Riesling"], notableWines: ["Schloss Johannisberg", "Prinz von Hessen", "Domdechant Werner"] },
  ],
  "Sonoma": [
    { name: "Healdsburg", coords: [-122.87, 38.61], tagline: "Charming plaza town at the crossroads of three premier AVAs", grapes: ["Pinot Noir", "Zinfandel", "Chardonnay"], notableWines: ["Ridge", "Seghesio", "Jordan"] },
    { name: "Sonoma", coords: [-122.46, 38.29], tagline: "Historic town plaza where California wine began — Buena Vista 1857", grapes: ["Pinot Noir", "Chardonnay"], notableWines: ["Buena Vista", "Hanzell", "Ravenswood"] },
    { name: "Sebastopol", coords: [-122.82, 38.40], tagline: "Cool-climate Sonoma Coast — foggy mornings perfect for Pinot and Chardonnay", grapes: ["Pinot Noir", "Chardonnay"], notableWines: ["Littorai", "Freeman", "Iron Horse"] },
    { name: "Glen Ellen", coords: [-122.53, 38.36], tagline: "Jack London's 'Valley of the Moon' — rustic charm and old-vine Zinfandel", grapes: ["Zinfandel", "Cabernet Sauvignon"], notableWines: ["Benziger", "B.R. Cohn", "Laurel Glen"] },
  ],
  "Willamette Valley": [
    { name: "Dundee", coords: [-123.01, 45.28], tagline: "Red volcanic Jory soil — Oregon's original Pinot Noir heartland", grapes: ["Pinot Noir"], notableWines: ["Domaine Drouhin", "Domaine Serene", "Archery Summit"] },
    { name: "McMinnville", coords: [-123.20, 45.21], tagline: "Basalt-bedded foothills producing structured, age-worthy Pinot Noir", grapes: ["Pinot Noir"], notableWines: ["Eyrie Vineyards", "Antica Terra", "Maysara"] },
    { name: "Carlton", coords: [-123.18, 45.29], tagline: "Small-town tasting rooms with some of Oregon's most sought-after Pinots", grapes: ["Pinot Noir", "Pinot Gris"], notableWines: ["Ken Wright", "Penner-Ash", "Lemelson"] },
  ],
  "Mendoza": [
    { name: "Luján de Cuyo", coords: [-68.87, -33.04], tagline: "First region officially recognized for Malbec — high-altitude old vines", grapes: ["Malbec"], notableWines: ["Catena Zapata", "Achaval-Ferrer", "Luigi Bosca"] },
    { name: "Valle de Uco", coords: [-69.25, -33.63], tagline: "Andes foothills at 1200m+ altitude — Argentina's most exciting terroir", grapes: ["Malbec", "Cabernet Franc"], notableWines: ["Zuccardi", "Salentein", "Clos de los Siete"] },
    { name: "Maipú", coords: [-68.75, -32.94], tagline: "Historic wine district with olive groves — Mendoza's first vineyards", grapes: ["Malbec", "Bonarda"], notableWines: ["Trapiche", "Familia Zuccardi", "Norton"] },
  ],
  "Maipo Valley": [
    { name: "Santiago", coords: [-70.65, -33.45], tagline: "Capital city with world-class wineries just minutes from downtown", grapes: ["Cabernet Sauvignon"], notableWines: ["Concha y Toro Don Melchor", "Santa Rita", "Cousiño Macul"] },
    { name: "Buin", coords: [-70.74, -33.73], tagline: "Heart of Alto Maipo — Chile's finest Cabernet Sauvignon territory", grapes: ["Cabernet Sauvignon", "Carmenère"], notableWines: ["Almaviva", "Seña", "Santa Alicia"] },
    { name: "Pirque", coords: [-70.58, -33.64], tagline: "Andean-cooled vineyards producing elegant, complex Bordeaux-style blends", grapes: ["Cabernet Sauvignon", "Carmenère"], notableWines: ["Antiyal", "Haras de Pirque", "Viña Maipo"] },
  ],
  "Colchagua Valley": [
    { name: "Santa Cruz", coords: [-71.37, -34.64], tagline: "Wine country capital with Colchagua Museum and harvest festival", grapes: ["Carmenère", "Cabernet Sauvignon"], notableWines: ["Montes", "Casa Lapostolle", "MontGras"] },
    { name: "Marchigüe", coords: [-71.62, -34.39], tagline: "Coastal influence producing Chile's finest Syrah", grapes: ["Syrah", "Carmenère"], notableWines: ["Viña Vik", "Casa Silva", "Emiliana"] },
    { name: "Lolol", coords: [-71.64, -34.73], tagline: "Traditional village with dry-farmed old vines and emerging artisan wineries", grapes: ["Carignan", "País"], notableWines: ["Polkura", "Boya", "Viu Manent"] },
  ],
  "Barossa Valley": [
    { name: "Tanunda", coords: [138.96, -34.53], tagline: "German heritage town surrounded by 150-year-old Shiraz vines", grapes: ["Shiraz"], notableWines: ["Penfolds", "Henschke", "Peter Lehmann"] },
    { name: "Angaston", coords: [139.05, -34.50], tagline: "Eastern ridge with cooler sites — Yalumba's historic home since 1849", grapes: ["Shiraz", "Viognier"], notableWines: ["Yalumba", "Saltram", "Mountadam"] },
    { name: "Nuriootpa", coords: [138.99, -34.48], tagline: "Valley floor hub with iconic Australian wineries and cellar doors", grapes: ["Shiraz", "Grenache"], notableWines: ["Penfolds Grange", "Torbreck", "Kaesler"] },
  ],
  "Margaret River": [
    { name: "Margaret River", coords: [115.04, -33.95], tagline: "Surf town surrounded by premium estates — Australia's Bordeaux", grapes: ["Cabernet Sauvignon", "Chardonnay"], notableWines: ["Leeuwin Estate", "Cullen", "Vasse Felix"] },
    { name: "Yallingup", coords: [115.03, -33.65], tagline: "Northern Margaret River with limestone caves and maritime-influenced vines", grapes: ["Cabernet Sauvignon", "Sauvignon Blanc"], notableWines: ["Cape Mentelle", "Windance", "Amelia Park"] },
    { name: "Cowaramup", coords: [115.09, -33.85], tagline: "Cow statue-lined streets and a cluster of boutique family wineries", grapes: ["Cabernet Sauvignon", "Shiraz"], notableWines: ["Voyager Estate", "Brookland Valley", "Howard Park"] },
  ],
  "Marlborough": [
    { name: "Blenheim", coords: [173.96, -41.51], tagline: "Sunny wine capital — the epicenter of New Zealand Sauvignon Blanc", grapes: ["Sauvignon Blanc"], notableWines: ["Cloudy Bay", "Villa Maria", "Brancott Estate"] },
    { name: "Renwick", coords: [173.83, -41.50], tagline: "Wairau Valley sub-region with intense, citrus-driven Sauvignon Blanc", grapes: ["Sauvignon Blanc", "Pinot Noir"], notableWines: ["Greywacke", "Framingham", "Allan Scott"] },
    { name: "Seddon", coords: [174.07, -41.66], tagline: "Awatere Valley — windswept, cooler climate producing herbaceous, mineral wines", grapes: ["Sauvignon Blanc", "Pinot Gris"], notableWines: ["Yealands", "Vavasour", "Nautilus"] },
  ],
  "Stellenbosch": [
    { name: "Stellenbosch", coords: [18.86, -33.93], tagline: "University town with Cape Dutch architecture and 200+ wine estates", grapes: ["Cabernet Sauvignon", "Pinotage"], notableWines: ["Kanonkop", "Rust en Vrede", "Meerlust"] },
    { name: "Franschhoek", coords: [19.12, -33.91], tagline: "French Huguenot valley — South Africa's culinary and wine capital", grapes: ["Chenin Blanc", "Semillon", "Syrah"], notableWines: ["Boekenhoutskloof", "La Motte", "Mullineux"] },
    { name: "Paarl", coords: [18.97, -33.73], tagline: "Granite domes and warm slopes — home to KWV and Fairview", grapes: ["Shiraz", "Chenin Blanc"], notableWines: ["Fairview", "Glen Carlou", "Nederburg"] },
  ],
};

type WineRegionMapProps = {
  onRegionClick?: (region: string, country: string) => void;
  regionCounts?: Record<string, number>;
  height?: string;
  className?: string;
  exploreRegion?: string | null;
  /** Fly to specific coordinates (city hopping) */
  flyToCoords?: [number, number] | null;
  /** Trigger a cinematic tour of a region's sub-cities */
  tourRegion?: string | null;
  /** Called when tour ends */
  onTourEnd?: () => void;
  /** Toggle satellite imagery view */
  satellite?: boolean;
  /** Called with current tour stop info (null = in-flight between stops) */
  onTourStop?: (stop: TourStop | null) => void;
  /** Expose the internal Mapbox map instance to parent */
  mapRef?: React.RefObject<mapboxgl.Map | null>;
  /** Winery data for map markers — falls back to mockWineries if not provided */
  wineries?: MockWinery[];
};

const STYLE_STANDARD = "mapbox://styles/mapbox/standard";
const STYLE_SATELLITE = "mapbox://styles/mapbox/standard-satellite";

/** Get sub-cities for a region */
export function getRegionCities(region: string) {
  return REGION_SUB_CITIES[region] ?? [];
}

/* City centers for each region */
export const REGION_CITIES: Record<string, [number, number]> = {
  "Bordeaux": [-0.58, 44.84], "Burgundy": [4.84, 47.02], "Champagne": [3.96, 49.25],
  "Rhone Valley": [4.83, 44.93], "Loire Valley": [0.69, 47.38], "Alsace": [7.35, 48.08],
  "Provence": [5.93, 43.53], "Piedmont": [7.68, 44.69], "Tuscany": [11.25, 43.77],
  "Veneto": [11.87, 45.44], "Sicily": [13.36, 37.60], "Rioja": [-2.73, 42.47],
  "Ribera del Duero": [-3.69, 41.63], "Priorat": [0.75, 41.20], "Douro Valley": [-7.79, 41.16],
  "Alentejo": [-7.91, 38.57], "Mosel": [6.63, 49.73], "Rheingau": [8.06, 50.01],
  "Napa Valley": [-122.31, 38.50], "Sonoma": [-122.72, 38.44], "Willamette Valley": [-123.09, 45.07],
  "Mendoza": [-68.83, -32.89], "Maipo Valley": [-70.60, -33.73], "Colchagua Valley": [-71.22, -34.66],
  "Barossa Valley": [138.95, -34.56], "Margaret River": [115.04, -33.95],
  "Marlborough": [173.95, -41.51], "Stellenbosch": [18.86, -33.93],
};

export function WineRegionMap({ onRegionClick, regionCounts, height = "100%", className = "", exploreRegion, flyToCoords, tourRegion, onTourEnd, satellite = false, onTourStop, mapRef, wineries: wineriesProp }: WineRegionMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const popup = useRef<mapboxgl.Popup | null>(null);
  const mapLoaded = useRef(false);
  const exploreRegionRef = useRef(exploreRegion);
  const tourAbort = useRef<AbortController | null>(null);
  const isMobileRef = useRef(false);

  // Refs for values used inside map event closures
  const onRegionClickRef = useRef(onRegionClick);
  onRegionClickRef.current = onRegionClick;
  const regionCountsRef = useRef(regionCounts);
  regionCountsRef.current = regionCounts;
  const onTourEndRef = useRef(onTourEnd);
  onTourEndRef.current = onTourEnd;
  const onTourStopRef = useRef(onTourStop);
  onTourStopRef.current = onTourStop;

  // City hopping — only flyTo, don't touch region visibility
  useEffect(() => {
    if (!flyToCoords || !map.current || !mapLoaded.current) return;
    map.current.flyTo({ center: flyToCoords, zoom: 13, pitch: 50, duration: 1200 });
  }, [flyToCoords]);

  // ── Cinematic tour ──
  const runTour = useCallback(async (regionName: string, signal: AbortSignal) => {
    if (!map.current || !mapLoaded.current) return;
    const cities = REGION_SUB_CITIES[regionName];
    if (!cities || cities.length === 0) return;

    // Zoom out to overview first
    const regionCenter = REGION_CITIES[regionName] ?? cities[0].coords;
    onTourStopRef.current?.(null); // in-flight
    await flyAndWait(map.current, { center: regionCenter, zoom: 10, pitch: 60, bearing: -20, duration: 2500 }, signal);

    // Sweep through each sub-city
    for (let i = 0; i < cities.length; i++) {
      if (signal.aborted) break;
      const city = cities[i];
      const bearing = -20 + (i * 40); // Rotate camera as we hop
      onTourStopRef.current?.(null); // in-flight
      await flyAndWait(map.current!, {
        center: city.coords,
        zoom: 14,
        pitch: 60,
        bearing,
        duration: 3500,
        essential: true,
      }, signal);
      if (signal.aborted) break;
      // Show info card after camera settles
      onTourStopRef.current?.(city);
      // Dwell — enough time to read the card
      await delay(5500, signal);
    }

    // Clear card before returning to overview
    onTourStopRef.current?.(null);

    // Return to region overview
    if (!signal.aborted && map.current) {
      await flyAndWait(map.current, { center: regionCenter, zoom: 11, pitch: 45, bearing: 0, duration: 2500 }, signal);
    }

    onTourStopRef.current?.(null);
    onTourEndRef.current?.();
  }, []);

  useEffect(() => {
    if (!tourRegion) {
      tourAbort.current?.abort();
      tourAbort.current = null;
      return;
    }
    // Cancel any running tour
    tourAbort.current?.abort();
    const ctrl = new AbortController();
    tourAbort.current = ctrl;
    runTour(tourRegion, ctrl.signal);
    return () => ctrl.abort();
  }, [tourRegion, runTour]);

  // ── Add custom layers (called on initial load AND after style swap) ──
  function addCustomLayers(m: mapboxgl.Map) {
    // Wine region polygons (bottom slot — below roads & buildings)
    if (!m.getSource("wine-regions")) {
      m.addSource("wine-regions", {
        type: "geojson",
        data: wineRegions as GeoJSON.FeatureCollection,
      });
    }

    if (!m.getLayer("wine-regions-fill")) {
      m.addLayer({
        id: "wine-regions-fill", type: "fill", slot: "middle", source: "wine-regions",
        paint: {
          "fill-color": ["get", "color"],
          "fill-opacity": ["case", ["boolean", ["feature-state", "hover"], false], 0.55, 0.35],
          "fill-emissive-strength": 1.0,
        },
      } as mapboxgl.LayerSpecification);
    }

    if (!m.getLayer("wine-regions-border")) {
      m.addLayer({
        id: "wine-regions-border", type: "line", slot: "middle", source: "wine-regions",
        paint: {
          "line-color": ["get", "color"],
          "line-width": ["case", ["boolean", ["feature-state", "hover"], false], 3, 2],
          "line-opacity": 0.85, "line-emissive-strength": 1.0,
        },
      } as mapboxgl.LayerSpecification);
    }

    if (!m.getLayer("wine-regions-label")) {
      m.addLayer({
        id: "wine-regions-label", type: "symbol", slot: "top", source: "wine-regions",
        layout: {
          "text-field": ["get", "name"],
          "text-size": ["interpolate", ["linear"], ["zoom"], 3, 11, 5, 14, 8, 17],
          "text-font": ["DIN Pro Bold", "Arial Unicode MS Bold"],
          "text-allow-overlap": false,
        },
        paint: {
          "text-color": "#74070E",
          "text-opacity": ["interpolate", ["linear"], ["zoom"], 3, 0.8, 5, 1.0],
          "text-halo-color": "#FFFFFF", "text-halo-width": 2.5, "text-emissive-strength": 1.0,
        },
      } as mapboxgl.LayerSpecification);
    }

    // Wine sub-city labels — our own city names from REGION_SUB_CITIES
    if (!m.getSource("wine-subcities")) {
      const subcityFeatures: GeoJSON.Feature[] = [];
      for (const [, cities] of Object.entries(REGION_SUB_CITIES)) {
        for (const city of cities) {
          subcityFeatures.push({
            type: "Feature",
            properties: { name: city.name },
            geometry: { type: "Point", coordinates: city.coords },
          });
        }
      }
      m.addSource("wine-subcities", {
        type: "geojson",
        data: { type: "FeatureCollection", features: subcityFeatures },
      });
    }

    if (!m.getLayer("wine-subcity-label")) {
      m.addLayer({
        id: "wine-subcity-label", type: "symbol", slot: "top", source: "wine-subcities",
        minzoom: 9,
        layout: {
          "text-field": ["get", "name"],
          "text-size": ["interpolate", ["linear"], ["zoom"], 9, 10, 12, 13, 14, 15],
          "text-font": ["DIN Pro Medium", "Arial Unicode MS Regular"],
          "text-allow-overlap": false,
          "text-padding": 8,
        },
        paint: {
          "text-color": "#3A3025",
          "text-opacity": ["interpolate", ["linear"], ["zoom"], 9, 0.5, 11, 0.8, 13, 1],
          "text-halo-color": "#FFFFFF",
          "text-halo-width": 2,
          "text-emissive-strength": 1.0,
        },
      } as mapboxgl.LayerSpecification);
    }

    // Add our own streets vector source — Standard's "composite" doesn't reliably
    // expose poi_label for custom layers. We add mapbox-streets-v8 explicitly.
    if (!m.getSource("wb-streets")) {
      m.addSource("wb-streets", {
        type: "vector",
        url: "mapbox://mapbox.mapbox-streets-v8",
      });
    }

    // POI layers (top slot — must be above Standard's buildings/roads to be visible)
    const poiDefs: { id: string; cls: string; color: string; rank: number }[] = [
      { id: "poi-food", cls: "food_and_drink", color: "#A08060", rank: 3 },
      { id: "poi-hotel", cls: "lodging", color: "#7A7A50", rank: 3 },
      { id: "poi-shops", cls: "food_and_drink_stores", color: "#8C7E6E", rank: 3 },
    ];
    const labelDefs: { id: string; cls: string; color: string; rank: number }[] = [
      { id: "poi-food-label", cls: "food_and_drink", color: "#8A7060", rank: 2 },
      { id: "poi-hotel-label", cls: "lodging", color: "#6A6A45", rank: 2 },
    ];

    for (const d of poiDefs) {
      if (m.getLayer(d.id)) continue;
      m.addLayer({
        id: d.id, type: "circle", slot: "top", source: "wb-streets", "source-layer": "poi_label",
        filter: ["all", ["==", ["get", "class"], d.cls], ["<=", ["get", "filterrank"], d.rank]],
        minzoom: 10,
        paint: {
          "circle-color": d.color,
          "circle-radius": ["interpolate", ["linear"], ["zoom"], 10, 2, 12, 4, 14, 6, 16, 8],
          "circle-opacity": ["interpolate", ["linear"], ["zoom"], 10, 0.3, 12, 0.45, 14, 0.6],
          "circle-stroke-color": "#FFFFFF",
          "circle-stroke-width": ["interpolate", ["linear"], ["zoom"], 10, 0.5, 12, 1, 14, 1.5],
          "circle-stroke-opacity": 0.6,
          "circle-emissive-strength": 0.5,
        },
      } as mapboxgl.LayerSpecification);
    }

    for (const d of labelDefs) {
      if (m.getLayer(d.id)) continue;
      m.addLayer({
        id: d.id, type: "symbol", slot: "top", source: "wb-streets", "source-layer": "poi_label",
        filter: ["all", ["==", ["get", "class"], d.cls], ["<=", ["get", "filterrank"], d.rank]],
        minzoom: 13,
        layout: {
          "text-field": ["get", "name"],
          "text-size": ["interpolate", ["linear"], ["zoom"], 13, 9, 15, 12],
          "text-font": ["DIN Pro Medium", "Arial Unicode MS Regular"],
          "text-offset": [0, 1.2], "text-anchor": "top", "text-allow-overlap": false,
        },
        paint: {
          "text-color": d.color,
          "text-opacity": ["interpolate", ["linear"], ["zoom"], 13, 0.4, 15, 0.7],
          "text-halo-color": "#FFFFFF", "text-halo-width": 1.5, "text-emissive-strength": 0.5,
        },
      } as mapboxgl.LayerSpecification);
    }

    // Restore region visibility state
    if (exploreRegionRef.current) {
      setRegionVisibility(false);
    }
  }

  useEffect(() => {
    if (!mapContainer.current || !MAPBOX_TOKEN) return;

    mapboxgl.accessToken = MAPBOX_TOKEN;

    isMobileRef.current = window.matchMedia("(max-width: 1024px)").matches || navigator.maxTouchPoints > 0;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: STYLE_STANDARD,
      config: {
        basemap: {
          lightPreset: "dawn",
          showPointOfInterestLabels: false,  // We render our own wine-relevant POIs
          showRoadLabels: false,             // Remove road number clutter
          showPlaceLabels: false,            // Hide default city labels — we add our own wine-region cities
          showTransitLabels: false,
        },
      } as Record<string, Record<string, unknown>>,
      center: [12, 44],
      zoom: 3.5,
      minZoom: 1.5,
      maxZoom: 17,
      attributionControl: false,
      pitch: 30,
    });

    popup.current = new mapboxgl.Popup({
      closeButton: true,
      closeOnClick: true,
      offset: 12,
      maxWidth: "320px",
      className: "wb-popup",
    });

    // Re-add custom layers after every style swap (Standard <-> Satellite)
    map.current.on("style.load", () => {
      if (!map.current) return;

      // Add terrain (desktop only)
      if (!isMobileRef.current && !map.current.getSource("mapbox-dem")) {
        try {
          map.current.addSource("mapbox-dem", {
            type: "raster-dem",
            url: "mapbox://mapbox.mapbox-terrain-dem-v1",
            tileSize: 512,
            maxzoom: 14,
          });
          map.current.setTerrain({ source: "mapbox-dem", exaggeration: 1.5 });
        } catch { /* terrain not supported */ }
      }

      addCustomLayers(map.current);
      mapLoaded.current = true;
    });

    map.current.on("load", () => {
      if (!map.current) return;
      mapLoaded.current = true;

      // Expose map instance to parent via mapRef
      if (mapRef) {
        (mapRef as React.MutableRefObject<mapboxgl.Map | null>).current = map.current;
      }

      let hoveredId: string | number | null = null;

      map.current.on("mousemove", "wine-regions-fill", (e) => {
        if (!map.current || !e.features?.length) return;
        map.current.getCanvas().style.cursor = "pointer";

        const newId = e.features[0].id ?? null;

        if (newId !== hoveredId) {
          if (hoveredId !== null) {
            map.current.setFeatureState({ source: "wine-regions", id: hoveredId }, { hover: false });
          }
          hoveredId = newId;
          if (hoveredId !== null) {
            map.current.setFeatureState({ source: "wine-regions", id: hoveredId }, { hover: true });
          }

          const props = e.features[0].properties;
          if (props && popup.current && map.current) {
            const count = regionCountsRef.current?.[props.name] ?? 0;
            popup.current
              .setHTML(`
                <div style="font-family:system-ui,sans-serif">
                  <p style="font-size:13px;font-weight:700;color:#1A1412;margin:0">${props.name}</p>
                  <p style="font-size:10px;color:#8C7E6E;margin:2px 0 0">${props.country} · ${props.grapes}</p>
                  ${count > 0 ? `<p style="font-size:11px;font-weight:600;color:#74070E;margin:3px 0 0">${count} wines</p>` : ""}
                </div>
              `)
              .addTo(map.current);
          }
        }

        popup.current?.setLngLat(e.lngLat);
      });

      map.current.on("mouseleave", "wine-regions-fill", () => {
        if (!map.current) return;
        map.current.getCanvas().style.cursor = "";
        if (hoveredId !== null) {
          map.current.setFeatureState({ source: "wine-regions", id: hoveredId }, { hover: false });
        }
        hoveredId = null;
        popup.current?.remove();
      });

      map.current.on("click", "wine-regions-fill", (e) => {
        if (!e.features?.length) return;
        const props = e.features[0].properties;
        if (props) onRegionClickRef.current?.(props.name, props.country);
      });

      // ── Winery markers (from DB or mock fallback) ──
      const wineryData = wineriesProp ?? mockWineries;
      const wineryGeoJSON: GeoJSON.FeatureCollection = {
        type: "FeatureCollection",
        features: wineryData.map((w, i) => ({
          type: "Feature" as const,
          id: i,
          properties: {
            name: w.name, slug: w.slug, description: w.description,
            region: w.region, country: w.country, featured: w.featured, founded: w.founded,
            owner: w.owner, grapeVarieties: JSON.stringify(w.grapeVarieties),
            wineStyles: JSON.stringify(w.wineStyles), vineyardSize: w.vineyardSize,
            annualBottles: w.annualBottles,
          },
          geometry: { type: "Point" as const, coordinates: [w.lng, w.lat] },
        })),
      };

      map.current.addSource("wineries", { type: "geojson", data: wineryGeoJSON });

      // Featured wineries — gold, large and prominent (hero markers)
      map.current.addLayer({
        id: "wineries-featured",
        type: "circle",
        source: "wineries",
        filter: ["==", ["get", "featured"], true],
        minzoom: 4,
        paint: {
          "circle-color": "#C8A255",
          "circle-radius": ["interpolate", ["linear"], ["zoom"], 4, 5, 7, 10, 10, 15, 13, 20],
          "circle-opacity": ["interpolate", ["linear"], ["zoom"], 4, 0.7, 7, 0.9, 10, 1],
          "circle-stroke-color": "#74070E",
          "circle-stroke-width": ["interpolate", ["linear"], ["zoom"], 4, 1.5, 10, 2.5, 13, 3],
          "circle-stroke-opacity": 0.9,
        },
      });

      // Regular wineries — cherry, medium sized
      map.current.addLayer({
        id: "wineries-regular",
        type: "circle",
        source: "wineries",
        filter: ["==", ["get", "featured"], false],
        minzoom: 6,
        paint: {
          "circle-color": "#74070E",
          "circle-radius": ["interpolate", ["linear"], ["zoom"], 6, 4, 9, 8, 12, 14],
          "circle-opacity": ["interpolate", ["linear"], ["zoom"], 6, 0.6, 9, 0.85, 12, 1],
          "circle-stroke-color": "#FFFFFF",
          "circle-stroke-width": ["interpolate", ["linear"], ["zoom"], 6, 1, 10, 2, 13, 2.5],
          "circle-stroke-opacity": 0.9,
        },
      });

      // Winery labels — more prominent, visible earlier
      map.current.addLayer({
        id: "wineries-label",
        type: "symbol",
        source: "wineries",
        minzoom: 7,
        layout: {
          "text-field": ["get", "name"],
          "text-size": ["interpolate", ["linear"], ["zoom"], 7, 10, 10, 13, 13, 15],
          "text-font": ["DIN Pro Bold", "Arial Unicode MS Bold"],
          "text-offset": [0, 1.5],
          "text-anchor": "top",
          "text-allow-overlap": false,
        },
        paint: {
          "text-color": ["case", ["==", ["get", "featured"], true], "#6B5010", "#4A1A08"],
          "text-opacity": ["interpolate", ["linear"], ["zoom"], 7, 0.6, 9, 0.85, 11, 1],
          "text-halo-color": "#FFFFFF",
          "text-halo-width": 2,
          "text-emissive-strength": 1.0,
        },
      });

      // Winery click — compact wine-label card
      for (const layerId of ["wineries-featured", "wineries-regular"]) {
        map.current.on("mouseenter", layerId, () => { if (map.current) map.current.getCanvas().style.cursor = "pointer"; });
        map.current.on("mouseleave", layerId, () => { if (map.current) map.current.getCanvas().style.cursor = ""; });
        map.current.on("click", layerId, (e) => {
          if (!map.current || !e.features?.length) return;
          const p = e.features[0].properties as Record<string, any>;
          const isFeatured = p.featured === true || p.featured === "true";

          let grapes: string[] = [];
          let styles: string[] = [];
          try { grapes = JSON.parse(p.grapeVarieties || "[]"); } catch {}
          try { styles = JSON.parse(p.wineStyles || "[]"); } catch {}

          const styleColorMap: Record<string, string> = {
            red: "#74070E", white: "#C8A255", rosé: "#C47080",
            sparkling: "#B8A840", orange: "#C87840", fortified: "#8B4513",
          };

          // Style dots inline
          const styleDots = styles.map((s: string) =>
            `<span style="width:8px;height:8px;border-radius:50%;background:${styleColorMap[s] || '#8C7E6E'};display:inline-block" title="${s}"></span>`
          ).join("");

          // Grape pills inline (max 3)
          const grapePills = grapes.slice(0, 3).map((g: string) =>
            `<span style="padding:1px 6px;border-radius:4px;background:#F5F0E8;color:#5A4A30;font-size:9px;font-weight:600;white-space:nowrap">${g}</span>`
          ).join("");

          const bottles = p.annualBottles ? `${(p.annualBottles / 1000).toFixed(0)}k btl/yr` : "";
          const vineyard = p.vineyardSize && p.vineyardSize !== "N/A" && p.vineyardSize !== "Multiple" ? p.vineyardSize : "";
          const meta = [p.founded ? `Est. ${p.founded}` : "", vineyard, bottles].filter(Boolean).join(" · ");

          // Truncate description to ~80 chars
          const desc = p.description ? (p.description.length > 90 ? p.description.slice(0, 87) + "..." : p.description) : "";

          const searchName = encodeURIComponent(p.name);
          const accentColor = isFeatured ? "#C8A255" : "#74070E";

          popup.current
            ?.setLngLat(e.lngLat)
            .setHTML(`
              <div style="font-family:system-ui,-apple-system,sans-serif;width:260px;display:flex;gap:0;overflow:hidden">
                <div style="width:4px;flex-shrink:0;background:${accentColor};border-radius:2px 0 0 2px"></div>
                <div style="flex:1;padding:2px 0 0 12px;min-width:0">
                  <div style="display:flex;align-items:center;gap:6px;margin-bottom:2px">
                    <p style="font-size:15px;font-weight:800;color:#1A1412;margin:0;font-family:Georgia,serif;line-height:1.2;flex:1;min-width:0">${p.name}</p>
                    ${isFeatured ? `<span style="font-size:12px;flex-shrink:0" title="Featured">★</span>` : ""}
                    <div style="display:flex;gap:3px;flex-shrink:0">${styleDots}</div>
                  </div>
                  <p style="font-size:10px;color:#8C7E6E;margin:0 0 6px;line-height:1.3">${meta}</p>
                  ${desc ? `<p style="font-size:11px;color:#5A4A30;margin:0 0 8px;line-height:1.4">${desc}</p>` : ""}
                  <div style="display:flex;align-items:center;justify-content:space-between;gap:6px">
                    <div style="display:flex;gap:3px;flex-wrap:wrap;flex:1;min-width:0">${grapePills}</div>
                    <a href="/producers/${p.slug || ''}" style="flex-shrink:0;font-size:10px;font-weight:700;color:${accentColor};text-decoration:none;padding:4px 10px;border-radius:6px;background:${accentColor}12;white-space:nowrap">View wines →</a>
                  </div>
                </div>
              </div>
            `)
            .addTo(map.current!);
        });
      }

      // ── POI interactions ──
      const poiLayers = ["poi-food", "poi-hotel", "poi-shops"];

      const poiMeta: Record<string, { icon: string; label: string; accent: string }> = {
        "poi-food":  { icon: "🍽️", label: "Restaurant", accent: "#74070E" },
        "poi-hotel": { icon: "🏨", label: "Hotel",      accent: "#C8A255" },
        "poi-shops": { icon: "🍷", label: "Wine Shop",  accent: "#8B5A4A" },
      };

      for (const layerId of poiLayers) {
        map.current.on("mouseenter", layerId, () => {
          if (map.current) map.current.getCanvas().style.cursor = "pointer";
        });
        map.current.on("mouseleave", layerId, () => {
          if (map.current) map.current.getCanvas().style.cursor = "";
          popup.current?.remove();
        });

        map.current.on("click", layerId, (e) => {
          if (!map.current || !e.features?.length) return;
          const p = e.features[0].properties as Record<string, string>;
          const name = p?.name ?? "Unknown";
          const cat = p?.category_en ?? p?.type ?? p?.class ?? "";
          const meta = poiMeta[layerId];
          const address = p?.address ?? "";

          popup.current
            ?.setLngLat(e.lngLat)
            .setHTML(`
              <div style="font-family:system-ui,sans-serif;min-width:160px">
                <div style="display:flex;align-items:center;gap:6px;margin-bottom:4px">
                  <span style="font-size:16px">${meta.icon}</span>
                  <div>
                    <p style="font-size:13px;font-weight:700;color:#1A1412;margin:0">${name}</p>
                    <p style="font-size:10px;color:${meta.accent};font-weight:600;margin:1px 0 0">${cat || meta.label}</p>
                  </div>
                </div>
                ${address ? `<p style="font-size:10px;color:#8C7E6E;margin:4px 0 0;border-top:1px solid #F0E8D8;padding-top:4px">${address}</p>` : ""}
              </div>
            `)
            .addTo(map.current!);
        });
      }
    });

    return () => { popup.current?.remove(); tourAbort.current?.abort(); map.current?.remove(); map.current = null; mapLoaded.current = false; if (mapRef) { (mapRef as React.MutableRefObject<mapboxgl.Map | null>).current = null; } };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Satellite toggle: swap style, layers re-added via style.load handler ──
  const prevSatRef = useRef(satellite);
  useEffect(() => {
    if (!map.current || satellite === prevSatRef.current) return;
    prevSatRef.current = satellite;
    map.current.setStyle(satellite ? STYLE_SATELLITE : STYLE_STANDARD);
  }, [satellite]);

  /* Helper: hide or show region layers */
  function setRegionVisibility(visible: boolean) {
    if (!map.current || !mapLoaded.current) return;
    try {
      map.current.setPaintProperty("wine-regions-fill", "fill-opacity", visible ? ["case", ["boolean", ["feature-state", "hover"], false], 0.55, 0.35] : 0);
      map.current.setLayoutProperty("wine-regions-fill", "visibility", visible ? "visible" : "none");
      map.current.setPaintProperty("wine-regions-border", "line-opacity", visible ? 0.85 : 0);
      map.current.setLayoutProperty("wine-regions-border", "visibility", visible ? "visible" : "none");
      map.current.setLayoutProperty("wine-regions-label", "visibility", visible ? "visible" : "none");
    } catch {}
  }

  // Explore region: fly + hide polygons
  const prevExploreRef = useRef<string | null | undefined>(null);
  exploreRegionRef.current = exploreRegion;
  useEffect(() => {
    if (!map.current || !mapLoaded.current) return;
    if (exploreRegion === prevExploreRef.current) return;
    prevExploreRef.current = exploreRegion;

    if (!exploreRegion) {
      setRegionVisibility(true);
      map.current.flyTo({ center: [12, 44], zoom: 3.5, pitch: 30, bearing: 0, duration: 1200 });
      return;
    }

    setRegionVisibility(false);

    const subCities = REGION_SUB_CITIES[exploreRegion];
    const firstCity = subCities?.[0]?.coords;
    const regionCity = REGION_CITIES[exploreRegion];
    const target = firstCity ?? regionCity;

    if (target) {
      map.current.flyTo({ center: target, zoom: 13, pitch: 50, duration: 2000, essential: true });
    } else {
      const feature = wineRegions.features.find((f) => f.properties.name === exploreRegion);
      if (feature) {
        const coords = feature.geometry.coordinates[0];
        let sumLng = 0, sumLat = 0;
        for (const [lng, lat] of coords) { sumLng += lng; sumLat += lat; }
        map.current.flyTo({ center: [sumLng / coords.length, sumLat / coords.length], zoom: 12, pitch: 50, duration: 2000, essential: true });
      }
    }
  }, [exploreRegion]);

  // ── Fallback without token ──
  if (!MAPBOX_TOKEN) {
    const regions = wineRegions.features.map((f) => f.properties);
    return (
      <div className={`bg-[#1C1A16] flex flex-col items-center justify-center ${className}`} style={{ height }}>
        <p style={{ color: "#8A7E6A", fontSize: 12, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 16 }}>
          Wine Regions of the World
        </p>
        <div className="flex flex-wrap justify-center gap-2 px-6 max-w-lg">
          {regions.map((r) => (
            <button
              key={r.name}
              onClick={() => onRegionClick?.(r.name, r.country)}
              className="px-3 py-1.5 rounded-[8px] text-[11px] font-semibold active:scale-95 transition-transform"
              style={{ background: `${r.color}30`, color: `${r.color}`, border: `1px solid ${r.color}40` }}
            >
              {r.name}
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <>
      <style>{`
        .wb-popup .mapboxgl-popup-content {
          background: #FFFFFF;
          border-radius: 12px;
          padding: 14px 16px;
          box-shadow: 0 4px 20px rgba(0,0,0,0.12);
          border: 1px solid rgba(0,0,0,0.06);
        }
        .wb-popup .mapboxgl-popup-close-button {
          font-size: 18px;
          color: #8C7E6E;
          padding: 4px 8px;
          right: 4px;
          top: 4px;
        }
        .wb-popup .mapboxgl-popup-close-button:hover { color: #1A1412; }
        .wb-popup .mapboxgl-popup-tip { border-top-color: #FFFFFF; }
        .mapboxgl-ctrl { display: none !important; }
      `}</style>
      <div ref={mapContainer} className={className} style={{ height }} />
    </>
  );
}

// ── Helpers for cinematic tours ──

/** Promisified flyTo that resolves when animation ends */
function flyAndWait(m: mapboxgl.Map, opts: Parameters<mapboxgl.Map["flyTo"]>[0], signal: AbortSignal): Promise<void> {
  return new Promise((resolve) => {
    if (signal.aborted) { resolve(); return; }
    const onAbort = () => { m.stop(); resolve(); };
    signal.addEventListener("abort", onAbort, { once: true });
    m.once("moveend", () => {
      signal.removeEventListener("abort", onAbort);
      resolve();
    });
    m.flyTo(opts);
  });
}

/** Abortable delay */
function delay(ms: number, signal: AbortSignal): Promise<void> {
  return new Promise((resolve) => {
    if (signal.aborted) { resolve(); return; }
    const timer = setTimeout(resolve, ms);
    signal.addEventListener("abort", () => { clearTimeout(timer); resolve(); }, { once: true });
  });
}
