"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Search, Plus, Wine, Heart, MapPin, ChevronLeft, ChevronRight,
  ChevronDown, Bookmark, Grape, ZoomIn, ZoomOut, Layers,
} from "lucide-react";
import { useState, useTransition, useRef } from "react";
import { toggleFavorite } from "@/lib/actions";
import { WineRegionMap } from "@/components/shared/WineRegionMap";

type WineItem = {
  id: string; name: string; producer: string; vintage: number | null;
  grapes: string[]; region: string; country: string; type: string;
  priceRange: string | null; description: string | null; labelImage: string | null;
};

type WinesClientProps = {
  wines: WineItem[]; total: number; pages: number; currentPage: number;
  countries: string[]; regionCounts?: Record<string, number>;
  activeType?: string; activeCountry?: string; activePriceRange?: string; activeSearch?: string;
};

const WINE_TYPES = [
  { value: "red", label: "Red", color: "#74070E" },
  { value: "white", label: "White", color: "#C8A255" },
  { value: "rosé", label: "Rosé", color: "#C47080" },
  { value: "sparkling", label: "Sparkling", color: "#B8A840" },
  { value: "orange", label: "Orange", color: "#C87840" },
];

const PRICE_LABELS: Record<string, string> = {
  budget: "Under $15", mid: "$15–40", premium: "$40–100", luxury: "$100+",
};

function typeColor(type: string): string {
  switch (type.toLowerCase()) {
    case "red": return "#74070E"; case "white": return "#C8A255";
    case "rosé": return "#C47080"; case "sparkling": return "#B8A840";
    case "orange": return "#C87840"; default: return "#8C7E6E";
  }
}

function buildQuery(params: Record<string, string | undefined>) {
  const q = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) { if (v) q.set(k, v); }
  const str = q.toString();
  return str ? `?${str}` : "";
}

