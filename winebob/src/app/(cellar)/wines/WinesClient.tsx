"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Search, Plus, Wine, Heart, ChevronLeft, ChevronRight,
  ChevronDown, Bookmark, Grape, Layers, Play, Square, Satellite, Map,
  CloudRain, Target, Radio, PenTool,
} from "lucide-react";
import { useState, useTransition, useRef, useCallback } from "react";
import { toggleFavorite } from "@/lib/actions";
import { WineRegionMap, getRegionCities } from "@/components/shared/WineRegionMap";
import type { TourStop } from "@/components/shared/WineRegionMap";
import { TourInfoCard } from "@/components/shared/TourInfoCard";
import { useMapLayers } from "@/hooks/useMapLayers";
import { MapLayerDrawer } from "@/components/shared/MapLayerDrawer";
import type { MapLayer } from "@/components/shared/MapLayerDrawer";
import { VintageWeatherLayer } from "@/components/layers/VintageWeatherLayer";
import { FlavorGenomeLayer } from "@/components/layers/FlavorGenomeLayer";
import { LiveHeatmapLayer } from "@/components/layers/LiveHeatmapLayer";
import DrawFlightLayer from "@/components/layers/DrawFlightLayer";
import mapboxgl from "mapbox-gl";

/* ── Types ── */

type WineItem = {
  id: string; name: string; producer: string; vintage: number | null;
  grapes: string[]; region: string; country: string; type: string;
  priceRange: string | null; description: string | null; labelImage: string | null;
};

type Props = {
  wines: WineItem[]; total: number; pages: number; currentPage: number;
  countries: string[]; regionCounts?: Record<string, number>;
  activeType?: string; activeCountry?: string; activePriceRange?: string; activeSearch?: string;
};

/* ── Constants ── */

const TYPES = [
  { value: "red", label: "Red", color: "#74070E" },
  { value: "white", label: "White", color: "#C8A255" },
  { value: "rosé", label: "Rosé", color: "#C47080" },
  { value: "sparkling", label: "Sparkling", color: "#B8A840" },
  { value: "orange", label: "Orange", color: "#C87840" },
];

const PRICES: Record<string, string> = { budget: "<$15", mid: "$15–40", premium: "$40–100", luxury: "$100+" };

function typeColor(t: string) {
  return TYPES.find((x) => x.value === t.toLowerCase())?.color ?? "#8C7E6E";
}

function buildQ(p: Record<string, string | undefined>) {
  const q = new URLSearchParams();
  for (const [k, v] of Object.entries(p)) { if (v) q.set(k, v); }
  const s = q.toString();
  return s ? `?${s}` : "";
}

/* ── Sheet states ── */
type SheetState = "peek" | "half" | "full";
const SHEET_HEIGHT = "88vh";
const SHEET_TRANSLATE: Record<SheetState, string> = {
  peek: "calc(88vh - 44px)",
  half: "calc(88vh - 50vh)",
  full: "0",
};

const LAYER_ICONS: Record<string, React.ReactNode> = {
  "vintage-weather": <CloudRain size={18} />,
  "flavor-genome": <Target size={18} />,
  "live-heatmap": <Radio size={18} />,
  "draw-flight": <PenTool size={18} />,
};

/* ══════════════════════════════════════════
   COMPONENT
   ══════════════════════════════════════════ */

