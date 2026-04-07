"use client";

import { useEffect, useRef, useCallback } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { wineRegions } from "@/data/wineRegions";
import { mockWineries } from "@/data/mockWineries";

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN ?? "";

/** Sub-cities within each wine region for hopping */
const REGION_SUB_CITIES: Record<string, { name: string; coords: [number, number] }[]> = {
  "Bordeaux": [
    { name: "Saint-Émilion", coords: [-0.15, 44.89] },
    { name: "Pauillac", coords: [-0.75, 45.20] },
    { name: "Margaux", coords: [-0.67, 45.04] },
    { name: "Sauternes", coords: [-0.35, 44.53] },
    { name: "Pessac-Léognan", coords: [-0.68, 44.77] },
  ],
  "Burgundy": [
    { name: "Beaune", coords: [4.84, 47.02] },
    { name: "Nuits-Saint-Georges", coords: [4.95, 47.14] },
    { name: "Chablis", coords: [3.80, 47.81] },
    { name: "Meursault", coords: [4.77, 46.98] },
    { name: "Gevrey-Chambertin", coords: [4.97, 47.23] },
  ],
  "Champagne": [
    { name: "Reims", coords: [3.88, 49.25] },
    { name: "Épernay", coords: [3.95, 49.04] },
    { name: "Ay", coords: [3.99, 49.06] },
  ],
  "Tuscany": [
    { name: "Montalcino", coords: [11.49, 43.06] },
    { name: "Montepulciano", coords: [11.78, 43.10] },
    { name: "Chianti", coords: [11.25, 43.47] },
    { name: "Bolgheri", coords: [10.61, 43.23] },
    { name: "San Gimignano", coords: [11.04, 43.47] },
  ],
  "Piedmont": [
    { name: "Barolo", coords: [7.94, 44.61] },
    { name: "Barbaresco", coords: [8.08, 44.73] },
    { name: "Asti", coords: [8.21, 44.90] },
    { name: "Alba", coords: [8.03, 44.70] },
  ],
  "Rioja": [
    { name: "Haro", coords: [-2.85, 42.58] },
    { name: "Logroño", coords: [-2.45, 42.47] },
    { name: "Laguardia", coords: [-2.58, 42.55] },
  ],
  "Napa Valley": [
    { name: "St. Helena", coords: [-122.47, 38.51] },
    { name: "Yountville", coords: [-122.36, 38.40] },
    { name: "Calistoga", coords: [-122.58, 38.58] },
    { name: "Rutherford", coords: [-122.42, 38.46] },
  ],
  "Douro Valley": [
    { name: "Pinhão", coords: [-7.55, 41.19] },
    { name: "Peso da Régua", coords: [-7.79, 41.16] },
  ],
  "Mosel": [
    { name: "Bernkastel-Kues", coords: [7.07, 49.92] },
    { name: "Piesport", coords: [6.92, 49.88] },
    { name: "Trittenheim", coords: [6.90, 49.83] },
  ],
};

type WineRegionMapProps = {
  onRegionClick?: (region: string, country: string) => void;
  onCityClick?: (city: string, coords: [number, number]) => void;
  regionCounts?: Record<string, number>;
  height?: string;
  className?: string;
  exploreRegion?: string | null;
  /** Fly to specific coordinates (city hopping) */
  flyToCoords?: [number, number] | null;
};

/** Get sub-cities for a region */
export function getRegionCities(region: string) {
  return REGION_SUB_CITIES[region] ?? [];
}

