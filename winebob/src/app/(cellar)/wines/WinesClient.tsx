"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { Search, Plus, Wine, Heart, MapPin, ChevronLeft, ChevronRight, SlidersHorizontal } from "lucide-react";
import { useState, useTransition } from "react";
import { toggleFavorite } from "@/lib/actions";
import { WineRegionMap } from "@/components/shared/WineRegionMap";

type WineItem = {
  id: string;
  name: string;
  producer: string;
  vintage: number | null;
  grapes: string[];
  region: string;
  country: string;
  type: string;
  priceRange: string | null;
  description: string | null;
  labelImage: string | null;
};

type WinesClientProps = {
  wines: WineItem[];
  total: number;
  pages: number;
  currentPage: number;
  countries: string[];
  activeType?: string;
  activeCountry?: string;
  activePriceRange?: string;
  activeSearch?: string;
};

const WINE_TYPES = [
  { value: "red", label: "Red", color: "#74070E" },
  { value: "white", label: "White", color: "#C8A255" },
  { value: "rosé", label: "Rosé", color: "#C47080" },
  { value: "sparkling", label: "Sparkling", color: "#B8A840" },
  { value: "orange", label: "Orange", color: "#C87840" },
  { value: "dessert", label: "Dessert", color: "#A07030" },
];

const PRICE_LABELS: Record<string, string> = {
  budget: "Under $15", mid: "$15–40", premium: "$40–100", luxury: "$100+",
};

function typeGradient(type: string): string {
  switch (type.toLowerCase()) {
    case "red": return "from-[#3D1018] to-[#1A0A0C]";
    case "white": return "from-[#F5ECD0] to-[#E8DDB8]";
    case "rosé": return "from-[#F0D0D4] to-[#E0B8BC]";
    case "sparkling": return "from-[#F8F0D0] to-[#E8DDB0]";
    case "orange": return "from-[#F0D8C0] to-[#E0C4A8]";
    default: return "from-[#E8E0D0] to-[#D8CFC0]";
  }
}

function typeTextColor(type: string): string {
  switch (type.toLowerCase()) {
    case "red": return "text-[#F4E4E6]";
    default: return "text-[#6B5A30]";
  }
}

function buildQuery(params: Record<string, string | undefined>) {
  const q = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) { if (v) q.set(k, v); }
  const str = q.toString();
  return str ? `?${str}` : "";
}

const card = "rounded-[16px] bg-card-bg border border-card-border shadow-[0_2px_8px_rgba(0,0,0,0.06),0_0_1px_rgba(0,0,0,0.04)]";