export function WinesClient({
  wines, total, pages, currentPage, countries, regionCounts,
  activeType, activeCountry, activePriceRange, activeSearch,
}: Props) {
  const router = useRouter();
  const { layers, toggle, isActive } = useMapLayers();
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const fullLayers: MapLayer[] = layers.map((l) => ({ ...l, icon: LAYER_ICONS[l.id] ?? null }));
  const [search, setSearch] = useState(activeSearch ?? "");
  const [favSet, setFavSet] = useState<Set<string>>(new Set());
  const [sheet, setSheet] = useState<SheetState>("peek");
  const [exploreRegion, setExploreRegion] = useState<string | null>(null);
  const [flyToCoords, setFlyToCoords] = useState<[number, number] | null>(null);
  const [tourRegion, setTourRegion] = useState<string | null>(null);
  const [satellite, setSatellite] = useState(false);
  const [activeCity, setActiveCity] = useState<string | null>(null);
  const [activeTourStop, setActiveTourStop] = useState<TourStop | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [, startTransition] = useTransition();

  /* Touch drag state */
  const touchStartY = useRef<number | null>(null);
  const sheetRef = useRef<HTMLDivElement>(null);

  function nav(overrides: Record<string, string | undefined>) {
    const p = { type: activeType, country: activeCountry, priceRange: activePriceRange, search: activeSearch, page: undefined, ...overrides };
    // Track price filter interactions
    if (overrides.priceRange && overrides.priceRange !== activePriceRange) {
      fetch("/api/analytics/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          events: [{
            eventType: "price_filter",
            metadata: { priceRange: overrides.priceRange, resultCount: total },
            sessionId: typeof window !== "undefined" ? sessionStorage.getItem("wb_session_id") : undefined,
          }],
        }),
        keepalive: true,
      }).catch(() => {});
    }
    router.push(`/wines${buildQ(p)}`);
  }

  function onSearch(e: React.FormEvent) {
    e.preventDefault();
    nav({ search: search.trim() || undefined });
    setSheet("half");
  }

  function onRegionClick(region: string) {
    // Only fly to — don't navigate (that causes remount and kills the animation)
    setExploreRegion(region);
    setSearch(region);
    setActiveCity(null);
    setTourRegion(null);
  }

  // Navigate when user explicitly confirms explore (e.g. from sheet header)
  function confirmExplore() {
    if (exploreRegion) nav({ search: exploreRegion });
  }

  function onFav(id: string) {
    startTransition(async () => {
      const r = await toggleFavorite(id);
      setFavSet((prev) => { const n = new Set(prev); r.favorited ? n.add(id) : n.delete(id); return n; });
    });
  }

  /* Touch drag handlers */
  function onTouchStart(e: React.TouchEvent) { touchStartY.current = e.touches[0].clientY; }
  function onTouchEnd(e: React.TouchEvent) {
    if (touchStartY.current === null) return;
    const dy = e.changedTouches[0].clientY - touchStartY.current;
    touchStartY.current = null;
    if (Math.abs(dy) < 40) return;
    if (dy < 0) {
      // Swipe up
      setSheet((s) => s === "peek" ? "half" : s === "half" ? "full" : s);
    } else {
      // Swipe down
      setSheet((s) => s === "full" ? "half" : s === "half" ? "peek" : s);
    }
  }

  const hasFilters = !!(activeType || activeCountry || activePriceRange || activeSearch);
  const featured = wines[0];

  /* ── Shared search bar (dark glass, used on map overlay) ── */
  function SearchBar({ className = "" }: { className?: string }) {
    return (
      <form onSubmit={onSearch} className={className}>
        <div className="flex items-center h-11 rounded-[12px] bg-[#1A1412]/75 backdrop-blur-xl border border-white/[0.08] shadow-[0_4px_20px_rgba(0,0,0,0.15)] px-3.5 gap-2.5">
          <Grape className="h-4 w-4 text-[#E8A08A] flex-shrink-0" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search wines, regions..."
            className="flex-1 bg-transparent text-[14px] text-white/90 placeholder:text-white/30 focus:outline-none"
          />
          <div className="flex items-center gap-1 pl-2.5 border-l border-white/[0.08]">
            <Bookmark className="h-3.5 w-3.5 text-white/30" />
          </div>
        </div>
      </form>
    );
  }

  /* ── Shared filter pills (dark glass) ── */
  function FilterPills({ className = "" }: { className?: string }) {
    return (
      <div className={`flex gap-1.5 overflow-x-auto scrollbar-hide ${className}`}>
        <button
          onClick={() => nav({ type: undefined })}
          className={`flex-shrink-0 h-[30px] px-3 rounded-[8px] text-[11px] font-semibold transition-all ${
            !activeType ? "bg-cherry text-white" : "bg-[#1A1412]/60 backdrop-blur-xl text-white/60 border border-white/[0.06]"
          }`}
        >Wines</button>
        {TYPES.map((t) => (
          <button
            key={t.value}
            onClick={() => nav({ type: activeType === t.value ? undefined : t.value })}
            className={`flex-shrink-0 h-[30px] px-3 rounded-[8px] text-[11px] font-semibold transition-all inline-flex items-center gap-1.5 ${
              activeType === t.value ? "bg-cherry text-white" : "bg-[#1A1412]/60 backdrop-blur-xl text-white/60 border border-white/[0.06]"
            }`}
          >{t.label}</button>
        ))}
      </div>
    );
  }

  /* ── Wine list item ── */
  function WineRow({ wine }: { wine: WineItem }) {
    return (
      <Link
        href={`/wines/${wine.id}`}
        className="flex items-center gap-3 py-3 px-3 border-b border-card-border/20 active:bg-card-border/10 transition-colors"
      >
        <div className="w-[3px] h-9 rounded-full flex-shrink-0" style={{ background: typeColor(wine.type) }} />
        <div className="flex-1 min-w-0">
          <p className="text-[14px] font-semibold text-foreground truncate">{wine.name}</p>
          <p className="text-[11px] text-muted mt-0.5 truncate">
            {wine.producer} · {wine.region}, {wine.country}{wine.vintage ? ` · ${wine.vintage}` : ""}
          </p>
        </div>
        {wine.priceRange && (
          <span className="text-[10px] font-semibold text-cherry bg-cherry/[0.07] px-2 py-0.5 rounded-[5px] flex-shrink-0">
            {PRICES[wine.priceRange] ?? wine.priceRange}
          </span>
        )}
        <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); onFav(wine.id); }} className="p-1 flex-shrink-0">
          <Heart className={`h-4 w-4 ${favSet.has(wine.id) ? "fill-cherry text-cherry" : "text-muted/20"}`} />
        </button>
      </Link>
    );
  }

  /* ── Wine list + pagination ── */
  function WineList() {
    if (wines.length === 0) {
      return (
        <div className="flex flex-col items-center py-20 text-center">
          <Wine className="h-8 w-8 text-muted/15 mb-3" />
          <p className="text-[15px] font-bold text-foreground">No wines found</p>
          <p className="text-[13px] text-muted mt-1">Try a different region or filter</p>
        </div>
      );
    }
    return (
      <>
        {wines.map((w) => <WineRow key={w.id} wine={w} />)}
        {pages > 1 && (
          <div className="flex items-center justify-center gap-3 py-5">
            <button onClick={() => nav({ page: String(Math.max(1, currentPage - 1)) })} disabled={currentPage <= 1} className="h-8 px-3 rounded-[8px] bg-card-bg border border-card-border text-[11px] font-semibold disabled:opacity-30 flex items-center gap-1">
              <ChevronLeft className="h-3 w-3" /> Prev
            </button>
            <span className="text-[11px] font-semibold text-muted">{currentPage}/{pages}</span>
            <button onClick={() => nav({ page: String(Math.min(pages, currentPage + 1)) })} disabled={currentPage >= pages} className="h-8 px-3 rounded-[8px] bg-card-bg border border-card-border text-[11px] font-semibold disabled:opacity-30 flex items-center gap-1">
              Next <ChevronRight className="h-3 w-3" />
            </button>
          </div>
        )}
      </>
    );
  }

  /* ══════════════════════════════════════════
     RENDER
     ══════════════════════════════════════════ */

  return (
    <div className="fixed inset-0">
      {/* ═══ SINGLE MAP — shared between desktop & mobile ═══ */}
      <div className="absolute inset-0">
        <WineRegionMap onRegionClick={onRegionClick} regionCounts={regionCounts} exploreRegion={exploreRegion} flyToCoords={flyToCoords} tourRegion={tourRegion} onTourEnd={() => { setTourRegion(null); setActiveTourStop(null); }} satellite={satellite} onTourStop={setActiveTourStop} height="100%" mapRef={mapRef} />
      </div>

      <MapLayerDrawer layers={fullLayers} onToggle={toggle} />

      {/* Vintage Weather Replay layer */}
      <VintageWeatherLayer
        active={isActive("vintage-weather")}
        mapRef={mapRef}
        region={exploreRegion}
      />

      {/* Flavor Genome Map layer */}
      <FlavorGenomeLayer
        active={isActive("flavor-genome")}
        mapRef={mapRef}
      />

      {/* Live Social Heatmap layer */}
      <LiveHeatmapLayer
        active={isActive("live-heatmap")}
        mapRef={mapRef}
      />

      {/* Draw Your Flight layer */}
      <DrawFlightLayer
        active={isActive("draw-flight")}
        mapRef={mapRef}
      />

      {/* Tour info card — floating overlay */}
      {activeTourStop && tourRegion && (
        <>
          {/* Desktop: bottom-left above filter bar */}
          <div className="hidden lg:block absolute bottom-16 left-4 z-20">
            <TourInfoCard stop={activeTourStop} region={exploreRegion ?? undefined} />
          </div>
          {/* Mobile: above bottom sheet */}
          <div className="lg:hidden absolute bottom-16 left-3 z-20">
            <TourInfoCard stop={activeTourStop} region={exploreRegion ?? undefined} />
          </div>
        </>
      )}

      {/* ═══ DESKTOP (lg+) overlays ═══ */}
      {/* Search overlay */}
      <div className="hidden lg:flex absolute top-4 left-4 z-20 gap-2 items-start" style={{ maxWidth: "420px" }}>
        <SearchBar className="flex-1" />
        <button
          onClick={() => setSatellite((s) => !s)}
          className="h-11 w-11 rounded-[12px] bg-[#1A1412]/70 backdrop-blur-xl border border-white/[0.08] flex items-center justify-center active:scale-90 transition-transform flex-shrink-0"
          title={satellite ? "Map view" : "Satellite view"}
        >
          {satellite ? <Map className="h-4 w-4 text-white/70" /> : <Satellite className="h-4 w-4 text-white/70" />}
        </button>
      </div>

      {/* Bottom bar: filter pills OR city hopping pills */}
      <div className="hidden lg:block absolute bottom-4 left-4 z-20" style={{ right: "calc(400px + 1rem)" }}>
        {exploreRegion ? (
          <div className="flex gap-1.5 overflow-x-auto scrollbar-hide">
            <button
              onClick={() => { setExploreRegion(null); setSearch(""); setTourRegion(null); setActiveCity(null); }}
              className="flex-shrink-0 h-[30px] px-3 rounded-[8px] bg-cherry text-white text-[11px] font-semibold flex items-center gap-1"
            >
              ← {exploreRegion}
            </button>
            {getRegionCities(exploreRegion).length > 1 && (
              <button
                onClick={() => setTourRegion(tourRegion ? null : exploreRegion)}
                className={`flex-shrink-0 h-[30px] px-3 rounded-[8px] text-[11px] font-bold flex items-center gap-1 transition-all ${
                  tourRegion
                    ? "bg-white text-cherry border border-white/40"
                    : "bg-cherry/80 text-white border border-cherry/40"
                }`}
              >
                {tourRegion ? <Square className="h-3 w-3" /> : <Play className="h-3 w-3" />}
                {tourRegion ? "Stop tour" : "Cinematic tour"}
              </button>
            )}
            {getRegionCities(exploreRegion).map((city) => (
              <button
                key={city.name}
                onClick={(e) => { e.stopPropagation(); setTourRegion(null); setActiveCity(city.name); setFlyToCoords([...city.coords]); }}
                className={`flex-shrink-0 h-[30px] px-3 rounded-[8px] text-[11px] font-semibold transition-colors ${
                  activeCity === city.name
                    ? "bg-cherry border-cherry/60 text-white"
                    : "bg-[#1A1412]/60 backdrop-blur-xl text-white/70 border border-white/[0.06] active:bg-cherry active:text-white"
                }`}
              >
                {city.name}
              </button>
            ))}
          </div>
        ) : (
          <FilterPills />
        )}
      </div>

      {/* Floating add button (desktop) */}
      <div className="hidden lg:flex absolute z-20 flex-col gap-2" style={{ right: "calc(400px + 1rem)", top: "50%", transform: "translateY(-50%)" }}>
        <Link href="/wines/add" className="h-10 w-10 rounded-[12px] bg-[#1A1412]/70 backdrop-blur-xl border border-white/[0.06] flex items-center justify-center text-white/50 shadow-[0_2px_12px_rgba(0,0,0,0.15)] active:scale-90 transition-transform" title="Add wine">
          <Plus className="h-4 w-4" />
        </Link>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:flex absolute top-0 right-0 bottom-0 w-[400px] xl:w-[440px] flex-col bg-background border-l border-card-border/40 z-20">
        <div className="px-5 pt-5 pb-3 border-b border-card-border/40">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-[17px] font-bold text-foreground tracking-tight" style={{ fontFamily: "var(--font-serif, Georgia, serif)" }}>
              {activeSearch || "All Wines"}
            </h2>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold text-muted bg-muted/[0.08] px-2 py-0.5 rounded-[5px]">{total}</span>
              {hasFilters && <button onClick={() => router.push("/wines")} className="text-[11px] font-semibold text-cherry">Clear</button>}
            </div>
          </div>
          <div className="flex gap-2">
            <select value={activeCountry ?? ""} onChange={(e) => nav({ country: e.target.value || undefined })} className="input-field flex-1 text-[11px] py-2">
              <option value="">All countries</option>
              {countries.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            <select value={activePriceRange ?? ""} onChange={(e) => nav({ priceRange: e.target.value || undefined })} className="input-field flex-1 text-[11px] py-2">
              <option value="">Any price</option>
              <option value="budget">Budget</option><option value="mid">Mid-range</option>
              <option value="premium">Premium</option><option value="luxury">Luxury</option>
            </select>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          <WineList />
        </div>
      </div>

      {/* ═══ MOBILE (<lg) overlays ═══ */}
      {/* Top: search + add */}
      <div className="lg:hidden absolute top-0 left-0 right-0 z-20 safe-top px-3 pt-3">
        <div className="flex gap-2">
          <SearchBar className="flex-1" />
          <button
            onClick={() => setSatellite((s) => !s)}
            className="h-11 w-11 rounded-[12px] bg-[#1A1412]/70 backdrop-blur-xl border border-white/[0.08] flex items-center justify-center active:scale-90 transition-transform flex-shrink-0"
            title={satellite ? "Map view" : "Satellite view"}
          >
            {satellite ? <Map className="h-4.5 w-4.5 text-white/70" /> : <Satellite className="h-4.5 w-4.5 text-white/70" />}
          </button>
          <Link href="/wines/add" className="h-11 w-11 rounded-[12px] bg-cherry flex items-center justify-center shadow-[0_2px_10px_rgba(116,7,14,0.3)] active:scale-90 transition-transform flex-shrink-0">
            <Plus className="h-5 w-5 text-white" strokeWidth={2.5} />
          </Link>
        </div>
        {/* Filter pills OR city pills */}
        <div className="mt-2">
          {exploreRegion ? (
            <div className="flex gap-1.5 overflow-x-auto scrollbar-hide">
              <button
                onClick={() => { setExploreRegion(null); setSearch(""); setSheet("peek"); setTourRegion(null); setActiveCity(null); }}
                className="flex-shrink-0 h-[30px] px-3 rounded-[8px] bg-cherry text-white text-[11px] font-semibold flex items-center gap-1"
              >
                ← {exploreRegion}
              </button>
              {getRegionCities(exploreRegion).length > 1 && (
                <button
                  onClick={() => setTourRegion(tourRegion ? null : exploreRegion)}
                  className={`flex-shrink-0 h-[30px] px-3 rounded-[8px] text-[11px] font-bold flex items-center gap-1 transition-all ${
                    tourRegion
                      ? "bg-white text-cherry border border-white/40"
                      : "bg-cherry/80 text-white border border-cherry/40"
                  }`}
                >
                  {tourRegion ? <Square className="h-3 w-3" /> : <Play className="h-3 w-3" />}
                  {tourRegion ? "Stop" : "Tour"}
                </button>
              )}
              {getRegionCities(exploreRegion).map((city) => (
                <button
                  key={city.name}
                  onClick={(e) => { e.stopPropagation(); setTourRegion(null); setActiveCity(city.name); setFlyToCoords([...city.coords]); }}
                  className={`flex-shrink-0 h-[30px] px-3 rounded-[8px] text-[11px] font-semibold transition-colors ${
                    activeCity === city.name
                      ? "bg-cherry border-cherry/60 text-white"
                      : "bg-[#1A1412]/60 backdrop-blur-xl text-white/70 border border-white/[0.06] active:bg-cherry active:text-white"
                  }`}
                >
                  {city.name}
                </button>
              ))}
            </div>
          ) : (
            <FilterPills />
          )}
        </div>
      </div>

      {/* Mobile bottom sheet */}
      <div
        ref={sheetRef}
        className="lg:hidden absolute left-0 right-0 bottom-0 z-30 will-change-transform"
        style={{
          height: SHEET_HEIGHT,
          transform: `translateY(${SHEET_TRANSLATE[sheet]})`,
          transition: "transform 0.3s cubic-bezier(0.32, 0.72, 0, 1)",
        }}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        <div className="h-full flex flex-col bg-background rounded-t-[16px] shadow-[0_-4px_20px_rgba(0,0,0,0.1)] border-t border-card-border/30">
          {/* Drag handle */}
          <div className="flex items-center justify-center py-2.5 touch-target" onClick={() => setSheet(sheet === "peek" ? "half" : sheet === "half" ? "full" : "half")}>
            <div className="w-9 h-[3px] rounded-full bg-muted/20" />
          </div>

          {sheet !== "peek" && (
            /* ── Half / Full: wine list ── */
            <>
              <div className="px-4 flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <h2 className="text-[16px] font-bold text-foreground tracking-tight">
                    {exploreRegion || activeSearch || "All Wines"}
                  </h2>
                  <span className="text-[10px] font-bold text-muted bg-muted/[0.08] px-1.5 py-0.5 rounded-[4px]">{total}</span>
                </div>
                <div className="flex items-center gap-2">
                  {exploreRegion && (
                    <button onClick={confirmExplore} className="text-[11px] font-semibold text-white bg-cherry px-3 py-1 rounded-[8px]">
                      View wines →
                    </button>
                  )}
                  {hasFilters && !exploreRegion && (
                    <button onClick={() => router.push("/wines")} className="text-[11px] font-semibold text-cherry">Clear</button>
                  )}
                  <button onClick={() => setSheet("peek")}><ChevronDown className="h-4 w-4 text-muted/30" /></button>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto pb-24">
                <WineList />
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
