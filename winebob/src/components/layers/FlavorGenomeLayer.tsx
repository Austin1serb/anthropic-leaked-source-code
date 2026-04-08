"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import mapboxgl from "mapbox-gl";
import { REGION_CITIES } from "@/components/shared/WineRegionMap";
import {
  REGION_FLAVORS,
  FLAVOR_AXES,
  FLAVOR_LABELS,
  type FlavorProfile,
} from "@/data/regionFlavors";

// ── Types ──

type Props = {
  active: boolean;
  mapRef: React.RefObject<mapboxgl.Map | null>;
};

type SimilarRegion = {
  profile: FlavorProfile;
  similarity: number;
  keyDifference: string;
};

// ── Cosine Similarity ──

function cosineSimilarity(a: number[], b: number[]): number {
  const dot = a.reduce((sum, v, i) => sum + v * b[i], 0);
  const magA = Math.sqrt(a.reduce((sum, v) => sum + v * v, 0));
  const magB = Math.sqrt(a.reduce((sum, v) => sum + v * v, 0));
  return magA && magB ? dot / (magA * magB) : 0;
}

function profileToVector(p: FlavorProfile): number[] {
  return FLAVOR_AXES.map((axis) => p[axis]);
}

function findKeyDifference(source: FlavorProfile, target: FlavorProfile): string {
  let maxDiff = 0;
  let maxAxis = "";
  let direction = "";

  for (const axis of FLAVOR_AXES) {
    const diff = target[axis] - source[axis];
    if (Math.abs(diff) > maxDiff) {
      maxDiff = Math.abs(diff);
      maxAxis = axis;
      direction = diff > 0 ? "More" : "Less";
    }
  }

  // Find second biggest difference
  let secondAxis = "";
  let secondDiff = 0;
  let secondDir = "";
  for (const axis of FLAVOR_AXES) {
    if (axis === maxAxis) continue;
    const diff = target[axis] - source[axis];
    if (Math.abs(diff) > secondDiff) {
      secondDiff = Math.abs(diff);
      secondAxis = axis;
      secondDir = diff > 0 ? "more" : "less";
    }
  }

  const primary = `${direction} ${FLAVOR_LABELS[maxAxis].toLowerCase()}`;
  if (secondDiff > 0.1) {
    return `${primary}, ${secondDir} ${FLAVOR_LABELS[secondAxis].toLowerCase()}`;
  }
  return primary;
}

function findSimilarRegions(
  source: FlavorProfile,
  count: number = 5,
): SimilarRegion[] {
  const srcVec = profileToVector(source);
  return REGION_FLAVORS
    .filter((r) => r.region !== source.region)
    .map((r) => ({
      profile: r,
      similarity: cosineSimilarity(srcVec, profileToVector(r)),
      keyDifference: findKeyDifference(source, r),
    }))
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, count);
}

// ── SVG Radar Chart ──

function radarPoints(
  profile: FlavorProfile,
  size: number,
  padding: number = 4,
): string {
  const cx = size / 2;
  const cy = size / 2;
  const r = (size - padding * 2) / 2;

  return FLAVOR_AXES
    .map((axis, i) => {
      const angle = (Math.PI * 2 * i) / FLAVOR_AXES.length - Math.PI / 2;
      const val = profile[axis];
      const x = cx + r * val * Math.cos(angle);
      const y = cy + r * val * Math.sin(angle);
      return `${x},${y}`;
    })
    .join(" ");
}

