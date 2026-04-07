"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { Search, Plus, Wine, Heart, MapPin, ChevronLeft, ChevronRight } from "lucide-react";
import { useState, useTransition } from "react";
import { toggleFavorite } from "@/lib/actions";

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
  { value: "red", label: "Red", emoji: "🔴" },
  { value: "white", label: "White", emoji: "⚪" },
  { value: "rosé", label: "Rosé", emoji: "🩷" },
  { value: "sparkling", label: "Sparkling", emoji: "✨" },
  { value: "orange", label: "Orange", emoji: "🟠" },
  { value: "dessert", label: "Dessert", emoji: "🍯" },
];

const PRICE_RANGES = [
  { value: "budget", label: "Budget", emoji: "💰" },
  { value: "mid", label: "Mid-range", emoji: "💰💰" },
  { value: "premium", label: "Premium", emoji: "💰💰💰" },
  { value: "luxury", label: "Luxury", emoji: "👑" },
];

function buildQuery(params: Record<string, string | undefined>) {
  const q = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v) q.set(k, v);
  }
  const str = q.toString();
  return str ? `?${str}` : "";
}

function typeColor(type: string) {
  switch (type.toLowerCase()) {
    case "red": return "bg-red-500";
    case "white": return "bg-amber-200";
    case "rosé": return "bg-pink-300";
    case "sparkling": return "bg-yellow-300";
    case "orange": return "bg-orange-300";
    case "dessert": return "bg-amber-400";
    default: return "bg-gray-300";
  }
}

