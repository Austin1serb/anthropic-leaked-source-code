"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { Search, Plus, Wine, Heart, MapPin, ChevronLeft, ChevronRight, SlidersHorizontal, ChevronUp } from "lucide-react";
import { useState, useTransition } from "react";
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
    case "red": return "#74070E";
    case "white": return "#C8A255";
    case "rosé": return "#C47080";
    case "sparkling": return "#B8A840";
    case "orange": return "#C87840";
    default: return "#8C7E6E";
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
  const [sheetExpanded, setSheetExpanded] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [, startTransition] = useTransition();

  function navigate(overrides: Record<string, string | undefined>) {
    const params = { type: activeType, country: activeCountry, priceRange: activePriceRange, search: activeSearch, page: undefined, ...overrides };
    router.push(`/wines${buildQuery(params)}`);
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    navigate({ search: search.trim() || undefined });
  }

  function handleRegionClick(region: string) {
    navigate({ search: region });
    setSheetExpanded(true);
  }

  function handleToggleFav(wineId: string) {
    startTransition(async () => {
      const result = await toggleFavorite(wineId);
      setFavSet((prev) => { const next = new Set(prev); if (result.favorited) next.add(wineId); else next.delete(wineId); return next; });
    });
  }

  const hasFilters = !!(activeType || activeCountry || activePriceRange || activeSearch);

  return (
    <div className="fixed inset-0 flex flex-col bg-background">

      {/* ══════════ MAP — fills top portion ══════════ */}
      <div className={`relative transition-all duration-300 ${sheetExpanded ? "h-[30vh]" : "h-[55vh]"}`}>
        <WineRegionMap
          onRegionClick={handleRegionClick}
          regionCounts={regionCounts}
          height="100%"
          className="rounded-none"
        />

        {/* Overlay: search bar on top of map */}
        <div className="absolute top-0 left-0 right-0 safe-top z-20">
          <div className="px-4 md:px-8 pt-4 flex gap-2">
            <form onSubmit={handleSearch} className="flex-1 relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted/60 pointer-events-none" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search wines, producers, regions..."
                className="w-full h-11 pl-10 pr-4 rounded-[12px] bg-white/90 backdrop-blur-md border border-white/60 shadow-[0_2px_12px_rgba(0,0,0,0.1)] text-[14px] text-foreground placeholder:text-muted/50 focus:outline-none focus:ring-2 focus:ring-cherry/20"
              />
            </form>
            <Link
              href="/wines/add"
              className="h-11 w-11 rounded-[12px] bg-cherry text-white flex items-center justify-center shadow-[0_2px_12px_rgba(116,7,14,0.3)] active:scale-90 transition-transform flex-shrink-0"
            >
              <Plus className="h-5 w-5" strokeWidth={2.5} />
            </Link>
          </div>
        </div>

        {/* Overlay: type filter pills on map */}
        <div className="absolute bottom-3 left-0 right-0 z-20">
          <div className="flex gap-1.5 overflow-x-auto px-4 md:px-8 scrollbar-hide">
            <button
              onClick={() => navigate({ type: undefined })}
              className={`flex-shrink-0 h-8 px-3 rounded-[8px] text-[12px] font-semibold backdrop-blur-md shadow-sm transition-all ${
                !activeType
                  ? "bg-cherry text-white shadow-[0_2px_8px_rgba(116,7,14,0.3)]"
                  : "bg-white/80 text-foreground border border-white/60"
              }`}
            >
              All
            </button>
            {WINE_TYPES.map((t) => (
              <button
                key={t.value}
                onClick={() => navigate({ type: activeType === t.value ? undefined : t.value })}
                className={`flex-shrink-0 h-8 px-3 rounded-[8px] text-[12px] font-semibold backdrop-blur-md shadow-sm transition-all inline-flex items-center gap-1.5 ${
                  activeType === t.value
                    ? "bg-cherry text-white shadow-[0_2px_8px_rgba(116,7,14,0.3)]"
                    : "bg-white/80 text-foreground border border-white/60"
                }`}
              >
                <span className="h-2 w-2 rounded-full" style={{ background: t.color }} />
                {t.label}
              </button>
            ))}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex-shrink-0 h-8 w-8 rounded-[8px] flex items-center justify-center backdrop-blur-md shadow-sm ${
                showFilters || hasFilters ? "bg-cherry text-white" : "bg-white/80 text-muted border border-white/60"
              }`}
            >
              <SlidersHorizontal className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* ══════════ BOTTOM SHEET — slides up over map ══════════ */}
      <div
        className={`relative z-30 bg-background rounded-t-[20px] border-t border-card-border shadow-[0_-4px_24px_rgba(0,0,0,0.08)] flex-1 flex flex-col overflow-hidden transition-all duration-300`}
        style={{ marginTop: -16 }}
      >
        {/* Drag handle */}
        <button
          onClick={() => setSheetExpanded(!sheetExpanded)}
          className="flex items-center justify-center py-3 touch-target"
        >
          <div className="w-10 h-1 rounded-full bg-muted/25" />
        </button>

        {/* Sheet header */}
        <div className="px-4 md:px-8 flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <h2 className="text-[18px] font-bold text-foreground tracking-tight" style={{ fontFamily: "var(--font-serif, Georgia, serif)" }}>
              {hasFilters ? "Results" : "Explore Wines"}
            </h2>
            <span className="text-[12px] font-semibold text-muted bg-card-border/30 px-2 py-0.5 rounded-[6px]">
              {total}
            </span>
          </div>
          {hasFilters && (
            <button onClick={() => router.push("/wines")} className="text-[12px] font-semibold text-cherry">
              Clear
            </button>
          )}
        </div>

        {/* Advanced filters (collapsible) */}
        {showFilters && (
          <div className="px-4 md:px-8 mb-3 flex gap-2">
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
        )}

        {/* Wine list — scrollable */}
        <div className="flex-1 overflow-y-auto px-4 md:px-8 pb-28">
          {wines.length === 0 ? (
            <div className="flex flex-col items-center py-16 text-center">
              <Wine className="h-8 w-8 text-muted/15 mb-3" />
              <p className="text-[15px] font-bold text-foreground">No wines found</p>
              <p className="text-[13px] text-muted mt-1">Try a different search or region</p>
            </div>
          ) : (
            <div className="space-y-1.5">
              {wines.map((wine) => (
                <Link
                  key={wine.id}
                  href={`/wines/${wine.id}`}
                  className="flex items-center gap-3 p-3 rounded-[12px] active:bg-card-border/20 transition-colors"
                >
                  {/* Type dot */}
                  <div
                    className="h-3 w-3 rounded-full flex-shrink-0"
                    style={{ background: typeColor(wine.type) }}
                  />

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-[14px] font-semibold text-foreground truncate">{wine.name}</p>
                    <p className="text-[11px] text-muted mt-0.5 truncate">
                      {wine.producer} · {wine.region}{wine.vintage ? ` · ${wine.vintage}` : ""}
                    </p>
                  </div>

                  {/* Price + favorite */}
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
                      <Heart className={`h-4 w-4 ${favSet.has(wine.id) ? "fill-cherry text-cherry" : "text-muted/25"}`} />
                    </button>
                  </div>
                </Link>
              ))}

              {/* Pagination */}
              {pages > 1 && (
                <div className="flex items-center justify-center gap-4 pt-6 pb-4">
                  <button
                    onClick={() => navigate({ page: String(Math.max(1, currentPage - 1)) })}
                    disabled={currentPage <= 1}
                    className="btn-secondary px-4 py-2 text-[13px] disabled:opacity-30"
                  >
                    <ChevronLeft className="h-4 w-4" /> Prev
                  </button>
                  <span className="text-[13px] font-semibold text-muted">{currentPage} / {pages}</span>
                  <button
                    onClick={() => navigate({ page: String(Math.min(pages, currentPage + 1)) })}
                    disabled={currentPage >= pages}
                    className="btn-secondary px-4 py-2 text-[13px] disabled:opacity-30"
                  >
                    Next <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
