"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import mapboxgl from "mapbox-gl";

type Props = {
  active: boolean;
  mapRef: React.RefObject<mapboxgl.Map | null>;
};

type GeoJSONFeature = {
  type: "Feature";
  geometry: { type: "Point"; coordinates: [number, number] };
  properties: {
    wineId: string;
    wineName: string;
    wineType: string;
    region: string;
    city: string | null;
    createdAt: string;
  };
};

type GeoJSONData = {
  type: "FeatureCollection";
  features: GeoJSONFeature[];
};

const EMPTY_GEOJSON: GeoJSONData = { type: "FeatureCollection", features: [] };

const SOURCE_ID = "live-checkins";
const LAYER_IDS = [
  "checkin-clusters",
  "checkin-cluster-count",
  "checkin-dots",
  "checkin-dots-pulse",
];

const POLL_INTERVAL = 30_000;

function timeSince(dateStr: string): string {
  const seconds = Math.floor(
    (Date.now() - new Date(dateStr).getTime()) / 1000
  );
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  return `${hours}h ago`;
}

function computeTrendingRegion(features: GeoJSONFeature[]): string | null {
  if (features.length === 0) return null;
  const counts: Record<string, number> = {};
  for (const f of features) {
    const r = f.properties.region;
    counts[r] = (counts[r] || 0) + 1;
  }
  let max = 0;
  let trending: string | null = null;
  for (const [region, count] of Object.entries(counts)) {
    if (count > max) {
      max = count;
      trending = region;
    }
  }
  return trending;
}