export function WinesClient({
  wines,
  total,
  pages,
  currentPage,
  countries,
  activeType,
  activeCountry,
  activePriceRange,
  activeSearch,
}: WinesClientProps) {
  const router = useRouter();
  const [search, setSearch] = useState(activeSearch ?? "");
  const [favSet, setFavSet] = useState<Set<string>>(new Set());
  const [, startTransition] = useTransition();

  function navigate(overrides: Record<string, string | undefined>) {
    const params = {
      type: activeType,
      country: activeCountry,
      priceRange: activePriceRange,
      search: activeSearch,
      page: undefined, // reset page on filter change
      ...overrides,
    };
    router.push(`/wines${buildQuery(params)}`);
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    navigate({ search: search.trim() || undefined });
  }

  function handleToggleFav(wineId: string) {
    startTransition(async () => {
      const result = await toggleFavorite(wineId);
      setFavSet((prev) => {
        const next = new Set(prev);
        if (result.favorited) next.add(wineId);
        else next.delete(wineId);
        return next;
      });
    });
  }

  const hasFilters = activeType || activeCountry || activePriceRange || activeSearch;

  return (
    <div className="min-h-screen pb-28 safe-top bg-background">
      {/* Header */}
      <div className="px-5 pt-8 pb-2">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground tracking-tight">
              Wines
            </h1>
            <p className="text-[13px] text-muted mt-0.5">{total} wines in library</p>
          </div>
          <Link
            href="/wines/add"
            className="h-11 w-11 rounded-2xl bg-cherry flex items-center justify-center float-action active:scale-90 transition-transform"
          >
            <Plus className="h-5 w-5 text-white" strokeWidth={2.5} />
          </Link>
        </div>

        {/* Search */}
        <form onSubmit={handleSearch} className="mt-5 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted/50 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search wines, producers, regions..."
            className="input-field w-full pl-12 pr-4 touch-target"
          />
        </form>
      </div>

      {/* Type filters */}
      <div className="flex gap-2 overflow-x-auto px-5 pt-4 pb-2 scrollbar-hide">
        <button
          onClick={() => navigate({ type: undefined })}
          className={`flex-shrink-0 px-3.5 py-2 rounded-xl text-[13px] font-medium transition-all ${
            !activeType
              ? "bg-cherry text-white shadow-sm"
              : "bg-card-bg border border-card-border text-foreground"
          }`}
        >
          All
        </button>
        {WINE_TYPES.map((t) => (
          <button
            key={t.value}
            onClick={() => navigate({ type: activeType === t.value ? undefined : t.value })}
            className={`flex-shrink-0 inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-[13px] font-medium transition-all ${
              activeType === t.value
                ? "bg-cherry text-white shadow-sm"
                : "bg-card-bg border border-card-border text-foreground"
            }`}
          >
            <span>{t.emoji}</span>{t.label}
          </button>
        ))}
      </div>

      {/* Country + Price filters */}
      <div className="flex gap-2 px-5 py-2">
        <select
          value={activeCountry ?? ""}
          onChange={(e) => navigate({ country: e.target.value || undefined })}
          className="input-field text-[13px] py-2 px-3 flex-1"
        >
          <option value="">All countries</option>
          {countries.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
        <select
          value={activePriceRange ?? ""}
          onChange={(e) => navigate({ priceRange: e.target.value || undefined })}
          className="input-field text-[13px] py-2 px-3 flex-1"
        >
          <option value="">Any price</option>
          {PRICE_RANGES.map((p) => (
            <option key={p.value} value={p.value}>{p.label}</option>
          ))}
        </select>
      </div>

      {/* Clear filters */}
      {hasFilters && (
        <div className="px-5 py-2">
          <button
            onClick={() => router.push("/wines")}
            className="text-[12px] font-semibold text-cherry active:opacity-70"
          >
            Clear all filters
          </button>
        </div>
      )}

      {/* Wine grid */}
      <div className="px-5 mt-2">
        {wines.length === 0 ? (
          <div className="wine-card flex flex-col items-center justify-center py-16 px-6 text-center">
            <div className="h-16 w-16 rounded-3xl widget-gold flex items-center justify-center mb-4">
              <Wine className="h-7 w-7 text-amber-600/40" />
            </div>
            <p className="text-[17px] font-bold text-foreground">No wines found</p>
            <p className="mt-2 text-[14px] text-muted">
              Try adjusting your filters or search.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {wines.map((wine) => (
              <Link
                key={wine.id}
                href={`/wines/${wine.id}`}
                className="wine-card overflow-hidden active:scale-[0.97] transition-transform"
              >
                {/* Label image or color block */}
                <div className={`h-28 flex items-center justify-center ${
                  wine.labelImage ? "" : "bg-gradient-to-br from-widget-wine to-widget-wine-strong"
                }`}>
                  {wine.labelImage ? (
                    <img src={wine.labelImage} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="flex flex-col items-center gap-1">
                      <div className={`h-4 w-4 rounded-full ${typeColor(wine.type)}`} />
                      <span className="text-[11px] font-semibold text-cherry/50 capitalize">{wine.type}</span>
                    </div>
                  )}
                </div>

                <div className="p-3">
                  <div className="flex items-start justify-between gap-1">
                    <h3 className="font-bold text-[13px] text-foreground leading-tight line-clamp-2 flex-1">
                      {wine.name}
                    </h3>
                    <button
                      onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleToggleFav(wine.id); }}
                      className="flex-shrink-0 p-1"
                    >
                      <Heart
                        className={`h-4 w-4 transition-colors ${
                          favSet.has(wine.id) ? "fill-cherry text-cherry" : "text-muted/30"
                        }`}
                      />
                    </button>
                  </div>
                  <p className="text-[11px] text-muted mt-1 line-clamp-1">
                    {wine.producer}{wine.vintage ? ` · ${wine.vintage}` : ""}
                  </p>
                  <div className="flex items-center gap-1 mt-1.5">
                    <MapPin className="h-3 w-3 text-muted/50" />
                    <span className="text-[10px] text-muted line-clamp-1">{wine.region}, {wine.country}</span>
                  </div>
                  {wine.priceRange && (
                    <span className="mt-2 inline-block text-[10px] font-semibold capitalize text-cherry bg-widget-wine px-2 py-0.5 rounded-lg">
                      {wine.priceRange}
                    </span>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* Pagination */}
        {pages > 1 && (
          <div className="flex items-center justify-center gap-4 mt-6">
            <button
              onClick={() => navigate({ page: String(Math.max(1, currentPage - 1)) })}
              disabled={currentPage <= 1}
              className="btn-secondary px-4 py-2 text-[13px] disabled:opacity-30"
            >
              <ChevronLeft className="h-4 w-4" /> Prev
            </button>
            <span className="text-[13px] font-semibold text-muted">
              {currentPage} / {pages}
            </span>
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
