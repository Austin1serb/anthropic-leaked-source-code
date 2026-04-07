"use client";

import { useEffect, useRef, useCallback } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { wineRegions } from "@/data/wineRegions";

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
};

const STYLE_STANDARD = "mapbox://styles/mapbox/standard";
const STYLE_SATELLITE = "mapbox://styles/mapbox/standard-satellite";

/** Get sub-cities for a region */
export function getRegionCities(region: string) {
  return REGION_SUB_CITIES[region] ?? [];
}

/* City centers for each region */
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

export function WineRegionMap({ onRegionClick, regionCounts, height = "100%", className = "", exploreRegion, flyToCoords, tourRegion, onTourEnd, satellite = false }: WineRegionMapProps) {
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
    await flyAndWait(map.current, { center: regionCenter, zoom: 10, pitch: 60, bearing: -20, duration: 2000 }, signal);

    // Sweep through each sub-city
    for (let i = 0; i < cities.length; i++) {
      if (signal.aborted) return;
      const city = cities[i];
      const bearing = -20 + (i * 40); // Rotate camera as we hop
      await flyAndWait(map.current!, {
        center: city.coords,
        zoom: 14,
        pitch: 60,
        bearing,
        duration: 2500,
        essential: true,
      }, signal);
      if (signal.aborted) return;
      // Pause at each city
      await delay(1500, signal);
    }

    // Return to region overview
    if (!signal.aborted && map.current) {
      await flyAndWait(map.current, { center: regionCenter, zoom: 11, pitch: 45, bearing: 0, duration: 2000 }, signal);
    }

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
        id: "wine-regions-fill", type: "fill", slot: "bottom", source: "wine-regions",
        paint: {
          "fill-color": ["get", "color"],
          "fill-opacity": ["case", ["boolean", ["feature-state", "hover"], false], 0.45, 0.25],
          "fill-emissive-strength": 0.8,
        },
      } as mapboxgl.LayerSpecification);
    }

    if (!m.getLayer("wine-regions-border")) {
      m.addLayer({
        id: "wine-regions-border", type: "line", slot: "bottom", source: "wine-regions",
        paint: {
          "line-color": ["get", "color"],
          "line-width": ["case", ["boolean", ["feature-state", "hover"], false], 2.5, 1.5],
          "line-opacity": 0.7, "line-emissive-strength": 0.8,
        },
      } as mapboxgl.LayerSpecification);
    }

    if (!m.getLayer("wine-regions-label")) {
      m.addLayer({
        id: "wine-regions-label", type: "symbol", slot: "top", source: "wine-regions",
        layout: {
          "text-field": ["get", "name"],
          "text-size": ["interpolate", ["linear"], ["zoom"], 3, 9, 6, 13, 8, 15],
          "text-font": ["DIN Pro Bold", "Arial Unicode MS Bold"],
          "text-allow-overlap": false,
        },
        paint: {
          "text-color": "#74070E",
          "text-opacity": ["interpolate", ["linear"], ["zoom"], 3, 0.6, 5, 0.9],
          "text-halo-color": "#FFFFFF", "text-halo-width": 2, "text-emissive-strength": 1.0,
        },
      } as mapboxgl.LayerSpecification);
    }

    // POI layers (middle slot — above roads, below labels)
    const poiDefs: { id: string; cls: string; color: string; rank: number }[] = [
      { id: "poi-food", cls: "food_and_drink", color: "#74070E", rank: 3 },
      { id: "poi-hotel", cls: "lodging", color: "#8B6914", rank: 3 },
      { id: "poi-shops", cls: "food_and_drink_stores", color: "#6B3A2A", rank: 3 },
    ];
    const labelDefs: { id: string; cls: string; color: string; rank: number }[] = [
      { id: "poi-food-label", cls: "food_and_drink", color: "#5A0408", rank: 2 },
      { id: "poi-hotel-label", cls: "lodging", color: "#6B5010", rank: 2 },
    ];

    for (const d of poiDefs) {
      if (m.getLayer(d.id)) continue;
      m.addLayer({
        id: d.id, type: "circle", slot: "middle", source: "composite", "source-layer": "poi_label",
        filter: ["all", ["==", ["get", "class"], d.cls], ["<=", ["get", "filterrank"], d.rank]],
        minzoom: 8,
        paint: {
          "circle-color": d.color,
          "circle-radius": ["interpolate", ["linear"], ["zoom"], 8, 3, 10, 5, 12, 7, 14, 9],
          "circle-opacity": ["interpolate", ["linear"], ["zoom"], 8, 0.6, 10, 0.85, 12, 1],
          "circle-stroke-color": "#FFFFFF",
          "circle-stroke-width": ["interpolate", ["linear"], ["zoom"], 8, 1, 10, 1.5, 12, 2],
          "circle-stroke-opacity": ["interpolate", ["linear"], ["zoom"], 8, 0.6, 10, 0.8, 12, 1],
          "circle-emissive-strength": 1.0,
        },
      } as mapboxgl.LayerSpecification);
    }

    for (const d of labelDefs) {
      if (m.getLayer(d.id)) continue;
      m.addLayer({
        id: d.id, type: "symbol", slot: "top", source: "composite", "source-layer": "poi_label",
        filter: ["all", ["==", ["get", "class"], d.cls], ["<=", ["get", "filterrank"], d.rank]],
        minzoom: 10,
        layout: {
          "text-field": ["get", "name"],
          "text-size": ["interpolate", ["linear"], ["zoom"], 10, 10, 14, 13],
          "text-font": ["DIN Pro Medium", "Arial Unicode MS Regular"],
          "text-offset": [0, 1.2], "text-anchor": "top", "text-allow-overlap": false,
        },
        paint: {
          "text-color": d.color,
          "text-opacity": ["interpolate", ["linear"], ["zoom"], 10, 0.7, 12, 1],
          "text-halo-color": "#FFFFFF", "text-halo-width": 1.5, "text-emissive-strength": 1.0,
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
          showPointOfInterestLabels: true,
          showRoadLabels: true,
          showPlaceLabels: true,
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
      closeButton: false,
      closeOnClick: true,
      offset: 8,
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

    return () => { popup.current?.remove(); tourAbort.current?.abort(); map.current?.remove(); map.current = null; mapLoaded.current = false; };
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
      map.current.setPaintProperty("wine-regions-fill", "fill-opacity", visible ? ["case", ["boolean", ["feature-state", "hover"], false], 0.45, 0.25] : 0);
      map.current.setLayoutProperty("wine-regions-fill", "visibility", visible ? "visible" : "none");
      map.current.setPaintProperty("wine-regions-border", "line-opacity", visible ? 0.7 : 0);
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
