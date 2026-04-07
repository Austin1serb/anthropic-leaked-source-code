export type WineRegionFeature = {
  type: "Feature";
  properties: {
    name: string;
    country: string;
    grapes: string;
    wineCount: number;
    color: string;
  };
  geometry: {
    type: "Polygon";
    coordinates: number[][][];
  };
};

export type WineRegionCollection = {
  type: "FeatureCollection";
  features: WineRegionFeature[];
};

export const wineRegions: WineRegionCollection = {
  type: "FeatureCollection",
  features: [
    // =====================
    // FRANCE
    // =====================
    {
      type: "Feature",
      properties: {
        name: "Bordeaux",
        country: "France",
        grapes: "Cabernet Sauvignon, Merlot, Cabernet Franc, Petit Verdot, Malbec",
        wineCount: 0,
        color: "#74070E",
      },
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [-1.2, 44.5],
            [-0.1, 44.5],
            [-0.1, 45.3],
            [-0.6, 45.6],
            [-1.2, 45.3],
            [-1.2, 44.5],
          ],
        ],
      },
    },
    {
      type: "Feature",
      properties: {
        name: "Burgundy",
        country: "France",
        grapes: "Pinot Noir, Chardonnay, Gamay, Aligote",
        wineCount: 0,
        color: "#74070E",
      },
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [4.2, 46.0],
            [4.9, 46.0],
            [4.9, 47.4],
            [4.5, 47.5],
            [4.2, 47.2],
            [4.2, 46.0],
          ],
        ],
      },
    },
    {
      type: "Feature",
      properties: {
        name: "Champagne",
        country: "France",
        grapes: "Chardonnay, Pinot Noir, Pinot Meunier",
        wineCount: 0,
        color: "#74070E",
      },
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [3.3, 48.8],
            [4.3, 48.8],
            [4.3, 49.4],
            [3.8, 49.5],
            [3.3, 49.3],
            [3.3, 48.8],
          ],
        ],
      },
    },
    {
      type: "Feature",
      properties: {
        name: "Rhone Valley",
        country: "France",
        grapes: "Syrah, Grenache, Mourvedre, Viognier, Marsanne",
        wineCount: 0,
        color: "#74070E",
      },
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [4.4, 43.7],
            [5.0, 43.7],
            [5.0, 45.5],
            [4.7, 45.6],
            [4.4, 45.4],
            [4.4, 43.7],
          ],
        ],
      },
    },
    {
      type: "Feature",
      properties: {
        name: "Loire Valley",
        country: "France",
        grapes: "Sauvignon Blanc, Chenin Blanc, Cabernet Franc, Melon de Bourgogne",
        wineCount: 0,
        color: "#74070E",
      },
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [-1.5, 47.0],
            [2.5, 47.0],
            [2.5, 47.6],
            [1.0, 47.8],
            [-1.5, 47.5],
            [-1.5, 47.0],
          ],
        ],
      },
    },
    {
      type: "Feature",
      properties: {
        name: "Alsace",
        country: "France",
        grapes: "Riesling, Gewurztraminer, Pinot Gris, Muscat, Pinot Blanc",
        wineCount: 0,
        color: "#74070E",
      },
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [7.1, 47.9],
            [7.6, 47.9],
            [7.6, 48.9],
            [7.4, 49.0],
            [7.1, 48.8],
            [7.1, 47.9],
          ],
        ],
      },
    },
    {
      type: "Feature",
      properties: {
        name: "Provence",
        country: "France",
        grapes: "Grenache, Syrah, Mourvedre, Cinsault, Rolle",
        wineCount: 0,
        color: "#74070E",
      },
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [5.5, 43.2],
            [6.8, 43.2],
            [6.8, 43.8],
            [6.2, 43.9],
            [5.5, 43.7],
            [5.5, 43.2],
          ],
        ],
      },
    },

    // =====================
    // ITALY
    // =====================
    {
      type: "Feature",
      properties: {
        name: "Piedmont",
        country: "Italy",
        grapes: "Nebbiolo, Barbera, Dolcetto, Moscato, Arneis",
        wineCount: 0,
        color: "#8B1A22",
      },
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [7.5, 44.3],
            [8.8, 44.3],
            [8.8, 45.2],
            [8.2, 45.5],
            [7.5, 45.2],
            [7.5, 44.3],
          ],
        ],
      },
    },
    {
      type: "Feature",
      properties: {
        name: "Tuscany",
        country: "Italy",
        grapes: "Sangiovese, Cabernet Sauvignon, Merlot, Vernaccia, Trebbiano",
        wineCount: 0,
        color: "#8B1A22",
      },
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [10.5, 42.4],
            [12.2, 42.4],
            [12.2, 43.8],
            [11.4, 44.0],
            [10.5, 43.6],
            [10.5, 42.4],
          ],
        ],
      },
    },
    {
      type: "Feature",
      properties: {
        name: "Veneto",
        country: "Italy",
        grapes: "Corvina, Garganega, Glera, Rondinella, Pinot Grigio",
        wineCount: 0,
        color: "#8B1A22",
      },
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [10.8, 45.0],
            [12.5, 45.0],
            [12.5, 46.0],
            [11.8, 46.3],
            [10.8, 46.0],
            [10.8, 45.0],
          ],
        ],
      },
    },
    {
      type: "Feature",
      properties: {
        name: "Sicily",
        country: "Italy",
        grapes: "Nero d'Avola, Nerello Mascalese, Grillo, Catarratto, Carricante",
        wineCount: 0,
        color: "#8B1A22",
      },
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [12.4, 36.6],
            [15.7, 36.6],
            [15.7, 38.3],
            [14.0, 38.4],
            [12.4, 37.8],
            [12.4, 36.6],
          ],
        ],
      },
    },

    // =====================
    // SPAIN
    // =====================
    {
      type: "Feature",
      properties: {
        name: "Rioja",
        country: "Spain",
        grapes: "Tempranillo, Garnacha, Graciano, Mazuelo, Viura",
        wineCount: 0,
        color: "#A03030",
      },
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [-3.1, 42.2],
            [-1.8, 42.2],
            [-1.8, 42.7],
            [-2.3, 42.8],
            [-3.1, 42.6],
            [-3.1, 42.2],
          ],
        ],
      },
    },
    {
      type: "Feature",
      properties: {
        name: "Ribera del Duero",
        country: "Spain",
        grapes: "Tempranillo, Cabernet Sauvignon, Merlot, Malbec",
        wineCount: 0,
        color: "#A03030",
      },
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [-4.3, 41.4],
            [-3.2, 41.4],
            [-3.2, 41.9],
            [-3.6, 42.0],
            [-4.3, 41.8],
            [-4.3, 41.4],
          ],
        ],
      },
    },
    {
      type: "Feature",
      properties: {
        name: "Priorat",
        country: "Spain",
        grapes: "Garnacha, Carinena, Cabernet Sauvignon, Syrah, Merlot",
        wineCount: 0,
        color: "#A03030",
      },
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [0.6, 41.1],
            [0.95, 41.1],
            [0.95, 41.35],
            [0.8, 41.4],
            [0.6, 41.3],
            [0.6, 41.1],
          ],
        ],
      },
    },

    // =====================
    // PORTUGAL
    // =====================
    {
      type: "Feature",
      properties: {
        name: "Douro Valley",
        country: "Portugal",
        grapes: "Touriga Nacional, Touriga Franca, Tinta Roriz, Tinta Barroca, Tinta Cao",
        wineCount: 0,
        color: "#704020",
      },
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [-7.9, 41.0],
            [-6.8, 41.0],
            [-6.8, 41.5],
            [-7.3, 41.6],
            [-7.9, 41.4],
            [-7.9, 41.0],
          ],
        ],
      },
    },
    {
      type: "Feature",
      properties: {
        name: "Alentejo",
        country: "Portugal",
        grapes: "Aragonez, Trincadeira, Alicante Bouschet, Antao Vaz",
        wineCount: 0,
        color: "#704020",
      },
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [-8.4, 37.8],
            [-7.2, 37.8],
            [-7.2, 39.0],
            [-7.8, 39.2],
            [-8.4, 38.8],
            [-8.4, 37.8],
          ],
        ],
      },
    },

    // =====================
    // GERMANY
    // =====================
    {
      type: "Feature",
      properties: {
        name: "Mosel",
        country: "Germany",
        grapes: "Riesling, Muller-Thurgau, Elbling, Pinot Blanc",
        wineCount: 0,
        color: "#506030",
      },
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [6.5, 49.4],
            [7.2, 49.4],
            [7.2, 50.2],
            [6.9, 50.4],
            [6.5, 50.1],
            [6.5, 49.4],
          ],
        ],
      },
    },
    {
      type: "Feature",
      properties: {
        name: "Rheingau",
        country: "Germany",
        grapes: "Riesling, Spatburgunder (Pinot Noir)",
        wineCount: 0,
        color: "#506030",
      },
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [7.8, 49.9],
            [8.2, 49.9],
            [8.2, 50.15],
            [8.05, 50.2],
            [7.8, 50.1],
            [7.8, 49.9],
          ],
        ],
      },
    },

    // =====================
    // USA
    // =====================
    {
      type: "Feature",
      properties: {
        name: "Napa Valley",
        country: "USA",
        grapes: "Cabernet Sauvignon, Merlot, Chardonnay, Pinot Noir, Sauvignon Blanc",
        wineCount: 0,
        color: "#305080",
      },
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [-122.6, 38.2],
            [-122.2, 38.2],
            [-122.2, 38.7],
            [-122.35, 38.75],
            [-122.6, 38.6],
            [-122.6, 38.2],
          ],
        ],
      },
    },
    {
      type: "Feature",
      properties: {
        name: "Sonoma",
        country: "USA",
        grapes: "Pinot Noir, Chardonnay, Cabernet Sauvignon, Zinfandel, Sauvignon Blanc",
        wineCount: 0,
        color: "#305080",
      },
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [-123.2, 38.2],
            [-122.6, 38.2],
            [-122.6, 38.85],
            [-122.9, 38.9],
            [-123.2, 38.7],
            [-123.2, 38.2],
          ],
        ],
      },
    },
    {
      type: "Feature",
      properties: {
        name: "Willamette Valley",
        country: "USA",
        grapes: "Pinot Noir, Pinot Gris, Chardonnay, Riesling",
        wineCount: 0,
        color: "#305080",
      },
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [-123.6, 44.8],
            [-122.5, 44.8],
            [-122.5, 45.6],
            [-123.0, 45.7],
            [-123.6, 45.4],
            [-123.6, 44.8],
          ],
        ],
      },
    },

    // =====================
    // ARGENTINA
    // =====================
    {
      type: "Feature",
      properties: {
        name: "Mendoza",
        country: "Argentina",
        grapes: "Malbec, Cabernet Sauvignon, Bonarda, Torrontes, Chardonnay",
        wineCount: 0,
        color: "#604080",
      },
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [-69.5, -34.5],
            [-67.5, -34.5],
            [-67.5, -32.5],
            [-68.3, -32.0],
            [-69.5, -32.8],
            [-69.5, -34.5],
          ],
        ],
      },
    },

    // =====================
    // CHILE
    // =====================
    {
      type: "Feature",
      properties: {
        name: "Maipo Valley",
        country: "Chile",
        grapes: "Cabernet Sauvignon, Merlot, Carmenere, Syrah",
        wineCount: 0,
        color: "#604080",
      },
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [-71.3, -34.0],
            [-70.4, -34.0],
            [-70.4, -33.3],
            [-70.8, -33.2],
            [-71.3, -33.5],
            [-71.3, -34.0],
          ],
        ],
      },
    },
    {
      type: "Feature",
      properties: {
        name: "Colchagua Valley",
        country: "Chile",
        grapes: "Carmenere, Cabernet Sauvignon, Syrah, Malbec, Merlot",
        wineCount: 0,
        color: "#604080",
      },
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [-71.8, -34.8],
            [-70.8, -34.8],
            [-70.8, -34.3],
            [-71.2, -34.2],
            [-71.8, -34.4],
            [-71.8, -34.8],
          ],
        ],
      },
    },

    // =====================
    // AUSTRALIA
    // =====================
    {
      type: "Feature",
      properties: {
        name: "Barossa Valley",
        country: "Australia",
        grapes: "Shiraz, Cabernet Sauvignon, Grenache, Riesling, Semillon",
        wineCount: 0,
        color: "#806030",
      },
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [138.5, -34.8],
            [139.1, -34.8],
            [139.1, -34.3],
            [138.85, -34.2],
            [138.5, -34.4],
            [138.5, -34.8],
          ],
        ],
      },
    },
    {
      type: "Feature",
      properties: {
        name: "Margaret River",
        country: "Australia",
        grapes: "Cabernet Sauvignon, Chardonnay, Sauvignon Blanc, Semillon, Merlot",
        wineCount: 0,
        color: "#806030",
      },
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [114.9, -34.2],
            [115.5, -34.2],
            [115.5, -33.5],
            [115.2, -33.4],
            [114.9, -33.7],
            [114.9, -34.2],
          ],
        ],
      },
    },

    // =====================
    // NEW ZEALAND
    // =====================
    {
      type: "Feature",
      properties: {
        name: "Marlborough",
        country: "New Zealand",
        grapes: "Sauvignon Blanc, Pinot Noir, Chardonnay, Pinot Gris, Riesling",
        wineCount: 0,
        color: "#308050",
      },
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [173.4, -41.8],
            [174.2, -41.8],
            [174.2, -41.2],
            [173.8, -41.1],
            [173.4, -41.4],
            [173.4, -41.8],
          ],
        ],
      },
    },

    // =====================
    // SOUTH AFRICA
    // =====================
    {
      type: "Feature",
      properties: {
        name: "Stellenbosch",
        country: "South Africa",
        grapes: "Cabernet Sauvignon, Pinotage, Merlot, Shiraz, Chenin Blanc",
        wineCount: 0,
        color: "#805030",
      },
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [18.7, -34.1],
            [19.1, -34.1],
            [19.1, -33.8],
            [18.95, -33.75],
            [18.7, -33.85],
            [18.7, -34.1],
          ],
        ],
      },
    },
  ],
};
