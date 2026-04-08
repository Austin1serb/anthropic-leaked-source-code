"use client";

import { Wine, MapPin, Grape, ArrowRight, X, Star } from "lucide-react";
import Link from "next/link";

type RegionWine = {
  id: string;
  name: string;
  producer: string;
  type: string;
  priceRange: string | null;
  grapes: string[];
};

type RegionProducer = {
  id: string;
  name: string;
  region: string | null;
  wineCount: number;
};

type RegionWinery = {
  name: string;
  slug: string;
  featured: boolean;
  grapeVarieties: string[];
  wineStyles: string[];
};

type Props = {
  region: string;
  country: string;
  wines: RegionWine[];
  producers: RegionProducer[];
  wineries: RegionWinery[];
  wineCount: number;
  producerCount: number;
  onClose: () => void;
};

const TYPE_COLORS: Record<string, string> = {
  red: "bg-red-900/40 text-red-300",
  white: "bg-amber-900/30 text-amber-200",
  rosé: "bg-pink-900/30 text-pink-300",
  sparkling: "bg-yellow-900/30 text-yellow-200",
  dessert: "bg-orange-900/30 text-orange-200",
  fortified: "bg-purple-900/30 text-purple-300",
  orange: "bg-orange-800/30 text-orange-300",
};

const PRICE_LABELS: Record<string, string> = {
  budget: "$",
  mid: "$$",
  premium: "$$$",
  luxury: "$$$$",
};

export function RegionDetailPanel({
  region,
  country,
  wines,
  producers,
  wineries,
  wineCount,
  producerCount,
  onClose,
}: Props) {
  const allGrapes = Array.from(
    new Set(wineries.flatMap((w) => w.grapeVarieties))
  ).slice(0, 8);

  return (
    <div className="w-[320px] max-h-[70vh] rounded-[14px] bg-[#1A1412]/90 backdrop-blur-xl border border-white/[0.08] shadow-[0_8px_32px_rgba(0,0,0,0.4)] overflow-hidden flex flex-col animate-fade-in">
      {/* Header */}
      <div className="px-4 pt-4 pb-3 border-b border-white/[0.06] flex-shrink-0">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p
              className="text-[18px] font-bold text-white tracking-tight"
              style={{ fontFamily: "var(--font-serif, Georgia, serif)" }}
            >
              {region}
            </p>
            <p className="text-[12px] text-white/40 mt-0.5">{country}</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-[8px] bg-white/[0.06] text-white/40 hover:text-white/70 hover:bg-white/[0.1] transition-colors flex-shrink-0"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
        {/* Stats */}
        <div className="flex items-center gap-3 mt-2.5">
          <div className="flex items-center gap-1.5">
            <MapPin className="h-3 w-3 text-cherry" />
            <span className="text-[11px] font-semibold text-white/60">
              {producerCount} producer{producerCount !== 1 ? "s" : ""}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <Wine className="h-3 w-3 text-cherry" />
            <span className="text-[11px] font-semibold text-white/60">
              {wineCount} wine{wineCount !== 1 ? "s" : ""}
            </span>
          </div>
        </div>
      </div>

      {/* Scrollable content */}
      <div className="overflow-y-auto flex-1 scrollbar-thin">
        {/* Grapes */}
        {allGrapes.length > 0 && (
          <div className="px-4 pt-3 pb-2">
            <div className="flex items-center gap-1.5 mb-2">
              <Grape className="h-3 w-3 text-[#E8A08A]" />
              <span className="text-[9px] font-bold text-white/30 uppercase tracking-wider">
                Key grapes
              </span>
            </div>
            <div className="flex flex-wrap gap-1">
              {allGrapes.map((g) => (
                <span
                  key={g}
                  className="px-2 py-0.5 rounded-[6px] bg-white/[0.08] text-[10px] font-semibold text-white/60"
                >
                  {g}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Producers */}
        {producers.length > 0 && (
          <div className="px-4 pt-2 pb-2">
            <div className="flex items-center gap-1.5 mb-2">
              <MapPin className="h-3 w-3 text-cherry" />
              <span className="text-[9px] font-bold text-white/30 uppercase tracking-wider">
                Producers
              </span>
            </div>
            <div className="space-y-1">
              {producers.slice(0, 6).map((p) => {
                const winery = wineries.find((w) => w.name === p.name);
                return (
                  <div
                    key={p.id}
                    className="flex items-center gap-2 px-2.5 py-1.5 rounded-[8px] bg-white/[0.04] hover:bg-white/[0.08] transition-colors"
                  >
                    <span className="text-[12px] font-semibold text-white/80 truncate flex-1">
                      {p.name}
                    </span>
                    {winery?.featured && (
                      <Star className="h-3 w-3 text-[#C8A255] flex-shrink-0" />
                    )}
                    {p.wineCount > 0 && (
                      <span className="text-[10px] text-white/30 flex-shrink-0">
                        {p.wineCount} wine{p.wineCount !== 1 ? "s" : ""}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Wines */}
        {wines.length > 0 && (
          <div className="px-4 pt-2 pb-3">
            <div className="flex items-center gap-1.5 mb-2">
              <Wine className="h-3 w-3 text-cherry" />
              <span className="text-[9px] font-bold text-white/30 uppercase tracking-wider">
                Wines
              </span>
            </div>
            <div className="space-y-1.5">
              {wines.slice(0, 6).map((w) => (
                <Link
                  key={w.id}
                  href={`/wines/${w.id}`}
                  className="block px-2.5 py-2 rounded-[8px] bg-white/[0.04] hover:bg-white/[0.08] transition-colors"
                >
                  <p className="text-[12px] font-semibold text-white/80 truncate">
                    {w.name}
                  </p>
                  <div className="flex items-center gap-1.5 mt-1">
                    <span className="text-[10px] text-white/40 truncate">
                      {w.producer}
                    </span>
                    <span
                      className={`px-1.5 py-0.5 rounded-[4px] text-[9px] font-bold ${TYPE_COLORS[w.type] ?? "bg-white/10 text-white/50"}`}
                    >
                      {w.type}
                    </span>
                    {w.priceRange && (
                      <span className="text-[9px] font-bold text-white/30">
                        {PRICE_LABELS[w.priceRange] ?? w.priceRange}
                      </span>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Empty state */}
        {wines.length === 0 && producers.length === 0 && (
          <div className="px-4 py-8 text-center">
            <Wine className="h-6 w-6 text-white/20 mx-auto mb-2" />
            <p className="text-[12px] text-white/30">
              No wines catalogued yet for this region.
            </p>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-white/[0.06] flex-shrink-0">
        <Link
          href={`/wines?search=${encodeURIComponent(region)}`}
          className="flex items-center justify-center gap-1.5 w-full text-[11px] font-bold text-cherry bg-cherry/[0.15] px-3 py-2 rounded-[8px] hover:bg-cherry/[0.25] transition-colors"
        >
          View all {region} wines <ArrowRight className="h-3 w-3" />
        </Link>
      </div>
    </div>
  );
}
