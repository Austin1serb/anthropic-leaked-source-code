"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import mapboxgl from "mapbox-gl";
import { wineRegions, type WineRegionFeature } from "@/data/wineRegions";
import { getRegionCities } from "@/components/shared/WineRegionMap";

// ─── Types ───────────────────────────────────────────────────────────
type Props = {
  active: boolean;
  mapRef: React.RefObject<mapboxgl.Map | null>;
};

type FlightWine = {
  region: string;
  wineName: string;
  grapes: string[];
};

type Phase = "drawing" | "flight" | "idle";

// ─── Point-in-polygon (ray casting) ─────────────────────────────────
function pointInPolygon(
  point: [number, number],
  polygon: [number, number][],
): boolean {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i][0],
      yi = polygon[i][1];
    const xj = polygon[j][0],
      yj = polygon[j][1];
    const intersect =
      yi > point[1] !== yj > point[1] &&
      point[0] < ((xj - xi) * (point[1] - yi)) / (yj - yi) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

// ─── Region intersection detection ──────────────────────────────────
function detectIntersectedRegions(
  drawnPoints: [number, number][],
): WineRegionFeature[] {
  const sampled: [number, number][] = [];
  for (let i = 0; i < drawnPoints.length; i += 5) {
    sampled.push(drawnPoints[i]);
  }

  const seen = new Set<string>();
  const orderedRegions: WineRegionFeature[] = [];

  for (const pt of sampled) {
    for (const feature of wineRegions.features) {
      if (seen.has(feature.properties.name)) continue;
      const ring = feature.geometry.coordinates[0] as [number, number][];
      if (pointInPolygon(pt, ring)) {
        seen.add(feature.properties.name);
        orderedRegions.push(feature);
      }
    }
  }

  return orderedRegions;
}

// ─── Build flight from intersected regions ──────────────────────────
function buildFlight(regions: WineRegionFeature[]): FlightWine[] {
  const capped = regions.slice(0, 6);
  return capped.map((r) => {
    const cities = getRegionCities(r.properties.name);
    const firstCity = cities[0];
    return {
      region: r.properties.name,
      wineName: firstCity?.notableWines?.[0] ?? r.properties.name + " Wine",
      grapes: firstCity?.grapes ?? r.properties.grapes.split(", ").slice(0, 3),
    };
  });
}

