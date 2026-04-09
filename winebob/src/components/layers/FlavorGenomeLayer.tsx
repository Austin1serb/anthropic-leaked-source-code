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
          stroke="rgba(255,255,255,0.15)"
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
            stroke="rgba(255,255,255,0.15)"
            strokeWidth={0.5}
          />
        );
      })}

      {/* Data polygon */}
      <polygon
        points={radarPoints(profile, size, padding)}
        fill="rgba(160, 30, 40, 0.35)"
        stroke="#c03040"
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
            r={size > 60 ? 3 : 2}
            fill="#e04050"
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
              fill="rgba(255,255,255,0.75)"
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
  const maxAxis = FLAVOR_AXES.reduce((a, b) => (profile[a] > profile[b] ? a : b));
  const DOMINANT_COLORS: Record<string, string> = {
    acidity: "#ffd700", tannin: "#e03030", body: "#c06020",
    fruit: "#f03060", earth: "#a08c50", floral: "#d070f0",
  };
  const accentColor = DOMINANT_COLORS[maxAxis] ?? "#74070E";

  return (
    <div className="flex flex-col gap-4 p-5">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[17px] font-bold text-white tracking-tight font-serif">{profile.region}</p>
          <p className="text-[11px] text-white/55 mt-0.5">{profile.country}</p>
        </div>
        <button
          onClick={onClose}
          className="w-7 h-7 flex items-center justify-center rounded-full bg-white/[0.08] text-white/40 hover:bg-white/15 hover:text-white/70 transition-colors"
        >
          <span className="text-[14px]">✕</span>
        </button>
      </div>

      {/* Radar chart — larger */}
      <div className="flex justify-center">
        <RadarSVG profile={profile} size={140} showLabels padding={24} />
      </div>

      {/* Dominant trait highlight */}
      <div className="flex items-center gap-2 px-3 py-2 rounded-[10px] bg-white/[0.10]">
        <div className="h-2 w-2 rounded-full" style={{ backgroundColor: accentColor }} />
        <span className="text-[11px] font-semibold text-white/85">
          Dominant: <span className="text-white" style={{ color: accentColor }}>{FLAVOR_LABELS[maxAxis]}</span>
        </span>
        <span className="ml-auto text-[12px] font-bold text-white/95 tabular-nums">{(profile[maxAxis] * 100).toFixed(0)}%</span>
      </div>

      {/* Axis values — horizontal bars */}
      <div className="space-y-2">
        {FLAVOR_AXES.map((axis) => {
          const val = profile[axis];
          const isMax = axis === maxAxis;
          return (
            <div key={axis} className="flex items-center gap-2">
              <span className={`text-[10px] font-semibold w-10 ${isMax ? "text-white" : "text-white/60"}`}>
                {FLAVOR_LABELS[axis]}
              </span>
              <div className="flex-1 h-1.5 rounded-full bg-white/[0.12] overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${val * 100}%`,
                    backgroundColor: isMax ? accentColor : "rgba(255,255,255,0.40)",
                  }}
                />
              </div>
              <span className={`text-[10px] font-bold tabular-nums w-7 text-right ${isMax ? "text-white" : "text-white/70"}`}>
                {(val * 100).toFixed(0)}
              </span>
            </div>
          );
        })}
      </div>

      {/* Find Similar button */}
      <button
        onClick={onFindSimilar}
        className="w-full py-2.5 rounded-[10px] text-[12px] font-bold transition-colors"
        style={{ backgroundColor: `${accentColor}30`, color: accentColor }}
        onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = `${accentColor}50`; }}
        onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = `${accentColor}30`; }}
      >
        Find Similar Regions →
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
    <div className="border-t border-white/[0.10] pt-3 px-4 pb-4">
      <p className="text-[10px] font-bold text-white/50 uppercase tracking-wider mb-2">
        Regions similar to {source.region}
      </p>
      <div className="flex flex-col gap-2 max-h-[220px] overflow-y-auto scrollbar-thin">
        {results.map((r) => (
          <button
            key={r.profile.region}
            onClick={() => onSelect(r.profile)}
            className="flex items-center gap-3 p-2.5 rounded-[10px] bg-white/[0.07] hover:bg-white/[0.12] transition-colors text-left group"
          >
            <RadarSVG profile={r.profile} size={40} padding={3} />
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[12px] font-bold text-white truncate">
                  {r.profile.region}
                </span>
                <span className="text-[11px] font-bold text-[#e8a040] flex-shrink-0">
                  {(r.similarity * 100).toFixed(0)}%
                </span>
              </div>
              <p className="text-[10px] text-white/60 truncate">
                {r.profile.country}
              </p>
              <p className="text-[10px] text-white/70 italic mt-0.5 truncate">
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
      el.style.transition = "transform 0.2s ease, filter 0.2s ease";
      el.style.animation = "flavorPop 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) both";
      el.addEventListener("mouseenter", () => { el.style.transform = "scale(1.2)"; el.style.filter = "brightness(1.2)"; });
      el.addEventListener("mouseleave", () => { el.style.transform = "scale(1)"; el.style.filter = "brightness(1)"; });

      const padding = 4;
      const cx = markerSize / 2;
      const cy = markerSize / 2;
      const r = (markerSize - padding * 2) / 2;

      // Grid rings at 33%, 66%, 100%
      const levels = [0.33, 0.66, 1.0];
      const gridPolygons = levels
        .map((level) => {
          const pts = FLAVOR_AXES.map((_, i) => {
            const angle = (Math.PI * 2 * i) / FLAVOR_AXES.length - Math.PI / 2;
            return `${cx + r * level * Math.cos(angle)},${cy + r * level * Math.sin(angle)}`;
          }).join(" ");
          return `<polygon points="${pts}" fill="none" stroke="rgba(255,255,255,0.2)" stroke-width="0.5" stroke-dasharray="${level < 1 ? '2,2' : 'none'}"/>`;
        })
        .join("");

      const axisLines = FLAVOR_AXES.map((_, i) => {
        const angle = (Math.PI * 2 * i) / FLAVOR_AXES.length - Math.PI / 2;
        return `<line x1="${cx}" y1="${cy}" x2="${cx + r * Math.cos(angle)}" y2="${cy + r * Math.sin(angle)}" stroke="rgba(255,255,255,0.15)" stroke-width="0.5"/>`;
      }).join("");

      // Axis labels at the tips (only on larger markers)
      const AXIS_LABELS = ["Acid", "Tan", "Body", "Fruit", "Earth", "Flora"];
      const axisLabelEls = markerSize >= 50 ? FLAVOR_AXES.map((_, i) => {
        const angle = (Math.PI * 2 * i) / FLAVOR_AXES.length - Math.PI / 2;
        const lx = cx + (r + 8) * Math.cos(angle);
        const ly = cy + (r + 8) * Math.sin(angle);
        return `<text x="${lx}" y="${ly}" text-anchor="middle" dominant-baseline="central" fill="rgba(255,255,255,0.4)" font-size="6" font-weight="600" font-family="system-ui">${AXIS_LABELS[i]}</text>`;
      }).join("") : "";

      const dataPoints = FLAVOR_AXES.map((axis, i) => {
        const angle = (Math.PI * 2 * i) / FLAVOR_AXES.length - Math.PI / 2;
        const val = profile[axis];
        return `${cx + r * val * Math.cos(angle)},${cy + r * val * Math.sin(angle)}`;
      }).join(" ");

      // Data point dots at each axis value
      const dataDots = FLAVOR_AXES.map((axis, i) => {
        const angle = (Math.PI * 2 * i) / FLAVOR_AXES.length - Math.PI / 2;
        const val = profile[axis];
        const dx = cx + r * val * Math.cos(angle);
        const dy = cy + r * val * Math.sin(angle);
        return `<circle cx="${dx}" cy="${dy}" r="${markerSize > 40 ? 2.5 : 1.5}" fill="white" opacity="0.9"/>`;
      }).join("");

      // Dominant trait determines vivid accent color
      const maxAxis = FLAVOR_AXES.reduce((a, b) => (profile[a] > profile[b] ? a : b));
      const AXIS_COLORS: Record<string, { fill: string; stroke: string; glow: string }> = {
        acidity: { fill: "rgba(255,220,50,0.6)", stroke: "#ffd700", glow: "rgba(255,220,50,0.4)" },
        tannin: { fill: "rgba(200,40,40,0.6)", stroke: "#e03030", glow: "rgba(200,40,40,0.4)" },
        body: { fill: "rgba(180,100,40,0.6)", stroke: "#c06020", glow: "rgba(180,100,40,0.4)" },
        fruit: { fill: "rgba(240,60,90,0.6)", stroke: "#f03060", glow: "rgba(240,60,90,0.4)" },
        earth: { fill: "rgba(160,140,80,0.6)", stroke: "#a08c50", glow: "rgba(160,140,80,0.4)" },
        floral: { fill: "rgba(220,120,240,0.6)", stroke: "#d070f0", glow: "rgba(220,120,240,0.4)" },
      };
      const colors = AXIS_COLORS[maxAxis] ?? { fill: "rgba(116,7,14,0.6)", stroke: "#b01020", glow: "rgba(116,7,14,0.4)" };

      const svgSize = markerSize + (markerSize >= 50 ? 20 : 0);
      const offset = (svgSize - markerSize) / 2;

      el.innerHTML = `
        <svg width="${svgSize}" height="${svgSize}" viewBox="0 0 ${svgSize} ${svgSize}" style="display:block">
          <defs>
            <filter id="glow-${profile.region.replace(/\s/g, "")}" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur in="SourceGraphic" stdDeviation="3" result="blur"/>
              <feMerge>
                <feMergeNode in="blur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
          </defs>
          <g transform="translate(${offset},${offset})">
            <circle cx="${cx}" cy="${cy}" r="${r + 1}" fill="rgba(26,20,18,0.75)" stroke="${colors.stroke}" stroke-width="1" stroke-opacity="0.4"/>
            ${gridPolygons}
            ${axisLines}
            <polygon points="${dataPoints}" fill="${colors.fill}" stroke="${colors.stroke}" stroke-width="${markerSize > 40 ? 2 : 1.5}" filter="url(#glow-${profile.region.replace(/\s/g, "")})" stroke-linejoin="round"/>
            ${dataDots}
            ${axisLabelEls}
          </g>
        </svg>
        <span style="
          display:block;
          margin-top:3px;
          font-size:${markerSize > 40 ? 11 : 9}px;
          font-weight:700;
          color:white;
          text-align:center;
          text-shadow:0 1px 6px rgba(0,0,0,0.9), 0 0 12px ${colors.glow};
          white-space:nowrap;
          max-width:${markerSize * 2.5}px;
          overflow:hidden;
          text-overflow:ellipsis;
          pointer-events:none;
          letter-spacing:0.02em;
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

    // Use a container div overlaid on the map for manual positioning
    // (Mapbox Markers with the "standard" style have positioning bugs)
    const container = document.createElement("div");
    container.style.cssText = "position:absolute;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:5;";
    map.getContainer().appendChild(container);

    let currentSize = sizeForZoom(map.getZoom());
    const markerEls: { el: HTMLElement; coords: [number, number] }[] = [];

    // Position all marker elements using map.project()
    function updatePositions() {
      if (!map) return;
      for (const { el, coords } of markerEls) {
        const point = map.project(coords as mapboxgl.LngLatLike);
        el.style.transform = `translate(${point.x}px, ${point.y}px) translate(-50%, -50%)`;
      }
    }

    function rebuildMarkers() {
      if (!map) return;
      // Clear existing
      markerEls.length = 0;
      container.innerHTML = "";

      const size = sizeForZoom(map.getZoom());
      currentSize = size;

      for (const profile of REGION_FLAVORS) {
        const coords = REGION_CITIES[profile.region];
        if (!coords) continue;

        // Inner element handles visuals (hover scale, pop-in animation).
        // Kept separate from the wrapper so the flavorPop CSS animation
        // (fill-mode:both) doesn't override the positioning transform.
        const inner = buildMarkerEl(profile, size);

        inner.addEventListener("click", (e) => {
          e.stopPropagation();
          handleMarkerClick(profile);
          map!.flyTo({ center: coords, zoom: 6, duration: 1200 });
        });

        // Outer wrapper only handles positioning via translate transform
        const wrapper = document.createElement("div");
        wrapper.style.position = "absolute";
        wrapper.style.top = "0";
        wrapper.style.left = "0";
        wrapper.style.pointerEvents = "auto";
        wrapper.appendChild(inner);

        container.appendChild(wrapper);
        markerEls.push({ el: wrapper, coords });
      }

      updatePositions();
    }

    rebuildMarkers();

    // Reposition on every render frame (pan, zoom, rotate)
    const onRender = () => updatePositions();
    map.on("render", onRender);

    // Rebuild on zoom change (marker size changes)
    const onZoom = () => {
      const newSize = sizeForZoom(map!.getZoom());
      if (newSize !== currentSize) rebuildMarkers();
    };
    map.on("zoomend", onZoom);

    return () => {
      map!.off("render", onRender);
      map!.off("zoomend", onZoom);
      container.remove();
      markerEls.length = 0;
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
