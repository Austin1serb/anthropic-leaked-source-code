"use client";

import { useEffect, useRef, useCallback } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { wineRegions } from "@/data/wineRegions";

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN ?? "";

/* Winebob map style — butter/cream world */
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
      paint: { "background-color": "#F0E4CC" },
    },
    {
      id: "water",
      type: "fill",
      source: "mapbox-streets",
      "source-layer": "water",
      paint: { "fill-color": "#C8D8E4" },
    },
    {
      id: "land",
      type: "fill",
      source: "mapbox-streets",
      "source-layer": "landuse",
      paint: { "fill-color": "#E8DCC8", "fill-opacity": 0.4 },
    },
    {
      id: "country-boundaries",
      type: "line",
      source: "mapbox-streets",
      "source-layer": "admin",
      filter: ["==", "admin_level", 0],
      paint: { "line-color": "#C0B090", "line-width": 0.6, "line-opacity": 0.4 },
    },
    {
      id: "country-labels",
      type: "symbol",
      source: "mapbox-streets",
      "source-layer": "place_label",
      filter: ["==", "class", "country"],
      layout: {
        "text-field": ["get", "name_en"],
        "text-size": 10,
        "text-transform": "uppercase",
        "text-letter-spacing": 0.12,
        "text-font": ["DIN Pro Medium", "Arial Unicode MS Regular"],
      },
      paint: { "text-color": "#8C7E6E", "text-opacity": 0.5 },
    },
  ],
};

type WineRegionMapProps = {
  onRegionClick?: (region: string, country: string) => void;
  regionCounts?: Record<string, number>; // region name → wine count from DB
  height?: string;
  className?: string;
};

export function WineRegionMap({ onRegionClick, regionCounts, height = "300px", className = "" }: WineRegionMapProps) {
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
      style: MAP_STYLE,
      center: [12, 42],
      zoom: 3.2,
      minZoom: 1.5,
      maxZoom: 10,
      attributionControl: false,
      pitchWithRotate: false,
      dragRotate: false,
    });

    map.current.addControl(new mapboxgl.NavigationControl({ showCompass: false }), "top-right");

    popup.current = new mapboxgl.Popup({
      closeButton: false,
      closeOnClick: false,
      offset: 8,
      className: "wine-region-popup",
    });

    map.current.on("load", () => {
      if (!map.current) return;

      // Add region polygons as a source
      map.current.addSource("wine-regions", {
        type: "geojson",
        data: wineRegions as GeoJSON.FeatureCollection,
      });

      // Fill layer — colored region areas
      map.current.addLayer({
        id: "wine-regions-fill",
        type: "fill",
        source: "wine-regions",
        paint: {
          "fill-color": ["get", "color"],
          "fill-opacity": [
            "case",
            ["boolean", ["feature-state", "hover"], false],
            0.35,
            0.18,
          ],
        },
      });

      // Border layer — region outlines
      map.current.addLayer({
        id: "wine-regions-border",
        type: "line",
        source: "wine-regions",
        paint: {
          "line-color": ["get", "color"],
          "line-width": [
            "case",
            ["boolean", ["feature-state", "hover"], false],
            2,
            1,
          ],
          "line-opacity": 0.5,
        },
      });

      // Label layer — region names
      map.current.addLayer({
        id: "wine-regions-label",
        type: "symbol",
        source: "wine-regions",
        layout: {
          "text-field": ["get", "name"],
          "text-size": [
            "interpolate", ["linear"], ["zoom"],
            3, 9,
            6, 12,
            8, 14,
          ],
          "text-font": ["DIN Pro Medium", "Arial Unicode MS Regular"],
          "text-allow-overlap": false,
          "text-ignore-placement": false,
        },
        paint: {
          "text-color": "#1A1412",
          "text-opacity": [
            "interpolate", ["linear"], ["zoom"],
            3, 0.5,
            5, 0.8,
          ],
          "text-halo-color": "#FEF9F0",
          "text-halo-width": 1.5,
        },
      });

      let hoveredId: string | number | null = null;

      // Hover effect
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

        // Show popup
        const props = e.features[0].properties;
        if (props && popup.current && map.current) {
          const count = regionCounts?.[props.name] ?? props.wineCount ?? 0;
          popup.current
            .setLngLat(e.lngLat)
            .setHTML(`
              <div style="font-family: system-ui, sans-serif; padding: 2px 0;">
                <p style="font-size: 14px; font-weight: 700; color: #1A1412; margin: 0;">${props.name}</p>
                <p style="font-size: 11px; color: #8C7E6E; margin: 2px 0 0;">${props.country} · ${props.grapes}</p>
                <p style="font-size: 12px; font-weight: 600; color: #74070E; margin: 4px 0 0;">${count} wines</p>
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

      // Click — filter wines
      map.current.on("click", "wine-regions-fill", (e) => {
        if (!e.features?.length) return;
        const props = e.features[0].properties;
        if (props) {
          handleRegionClick(props.name, props.country);
        }
      });
    });

    return () => {
      popup.current?.remove();
      map.current?.remove();
    };
  }, [handleRegionClick, regionCounts]);

  if (!MAPBOX_TOKEN) {
    return (
      <div
        className={`rounded-[20px] bg-card-bg border border-card-border flex items-center justify-center ${className}`}
        style={{ height }}
      >
        <p className="text-muted text-[13px]">Add NEXT_PUBLIC_MAPBOX_TOKEN to enable the wine region map</p>
      </div>
    );
  }

  return (
    <>
      <style>{`
        .wine-region-popup .mapboxgl-popup-content {
          background: #FFFFFF;
          border-radius: 12px;
          padding: 10px 14px;
          box-shadow: 0 4px 20px rgba(0,0,0,0.12);
          border: 1px solid rgba(0,0,0,0.06);
        }
        .wine-region-popup .mapboxgl-popup-tip {
          border-top-color: #FFFFFF;
        }
        .mapboxgl-ctrl-group {
          border-radius: 12px !important;
          border: 1px solid rgba(0,0,0,0.06) !important;
          box-shadow: 0 2px 8px rgba(0,0,0,0.06) !important;
          overflow: hidden;
        }
        .mapboxgl-ctrl-group button { width: 36px !important; height: 36px !important; }
      `}</style>
      <div
        ref={mapContainer}
        className={`rounded-[20px] overflow-hidden border border-card-border shadow-[0_2px_8px_rgba(0,0,0,0.06),0_0_1px_rgba(0,0,0,0.04)] ${className}`}
        style={{ height }}
      />
    </>
  );
}
