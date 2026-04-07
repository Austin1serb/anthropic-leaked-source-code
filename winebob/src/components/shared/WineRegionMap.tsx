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
};

export function WineRegionMap({ onRegionClick, regionCounts, height = "100%", className = "" }: WineRegionMapProps) {
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
      style: "mapbox://styles/mapbox/dark-v11",
      center: [12, 44],
      zoom: 3.5,
      minZoom: 1.5,
      maxZoom: 10,
      attributionControl: false,
      pitchWithRotate: false,
      dragRotate: false,
    });

    popup.current = new mapboxgl.Popup({
      closeButton: false,
      closeOnClick: false,
      offset: 8,
      className: "wb-popup",
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
    });

    return () => { popup.current?.remove(); map.current?.remove(); };
  }, [handleRegionClick, regionCounts]);

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