export function WinesClient({
  wines, total, pages, currentPage, countries, regionCounts,
  activeType, activeCountry, activePriceRange, activeSearch,
}: WinesClientProps) {
  const router = useRouter();
  const [search, setSearch] = useState(activeSearch ?? "");
  const [favSet, setFavSet] = useState<Set<string>>(new Set());
  const [sheetOpen, setSheetOpen] = useState(false);
  const [, startTransition] = useTransition();

  function navigate(overrides: Record<string, string | undefined>) {
    const params = { type: activeType, country: activeCountry, priceRange: activePriceRange, search: activeSearch, page: undefined, ...overrides };
    router.push(`/wines${buildQuery(params)}`);
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    navigate({ search: search.trim() || undefined });
    setSheetOpen(true);
  }

  function handleRegionClick(region: string) {
    navigate({ search: region });
    setSheetOpen(true);
  }

  function handleToggleFav(wineId: string) {
    startTransition(async () => {
      const result = await toggleFavorite(wineId);
      setFavSet((prev) => { const next = new Set(prev); if (result.favorited) next.add(wineId); else next.delete(wineId); return next; });
    });
  }

  const hasFilters = !!(activeType || activeCountry || activePriceRange || activeSearch);
  const featuredWine = wines[0];

  /* ── Wine list component — reused in both mobile sheet and desktop sidebar ── */
  function WineList({ className = "" }: { className?: string }) {
    return (
      <div className={className}>
        {wines.length === 0 ? (
          <div className="flex flex-col items-center py-16 text-center">
            <Wine className="h-8 w-8 text-muted/15 mb-3" />
            <p className="text-[15px] font-bold text-foreground">No wines found</p>
            <p className="text-[13px] text-muted mt-1">Try a different region</p>
          </div>
        ) : (
          <>
            {wines.map((wine) => (
              <Link
                key={wine.id}
                href={`/wines/${wine.id}`}
                className="flex items-center gap-3 py-3 px-3 border-b border-card-border/30 active:bg-card-border/10 transition-colors"
              >
                {/* Type color strip */}
                <div className="w-1 h-10 rounded-full flex-shrink-0" style={{ background: typeColor(wine.type) }} />

                <div className="flex-1 min-w-0">
                  <p className="text-[14px] font-semibold text-foreground truncate">{wine.name}</p>
                  <p className="text-[11px] text-muted mt-0.5 truncate">
                    {wine.producer} · {wine.region}, {wine.country}{wine.vintage ? ` · ${wine.vintage}` : ""}
                  </p>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  {wine.priceRange && (
                    <span className="text-[10px] font-semibold text-cherry bg-cherry/8 px-2 py-0.5 rounded-[6px]">
                      {PRICE_LABELS[wine.priceRange] ?? wine.priceRange}
                    </span>
                  )}
                  <button
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleToggleFav(wine.id); }}
                    className="p-1"
                  >
                    <Heart className={`h-4 w-4 ${favSet.has(wine.id) ? "fill-cherry text-cherry" : "text-muted/20"}`} />
                  </button>
                </div>
              </Link>
            ))}

            {/* Pagination */}
            {pages > 1 && (
              <div className="flex items-center justify-center gap-3 py-5">
                <button
                  onClick={() => navigate({ page: String(Math.max(1, currentPage - 1)) })}
                  disabled={currentPage <= 1}
                  className="h-9 px-3 rounded-[8px] bg-card-bg border border-card-border text-[12px] font-semibold text-foreground disabled:opacity-30 flex items-center gap-1"
                >
                  <ChevronLeft className="h-3.5 w-3.5" /> Prev
                </button>
                <span className="text-[12px] font-semibold text-muted">{currentPage} / {pages}</span>
                <button
                  onClick={() => navigate({ page: String(Math.min(pages, currentPage + 1)) })}
                  disabled={currentPage >= pages}
                  className="h-9 px-3 rounded-[8px] bg-card-bg border border-card-border text-[12px] font-semibold text-foreground disabled:opacity-30 flex items-center gap-1"
                >
                  Next <ChevronRight className="h-3.5 w-3.5" />
                </button>
              </div>
            )}
          </>
        )}
      </div>
    );
  }

  /* ── Desktop: map + sidebar ── */
  /* ── Mobile: fullscreen map + bottom sheet ── */

  return (
    <>
      {/* ══════════════════════════════════════════
          DESKTOP LAYOUT (lg+): map left, list right
          ══════════════════════════════════════════ */}
      <div className="hidden lg:flex fixed inset-0">
        {/* Map — takes remaining space */}
        <div className="flex-1 relative">
          <WineRegionMap
            onRegionClick={handleRegionClick}
            regionCounts={regionCounts}
            height="100%"
            className="rounded-none"
          />

          {/* Search overlay on map */}
          <div className="absolute top-4 left-4 right-4 z-20">
            <form onSubmit={handleSearch} className="max-w-md">
              <div className="flex items-center h-11 rounded-[12px] bg-[#1A1412]/80 backdrop-blur-xl border border-white/10 shadow-[0_4px_20px_rgba(0,0,0,0.2)] px-3.5 gap-2.5">
                <Grape className="h-4 w-4 text-cherry flex-shrink-0" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search wines, regions..."
                  className="flex-1 bg-transparent text-[14px] text-white/90 placeholder:text-white/35 focus:outline-none"
                />
              </div>
            </form>
          </div>

          {/* Filter pills on map */}
          <div className="absolute bottom-4 left-4 z-20 flex gap-1.5">
            {WINE_TYPES.map((t) => (
              <button
                key={t.value}
                onClick={() => navigate({ type: activeType === t.value ? undefined : t.value })}
                className={`h-8 px-3 rounded-[8px] text-[12px] font-semibold transition-all inline-flex items-center gap-1.5 ${
                  activeType === t.value
                    ? "bg-cherry text-white shadow-[0_2px_8px_rgba(116,7,14,0.4)]"
                    : "bg-[#1A1412]/70 backdrop-blur-xl text-white/70 border border-white/10"
                }`}
              >
                <span className="h-2 w-2 rounded-full" style={{ background: t.color }} />
                {t.label}
              </button>
            ))}
          </div>

          {/* Right side buttons */}
          <div className="absolute right-4 top-1/2 -translate-y-1/2 z-20 flex flex-col gap-2">
            <Link
              href="/wines/add"
              className="h-11 w-11 rounded-[12px] bg-[#1A1412]/80 backdrop-blur-xl border border-white/10 flex items-center justify-center text-white/60 shadow-[0_2px_12px_rgba(0,0,0,0.2)] active:scale-90 transition-transform"
              title="Add wine"
            >
              <Plus className="h-5 w-5" />
            </Link>
          </div>
        </div>

        {/* Sidebar — wine list */}
        <div className="w-[400px] xl:w-[440px] flex flex-col bg-background border-l border-card-border">
          {/* Sidebar header */}
          <div className="px-5 pt-5 pb-3 border-b border-card-border/50">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h2 className="text-[18px] font-bold text-foreground tracking-tight" style={{ fontFamily: "var(--font-serif, Georgia, serif)" }}>
                  {activeSearch || "All Wines"}
                </h2>
                <p className="text-[12px] text-muted mt-0.5">{total} wines</p>
              </div>
              {hasFilters && (
                <button onClick={() => router.push("/wines")} className="text-[12px] font-semibold text-cherry">Clear</button>
              )}
            </div>

            {/* Country + Price filters */}
            <div className="flex gap-2">
              <select
                value={activeCountry ?? ""}
                onChange={(e) => navigate({ country: e.target.value || undefined })}
                className="input-field flex-1 text-[12px] py-2"
              >
                <option value="">All countries</option>
                {countries.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
              <select
                value={activePriceRange ?? ""}
                onChange={(e) => navigate({ priceRange: e.target.value || undefined })}
                className="input-field flex-1 text-[12px] py-2"
              >
                <option value="">Any price</option>
                <option value="budget">Budget</option>
                <option value="mid">Mid-range</option>
                <option value="premium">Premium</option>
                <option value="luxury">Luxury</option>
              </select>
            </div>
          </div>

          {/* Wine list — scrollable */}
          <div className="flex-1 overflow-y-auto">
            <WineList />
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════
          MOBILE LAYOUT (<lg): fullscreen map + bottom sheet
          ══════════════════════════════════════════ */}
      <div className="lg:hidden fixed inset-0">
        {/* Map — 100% */}
        <div className="absolute inset-0">
          <WineRegionMap
            onRegionClick={handleRegionClick}
            regionCounts={regionCounts}
            height="100%"
            className="rounded-none"
          />
        </div>

        {/* Top overlay — search */}
        <div className="absolute top-0 left-0 right-0 z-20 safe-top">
          <div className="px-4 pt-3 flex gap-2">
            <form onSubmit={handleSearch} className="flex-1">
              <div className="flex items-center h-11 rounded-[12px] bg-[#1A1412]/80 backdrop-blur-xl border border-white/10 shadow-[0_4px_20px_rgba(0,0,0,0.2)] px-3.5 gap-2.5">
                <Grape className="h-4 w-4 text-cherry flex-shrink-0" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search wines, regions..."
                  className="flex-1 bg-transparent text-[14px] text-white/90 placeholder:text-white/35 focus:outline-none"
                />
                <div className="flex items-center gap-1.5 pl-2.5 border-l border-white/10">
                  <Bookmark className="h-4 w-4 text-white/40" />
                </div>
              </div>
            </form>
            <Link
              href="/wines/add"
              className="h-11 w-11 rounded-[12px] bg-cherry flex items-center justify-center shadow-[0_2px_12px_rgba(116,7,14,0.3)] active:scale-90 transition-transform flex-shrink-0"
            >
              <Plus className="h-5 w-5 text-white" strokeWidth={2.5} />
            </Link>
          </div>

          {/* Filter pills */}
          <div className="flex gap-1.5 overflow-x-auto px-4 pt-2.5 pb-1 scrollbar-hide">
            <button
              onClick={() => navigate({ type: undefined })}
              className={`flex-shrink-0 h-8 px-3.5 rounded-[8px] text-[12px] font-semibold transition-all ${
                !activeType
                  ? "bg-cherry text-white shadow-[0_2px_8px_rgba(116,7,14,0.4)]"
                  : "bg-[#1A1412]/70 backdrop-blur-xl text-white/70 border border-white/10"
              }`}
            >
              Wines ▾
            </button>
            {WINE_TYPES.map((t) => (
              <button
                key={t.value}
                onClick={() => navigate({ type: activeType === t.value ? undefined : t.value })}
                className={`flex-shrink-0 h-8 px-3.5 rounded-[8px] text-[12px] font-semibold transition-all inline-flex items-center gap-1.5 ${
                  activeType === t.value
                    ? "bg-cherry text-white shadow-[0_2px_8px_rgba(116,7,14,0.4)]"
                    : "bg-[#1A1412]/70 backdrop-blur-xl text-white/70 border border-white/10"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Right floating buttons */}
        <div className="absolute right-3 z-20 flex flex-col gap-2" style={{ bottom: sheetOpen ? "auto" : "35%", top: sheetOpen ? "40%" : "auto" }}>
          <button className="h-10 w-10 rounded-[12px] bg-[#1A1412]/80 backdrop-blur-xl border border-white/10 flex items-center justify-center text-white/50 shadow-[0_2px_12px_rgba(0,0,0,0.2)]">
            <Layers className="h-4 w-4" />
          </button>
        </div>

        {/* "Explore Wines" CTA */}
        {!sheetOpen && (
          <div className="absolute bottom-[130px] right-4 z-20">
            <button
              onClick={() => setSheetOpen(true)}
              className="h-11 px-5 rounded-[12px] bg-[#1A1412]/80 backdrop-blur-xl border border-white/10 flex items-center gap-2 shadow-[0_4px_16px_rgba(0,0,0,0.2)] active:scale-95 transition-transform"
            >
              <Search className="h-4 w-4 text-white/50" />
              <span className="text-[13px] font-semibold text-white/80">Explore Wines</span>
            </button>
          </div>
        )}

        {/* Bottom: featured card OR expanded sheet */}
        <div
          className={`absolute left-0 right-0 bottom-0 z-30 transition-all duration-300 ease-out ${
            sheetOpen ? "top-[12vh]" : ""
          }`}
          style={sheetOpen ? {} : { top: "auto" }}
        >
          {!sheetOpen ? (
            /* ── Collapsed: featured wine + drag handle ── */
            <div className="px-3 pb-24">
              {featuredWine ? (
                <Link
                  href={`/wines/${featuredWine.id}`}
                  className="block rounded-[16px] bg-[#1A1412]/90 backdrop-blur-xl border border-white/8 shadow-[0_4px_24px_rgba(0,0,0,0.3)] overflow-hidden active:scale-[0.99] transition-transform"
                >
                  <div className="flex">
                    <div className="w-[90px] h-[90px] flex-shrink-0 flex items-center justify-center" style={{ background: `linear-gradient(135deg, ${typeColor(featuredWine.type)}40, ${typeColor(featuredWine.type)}15)` }}>
                      {featuredWine.labelImage ? (
                        <img src={featuredWine.labelImage} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <Wine className="h-7 w-7" style={{ color: typeColor(featuredWine.type), opacity: 0.3 }} />
                      )}
                    </div>
                    <div className="flex-1 p-3 min-w-0">
                      <p className="text-[14px] font-bold text-white/90 truncate">{featuredWine.name}</p>
                      <div className="flex items-center gap-1.5 mt-1">
                        <span className="text-[10px] font-bold text-cherry bg-cherry/15 px-1.5 py-0.5 rounded-[4px] capitalize">{featuredWine.type}</span>
                        <span className="text-[10px] text-white/35 truncate">{featuredWine.producer} · {featuredWine.region}</span>
                      </div>
                      <p className="text-[10px] text-cherry font-semibold mt-1.5">Discover →</p>
                    </div>
                  </div>
                </Link>
              ) : (
                <div className="rounded-[16px] bg-[#1A1412]/90 backdrop-blur-xl border border-white/8 p-4 text-center">
                  <p className="text-[12px] text-white/40">Tap a region to explore wines</p>
                </div>
              )}
              <button onClick={() => setSheetOpen(true)} className="w-full flex justify-center pt-2.5">
                <div className="w-10 h-1 rounded-full bg-white/20" />
              </button>
            </div>
          ) : (
            /* ── Expanded sheet ── */
            <div className="h-full flex flex-col bg-background rounded-t-[20px] shadow-[0_-8px_32px_rgba(0,0,0,0.15)]">
              <button onClick={() => setSheetOpen(false)} className="flex items-center justify-center py-2.5 touch-target">
                <div className="w-10 h-1 rounded-full bg-muted/25" />
              </button>

              <div className="px-4 flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <h2 className="text-[16px] font-bold text-foreground tracking-tight">
                    {activeSearch || "All Wines"}
                  </h2>
                  <span className="text-[11px] font-bold text-muted bg-muted/10 px-2 py-0.5 rounded-[6px]">{total}</span>
                </div>
                <div className="flex items-center gap-2">
                  {hasFilters && (
                    <button onClick={() => router.push("/wines")} className="text-[12px] font-semibold text-cherry">Clear</button>
                  )}
                  <button onClick={() => setSheetOpen(false)}>
                    <ChevronDown className="h-5 w-5 text-muted/40" />
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto pb-24">
                <WineList />
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
