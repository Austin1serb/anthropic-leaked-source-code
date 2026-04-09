"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { ChevronLeft, ChevronRight, X, MapPin, Star, Wine, Grape } from "lucide-react";
import mapboxgl from "mapbox-gl";
import {
  SHOWCASE_WINERIES,
  type ShowcaseWinery,
  type ShowcaseWineryPage,
  type ShowcaseWine,
} from "@/data/showcaseWineries";

// ── Types ──

type Props = {
  mapRef: React.RefObject<mapboxgl.Map | null>;
};

// ── Utility ──

const WINE_COLORS: Record<string, string> = {
  red: "#8B1A2B",
  white: "#C8A255",
  rosé: "#D4748A",
};

// ── Showcase Card ──

function ShowcaseCard({
  winery,
  onClose,
}: {
  winery: ShowcaseWinery;
  onClose: () => void;
}) {
  const [page, setPage] = useState(0);
  const [showWines, setShowWines] = useState(false);
  const touchStartX = useRef(0);

  // Total pages = info pages + 1 wines page
  const totalPages = winery.pages.length + 1;
  const isWinePage = page === winery.pages.length;

  const goNext = useCallback(() => setPage((p) => Math.min(p + 1, totalPages - 1)), [totalPages]);
  const goPrev = useCallback(() => setPage((p) => Math.max(p - 1, 0)), []);

  // Swipe support
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };
  const handleTouchEnd = (e: React.TouchEvent) => {
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 50) {
      diff > 0 ? goNext() : goPrev();
    }
  };

  // Keyboard navigation
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") goNext();
      else if (e.key === "ArrowLeft") goPrev();
      else if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [goNext, goPrev, onClose]);

  const currentPage = isWinePage ? null : winery.pages[page];

  return (
    <div
      className="absolute left-3 z-30 flex flex-col"
      style={{ top: "80px", width: "320px", maxHeight: "calc(100vh - 160px)" }}
    >
      <div
        className="rounded-[16px] bg-[#1A1412]/92 backdrop-blur-xl border border-white/[0.08] shadow-[0_12px_48px_rgba(0,0,0,0.5)] overflow-hidden flex flex-col"
        style={{ maxHeight: "calc(100vh - 180px)" }}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {/* ── Header ── */}
        <div className="px-5 pt-4 pb-3 border-b border-white/[0.06] flex-shrink-0">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <Star className="h-3.5 w-3.5 text-[#C8A255] flex-shrink-0" />
                <span className="text-[9px] font-bold text-[#C8A255] uppercase tracking-wider">
                  Premier Grand Cru Classé
                </span>
              </div>
              <h2
                className="text-[20px] font-bold text-white tracking-tight leading-tight"
                style={{ fontFamily: "var(--font-serif, Georgia, serif)" }}
              >
                {winery.name}
              </h2>
              <div className="flex items-center gap-2 mt-1.5">
                <MapPin className="h-3 w-3 text-white/40" />
                <span className="text-[11px] text-white/50">
                  {winery.appellation} · {winery.region}
                </span>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-full bg-white/[0.08] text-white/40 hover:bg-white/15 hover:text-white/70 transition-colors flex-shrink-0"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* ── Page Content ── */}
        <div className="flex-1 overflow-y-auto scrollbar-thin">
          {isWinePage ? (
            // ── Wines Page ──
            <div className="px-5 py-4">
              <div className="flex items-center gap-2 mb-3">
                <Wine className="h-4 w-4 text-[#8B1A2B]" />
                <h3
                  className="text-[15px] font-bold text-white"
                  style={{ fontFamily: "var(--font-serif, Georgia, serif)" }}
                >
                  The Wines
                </h3>
              </div>
              <div className="space-y-3">
                {winery.wines.map((wine) => (
                  <WineCard key={wine.name + wine.vintage} wine={wine} />
                ))}
              </div>
            </div>
          ) : currentPage ? (
            // ── Info Page ──
            <div className="px-5 py-4">
              <h3
                className="text-[15px] font-bold text-white mb-3"
                style={{ fontFamily: "var(--font-serif, Georgia, serif)" }}
              >
                {currentPage.title}
              </h3>

              {/* Text content */}
              <div className="space-y-3 mb-4">
                {currentPage.content.split("\n\n").map((para, i) => (
                  <p key={i} className="text-[12px] text-white/65 leading-relaxed">
                    {para}
                  </p>
                ))}
              </div>

              {/* Stats grid */}
              {currentPage.stats && currentPage.stats.length > 0 && (
                <div className="grid grid-cols-2 gap-2">
                  {currentPage.stats.map((stat) => (
                    <div
                      key={stat.label}
                      className="px-3 py-2 rounded-[8px] bg-white/[0.04]"
                    >
                      <p className="text-[9px] font-bold text-white/30 uppercase tracking-wider">
                        {stat.label}
                      </p>
                      <p className="text-[13px] font-bold text-white/85 mt-0.5">
                        {stat.value}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : null}
        </div>

        {/* ── Page Navigation ── */}
        <div className="px-4 py-3 border-t border-white/[0.06] flex-shrink-0">
          <div className="flex items-center justify-between">
            <button
              onClick={goPrev}
              disabled={page === 0}
              className="w-8 h-8 flex items-center justify-center rounded-full bg-white/[0.06] text-white/50 hover:bg-white/[0.12] hover:text-white transition-colors disabled:opacity-20 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>

            {/* Page dots + labels */}
            <div className="flex flex-col items-center gap-1">
              <span className="text-[10px] font-semibold text-white/40">
                {isWinePage ? "The Wines" : currentPage?.title}
              </span>
              <div className="flex items-center gap-1.5">
                {Array.from({ length: totalPages }).map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setPage(i)}
                    className={`rounded-full transition-all ${
                      i === page
                        ? "w-5 h-1.5 bg-white/60"
                        : "w-1.5 h-1.5 bg-white/20 hover:bg-white/30"
                    }`}
                  />
                ))}
              </div>
            </div>

            <button
              onClick={goNext}
              disabled={page === totalPages - 1}
              className="w-8 h-8 flex items-center justify-center rounded-full bg-white/[0.06] text-white/50 hover:bg-white/[0.12] hover:text-white transition-colors disabled:opacity-20 disabled:cursor-not-allowed"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Wine Mini Card ──

function WineCard({ wine }: { wine: ShowcaseWine }) {
  const color = WINE_COLORS[wine.type] ?? "#8B1A2B";
  return (
    <div className="px-3 py-3 rounded-[10px] bg-white/[0.04] hover:bg-white/[0.07] transition-colors">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
            <p className="text-[13px] font-bold text-white/90 truncate">
              {wine.name}
            </p>
          </div>
          <div className="flex items-center gap-2 mt-1 ml-4">
            <span className="text-[10px] text-white/40">
              {wine.vintage ?? "NV"} · {wine.grape}
            </span>
          </div>
        </div>
        {wine.rating && (
          <span className="text-[12px] font-bold text-[#C8A255] flex-shrink-0">
            {wine.rating}
          </span>
        )}
      </div>
      <p className="text-[11px] text-white/50 leading-relaxed mt-2 ml-4">
        {wine.description}
      </p>
    </div>
  );
}

// ── Main Layer Component ──

const SOURCE_ID = "showcase-wineries";
const FILL_LAYER = "showcase-wineries-fill";
const BORDER_LAYER = "showcase-wineries-border";
const LABEL_LAYER = "showcase-wineries-label";

export function WineryShowcaseLayer({ mapRef }: Props) {
  const [selected, setSelected] = useState<ShowcaseWinery | null>(null);
  const [mapReady, setMapReady] = useState(false);
  const layersAdded = useRef(false);

  const handleClose = useCallback(() => setSelected(null), []);

  // ── Poll for map readiness ──
  useEffect(() => {
    const map = mapRef.current;
    if (map) {
      setMapReady(true);
      return;
    }
    const interval = setInterval(() => {
      if (mapRef.current) {
        setMapReady(true);
        clearInterval(interval);
      }
    }, 200);
    return () => clearInterval(interval);
  }, [mapRef]);

  // ── Add/remove map layers ──
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady) return;

    function addLayers(m: mapboxgl.Map) {
      if (m.getSource(SOURCE_ID)) return;

      // Build GeoJSON FeatureCollection from showcase wineries
      const features: GeoJSON.Feature[] = SHOWCASE_WINERIES.map((w) => ({
        type: "Feature",
        properties: { id: w.id, name: w.name, accentColor: w.accentColor },
        geometry: {
          type: "Polygon",
          coordinates: [w.polygon],
        },
      }));

      m.addSource(SOURCE_ID, {
        type: "geojson",
        data: { type: "FeatureCollection", features },
      });

      // Fill layer — subtle at first, prominent when zoomed in
      // slot:"top" ensures it renders above 3D buildings in Mapbox Standard style
      m.addLayer({
        id: FILL_LAYER,
        type: "fill",
        source: SOURCE_ID,
        slot: "top",
        paint: {
          "fill-color": "#C8A255",
          "fill-opacity": [
            "interpolate", ["linear"], ["zoom"],
            10, 0,
            13, 0.15,
            15, 0.25,
            17, 0.35,
          ],
        },
      } as mapboxgl.FillLayerSpecification & { slot?: string });

      // Border layer — gold outline
      m.addLayer({
        id: BORDER_LAYER,
        type: "line",
        source: SOURCE_ID,
        slot: "top",
        paint: {
          "line-color": "#C8A255",
          "line-width": [
            "interpolate", ["linear"], ["zoom"],
            12, 1,
            15, 3,
            18, 4,
          ],
          "line-opacity": [
            "interpolate", ["linear"], ["zoom"],
            10, 0,
            13, 0.6,
            15, 0.9,
            17, 1,
          ],
        },
      } as mapboxgl.LineLayerSpecification & { slot?: string });

      // Label layer
      m.addLayer({
        id: LABEL_LAYER,
        type: "symbol",
        source: SOURCE_ID,
        slot: "top",
        layout: {
          "text-field": ["get", "name"],
          "text-font": ["DIN Pro Bold", "Arial Unicode MS Bold"],
          "text-size": [
            "interpolate", ["linear"], ["zoom"],
            12, 10,
            15, 14,
            18, 18,
          ],
          "text-offset": [0, -1.5],
          "text-anchor": "bottom",
        },
        paint: {
          "text-color": "#C8A255",
          "text-halo-color": "rgba(26,20,18,0.9)",
          "text-halo-width": 2,
          "text-opacity": [
            "interpolate", ["linear"], ["zoom"],
            11, 0,
            13, 1,
          ],
        },
      });

      layersAdded.current = true;
    }

    // Add layers when map is ready
    if (map.isStyleLoaded()) {
      addLayers(map);
    }
    const onLoad = () => addLayers(map);
    map.on("style.load", onLoad);

    // Click handler
    const onClick = (e: mapboxgl.MapMouseEvent) => {
      const features = map.queryRenderedFeatures(e.point, { layers: [FILL_LAYER] });
      if (features.length > 0) {
        const id = features[0].properties?.id;
        const winery = SHOWCASE_WINERIES.find((w) => w.id === id);
        if (winery) {
          setSelected(winery);
          map.flyTo({
            center: winery.center,
            zoom: Math.max(map.getZoom(), 15),
            pitch: 60,
            bearing: -20,
            duration: 1500,
          });
        }
      }
    };

    // Hover cursor
    const onMouseEnter = () => { map.getCanvas().style.cursor = "pointer"; };
    const onMouseLeave = () => { map.getCanvas().style.cursor = ""; };

    map.on("click", FILL_LAYER, onClick);
    map.on("mouseenter", FILL_LAYER, onMouseEnter);
    map.on("mouseleave", FILL_LAYER, onMouseLeave);

    return () => {
      map.off("style.load", onLoad);
      map.off("click", FILL_LAYER, onClick);
      map.off("mouseenter", FILL_LAYER, onMouseEnter);
      map.off("mouseleave", FILL_LAYER, onMouseLeave);

      // Clean up layers
      try {
        if (map.getLayer(LABEL_LAYER)) map.removeLayer(LABEL_LAYER);
        if (map.getLayer(BORDER_LAYER)) map.removeLayer(BORDER_LAYER);
        if (map.getLayer(FILL_LAYER)) map.removeLayer(FILL_LAYER);
        if (map.getSource(SOURCE_ID)) map.removeSource(SOURCE_ID);
      } catch { /* already removed */ }
      layersAdded.current = false;
    };
  }, [mapRef, mapReady]);

  if (!selected) return null;

  return <ShowcaseCard winery={selected} onClose={handleClose} />;
}
