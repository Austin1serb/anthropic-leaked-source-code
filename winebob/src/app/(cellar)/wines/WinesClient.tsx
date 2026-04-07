"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { Search, Plus, Wine, Heart, MapPin, ChevronUp, Bookmark, Grape } from "lucide-react";
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

  return (
    <div className="fixed inset-0">

      {/* ══════════ MAP — 100% of screen ══════════ */}
      <div className="absolute inset-0">
        <WineRegionMap
          onRegionClick={handleRegionClick}
          regionCounts={regionCounts}
          height="100%"
          className="rounded-none"
        />
      </div>

      {/* ══════════ TOP OVERLAY — search + filters ══════════ */}
      <div className="absolute top-0 left-0 right-0 z-20 safe-top">
        {/* Search bar */}
        <div className="px-4 pt-3 flex gap-2">
          <form onSubmit={handleSearch} className="flex-1 relative">
            <div className="flex items-center h-11 rounded-[12px] bg-[#1A1412]/80 backdrop-blur-xl border border-white/10 shadow-[0_4px_20px_rgba(0,0,0,0.2)] px-3.5 gap-2.5">
              <Grape className="h-4 w-4 text-cherry flex-shrink-0" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search wines, regions..."
                className="flex-1 bg-transparent text-[14px] text-white/90 placeholder:text-white/35 focus:outline-none"
              />
              <button type="button" className="flex items-center gap-1.5 pl-2.5 border-l border-white/10">
                <Bookmark className="h-4 w-4 text-white/50" />
                <span className="text-[12px] font-semibold text-white/50">Saved</span>
              </button>
            </div>
          </form>
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

      {/* ══════════ RIGHT SIDE FLOATING BUTTONS ══════════ */}
      <div className="absolute right-4 bottom-[35%] z-20 flex flex-col gap-2">
        <Link
          href="/wines/add"
          className="h-12 w-12 rounded-[14px] bg-[#1A1412]/80 backdrop-blur-xl border border-white/10 flex items-center justify-center text-white/70 shadow-[0_4px_16px_rgba(0,0,0,0.2)] active:scale-90 transition-transform"
        >
          <Plus className="h-5 w-5" />
        </Link>
      </div>

      {/* ══════════ "EXPLORE WINES" FLOATING CTA ══════════ */}
      {!sheetOpen && (
        <div className="absolute bottom-[140px] right-4 z-20">
          <button
            onClick={() => setSheetOpen(true)}
            className="h-11 px-5 rounded-[12px] bg-[#1A1412]/80 backdrop-blur-xl border border-white/10 flex items-center gap-2 shadow-[0_4px_16px_rgba(0,0,0,0.2)] active:scale-95 transition-transform"
          >
            <Search className="h-4 w-4 text-white/60" />
            <span className="text-[13px] font-semibold text-white/80">Explore Wines</span>
          </button>
        </div>
      )}

      {/* ══════════ BOTTOM — Featured wine or full sheet ══════════ */}
      <div
        className={`absolute left-0 right-0 bottom-0 z-30 transition-all duration-300 ease-out ${
          sheetOpen ? "top-[15vh]" : "bottom-0"
        }`}
        style={sheetOpen ? {} : { top: "auto" }}
      >
        {!sheetOpen ? (
          /* ── Collapsed: one featured wine card ── */
          <div className="px-4 pb-24">
            {featuredWine ? (
              <Link
                href={`/wines/${featuredWine.id}`}
                className="block rounded-[16px] bg-[#1A1412]/90 backdrop-blur-xl border border-white/8 shadow-[0_4px_24px_rgba(0,0,0,0.3)] overflow-hidden active:scale-[0.99] transition-transform"
              >
                <div className="flex">
                  {/* Thumbnail */}
                  <div className="w-[100px] h-[100px] flex-shrink-0 flex items-center justify-center" style={{ background: `linear-gradient(135deg, ${typeColor(featuredWine.type)}40, ${typeColor(featuredWine.type)}20)` }}>
                    {featuredWine.labelImage ? (
                      <img src={featuredWine.labelImage} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <Wine className="h-8 w-8" style={{ color: typeColor(featuredWine.type), opacity: 0.4 }} />
                    )}
                  </div>
                  {/* Info */}
                  <div className="flex-1 p-3.5 min-w-0">
                    <p className="text-[15px] font-bold text-white/90 truncate">{featuredWine.name}</p>
                    <div className="flex items-center gap-1.5 mt-1">
                      <span className="text-[11px] font-semibold text-cherry bg-cherry/15 px-1.5 py-0.5 rounded-[4px] capitalize">{featuredWine.type}</span>
                      <span className="text-[11px] text-white/40">{featuredWine.producer} · {featuredWine.region}</span>
                    </div>
                    <p className="text-[11px] text-cherry font-semibold mt-1.5">Discover this wine →</p>
                  </div>
                </div>
              </Link>
            ) : (
              <div className="rounded-[16px] bg-[#1A1412]/90 backdrop-blur-xl border border-white/8 p-5 text-center">
                <p className="text-[13px] text-white/50">Tap a region to explore wines</p>
              </div>
            )}

            {/* Drag handle */}
            <button onClick={() => setSheetOpen(true)} className="w-full flex justify-center pt-3">
              <div className="w-10 h-1 rounded-full bg-white/20" />
            </button>
          </div>
        ) : (
          /* ── Expanded: full wine list sheet ── */
          <div className="h-full flex flex-col bg-background rounded-t-[20px] shadow-[0_-8px_32px_rgba(0,0,0,0.15)]">
            {/* Drag handle + close */}
            <button onClick={() => setSheetOpen(false)} className="flex items-center justify-center py-3 touch-target">
              <div className="w-10 h-1 rounded-full bg-muted/25" />
            </button>

            {/* Header */}
            <div className="px-4 md:px-8 flex items-center justify-between mb-2">
              <div className="flex items-center gap-2.5">
                <h2 className="text-[17px] font-bold text-foreground tracking-tight">
                  {activeSearch || "All Wines"}
                </h2>
                <span className="text-[11px] font-bold text-muted bg-muted/10 px-2 py-0.5 rounded-[6px]">{total}</span>
              </div>
              <div className="flex items-center gap-2">
                {hasFilters && (
                  <button onClick={() => router.push("/wines")} className="text-[12px] font-semibold text-cherry">Clear</button>
                )}
                <button onClick={() => setSheetOpen(false)}>
                  <ChevronUp className="h-5 w-5 text-muted/40 rotate-180" />
                </button>
              </div>
            </div>

            {/* Wine list */}
            <div className="flex-1 overflow-y-auto px-4 md:px-8 pb-28">
              {wines.length === 0 ? (
                <div className="flex flex-col items-center py-16 text-center">
                  <Wine className="h-8 w-8 text-muted/15 mb-3" />
                  <p className="text-[15px] font-bold text-foreground">No wines found</p>
                  <p className="text-[13px] text-muted mt-1">Try a different region</p>
                </div>
              ) : (
                <div className="space-y-0.5">
                  {wines.map((wine) => (
                    <Link
                      key={wine.id}
                      href={`/wines/${wine.id}`}
                      className="flex items-center gap-3 py-3 px-1 border-b border-card-border/30 active:bg-card-border/10 transition-colors"
                    >
                      <div className="h-3 w-3 rounded-full flex-shrink-0" style={{ background: typeColor(wine.type) }} />
                      <div className="flex-1 min-w-0">
                        <p className="text-[14px] font-semibold text-foreground truncate">{wine.name}</p>
                        <p className="text-[11px] text-muted mt-0.5 truncate">
                          {wine.producer} · {wine.region}{wine.vintage ? ` · ${wine.vintage}` : ""}
                        </p>
                      </div>
                      {wine.priceRange && (
                        <span className="text-[10px] font-semibold text-cherry bg-cherry/8 px-2 py-0.5 rounded-[6px] flex-shrink-0">
                          {PRICE_LABELS[wine.priceRange] ?? wine.priceRange}
                        </span>
                      )}
                      <button
                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleToggleFav(wine.id); }}
                        className="p-1 flex-shrink-0"
                      >
                        <Heart className={`h-4 w-4 ${favSet.has(wine.id) ? "fill-cherry text-cherry" : "text-muted/20"}`} />
                      </button>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