// ─── Component ───────────────────────────────────────────────────────
export default function DrawFlightLayer({ active, mapRef }: Props) {
  const [phase, setPhase] = useState<Phase>("idle");
  const [flight, setFlight] = useState<FlightWine[]>([]);
  const [intersectedRegions, setIntersectedRegions] = useState<
    WineRegionFeature[]
  >([]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [copied, setCopied] = useState(false);
  const [noRegions, setNoRegions] = useState(false);

  const drawnPointsRef = useRef<[number, number][]>([]);
  const isDrawingRef = useRef(false);
  const rafRef = useRef<number | null>(null);
  const cleanupRef = useRef<(() => void) | null>(null);

  // ── Cleanup map layers / sources ────────────────────────────────
  const removeMapLayers = useCallback(() => {
    const map = mapRef.current;
    if (!map) return;
    try {
      if (map.getLayer("draw-flight-line")) map.removeLayer("draw-flight-line");
      if (map.getLayer("draw-flight-line-glow"))
        map.removeLayer("draw-flight-line-glow");
      if (map.getSource("draw-flight-line"))
        map.removeSource("draw-flight-line");
    } catch {
      /* layer may not exist */
    }
  }, [mapRef]);

  // ── Full reset ──────────────────────────────────────────────────
  const resetAll = useCallback(() => {
    const map = mapRef.current;
    removeMapLayers();
    drawnPointsRef.current = [];
    isDrawingRef.current = false;
    setFlight([]);
    setIntersectedRegions([]);
    setSaved(false);
    setCopied(false);
    setNoRegions(false);
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    if (map) {
      map.dragPan.enable();
    }
  }, [mapRef, removeMapLayers]);

  // ── Update the line on the map ──────────────────────────────────
  const updateLine = useCallback(() => {
    const map = mapRef.current;
    if (!map) return;

    const geojson: GeoJSON.Feature<GeoJSON.LineString> = {
      type: "Feature",
      properties: {},
      geometry: {
        type: "LineString",
        coordinates: drawnPointsRef.current,
      },
    };

    const source = map.getSource(
      "draw-flight-line",
    ) as mapboxgl.GeoJSONSource | null;
    if (source) {
      source.setData(geojson);
    } else {
      map.addSource("draw-flight-line", { type: "geojson", data: geojson });
      map.addLayer({
        id: "draw-flight-line-glow",
        type: "line",
        source: "draw-flight-line",
        paint: {
          "line-color": "#74070E",
          "line-width": 8,
          "line-opacity": 0.3,
          "line-blur": 4,
        },
      });
      map.addLayer({
        id: "draw-flight-line",
        type: "line",
        source: "draw-flight-line",
        paint: {
          "line-color": "#74070E",
          "line-width": 3,
          "line-dasharray": [2, 2],
          "line-opacity": 0.9,
        },
      });
    }
  }, [mapRef]);

  // ── Drawing event handlers ──────────────────────────────────────
  const startDrawing = useCallback(() => {
    const map = mapRef.current;
    if (!map) return;

    resetAll();
    setPhase("drawing");
    map.dragPan.disable();
    map.getCanvas().style.cursor = "crosshair";

    const onPointerDown = (e: mapboxgl.MapMouseEvent) => {
      isDrawingRef.current = true;
      drawnPointsRef.current = [[e.lngLat.lng, e.lngLat.lat]];
      updateLine();
    };

    const onPointerMove = (e: mapboxgl.MapMouseEvent) => {
      if (!isDrawingRef.current) return;
      drawnPointsRef.current.push([e.lngLat.lng, e.lngLat.lat]);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(() => {
        updateLine();
      });
    };

    const onPointerUp = () => {
      if (!isDrawingRef.current) return;
      isDrawingRef.current = false;
      map.dragPan.enable();
      map.getCanvas().style.cursor = "";

      const points = drawnPointsRef.current;
      if (points.length < 3) {
        setPhase("drawing");
        return;
      }

      const regions = detectIntersectedRegions(points);
      if (regions.length === 0) {
        setNoRegions(true);
        setPhase("drawing");
        return;
      }

      setNoRegions(false);
      setIntersectedRegions(regions);
      setFlight(buildFlight(regions));
      setPhase("flight");
    };

    map.on("mousedown", onPointerDown);
    map.on("mousemove", onPointerMove);
    map.on("mouseup", onPointerUp);
    map.on("touchstart", onPointerDown as never);
    map.on("touchmove", onPointerMove as never);
    map.on("touchend", onPointerUp);

    cleanupRef.current = () => {
      map.off("mousedown", onPointerDown);
      map.off("mousemove", onPointerMove);
      map.off("mouseup", onPointerUp);
      map.off("touchstart", onPointerDown as never);
      map.off("touchmove", onPointerMove as never);
      map.off("touchend", onPointerUp);
      map.getCanvas().style.cursor = "";
    };
  }, [mapRef, resetAll, updateLine]);

  // ── Activate / deactivate based on `active` prop ────────────────
  useEffect(() => {
    if (active) {
      startDrawing();
    } else {
      if (cleanupRef.current) {
        cleanupRef.current();
        cleanupRef.current = null;
      }
      resetAll();
      setPhase("idle");
    }
    return () => {
      if (cleanupRef.current) {
        cleanupRef.current();
        cleanupRef.current = null;
      }
      resetAll();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);

  // ── Clear & Redraw ──────────────────────────────────────────────
  const handleClearRedraw = useCallback(() => {
    if (cleanupRef.current) {
      cleanupRef.current();
      cleanupRef.current = null;
    }
    resetAll();
    setPhase("idle");
    // Short delay then restart drawing so state can settle
    setTimeout(() => startDrawing(), 50);
  }, [resetAll, startDrawing]);

  // ── Save flight ─────────────────────────────────────────────────
  const handleSave = useCallback(async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/flights", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          path: {
            type: "LineString",
            coordinates: drawnPointsRef.current,
          },
          wines: flight.map((w) => ({
            region: w.region,
            wineName: w.wineName,
            grapes: w.grapes,
          })),
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Failed to save flight");
      }
      setSaved(true);
    } catch (err) {
      console.error("Save flight error:", err);
      alert(
        err instanceof Error ? err.message : "Failed to save flight",
      );
    } finally {
      setSaving(false);
    }
  }, [flight]);

  // ── Share to clipboard ──────────────────────────────────────────
  const handleShare = useCallback(() => {
    const lines = [
      `My Winebob Flight - ${flight.length} wines across ${intersectedRegions.length} regions`,
      "",
    ];
    flight.forEach((w, i) => {
      lines.push(
        `${i + 1}. ${w.wineName} (${w.region}) - ${w.grapes.join(", ")}`,
      );
    });
    lines.push("", "Created with Winebob");
    navigator.clipboard.writeText(lines.join("\n")).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [flight, intersectedRegions]);

  // ── Render nothing if not active ────────────────────────────────
  if (!active && phase === "idle") return null;

  return (
    <>
      {/* ── Draw Mode Banner ────────────────────────────────────── */}
      {phase === "drawing" && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 px-5 py-3 bg-[#74070E]/90 backdrop-blur-xl text-white rounded-[12px] shadow-lg flex items-center gap-3 select-none pointer-events-none">
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="opacity-70 shrink-0"
          >
            <path d="M12 19l7-7 3 3-7 7-3-3z" />
            <path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z" />
            <path d="M2 2l7.586 7.586" />
            <circle cx="11" cy="11" r="2" />
          </svg>
          <span className="text-sm font-medium">
            Draw a path across wine regions
          </span>
        </div>
      )}

      {/* ── No Regions Warning ──────────────────────────────────── */}
      {noRegions && phase === "drawing" && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-20 px-4 py-2 bg-[#1A1412]/90 backdrop-blur-xl text-white/70 rounded-[12px] text-xs shadow-lg pointer-events-none">
          Your path didn&apos;t cross any wine regions. Try again!
        </div>
      )}

      {/* ── Flight Card Panel ───────────────────────────────────── */}
      {phase === "flight" && flight.length > 0 && (
        <div className="absolute top-4 left-4 z-20 w-80 max-h-[calc(100vh-2rem)] overflow-y-auto bg-[#1A1412]/90 backdrop-blur-xl border border-white/[0.08] rounded-[14px] shadow-2xl">
          {/* Header */}
          <div className="px-5 pt-5 pb-3">
            <h2 className="text-white font-semibold text-base leading-tight">
              Your Flight
            </h2>
            <p className="text-white/50 text-xs mt-1">
              {flight.length} wine{flight.length !== 1 ? "s" : ""} &middot;{" "}
              {intersectedRegions.length} region
              {intersectedRegions.length !== 1 ? "s" : ""}
            </p>
          </div>

          {/* Wine list */}
          <div className="px-4 pb-2 flex flex-col gap-2">
            {flight.map((wine, i) => (
              <div
                key={wine.region + i}
                className="flex items-start gap-3 p-3 rounded-[10px] bg-white/[0.04] hover:bg-white/[0.07] transition-colors"
              >
                {/* Number circle */}
                <div className="shrink-0 w-7 h-7 rounded-full bg-[#74070E] flex items-center justify-center text-white text-xs font-bold">
                  {i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white font-bold text-[13px] leading-tight truncate">
                    {wine.wineName}
                  </p>
                  <p className="text-white/50 text-[11px] mt-0.5">
                    {wine.region}
                  </p>
                  {/* Grape pills */}
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {wine.grapes.map((g) => (
                      <span
                        key={g}
                        className="px-2 py-0.5 rounded-full bg-white/[0.08] text-white/60 text-[10px]"
                      >
                        {g}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Actions */}
          <div className="px-4 pb-4 pt-2 flex flex-col gap-2">
            <button
              onClick={handleSave}
              disabled={saving || saved}
              className="w-full h-11 rounded-[12px] bg-[#74070E] text-white font-medium text-sm hover:bg-[#8a0f18] transition-colors disabled:opacity-60"
            >
              {saved ? "Saved!" : saving ? "Saving..." : "Save Flight"}
            </button>
            <div className="flex gap-2">
              <button
                onClick={handleClearRedraw}
                className="flex-1 h-11 rounded-[12px] bg-white/10 text-white/70 font-medium text-sm hover:bg-white/15 transition-colors"
              >
                Clear &amp; Redraw
              </button>
              <button
                onClick={handleShare}
                className="flex-1 h-11 rounded-[12px] bg-white/10 text-white/70 font-medium text-sm hover:bg-white/15 transition-colors"
              >
                {copied ? "Copied!" : "Share"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