export function WinesClient({
  wines, total, pages, currentPage, countries,
  activeType, activeCountry, activePriceRange, activeSearch,
}: WinesClientProps) {
  const router = useRouter();
  const [search, setSearch] = useState(activeSearch ?? "");
  const [favSet, setFavSet] = useState<Set<string>>(new Set());
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

  function handleRegionClick(region: string, country: string) {
    navigate({ search: region, country: undefined });
  }

  function handleToggleFav(wineId: string) {
    startTransition(async () => {
      const result = await toggleFavorite(wineId);
      setFavSet((prev) => { const next = new Set(prev); if (result.favorited) next.add(wineId); else next.delete(wineId); return next; });
    });
  }

  const hasFilters = !!(activeType || activeCountry || activePriceRange || activeSearch);

  return (
    <div className="pb-28">
      <div className="px-4 md:px-8 lg:px-10 pt-4">

        {/* ── Header ── */}
        <div className="flex items-end justify-between mb-5">
          <div>
            <h1 className="text-[28px] font-bold text-foreground tracking-tight" style={{ fontFamily: "var(--font-serif, Georgia, serif)" }}>
              {total} Wines
            </h1>
            <p className="text-[13px] text-muted mt-0.5">Explore the collection</p>
          </div>
          <Link
            href="/wines/add"
            className="h-10 px-4 rounded-[12px] bg-card-bg border border-card-border flex items-center gap-2 text-[13px] font-semibold text-foreground active:scale-95 transition-transform shadow-sm"
          >
            <Plus className="h-4 w-4 text-cherry" /> Add Wine
          </Link>
        </div>

        {/* ── Region Map ── */}
        <div className="mb-5">
          <WineRegionMap
            onRegionClick={handleRegionClick}
            height="280px"
            className="md:h-[360px]"
          />
        </div>

        {/* ── Search + Filter ── */}
        <div className="flex gap-2 mb-4">
          <form onSubmit={handleSearch} className="flex-1 relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted/50 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search wines, producers, regions..."
              className="input-field w-full pl-10 pr-4 text-[14px] touch-target"
            />
          </form>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`h-[44px] w-[44px] rounded-[12px] flex items-center justify-center transition-colors ${
              showFilters || hasFilters ? "bg-cherry text-white" : "bg-card-bg border border-card-border text-muted"
            }`}
          >
            <SlidersHorizontal className="h-4 w-4" />
          </button>
        </div>

        {/* ── Type pills ── */}
        <div className="flex gap-2 overflow-x-auto pb-3 scrollbar-hide">
          <button
            onClick={() => navigate({ type: undefined })}
            className={`flex-shrink-0 px-3 py-1.5 rounded-[8px] text-[12px] font-semibold transition-all ${
              !activeType ? "bg-cherry text-white" : "bg-card-bg border border-card-border text-foreground"
            }`}
          >
            All
          </button>
          {WINE_TYPES.map((t) => (
            <button
              key={t.value}
              onClick={() => navigate({ type: activeType === t.value ? undefined : t.value })}
              className={`flex-shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] text-[12px] font-semibold transition-all ${
                activeType === t.value ? "bg-cherry text-white" : "bg-card-bg border border-card-border text-foreground"
              }`}
            >
              <span className="h-2 w-2 rounded-full flex-shrink-0" style={{ background: t.color }} />
              {t.label}
            </button>
          ))}
        </div>

        {/* ── Filter panel ── */}
        {showFilters && (
          <div className={`${card} p-4 mb-4 animate-scale-in`}>
            <div className="flex gap-3">
              <div className="flex-1">
                <p className="text-[11px] font-semibold text-muted uppercase tracking-wider mb-1.5">Country</p>
                <select
                  value={activeCountry ?? ""}
                  onChange={(e) => navigate({ country: e.target.value || undefined })}
                  className="input-field w-full text-[13px] py-2.5"
                >
                  <option value="">All</option>
                  {countries.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="flex-1">
                <p className="text-[11px] font-semibold text-muted uppercase tracking-wider mb-1.5">Price</p>
                <select
                  value={activePriceRange ?? ""}
                  onChange={(e) => navigate({ priceRange: e.target.value || undefined })}
                  className="input-field w-full text-[13px] py-2.5"
                >
                  <option value="">Any</option>
                  <option value="budget">Budget</option>
                  <option value="mid">Mid-range</option>
                  <option value="premium">Premium</option>
                  <option value="luxury">Luxury</option>
                </select>
              </div>
            </div>
            {hasFilters && (
              <button onClick={() => { router.push("/wines"); setShowFilters(false); }} className="mt-3 text-[12px] font-semibold text-cherry">
                Clear all filters
              </button>
            )}
          </div>
        )}

        {/* ── Wine Grid ── */}
        {wines.length === 0 ? (
          <div className={`${card} p-14 text-center`}>
            <Wine className="h-8 w-8 text-muted/15 mx-auto mb-3" />
            <p className="text-[15px] font-bold text-foreground">No wines found</p>
            <p className="text-[13px] text-muted mt-1">Try adjusting your filters</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
            {wines.map((wine) => (
              <Link
                key={wine.id}
                href={`/wines/${wine.id}`}
                className="group block overflow-hidden active:scale-[0.97] transition-transform"
              >
                {/* Bottle visual */}
                <div className={`aspect-[3/4] relative rounded-t-[16px] bg-gradient-to-b ${typeGradient(wine.type)} flex items-center justify-center p-4`}>
                  {wine.labelImage ? (
                    <img src={wine.labelImage} alt="" className="w-full h-full object-contain drop-shadow-lg" />
                  ) : (
                    <svg width="40" height="100" viewBox="0 0 48 120" className="opacity-15">
                      <rect x="18" y="0" width="12" height="20" rx="3" fill="currentColor" className={typeTextColor(wine.type)} />
                      <rect x="20" y="18" width="8" height="8" fill="currentColor" className={typeTextColor(wine.type)} />
                      <path d="M20 26 C20 26 12 40 12 52 L12 110 C12 115 17 120 24 120 C31 120 36 115 36 110 L36 52 C36 40 28 26 28 26 Z" fill="currentColor" className={typeTextColor(wine.type)} />
                    </svg>
                  )}

                  {/* Favorite */}
                  <button
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleToggleFav(wine.id); }}
                    className="absolute top-3 right-3 h-7 w-7 rounded-[8px] bg-black/15 backdrop-blur-sm flex items-center justify-center"
                  >
                    <Heart className={`h-3.5 w-3.5 ${favSet.has(wine.id) ? "fill-white text-white" : "text-white/60"}`} />
                  </button>

                  {/* Price */}
                  {wine.priceRange && (
                    <span className="absolute bottom-2 left-2 text-[10px] font-semibold px-2 py-0.5 rounded-[6px] bg-black/15 backdrop-blur-sm text-white/80">
                      {PRICE_LABELS[wine.priceRange] ?? wine.priceRange}
                    </span>
                  )}
                </div>

                {/* Info */}
                <div className="p-3 rounded-b-[16px] bg-card-bg border border-t-0 border-card-border">
                  <p className="text-[13px] font-bold text-foreground leading-tight line-clamp-1">{wine.name}</p>
                  <p className="text-[11px] text-muted mt-0.5 line-clamp-1">{wine.producer}{wine.vintage ? ` · ${wine.vintage}` : ""}</p>
                  <div className="flex items-center gap-1 mt-1.5">
                    <MapPin className="h-3 w-3 text-muted/40" />
                    <span className="text-[10px] text-muted line-clamp-1">{wine.region}, {wine.country}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* ── Pagination ── */}
        {pages > 1 && (
          <div className="flex items-center justify-center gap-4 mt-8">
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
    </div>
  );
}
