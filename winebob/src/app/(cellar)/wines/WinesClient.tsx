"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Search, Plus, Wine, Heart, ChevronLeft, ChevronRight,
  ChevronDown, Bookmark, Grape, Layers,
} from "lucide-react";
import { useState, useTransition, useRef, useCallback } from "react";
import { toggleFavorite } from "@/lib/actions";
import { WineRegionMap } from "@/components/shared/WineRegionMap";

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
type SheetState = "collapsed" | "half" | "full";
const SHEET_HEIGHTS: Record<SheetState, string> = {
  collapsed: "140px",
  half: "50vh",
  full: "88vh",
};

/* ══════════════════════════════════════════
   COMPONENT
   ══════════════════════════════════════════ */

export function WinesClient({
  wines, total, pages, currentPage, countries, regionCounts,
  activeType, activeCountry, activePriceRange, activeSearch,
}: Props) {
  const router = useRouter();
  const [search, setSearch] = useState(activeSearch ?? "");
  const [favSet, setFavSet] = useState<Set<string>>(new Set());
  const [sheet, setSheet] = useState<SheetState>("collapsed");
  const [exploreRegion, setExploreRegion] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [, startTransition] = useTransition();

  /* Touch drag state */
  const touchStartY = useRef<number | null>(null);
  const sheetRef = useRef<HTMLDivElement>(null);

  function nav(overrides: Record<string, string | undefined>) {
    const p = { type: activeType, country: activeCountry, priceRange: activePriceRange, search: activeSearch, page: undefined, ...overrides };
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
    setSheet("half");
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
      setSheet((s) => s === "collapsed" ? "half" : s === "half" ? "full" : s);
    } else {
      // Swipe down
      setSheet((s) => s === "full" ? "half" : s === "half" ? "collapsed" : s);
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
    <>
      {/* ═══ DESKTOP (lg+): map left, sidebar right ═══ */}
      <div className="hidden lg:flex fixed inset-0">
        {/* Map */}
        <div className="flex-1 relative">
          <WineRegionMap onRegionClick={onRegionClick} regionCounts={regionCounts} exploreRegion={exploreRegion} height="100%" />

          {/* Search overlay */}
          <div className="absolute top-4 left-4 z-20 w-full max-w-sm">
            <SearchBar />
          </div>

          {/* Filter pills overlay */}
          <div className="absolute bottom-4 left-4 z-20">
            <FilterPills />
          </div>

          {/* Floating buttons */}
          <div className="absolute right-4 top-1/2 -translate-y-1/2 z-20 flex flex-col gap-2">
            {exploreRegion && (
              <button
                onClick={() => { setExploreRegion(null); setSearch(""); }}
                className="h-10 px-3 rounded-[12px] bg-[#1A1412]/80 backdrop-blur-xl border border-white/[0.08] flex items-center gap-1.5 text-white/70 shadow-[0_2px_12px_rgba(0,0,0,0.2)] active:scale-90 transition-transform"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
                <span className="text-[11px] font-semibold">World</span>
              </button>
            )}
            <Link href="/wines/add" className="h-10 w-10 rounded-[12px] bg-[#1A1412]/70 backdrop-blur-xl border border-white/[0.06] flex items-center justify-center text-white/50 shadow-[0_2px_12px_rgba(0,0,0,0.15)] active:scale-90 transition-transform" title="Add wine">
              <Plus className="h-4 w-4" />
            </Link>
          </div>

          {/* Explore region badge */}
          {exploreRegion && (
            <div className="absolute left-4 bottom-16 z-20">
              <div className="px-4 py-2.5 rounded-[12px] bg-cherry/90 backdrop-blur-xl shadow-[0_2px_12px_rgba(116,7,14,0.3)]">
                <p className="text-[10px] font-bold text-white/50 uppercase tracking-wider">Exploring</p>
                <p className="text-[16px] font-bold text-white">{exploreRegion}</p>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="w-[400px] xl:w-[440px] flex flex-col bg-background border-l border-card-border/40">
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
      </div>

      {/* ═══ MOBILE (<lg): fullscreen map + bottom sheet ═══ */}
      <div className="lg:hidden fixed inset-0">
        {/* Map background */}
        <div className="absolute inset-0">
          <WineRegionMap onRegionClick={onRegionClick} regionCounts={regionCounts} exploreRegion={exploreRegion} height="100%" />
        </div>

        {/* Top overlays */}
        <div className="absolute top-0 left-0 right-0 z-20 safe-top px-3 pt-3">
          <div className="flex gap-2">
            <SearchBar className="flex-1" />
            <Link href="/wines/add" className="h-11 w-11 rounded-[12px] bg-cherry flex items-center justify-center shadow-[0_2px_10px_rgba(116,7,14,0.3)] active:scale-90 transition-transform flex-shrink-0">
              <Plus className="h-5 w-5 text-white" strokeWidth={2.5} />
            </Link>
          </div>
          <div className="mt-2">
            <FilterPills />
          </div>
        </div>

        {/* Right floating */}
        <div className="absolute right-3 z-20 flex flex-col gap-2" style={{ top: "35%" }}>
          {exploreRegion && (
            <button
              onClick={() => { setExploreRegion(null); setSearch(""); setSheet("collapsed"); }}
              className="h-10 px-3 rounded-[12px] bg-[#1A1412]/80 backdrop-blur-xl border border-white/[0.08] flex items-center gap-1.5 text-white/70 shadow-[0_2px_12px_rgba(0,0,0,0.2)] active:scale-90 transition-transform"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
              <span className="text-[11px] font-semibold">World</span>
            </button>
          )}
          <button className="h-10 w-10 rounded-[12px] bg-[#1A1412]/70 backdrop-blur-xl border border-white/[0.06] flex items-center justify-center text-white/40 shadow-[0_2px_12px_rgba(0,0,0,0.15)]">
            <Layers className="h-4 w-4" />
          </button>
        </div>

        {/* Explore region badge */}
        {exploreRegion && (
          <div className="absolute left-3 z-20" style={{ top: "35%" }}>
            <div className="px-3 py-2 rounded-[12px] bg-cherry/90 backdrop-blur-xl shadow-[0_2px_12px_rgba(116,7,14,0.3)]">
              <p className="text-[10px] font-bold text-white/50 uppercase tracking-wider">Exploring</p>
              <p className="text-[14px] font-bold text-white">{exploreRegion}</p>
            </div>
          </div>
        )}

        {/* Bottom sheet */}
        <div
          ref={sheetRef}
          className="absolute left-0 right-0 bottom-0 z-30"
          style={{
            height: SHEET_HEIGHTS[sheet],
            transition: "height 0.3s cubic-bezier(0.32, 0.72, 0, 1)",
          }}
          onTouchStart={onTouchStart}
          onTouchEnd={onTouchEnd}
        >
          <div className="h-full flex flex-col bg-background rounded-t-[16px] shadow-[0_-4px_20px_rgba(0,0,0,0.1)] border-t border-card-border/30">
            {/* Drag handle */}
            <div className="flex items-center justify-center py-2.5 touch-target" onClick={() => setSheet(sheet === "collapsed" ? "half" : sheet === "half" ? "full" : "half")}>
              <div className="w-9 h-[3px] rounded-full bg-muted/20" />
            </div>

            {sheet === "collapsed" ? (
              /* ── Collapsed: featured wine preview ── */
              <div className="px-3 pb-2">
                {featured ? (
                  <Link href={`/wines/${featured.id}`} className="flex items-center gap-3 p-2.5 rounded-[12px] bg-card-bg border border-card-border shadow-sm active:scale-[0.99] transition-transform">
                    <div className="w-[52px] h-[52px] rounded-[10px] flex items-center justify-center flex-shrink-0" style={{ background: `${typeColor(featured.type)}15` }}>
                      <Wine className="h-5 w-5" style={{ color: typeColor(featured.type), opacity: 0.5 }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-semibold text-foreground truncate">{featured.name}</p>
                      <p className="text-[10px] text-muted mt-0.5 truncate">{featured.producer} · {featured.region}</p>
                    </div>
                    <span className="text-[10px] font-semibold text-cherry">Discover →</span>
                  </Link>
                ) : (
                  <p className="text-[12px] text-muted text-center py-3">Tap a region to explore</p>
                )}
              </div>
            ) : (
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
                    <button onClick={() => setSheet("collapsed")}><ChevronDown className="h-4 w-4 text-muted/30" /></button>
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
    </>
  );
}