export function WineRegionMap({ onRegionClick, onCityClick, regionCounts, height = "100%", className = "", exploreRegion, flyToCoords }: WineRegionMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const popup = useRef<mapboxgl.Popup | null>(null);
  const mapLoaded = useRef(false);

  // City hopping — only flyTo, don't touch region visibility
  useEffect(() => {
    if (!flyToCoords || !map.current || !mapLoaded.current) return;
    map.current.flyTo({ center: flyToCoords, zoom: 13, pitch: 30, duration: 1200 });
  }, [flyToCoords]);

  const handleRegionClick = useCallback((region: string, country: string) => {
    onRegionClick?.(region, country);
  }, [onRegionClick]);

  useEffect(() => {
    if (!mapContainer.current || !MAPBOX_TOKEN) return;

    mapboxgl.accessToken = MAPBOX_TOKEN;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: {
        version: 8,
        name: "Winebob",
        glyphs: "mapbox://fonts/mapbox/{fontstack}/{range}.pbf",
        sources: {
          "mapbox-streets": { type: "vector", url: "mapbox://mapbox.mapbox-streets-v8" },
          "mapbox-dem": { type: "raster-dem", url: "mapbox://mapbox.mapbox-terrain-dem-v1", tileSize: 512, maxzoom: 14 },
        },
        layers: [
          // Background — warm butter
          { id: "bg", type: "background", paint: { "background-color": "#F0E4CC" } },
          // Water — soft blue
          { id: "water", type: "fill", source: "mapbox-streets", "source-layer": "water", paint: { "fill-color": "#C0D0E0" } },
          // Land use (parks, forests etc) — soft greens
          { id: "landuse", type: "fill", source: "mapbox-streets", "source-layer": "landuse", paint: { "fill-color": ["match", ["get", "class"], "park", "#D8E4C8", "agriculture", "#E4DCC4", "wood", "#C8D8B8", "#E8DCC8"], "fill-opacity": 0.5 } },
          // Buildings — subtle cream
          { id: "buildings", type: "fill", source: "mapbox-streets", "source-layer": "building", minzoom: 12, paint: { "fill-color": "#E0D4BC", "fill-opacity": 0.6 } },
          // Roads — tertiary
          { id: "roads-tertiary", type: "line", source: "mapbox-streets", "source-layer": "road", filter: ["in", "class", "street", "street_limited"], minzoom: 10, paint: { "line-color": "#E8DCC4", "line-width": 0.5 } },
          // Roads — secondary
          { id: "roads-secondary", type: "line", source: "mapbox-streets", "source-layer": "road", filter: ["in", "class", "secondary", "tertiary"], minzoom: 8, paint: { "line-color": "#DCD0B8", "line-width": 0.8 } },
          // Roads — primary
          { id: "roads-primary", type: "line", source: "mapbox-streets", "source-layer": "road", filter: ["in", "class", "primary", "trunk"], paint: { "line-color": "#D0C4A8", "line-width": ["interpolate", ["linear"], ["zoom"], 5, 0.5, 10, 1.5] } },
          // Roads — motorway
          { id: "roads-motorway", type: "line", source: "mapbox-streets", "source-layer": "road", filter: ["==", "class", "motorway"], paint: { "line-color": "#C4B898", "line-width": ["interpolate", ["linear"], ["zoom"], 5, 0.8, 10, 2] } },
          // Admin boundaries
          { id: "admin-0", type: "line", source: "mapbox-streets", "source-layer": "admin", filter: ["==", "admin_level", 0], paint: { "line-color": "#B8A888", "line-width": 0.8, "line-opacity": 0.4 } },
          { id: "admin-1", type: "line", source: "mapbox-streets", "source-layer": "admin", filter: ["==", "admin_level", 1], minzoom: 4, paint: { "line-color": "#C8B898", "line-width": 0.4, "line-opacity": 0.3, "line-dasharray": [3, 2] } },
          // Place labels — countries
          { id: "labels-country", type: "symbol", source: "mapbox-streets", "source-layer": "place_label", filter: ["==", "class", "country"], layout: { "text-field": ["get", "name_en"], "text-size": ["interpolate", ["linear"], ["zoom"], 2, 10, 5, 13], "text-transform": "uppercase", "text-letter-spacing": 0.15, "text-font": ["DIN Pro Medium", "Arial Unicode MS Regular"] }, paint: { "text-color": "#8C7E6E", "text-opacity": 0.6 } },
          // Place labels — cities
          { id: "labels-city", type: "symbol", source: "mapbox-streets", "source-layer": "place_label", filter: ["in", "class", "city"], layout: { "text-field": ["get", "name_en"], "text-size": ["interpolate", ["linear"], ["zoom"], 4, 9, 8, 13], "text-font": ["DIN Pro Regular", "Arial Unicode MS Regular"] }, paint: { "text-color": "#6B5A40", "text-opacity": 0.6, "text-halo-color": "#F0E4CC", "text-halo-width": 1.5 } },
          // Place labels — towns
          { id: "labels-town", type: "symbol", source: "mapbox-streets", "source-layer": "place_label", filter: ["in", "class", "town", "village"], minzoom: 8, layout: { "text-field": ["get", "name_en"], "text-size": 10, "text-font": ["DIN Pro Regular", "Arial Unicode MS Regular"] }, paint: { "text-color": "#8C7E6E", "text-opacity": 0.5, "text-halo-color": "#F0E4CC", "text-halo-width": 1.5 } },

          // ── POI: Restaurants, bars, cafes (food_and_drink) ──
          { id: "poi-food", type: "circle", source: "mapbox-streets", "source-layer": "poi_label",
            filter: ["all",
              ["==", ["get", "class"], "food_and_drink"],
              ["<=", ["get", "filterrank"], 3],
            ],
            minzoom: 8,
            paint: {
              "circle-color": "#74070E",
              "circle-radius": ["interpolate", ["linear"], ["zoom"], 8, 1.5, 10, 3, 12, 5, 14, 7],
              "circle-opacity": ["interpolate", ["linear"], ["zoom"], 8, 0.3, 10, 0.6, 12, 0.8],
              "circle-stroke-color": "#F0E8D8",
              "circle-stroke-width": ["interpolate", ["linear"], ["zoom"], 8, 0, 10, 0.5, 12, 1],
              "circle-stroke-opacity": 0.3,
            },
          },
          // Food labels
          { id: "poi-food-label", type: "symbol", source: "mapbox-streets", "source-layer": "poi_label",
            filter: ["all",
              ["==", ["get", "class"], "food_and_drink"],
              ["<=", ["get", "filterrank"], 2],
            ],
            minzoom: 11,
            layout: {
              "text-field": ["get", "name"],
              "text-size": ["interpolate", ["linear"], ["zoom"], 11, 9, 14, 12],
              "text-font": ["DIN Pro Regular", "Arial Unicode MS Regular"],
              "text-offset": [0, 1.2],
              "text-anchor": "top",
              "text-allow-overlap": false,
            },
            paint: {
              "text-color": "#C8A080",
              "text-opacity": 0.7,
              "text-halo-color": "#110E0A",
              "text-halo-width": 1,
            },
          },

          // ── POI: Hotels & lodging ──
          { id: "poi-hotel", type: "circle", source: "mapbox-streets", "source-layer": "poi_label",
            filter: ["all",
              ["==", ["get", "class"], "lodging"],
              ["<=", ["get", "filterrank"], 3],
            ],
            minzoom: 8,
            paint: {
              "circle-color": "#C8A255",
              "circle-radius": ["interpolate", ["linear"], ["zoom"], 8, 1.5, 10, 3, 12, 5, 14, 7],
              "circle-opacity": ["interpolate", ["linear"], ["zoom"], 8, 0.3, 10, 0.5, 12, 0.7],
              "circle-stroke-color": "#F0E8D8",
              "circle-stroke-width": ["interpolate", ["linear"], ["zoom"], 8, 0, 10, 0.5, 12, 1],
              "circle-stroke-opacity": 0.2,
            },
          },
          // Hotel labels
          { id: "poi-hotel-label", type: "symbol", source: "mapbox-streets", "source-layer": "poi_label",
            filter: ["all",
              ["==", ["get", "class"], "lodging"],
              ["<=", ["get", "filterrank"], 2],
            ],
            minzoom: 11,
            layout: {
              "text-field": ["get", "name"],
              "text-size": ["interpolate", ["linear"], ["zoom"], 11, 8, 14, 11],
              "text-font": ["DIN Pro Regular", "Arial Unicode MS Regular"],
              "text-offset": [0, 1.2],
              "text-anchor": "top",
              "text-allow-overlap": false,
            },
            paint: {
              "text-color": "#A08850",
              "text-opacity": 0.5,
              "text-halo-color": "#110E0A",
              "text-halo-width": 1,
            },
          },

          // ── POI: Food & drink shops (wine shops, etc) ──
          { id: "poi-shops", type: "circle", source: "mapbox-streets", "source-layer": "poi_label",
            filter: ["all",
              ["==", ["get", "class"], "food_and_drink_stores"],
              ["<=", ["get", "filterrank"], 3],
            ],
            minzoom: 9,
            paint: {
              "circle-color": "#8B5A4A",
              "circle-radius": ["interpolate", ["linear"], ["zoom"], 9, 1.5, 12, 4, 14, 6],
              "circle-opacity": ["interpolate", ["linear"], ["zoom"], 9, 0.3, 12, 0.6],
              "circle-stroke-color": "#F0E8D8",
              "circle-stroke-width": 0.5,
              "circle-stroke-opacity": 0.2,
            },
          },
        ],
      } as mapboxgl.StyleSpecification,
      center: [12, 44],
      zoom: 3.5,
      minZoom: 1.5,
      maxZoom: 14,
      attributionControl: false,
      pitch: 30,
    });

    popup.current = new mapboxgl.Popup({
      closeButton: false,
      closeOnClick: false,
      offset: 8,
      className: "wb-popup",
    });

    // Enable 3D terrain after style loads (avoids createBucket error)
    map.current.on("style.load", () => {
      if (!map.current) return;
      try { map.current.setTerrain({ source: "mapbox-dem", exaggeration: 1.5 }); } catch { /* terrain not supported */ }
    });

    map.current.on("load", () => {
      if (!map.current) return;
      mapLoaded.current = true;

      // Add wine region polygons
      map.current.addSource("wine-regions", {
        type: "geojson",
        data: wineRegions as GeoJSON.FeatureCollection,
      });

      // Fill
      map.current.addLayer({
        id: "wine-regions-fill",
        type: "fill",
        source: "wine-regions",
        paint: {
          "fill-color": ["get", "color"],
          "fill-opacity": ["case", ["boolean", ["feature-state", "hover"], false], 0.45, 0.2],
        },
      });

      // Border
      map.current.addLayer({
        id: "wine-regions-border",
        type: "line",
        source: "wine-regions",
        paint: {
          "line-color": ["get", "color"],
          "line-width": ["case", ["boolean", ["feature-state", "hover"], false], 2, 1],
          "line-opacity": 0.6,
        },
      });

      // Labels
      map.current.addLayer({
        id: "wine-regions-label",
        type: "symbol",
        source: "wine-regions",
        layout: {
          "text-field": ["get", "name"],
          "text-size": ["interpolate", ["linear"], ["zoom"], 3, 8, 6, 12, 8, 14],
          "text-font": ["DIN Pro Medium", "Arial Unicode MS Regular"],
          "text-allow-overlap": false,
        },
        paint: {
          "text-color": "#74070E",
          "text-opacity": ["interpolate", ["linear"], ["zoom"], 3, 0.5, 5, 0.8],
          "text-halo-color": "#F0E4CC",
          "text-halo-width": 1.5,
        },
      });

      let hoveredId: string | number | null = null;

      map.current.on("mousemove", "wine-regions-fill", (e) => {
        if (!map.current || !e.features?.length) return;
        map.current.getCanvas().style.cursor = "pointer";

        if (hoveredId !== null) {
          map.current.setFeatureState({ source: "wine-regions", id: hoveredId }, { hover: false });
        }
        hoveredId = e.features[0].id ?? null;
        if (hoveredId !== null) {
          map.current.setFeatureState({ source: "wine-regions", id: hoveredId }, { hover: true });
        }

        const props = e.features[0].properties;
        if (props && popup.current && map.current) {
          const count = regionCounts?.[props.name] ?? 0;
          popup.current
            .setLngLat(e.lngLat)
            .setHTML(`
              <div style="font-family:system-ui,sans-serif">
                <p style="font-size:13px;font-weight:700;color:#1A1412;margin:0">${props.name}</p>
                <p style="font-size:10px;color:#8C7E6E;margin:2px 0 0">${props.country} · ${props.grapes}</p>
                ${count > 0 ? `<p style="font-size:11px;font-weight:600;color:#74070E;margin:3px 0 0">${count} wines</p>` : ""}
              </div>
            `)
            .addTo(map.current);
        }
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
        if (props) handleRegionClick(props.name, props.country);
      });

      // ── Winery markers (from mock data) ──
      const wineryGeoJSON: GeoJSON.FeatureCollection = {
        type: "FeatureCollection",
        features: mockWineries.map((w, i) => ({
          type: "Feature" as const,
          id: i,
          properties: { name: w.name, slug: w.slug, description: w.description, region: w.region, country: w.country, featured: w.featured, founded: w.founded },
          geometry: { type: "Point" as const, coordinates: [w.lng, w.lat] },
        })),
      };

      map.current.addSource("wineries", { type: "geojson", data: wineryGeoJSON });

      // Featured wineries — gold, larger
      map.current.addLayer({
        id: "wineries-featured",
        type: "circle",
        source: "wineries",
        filter: ["==", ["get", "featured"], true],
        minzoom: 5,
        paint: {
          "circle-color": "#C8A255",
          "circle-radius": ["interpolate", ["linear"], ["zoom"], 5, 4, 8, 7, 12, 10],
          "circle-opacity": ["interpolate", ["linear"], ["zoom"], 5, 0.6, 8, 0.9],
          "circle-stroke-color": "#FFFFFF",
          "circle-stroke-width": ["interpolate", ["linear"], ["zoom"], 5, 1, 12, 2],
          "circle-stroke-opacity": 0.8,
        },
      });

      // Regular wineries — cherry, smaller
      map.current.addLayer({
        id: "wineries-regular",
        type: "circle",
        source: "wineries",
        filter: ["==", ["get", "featured"], false],
        minzoom: 7,
        paint: {
          "circle-color": "#74070E",
          "circle-radius": ["interpolate", ["linear"], ["zoom"], 7, 3, 12, 6],
          "circle-opacity": ["interpolate", ["linear"], ["zoom"], 7, 0.4, 10, 0.7],
          "circle-stroke-color": "#FFFFFF",
          "circle-stroke-width": 1,
          "circle-stroke-opacity": 0.5,
        },
      });

      // Winery labels
      map.current.addLayer({
        id: "wineries-label",
        type: "symbol",
        source: "wineries",
        minzoom: 8,
        layout: {
          "text-field": ["get", "name"],
          "text-size": ["interpolate", ["linear"], ["zoom"], 8, 9, 12, 12],
          "text-font": ["DIN Pro Medium", "Arial Unicode MS Regular"],
          "text-offset": [0, 1.5],
          "text-anchor": "top",
          "text-allow-overlap": false,
        },
        paint: {
          "text-color": ["case", ["==", ["get", "featured"], true], "#8B6A20", "#5A3020"],
          "text-opacity": ["interpolate", ["linear"], ["zoom"], 8, 0.5, 10, 0.8],
          "text-halo-color": "#F0E4CC",
          "text-halo-width": 1.5,
        },
      });

      // Winery click
      for (const layerId of ["wineries-featured", "wineries-regular"]) {
        map.current.on("mouseenter", layerId, () => { if (map.current) map.current.getCanvas().style.cursor = "pointer"; });
        map.current.on("mouseleave", layerId, () => { if (map.current) map.current.getCanvas().style.cursor = ""; popup.current?.remove(); });
        map.current.on("click", layerId, (e) => {
          if (!map.current || !e.features?.length) return;
          const p = e.features[0].properties as Record<string, any>;
          const isFeatured = p.featured === true || p.featured === "true";
          popup.current
            ?.setLngLat(e.lngLat)
            .setHTML(`
              <div style="font-family:system-ui,sans-serif;max-width:220px">
                <div style="display:flex;align-items:center;gap:6px;margin-bottom:4px">
                  <span style="font-size:14px">🏰</span>
                  <p style="font-size:14px;font-weight:700;color:#1A1412;margin:0">${p.name}</p>
                </div>
                <p style="font-size:10px;color:#8C7E6E;margin:0 0 4px">${p.region}, ${p.country}${p.founded ? ` · Est. ${p.founded}` : ""}</p>
                ${p.description ? `<p style="font-size:11px;color:#6B5A40;margin:0;line-height:1.4">${p.description}</p>` : ""}
                ${isFeatured ? `<p style="font-size:10px;font-weight:600;color:#C8A255;margin:4px 0 0">★ Featured Winery</p>` : ""}
              </div>
            `)
            .addTo(map.current!);
        });
      }

      // ── POI interactions ──
      const poiLayers = ["poi-winery", "poi-hotel"];

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
          const isWine = layerId === "poi-winery";

          popup.current
            ?.setLngLat(e.lngLat)
            .setHTML(`
              <div style="font-family:system-ui,sans-serif">
                <div style="display:flex;align-items:center;gap:6px;margin-bottom:2px">
                  <span style="font-size:14px">${isWine ? "🍷" : "🏨"}</span>
                  <p style="font-size:13px;font-weight:700;color:#1A1412;margin:0">${name}</p>
                </div>
                <p style="font-size:10px;color:#8C7E6E;margin:0">${cat}</p>
              </div>
            `)
            .addTo(map.current!);
        });
      }
    });

    return () => { popup.current?.remove(); map.current?.remove(); };
  }, [handleRegionClick, regionCounts]);

  /* City centers for each region — zooms to the main wine town, not the polygon center */
  const REGION_CITIES: Record<string, [number, number]> = {
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

  /* Helper: hide or show region layers */
  function setRegionVisibility(visible: boolean) {
    if (!map.current || !mapLoaded.current) return;
    try {
      map.current.setPaintProperty("wine-regions-fill", "fill-opacity", visible ? ["case", ["boolean", ["feature-state", "hover"], false], 0.45, 0.2] : 0);
      map.current.setPaintProperty("wine-regions-border", "line-opacity", visible ? 0.6 : 0);
      map.current.setLayoutProperty("wine-regions-label", "visibility", visible ? "visible" : "none");
    } catch {}
  }

  // Explore region: fly + hide polygons. Separate from flyToCoords.
  const prevExploreRef = useRef<string | null | undefined>(null);
  useEffect(() => {
    if (!map.current || !mapLoaded.current) return;
    // Skip if same region (prevents re-triggering)
    if (exploreRegion === prevExploreRef.current) return;
    prevExploreRef.current = exploreRegion;

    if (!exploreRegion) {
      setRegionVisibility(true);
      map.current.flyTo({ center: [12, 44], zoom: 3.5, pitch: 0, duration: 1200 });
      return;
    }

    setRegionVisibility(false);

    // Fly to first sub-city, or region city, or polygon center
    const subCities = REGION_SUB_CITIES[exploreRegion];
    const firstCity = subCities?.[0]?.coords;
    const regionCity = REGION_CITIES[exploreRegion];
    const target = firstCity ?? regionCity;

    if (target) {
      map.current.flyTo({ center: target, zoom: 13, pitch: 30, duration: 2000, essential: true });
    } else {
      const feature = wineRegions.features.find((f) => f.properties.name === exploreRegion);
      if (feature) {
        const coords = feature.geometry.coordinates[0];
        let sumLng = 0, sumLat = 0;
        for (const [lng, lat] of coords) { sumLng += lng; sumLat += lat; }
        map.current.flyTo({ center: [sumLng / coords.length, sumLat / coords.length], zoom: 12, pitch: 30, duration: 2000, essential: true });
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
              onClick={() => handleRegionClick(r.name, r.country)}
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
          padding: 10px 14px;
          box-shadow: 0 4px 20px rgba(0,0,0,0.12);
          border: 1px solid rgba(0,0,0,0.06);
        }
        .wb-popup .mapboxgl-popup-tip { border-top-color: #FFFFFF; }
        .mapboxgl-ctrl { display: none !important; }
      `}</style>
      <div ref={mapContainer} className={className} style={{ height }} />
    </>
  );
}
