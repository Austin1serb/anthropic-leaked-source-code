"use client";

import { useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN ?? "";

/* Major wine regions with coordinates */
const WINE_REGIONS = [
  { name: "Bordeaux", country: "France", lat: 44.84, lng: -0.58, wines: "Cabernet, Merlot" },
  { name: "Burgundy", country: "France", lat: 47.05, lng: 4.39, wines: "Pinot Noir, Chardonnay" },
  { name: "Champagne", country: "France", lat: 49.25, lng: 3.96, wines: "Sparkling" },
  { name: "Rhône", country: "France", lat: 44.06, lng: 4.81, wines: "Syrah, Grenache" },
  { name: "Loire", country: "France", lat: 47.38, lng: 0.69, wines: "Sauvignon Blanc, Chenin" },
  { name: "Piedmont", country: "Italy", lat: 44.69, lng: 8.03, wines: "Nebbiolo, Barbera" },
  { name: "Tuscany", country: "Italy", lat: 43.35, lng: 11.35, wines: "Sangiovese" },
  { name: "Veneto", country: "Italy", lat: 45.44, lng: 12.32, wines: "Corvina, Glera" },
  { name: "Rioja", country: "Spain", lat: 42.47, lng: -2.45, wines: "Tempranillo" },
  { name: "Ribera del Duero", country: "Spain", lat: 41.63, lng: -3.71, wines: "Tempranillo" },
  { name: "Douro", country: "Portugal", lat: 41.16, lng: -7.79, wines: "Touriga Nacional" },
  { name: "Mosel", country: "Germany", lat: 49.96, lng: 6.89, wines: "Riesling" },
  { name: "Napa Valley", country: "USA", lat: 38.50, lng: -122.27, wines: "Cabernet Sauvignon" },
  { name: "Barossa Valley", country: "Australia", lat: -34.56, lng: 138.95, wines: "Shiraz" },
  { name: "Mendoza", country: "Argentina", lat: -32.89, lng: -68.83, wines: "Malbec" },
  { name: "Marlborough", country: "New Zealand", lat: -41.51, lng: 173.95, wines: "Sauvignon Blanc" },
  { name: "Stellenbosch", country: "South Africa", lat: -33.93, lng: 18.86, wines: "Pinotage, Chenin" },
];

/* Winebob-themed Mapbox style — warm, muted, butter tones */
const MAP_STYLE: mapboxgl.StyleSpecification = {
  version: 8,
  name: "Winebob",
  sources: {
    "mapbox-streets": {
      type: "vector",
      url: "mapbox://mapbox.mapbox-streets-v8",
    },
  },
  layers: [
    {
      id: "background",
      type: "background",
      paint: { "background-color": "#F5E6C8" },
    },
    {
      id: "water",
      type: "fill",
      source: "mapbox-streets",
      "source-layer": "water",
      paint: { "fill-color": "#D6E2E8" },
    },
    {
      id: "land",
      type: "fill",
      source: "mapbox-streets",
      "source-layer": "landuse",
      paint: { "fill-color": "#EDE4D4", "fill-opacity": 0.5 },
    },
    {
      id: "country-boundaries",
      type: "line",
      source: "mapbox-streets",
      "source-layer": "admin",
      filter: ["==", "admin_level", 0],
      paint: {
        "line-color": "#C8B898",
        "line-width": 0.8,
        "line-opacity": 0.5,
      },
    },
    {
      id: "country-labels",
      type: "symbol",
      source: "mapbox-streets",
      "source-layer": "place_label",
      filter: ["==", "class", "country"],
      layout: {
        "text-field": ["get", "name_en"],
        "text-size": 11,
        "text-transform": "uppercase",
        "text-letter-spacing": 0.15,
        "text-font": ["DIN Pro Medium", "Arial Unicode MS Regular"],
      },
      paint: {
        "text-color": "#8C7E6E",
        "text-opacity": 0.6,
      },
    },
  ],
};

type WineRegionMapProps = {
  onRegionClick?: (region: string, country: string) => void;
  height?: string;
  className?: string;
};

export function WineRegionMap({ onRegionClick, height = "300px", className = "" }: WineRegionMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);

  useEffect(() => {
    if (!mapContainer.current || !MAPBOX_TOKEN) return;

    mapboxgl.accessToken = MAPBOX_TOKEN;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: MAP_STYLE,
      center: [10, 46], // Europe center
      zoom: 3.5,
      minZoom: 2,
      maxZoom: 8,
      attributionControl: false,
      pitchWithRotate: false,
      dragRotate: false,
    });

    map.current.addControl(new mapboxgl.NavigationControl({ showCompass: false }), "top-right");

    map.current.on("load", () => {
      if (!map.current) return;

      // Add region markers
      for (const region of WINE_REGIONS) {
        // Create marker element
        const el = document.createElement("button");
        el.className = "wine-region-marker";
        el.style.cssText = `
          width: 12px; height: 12px; border-radius: 6px;
          background: #74070E; border: 2px solid #FEF9F0;
          box-shadow: 0 2px 8px rgba(116, 7, 14, 0.3);
          cursor: pointer; transition: transform 0.15s;
          padding: 0; outline: none;
        `;
        el.addEventListener("mouseenter", () => { el.style.transform = "scale(1.5)"; });
        el.addEventListener("mouseleave", () => { el.style.transform = "scale(1)"; });
        el.addEventListener("click", (e) => {
          e.stopPropagation();
          onRegionClick?.(region.name, region.country);
        });

        // Create popup
        const popup = new mapboxgl.Popup({
          offset: 12,
          closeButton: false,
          className: "wine-popup",
        }).setHTML(`
          <div style="font-family: system-ui, sans-serif; padding: 4px 0;">
            <p style="font-size: 13px; font-weight: 700; color: #1A1412; margin: 0;">${region.name}</p>
            <p style="font-size: 11px; color: #8C7E6E; margin: 2px 0 0;">${region.country} · ${region.wines}</p>
          </div>
        `);

        new mapboxgl.Marker({ element: el })
          .setLngLat([region.lng, region.lat])
          .setPopup(popup)
          .addTo(map.current!);
      }
    });

    return () => { map.current?.remove(); };
  }, [onRegionClick]);

  if (!MAPBOX_TOKEN) {
    return (
      <div
        className={`rounded-[16px] bg-card-bg border border-card-border flex items-center justify-center ${className}`}
        style={{ height }}
      >
        <p className="text-muted text-[13px]">Map requires NEXT_PUBLIC_MAPBOX_TOKEN</p>
      </div>
    );
  }

  return (
    <>
      <style>{`
        .mapboxgl-popup-content {
          background: #FFFFFF;
          border-radius: 12px;
          padding: 10px 14px;
          box-shadow: 0 4px 16px rgba(0,0,0,0.1);
          border: 1px solid rgba(0,0,0,0.06);
        }
        .mapboxgl-popup-tip { border-top-color: #FFFFFF; }
        .mapboxgl-ctrl-group {
          border-radius: 12px !important;
          border: 1px solid rgba(0,0,0,0.06) !important;
          box-shadow: 0 2px 8px rgba(0,0,0,0.06) !important;
          overflow: hidden;
        }
        .mapboxgl-ctrl-group button {
          width: 36px !important;
          height: 36px !important;
        }
      `}</style>
      <div
        ref={mapContainer}
        className={`rounded-[20px] overflow-hidden ${className}`}
        style={{ height }}
      />
    </>
  );
}