export function LiveHeatmapLayer({ active, mapRef }: Props) {
  const [data, setData] = useState<GeoJSONData>(EMPTY_GEOJSON);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const popupRef = useRef<mapboxgl.Popup | null>(null);
  const pulseStartRef = useRef<number | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const layersAddedRef = useRef(false);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch("/api/checkin");
      if (res.ok) {
        const json: GeoJSONData = await res.json();
        setData(json);
      }
    } catch {
      // Silently fail — will retry on next poll
    }
  }, []);

  // Add layers to the map
  const addLayers = useCallback(
    (map: mapboxgl.Map, geojson: GeoJSONData) => {
      if (map.getSource(SOURCE_ID)) return;

      map.addSource(SOURCE_ID, {
        type: "geojson",
        data: geojson,
        cluster: true,
        clusterMaxZoom: 14,
        clusterRadius: 50,
      });

      // Cluster circles
      map.addLayer({
        id: "checkin-clusters",
        type: "circle",
        source: SOURCE_ID,
        filter: ["has", "point_count"],
        paint: {
          "circle-color": "#74070E",
          "circle-radius": [
            "step",
            ["get", "point_count"],
            20,
            10,
            30,
            50,
            40,
          ],
          "circle-opacity": 0.85,
        },
      });

      // Cluster count labels
      map.addLayer({
        id: "checkin-cluster-count",
        type: "symbol",
        source: SOURCE_ID,
        filter: ["has", "point_count"],
        layout: {
          "text-field": "{point_count_abbreviated}",
          "text-font": ["DIN Pro Bold"],
          "text-size": 13,
        },
        paint: { "text-color": "#FFFFFF" },
      });

      // Unclustered dots (color by wine type)
      map.addLayer({
        id: "checkin-dots",
        type: "circle",
        source: SOURCE_ID,
        filter: ["!", ["has", "point_count"]],
        paint: {
          "circle-color": [
            "match",
            ["get", "wineType"],
            "red",
            "#8B0000",
            "white",
            "#FFD700",
            "rosé",
            "#FF69B4",
            "sparkling",
            "#C9B037",
            "#888",
          ],
          "circle-radius": 6,
          "circle-stroke-width": 2,
          "circle-stroke-color": "#FFFFFF",
        },
      });

      // Pulse halo layer
      map.addLayer({
        id: "checkin-dots-pulse",
        type: "circle",
        source: SOURCE_ID,
        filter: ["!", ["has", "point_count"]],
        paint: {
          "circle-color": "#74070E",
          "circle-radius": 6,
          "circle-opacity": 0.6,
          "circle-stroke-width": 0,
        },
      });

      layersAddedRef.current = true;
    },
    []
  );

  // Remove layers from the map
  const removeLayers = useCallback((map: mapboxgl.Map) => {
    for (const id of LAYER_IDS) {
      if (map.getLayer(id)) map.removeLayer(id);
    }
    if (map.getSource(SOURCE_ID)) map.removeSource(SOURCE_ID);
    layersAddedRef.current = false;
  }, []);

  // Pulse animation loop
  const startPulse = useCallback((map: mapboxgl.Map) => {
    pulseStartRef.current = performance.now();

    function animate() {
      if (!pulseStartRef.current) return;
      const elapsed = performance.now() - pulseStartRef.current;
      const duration = 2000;
      const t = (elapsed % duration) / duration; // 0..1

      const radius = 6 + t * 18; // 6 -> 24
      const opacity = 0.6 * (1 - t); // 0.6 -> 0

      if (map.getLayer("checkin-dots-pulse")) {
        map.setPaintProperty("checkin-dots-pulse", "circle-radius", radius);
        map.setPaintProperty("checkin-dots-pulse", "circle-opacity", opacity);
      }

      animFrameRef.current = requestAnimationFrame(animate);
    }

    animFrameRef.current = requestAnimationFrame(animate);
  }, []);

  const stopPulse = useCallback(() => {
    pulseStartRef.current = null;
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
  }, []);

  // Main effect: setup/teardown when active changes
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (!active) {
      // Cleanup
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      stopPulse();
      popupRef.current?.remove();
      popupRef.current = null;
      if (map.isStyleLoaded()) {
        removeLayers(map);
      }
      setData(EMPTY_GEOJSON);
      return;
    }

    // Active — setup
    function setup() {
      if (!map) return;
      addLayers(map, EMPTY_GEOJSON);
      startPulse(map);
      fetchData();
      intervalRef.current = setInterval(fetchData, POLL_INTERVAL);
    }

    if (map.isStyleLoaded()) {
      setup();
    } else {
      map.once("load", setup);
    }

    // Click: cluster -> zoom
    function onClusterClick(e: mapboxgl.MapMouseEvent) {
      if (!map) return;
      const features = map.queryRenderedFeatures(e.point, {
        layers: ["checkin-clusters"],
      });
      if (!features.length) return;
      const clusterId = features[0].properties?.cluster_id;
      const source = map.getSource(SOURCE_ID) as mapboxgl.GeoJSONSource;
      source.getClusterExpansionZoom(clusterId, (err, zoom) => {
        if (err || zoom == null) return;
        const geometry = features[0].geometry;
        if (geometry.type !== "Point") return;
        map.easeTo({
          center: geometry.coordinates as [number, number],
          zoom,
        });
      });
    }

    // Click: dot -> popup
    function onDotClick(e: mapboxgl.MapMouseEvent) {
      if (!map) return;
      const features = map.queryRenderedFeatures(e.point, {
        layers: ["checkin-dots"],
      });
      if (!features.length) return;
      const f = features[0];
      const geometry = f.geometry;
      if (geometry.type !== "Point") return;
      const coords = geometry.coordinates.slice() as [number, number];
      const props = f.properties as Record<string, string>;

      popupRef.current?.remove();
      popupRef.current = new mapboxgl.Popup({ offset: 12, closeButton: false })
        .setLngLat(coords)
        .setHTML(
          `<div style="font-family:system-ui,sans-serif;font-size:13px;line-height:1.4;color:#1A1412;">
            <strong>${props.wineName || "Unknown wine"}</strong><br/>
            <span style="color:#666;">${props.region || ""}</span><br/>
            <span style="color:#999;font-size:11px;">${timeSince(props.createdAt)}</span>
          </div>`
        )
        .addTo(map);
    }

    // Cursor styling
    function onEnter() {
      if (map) map.getCanvas().style.cursor = "pointer";
    }
    function onLeave() {
      if (map) map.getCanvas().style.cursor = "";
    }

    map.on("click", "checkin-clusters", onClusterClick);
    map.on("click", "checkin-dots", onDotClick);
    map.on("mouseenter", "checkin-clusters", onEnter);
    map.on("mouseleave", "checkin-clusters", onLeave);
    map.on("mouseenter", "checkin-dots", onEnter);
    map.on("mouseleave", "checkin-dots", onLeave);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      stopPulse();
      popupRef.current?.remove();
      popupRef.current = null;

      map.off("click", "checkin-clusters", onClusterClick);
      map.off("click", "checkin-dots", onDotClick);
      map.off("mouseenter", "checkin-clusters", onEnter);
      map.off("mouseleave", "checkin-clusters", onLeave);
      map.off("mouseenter", "checkin-dots", onEnter);
      map.off("mouseleave", "checkin-dots", onLeave);

      if (map.isStyleLoaded()) {
        removeLayers(map);
      }
    };
  }, [active, mapRef, addLayers, removeLayers, fetchData, startPulse, stopPulse]);

  // Update source data when data changes (without remove/re-add)
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !active || !layersAddedRef.current) return;
    const source = map.getSource(SOURCE_ID) as mapboxgl.GeoJSONSource | undefined;
    if (source) {
      source.setData(data);
    }
  }, [data, active, mapRef]);

  if (!active) return null;

  const count = data.features.length;
  const trending = computeTrendingRegion(data.features);

  // Cold start / empty state
  if (count === 0) {
    return (
      <div className="fixed bottom-24 left-4 right-4 md:left-auto md:right-5 md:bottom-5 md:w-[400px] z-30">
        <div className="rounded-xl bg-[#1A1412]/85 backdrop-blur-xl border border-white/[0.08] px-4 py-3 text-center">
          <p className="text-[13px] text-white/70">
            Be the first to check in! Open any wine and tap &quot;I&apos;m
            drinking this&quot;
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed bottom-24 left-4 right-4 md:left-auto md:right-5 md:bottom-5 md:w-[400px] z-30">
      <div className="rounded-xl bg-[#1A1412]/85 backdrop-blur-xl border border-white/[0.08] px-4 py-3">
        <p className="text-[13px] text-white/90 font-medium">
          {count} {count === 1 ? "person" : "people"} drinking right now
          {trending && (
            <span className="text-white/50">
              {" "}
              &middot; Trending: {trending}
            </span>
          )}
        </p>
      </div>
    </div>
  );
}