function RadarSVG({
  profile,
  size,
  showLabels = false,
  padding = 4,
}: {
  profile: FlavorProfile;
  size: number;
  showLabels?: boolean;
  padding?: number;
}) {
  const cx = size / 2;
  const cy = size / 2;
  const r = (size - padding * 2) / 2;

  // Grid levels (0.25, 0.5, 0.75, 1.0)
  const levels = [0.25, 0.5, 0.75, 1.0];

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      style={{ display: "block" }}
    >
      {/* Background grid circles */}
      {levels.map((level) => (
        <polygon
          key={level}
          points={FLAVOR_AXES.map((_, i) => {
            const angle = (Math.PI * 2 * i) / FLAVOR_AXES.length - Math.PI / 2;
            return `${cx + r * level * Math.cos(angle)},${cy + r * level * Math.sin(angle)}`;
          }).join(" ")}
          fill="none"
          stroke="rgba(255,255,255,0.08)"
          strokeWidth={0.5}
        />
      ))}

      {/* Axis lines */}
      {FLAVOR_AXES.map((_, i) => {
        const angle = (Math.PI * 2 * i) / FLAVOR_AXES.length - Math.PI / 2;
        return (
          <line
            key={i}
            x1={cx}
            y1={cy}
            x2={cx + r * Math.cos(angle)}
            y2={cy + r * Math.sin(angle)}
            stroke="rgba(255,255,255,0.08)"
            strokeWidth={0.5}
          />
        );
      })}

      {/* Data polygon */}
      <polygon
        points={radarPoints(profile, size, padding)}
        fill="rgba(116, 7, 14, 0.30)"
        stroke="#74070E"
        strokeWidth={size > 60 ? 1.5 : 1}
      />

      {/* Data dots */}
      {FLAVOR_AXES.map((axis, i) => {
        const angle = (Math.PI * 2 * i) / FLAVOR_AXES.length - Math.PI / 2;
        const val = profile[axis];
        const x = cx + r * val * Math.cos(angle);
        const y = cy + r * val * Math.sin(angle);
        return (
          <circle
            key={axis}
            cx={x}
            cy={y}
            r={size > 60 ? 2.5 : 1.5}
            fill="#74070E"
          />
        );
      })}

      {/* Axis labels */}
      {showLabels &&
        FLAVOR_AXES.map((axis, i) => {
          const angle = (Math.PI * 2 * i) / FLAVOR_AXES.length - Math.PI / 2;
          const labelR = r + 14;
          const x = cx + labelR * Math.cos(angle);
          const y = cy + labelR * Math.sin(angle);
          return (
            <text
              key={axis}
              x={x}
              y={y}
              textAnchor="middle"
              dominantBaseline="middle"
              fill="rgba(255,255,255,0.5)"
              fontSize={9}
              fontWeight={600}
            >
              {FLAVOR_LABELS[axis]}
            </text>
          );
        })}
    </svg>
  );
}

// ── Detail Card ──

function DetailCard({
  profile,
  onClose,
  onFindSimilar,
}: {
  profile: FlavorProfile;
  onClose: () => void;
  onFindSimilar: () => void;
}) {
  return (
    <div className="flex flex-col items-center gap-3 p-4">
      <div className="flex items-center justify-between w-full">
        <div>
          <p className="text-[15px] font-bold text-white">{profile.region}</p>
          <p className="text-[11px] text-white/40">{profile.country}</p>
        </div>
        <button
          onClick={onClose}
          className="w-6 h-6 flex items-center justify-center rounded-full bg-white/10 text-white/40 hover:text-white/70 transition-colors text-[12px]"
        >
          ✕
        </button>
      </div>
      <RadarSVG profile={profile} size={120} showLabels padding={20} />
      {/* Axis values */}
      <div className="grid grid-cols-3 gap-x-4 gap-y-1 w-full">
        {FLAVOR_AXES.map((axis) => (
          <div key={axis} className="flex items-center justify-between gap-2">
            <span className="text-[10px] text-white/40 font-semibold">
              {FLAVOR_LABELS[axis]}
            </span>
            <span className="text-[10px] text-white/70 font-bold tabular-nums">
              {(profile[axis] * 100).toFixed(0)}
            </span>
          </div>
        ))}
      </div>
      <button
        onClick={onFindSimilar}
        className="mt-1 px-4 py-2 rounded-full bg-[#74070E] text-white text-[12px] font-bold active:scale-95 transition-transform hover:bg-[#8a1018]"
      >
        Find Similar
      </button>
    </div>
  );
}

// ── Similar Results List ──

