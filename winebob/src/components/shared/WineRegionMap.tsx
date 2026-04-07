"use client";

import { useEffect, useRef, useCallback } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { wineRegions } from "@/data/wineRegions";

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN ?? "";

type WineRegionMapProps = {
  onRegionClick?: (region: string, country: string) => void;
  regionCounts?: Record<string, number>;
  height?: string;
  className?: string;
  /** When set, map flies to this region and zooms in */
  exploreRegion?: string | null;
};

export function WineRegionMap({ onRegionClick, regionCounts, height = "100%", className = "", exploreRegion }: WineRegionMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const popup = useRef<mapboxgl.Popup | null>(null);

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
          // Background
          { id: "bg", type: "background", paint: { "background-color": "#110E0A" } },
          // Water
          { id: "water", type: "fill", source: "mapbox-streets", "source-layer": "water", paint: { "fill-color": "#141C28" } },
          // Land use (parks, forests etc)
          { id: "landuse", type: "fill", source: "mapbox-streets", "source-layer": "landuse", paint: { "fill-color": ["match", ["get", "class"], "park", "#141A10", "agriculture", "#16140E", "wood", "#121610", "#12100C"], "fill-opacity": 0.5 } },
          // Buildings (subtle at zoom)
          { id: "buildings", type: "fill", source: "mapbox-streets", "source-layer": "building", minzoom: 12, paint: { "fill-color": "#1A1814", "fill-opacity": 0.6 } },
          // Roads — tertiary
          { id: "roads-tertiary", type: "line", source: "mapbox-streets", "source-layer": "road", filter: ["in", "class", "street", "street_limited"], minzoom: 10, paint: { "line-color": "#1E1A14", "line-width": 0.5 } },
          // Roads — secondary
          { id: "roads-secondary", type: "line", source: "mapbox-streets", "source-layer": "road", filter: ["in", "class", "secondary", "tertiary"], minzoom: 8, paint: { "line-color": "#221E16", "line-width": 0.8 } },
          // Roads — primary
          { id: "roads-primary", type: "line", source: "mapbox-streets", "source-layer": "road", filter: ["in", "class", "primary", "trunk"], paint: { "line-color": "#2A2418", "line-width": ["interpolate", ["linear"], ["zoom"], 5, 0.5, 10, 1.5] } },
          // Roads — motorway
          { id: "roads-motorway", type: "line", source: "mapbox-streets", "source-layer": "road", filter: ["==", "class", "motorway"], paint: { "line-color": "#302818", "line-width": ["interpolate", ["linear"], ["zoom"], 5, 0.8, 10, 2] } },
          // Admin boundaries
          { id: "admin-0", type: "line", source: "mapbox-streets", "source-layer": "admin", filter: ["==", "admin_level", 0], paint: { "line-color": "#3A3020", "line-width": 0.8, "line-opacity": 0.5 } },
          { id: "admin-1", type: "line", source: "mapbox-streets", "source-layer": "admin", filter: ["==", "admin_level", 1], minzoom: 4, paint: { "line-color": "#2A2418", "line-width": 0.4, "line-opacity": 0.3, "line-dasharray": [3, 2] } },
          // Place labels — countries
          { id: "labels-country", type: "symbol", source: "mapbox-streets", "source-layer": "place_label", filter: ["==", "class", "country"], layout: { "text-field": ["get", "name_en"], "text-size": ["interpolate", ["linear"], ["zoom"], 2, 10, 5, 13], "text-transform": "uppercase", "text-letter-spacing": 0.15, "text-font": ["DIN Pro Medium", "Arial Unicode MS Regular"] }, paint: { "text-color": "#5A4E3A", "text-opacity": 0.7 } },
          // Place labels — cities
          { id: "labels-city", type: "symbol", source: "mapbox-streets", "source-layer": "place_label", filter: ["in", "class", "city"], layout: { "text-field": ["get", "name_en"], "text-size": ["interpolate", ["linear"], ["zoom"], 4, 9, 8, 13], "text-font": ["DIN Pro Regular", "Arial Unicode MS Regular"] }, paint: { "text-color": "#4A4030", "text-opacity": 0.5, "text-halo-color": "#110E0A", "text-halo-width": 1 } },
          // Place labels — towns (at higher zoom)
          { id: "labels-town", type: "symbol", source: "mapbox-streets", "source-layer": "place_label", filter: ["in", "class", "town", "village"], minzoom: 8, layout: { "text-field": ["get", "name_en"], "text-size": 10, "text-font": ["DIN Pro Regular", "Arial Unicode MS Regular"] }, paint: { "text-color": "#3A3428", "text-opacity": 0.4, "text-halo-color": "#110E0A", "text-halo-width": 1 } },

          // ── POI: Wineries & wine bars (food_and_drink_stores, winery) ──
          { id: "poi-winery", type: "circle", source: "mapbox-streets", "source-layer": "poi_label",
            filter: ["any",
              ["in", "maki", "wine-bar", "bar", "restaurant"],
              ["in", "type", "Winery", "Wine Bar", "Vineyard"],
              ["in", "class", "food_and_drink"],
            ],
            minzoom: 9,
            paint: {
              "circle-color": "#74070E",
              "circle-radius": ["interpolate", ["linear"], ["zoom"], 9, 2, 12, 4, 14, 6],
              "circle-opacity": 0.7,
              "circle-stroke-color": "#F0E8D8",
              "circle-stroke-width": 0.5,
              "circle-stroke-opacity": 0.3,
            },
          },
          // POI labels for wineries
          { id: "poi-winery-label", type: "symbol", source: "mapbox-streets", "source-layer": "poi_label",
            filter: ["any",
              ["in", "maki", "wine-bar", "bar", "restaurant"],
              ["in", "type", "Winery", "Wine Bar", "Vineyard"],
              ["in", "class", "food_and_drink"],
            ],
            minzoom: 12,
            layout: {
              "text-field": ["get", "name"],
              "text-size": 10,
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
            filter: ["in", "class", "lodging"],
            minzoom: 11,
            paint: {
              "circle-color": "#C8A255",
              "circle-radius": ["interpolate", ["linear"], ["zoom"], 11, 2, 14, 5],
              "circle-opacity": 0.5,
              "circle-stroke-color": "#F0E8D8",
              "circle-stroke-width": 0.5,
              "circle-stroke-opacity": 0.2,
            },
          },
          // Hotel labels
          { id: "poi-hotel-label", type: "symbol", source: "mapbox-streets", "source-layer": "poi_label",
            filter: ["in", "class", "lodging"],
            minzoom: 13,
            layout: {
              "text-field": ["get", "name"],
              "text-size": 9,
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
          "text-color": "#E0D4C0",
          "text-opacity": ["interpolate", ["linear"], ["zoom"], 3, 0.5, 5, 0.8],
          "text-halo-color": "rgba(0,0,0,0.7)",
          "text-halo-width": 1.2,
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
                <p style="font-size:13px;font-weight:700;color:#F0E8D8;margin:0">${props.name}</p>
                <p style="font-size:10px;color:#8A7E6A;margin:2px 0 0">${props.country} · ${props.grapes}</p>
                ${count > 0 ? `<p style="font-size:11px;font-weight:600;color:#E8A08A;margin:3px 0 0">${count} wines</p>` : ""}
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
                  <p style="font-size:13px;font-weight:700;color:#F0E8D8;margin:0">${name}</p>
                </div>
                <p style="font-size:10px;color:#8A7E6A;margin:0">${cat}</p>
              </div>
            `)
            .addTo(map.current!);
        });
      }
    });

    return () => { popup.current?.remove(); map.current?.remove(); };
  }, [handleRegionClick, regionCounts]);

  // Fly to region or back to world
  useEffect(() => {
    if (!map.current) return;

    if (!exploreRegion) {
      // Fly back to world view
      map.current.flyTo({ center: [12, 44], zoom: 3.5, pitch: 0, duration: 1200 });
      return;
    }

    const feature = wineRegions.features.find((f) => f.properties.name === exploreRegion);
    if (!feature) return;

    // Compute bounding box from polygon coords
    const coords = feature.geometry.coordinates[0];
    let minLng = Infinity, maxLng = -Infinity, minLat = Infinity, maxLat = -Infinity;
    for (const [lng, lat] of coords) {
      if (lng < minLng) minLng = lng;
      if (lng > maxLng) maxLng = lng;
      if (lat < minLat) minLat = lat;
      if (lat > maxLat) maxLat = lat;
    }

    // Calculate center and fly to zoom 10 minimum (enough to see POIs)
    const centerLng = (minLng + maxLng) / 2;
    const centerLat = (minLat + maxLat) / 2;

    map.current.flyTo({
      center: [centerLng, centerLat],
      zoom: 10,
      pitch: 35,
      duration: 2000,
      essential: true,
    });
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
          background: rgba(20,18,14,0.92);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border-radius: 10px;
          padding: 8px 12px;
          box-shadow: 0 4px 16px rgba(0,0,0,0.3);
          border: 1px solid rgba(255,255,255,0.06);
        }
        .wb-popup .mapboxgl-popup-tip { border-top-color: rgba(20,18,14,0.92); }
        .mapboxgl-ctrl { display: none !important; }
      `}</style>
      <div ref={mapContainer} className={className} style={{ height }} />
    </>
  );
}