function SimilarResults({
  source,
  results,
  onSelect,
}: {
  source: FlavorProfile;
  results: SimilarRegion[];
  onSelect: (profile: FlavorProfile) => void;
}) {
  return (
    <div className="border-t border-white/[0.06] pt-3 px-4 pb-4">
      <p className="text-[10px] font-bold text-white/30 uppercase tracking-wider mb-2">
        Regions similar to {source.region}
      </p>
      <div className="flex flex-col gap-2 max-h-[220px] overflow-y-auto scrollbar-thin">
        {results.map((r) => (
          <button
            key={r.profile.region}
            onClick={() => onSelect(r.profile)}
            className="flex items-center gap-3 p-2 rounded-[10px] bg-white/[0.04] hover:bg-white/[0.08] transition-colors text-left group"
          >
            <RadarSVG profile={r.profile} size={40} padding={3} />
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[12px] font-bold text-white truncate">
                  {r.profile.region}
                </span>
                <span className="text-[11px] font-bold text-[#74070E] flex-shrink-0">
                  {(r.similarity * 100).toFixed(0)}%
                </span>
              </div>
              <p className="text-[10px] text-white/35 truncate">
                {r.profile.country}
              </p>
              <p className="text-[10px] text-white/50 italic mt-0.5 truncate">
                {r.keyDifference}
              </p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

// ── Main Component ──

export function FlavorGenomeLayer({ active, mapRef }: Props) {
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const [selectedProfile, setSelectedProfile] = useState<FlavorProfile | null>(
    null,
  );
  const [similarResults, setSimilarResults] = useState<SimilarRegion[] | null>(
    null,
  );
  const [mapReady, setMapReady] = useState(false);

  // Watch for map readiness
  useEffect(() => {
    const map = mapRef.current;
    if (!map) {
      // Poll briefly for the map to become available
      const interval = setInterval(() => {
        if (mapRef.current) {
          setMapReady(true);
          clearInterval(interval);
        }
      }, 200);
      return () => clearInterval(interval);
    }
    setMapReady(true);
  }, [mapRef]);

  const clearMarkers = useCallback(() => {
    for (const m of markersRef.current) {
      m.remove();
    }
    markersRef.current = [];
  }, []);

  const handleMarkerClick = useCallback((profile: FlavorProfile) => {
    setSelectedProfile(profile);
    setSimilarResults(null);
  }, []);

  const handleFindSimilar = useCallback(() => {
    if (!selectedProfile) return;
    setSimilarResults(findSimilarRegions(selectedProfile, 5));
  }, [selectedProfile]);

  const handleSelectSimilar = useCallback((profile: FlavorProfile) => {
    setSelectedProfile(profile);
    setSimilarResults(null);

    // Fly to the selected region
    const map = mapRef.current;
    const coords = REGION_CITIES[profile.region];
    if (map && coords) {
      map.flyTo({ center: coords, zoom: 6, duration: 1500 });
    }
  }, [mapRef]);

  const handleClose = useCallback(() => {
    setSelectedProfile(null);
    setSimilarResults(null);
  }, []);

  // Create / remove markers when active changes or map becomes ready
  useEffect(() => {
    const map = mapRef.current;
    if (!active || !map || !mapReady) {
      clearMarkers();
      setSelectedProfile(null);
      setSimilarResults(null);
      return;
    }

    // Clear any existing markers first
    clearMarkers();

    // Helper: build marker element for a profile at a given size
    function buildMarkerEl(profile: FlavorProfile, markerSize: number) {
      const el = document.createElement("div");
      el.style.display = "flex";
      el.style.flexDirection = "column";
      el.style.alignItems = "center";
      el.style.cursor = "pointer";
      el.style.transition = "transform 0.15s ease";
      el.addEventListener("mouseenter", () => { el.style.transform = "scale(1.15)"; });
      el.addEventListener("mouseleave", () => { el.style.transform = "scale(1)"; });

      const padding = 4;
      const cx = markerSize / 2;
      const cy = markerSize / 2;
      const r = (markerSize - padding * 2) / 2;
      const levels = [0.5, 1.0];

      const gridPolygons = levels
        .map((level) => {
          const pts = FLAVOR_AXES.map((_, i) => {
            const angle = (Math.PI * 2 * i) / FLAVOR_AXES.length - Math.PI / 2;
            return `${cx + r * level * Math.cos(angle)},${cy + r * level * Math.sin(angle)}`;
          }).join(" ");
          return `<polygon points="${pts}" fill="none" stroke="rgba(255,255,255,0.15)" stroke-width="0.5"/>`;
        })
        .join("");

      const axisLines = FLAVOR_AXES.map((_, i) => {
        const angle = (Math.PI * 2 * i) / FLAVOR_AXES.length - Math.PI / 2;
        return `<line x1="${cx}" y1="${cy}" x2="${cx + r * Math.cos(angle)}" y2="${cy + r * Math.sin(angle)}" stroke="rgba(255,255,255,0.12)" stroke-width="0.5"/>`;
      }).join("");

      const dataPoints = FLAVOR_AXES.map((axis, i) => {
        const angle = (Math.PI * 2 * i) / FLAVOR_AXES.length - Math.PI / 2;
        const val = profile[axis];
        return `${cx + r * val * Math.cos(angle)},${cy + r * val * Math.sin(angle)}`;
      }).join(" ");

      // Dominant trait determines accent color
      const maxAxis = FLAVOR_AXES.reduce((a, b) => (profile[a] > profile[b] ? a : b));
      const AXIS_COLORS: Record<string, string> = {
        acidity: "rgba(255,220,50,0.45)",
        tannin: "rgba(180,50,50,0.45)",
        body: "rgba(160,80,40,0.45)",
        fruit: "rgba(220,60,80,0.45)",
        earth: "rgba(140,120,80,0.45)",
        floral: "rgba(200,120,220,0.45)",
      };
      const fillColor = AXIS_COLORS[maxAxis] ?? "rgba(116,7,14,0.40)";
      const AXIS_STROKES: Record<string, string> = {
        acidity: "#d4b830",
        tannin: "#b43232",
        body: "#a05028",
        fruit: "#dc3c50",
        earth: "#8c7850",
        floral: "#c878dc",
      };
      const strokeColor = AXIS_STROKES[maxAxis] ?? "#74070E";

      el.innerHTML = `
        <svg width="${markerSize}" height="${markerSize}" viewBox="0 0 ${markerSize} ${markerSize}" style="display:block;filter:drop-shadow(0 2px 6px rgba(0,0,0,0.4))">
          <circle cx="${cx}" cy="${cy}" r="${r}" fill="rgba(26,20,18,0.85)" stroke="rgba(255,255,255,0.12)" stroke-width="0.5"/>
          ${gridPolygons}
          ${axisLines}
          <polygon points="${dataPoints}" fill="${fillColor}" stroke="${strokeColor}" stroke-width="${markerSize > 40 ? 1.5 : 1}"/>
        </svg>
        <span style="
          display:block;
          margin-top:2px;
          font-size:${markerSize > 40 ? 10 : 8}px;
          font-weight:700;
          color:white;
          text-align:center;
          text-shadow:0 1px 4px rgba(0,0,0,0.8);
          white-space:nowrap;
          max-width:${markerSize * 2}px;
          overflow:hidden;
          text-overflow:ellipsis;
          pointer-events:none;
        ">${profile.region}</span>
      `;

      return el;
    }

    // Determine marker size based on zoom
    function sizeForZoom(zoom: number): number {
      if (zoom < 3) return 30;
      if (zoom < 4) return 36;
      if (zoom < 5) return 42;
      return 50;
    }

    let currentSize = sizeForZoom(map.getZoom());

    for (const profile of REGION_FLAVORS) {
      const coords = REGION_CITIES[profile.region];
      if (!coords) continue;

      const el = buildMarkerEl(profile, currentSize);

      el.addEventListener("click", (e) => {
        e.stopPropagation();
        handleMarkerClick(profile);
        map.flyTo({ center: coords, zoom: 6, duration: 1200 });
      });

      const marker = new mapboxgl.Marker({ element: el, anchor: "center" })
        .setLngLat(coords)
        .addTo(map);

      markersRef.current.push(marker);
    }

    // Resize markers on zoom
    const onZoom = () => {
      const newSize = sizeForZoom(map.getZoom());
      if (newSize === currentSize) return;
      currentSize = newSize;

      // Rebuild all marker elements
      markersRef.current.forEach((marker, idx) => {
        const profile = REGION_FLAVORS[idx];
        if (!profile) return;
        const newEl = buildMarkerEl(profile, newSize);
        newEl.addEventListener("click", (e) => {
          e.stopPropagation();
          handleMarkerClick(profile);
          const coords = REGION_CITIES[profile.region];
          if (coords) map.flyTo({ center: coords, zoom: 6, duration: 1200 });
        });
        (marker as unknown as { _element: HTMLElement })._element.replaceWith(newEl);
        // Update internal reference
        (marker as unknown as { _element: HTMLElement })._element = newEl;
      });
    };
    map.on("zoom", onZoom);

    return () => {
      map.off("zoom", onZoom);
      clearMarkers();
    };
  }, [active, mapReady, mapRef, clearMarkers, handleMarkerClick]);

  // Close detail card when clicking the map background
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !active || !selectedProfile) return;

    const handleMapClick = () => {
      // Only close if the click wasn't on a marker (markers stopPropagation)
      handleClose();
    };

    map.on("click", handleMapClick);
    return () => {
      map.off("click", handleMapClick);
    };
  }, [active, selectedProfile, mapRef, handleClose]);

  if (!active || !selectedProfile) return null;

  return (
    <div
      className="absolute right-3 z-30 bg-[#1A1412]/90 backdrop-blur-xl border border-white/[0.08] rounded-[14px] shadow-[0_8px_32px_rgba(0,0,0,0.4)] overflow-hidden"
      style={{ top: "80px", width: "260px", maxHeight: "calc(100vh - 160px)" }}
    >
      <div className="overflow-y-auto max-h-[calc(100vh-160px)]">
        <DetailCard
          profile={selectedProfile}
          onClose={handleClose}
          onFindSimilar={handleFindSimilar}
        />
        {similarResults && (
          <SimilarResults
            source={selectedProfile}
            results={similarResults}
            onSelect={handleSelectSimilar}
          />
        )}
      </div>
    </div>
  );
}
