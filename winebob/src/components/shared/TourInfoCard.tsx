"use client";

import { Wine, Grape, ArrowRight } from "lucide-react";
import Link from "next/link";
import type { TourStop } from "./WineRegionMap";

type Props = {
  stop: TourStop;
  /** Region name for the "Explore wines" link */
  region?: string;
  /** Called when user taps "Next" to advance tour manually */
  onNext?: () => void;
};

export function TourInfoCard({ stop, region, onNext }: Props) {
  return (
    <div
      className="w-[280px] rounded-[14px] bg-[#1A1412]/85 backdrop-blur-xl border border-white/[0.08] shadow-[0_8px_32px_rgba(0,0,0,0.3)] overflow-hidden animate-fade-in"
    >
      {/* Header */}
      <div className="px-4 pt-3.5 pb-2">
        <p className="text-[15px] font-bold text-white tracking-tight" style={{ fontFamily: "var(--font-serif, Georgia, serif)" }}>
          {stop.name}
        </p>
        <p className="text-[11px] text-white/50 mt-0.5 leading-relaxed">
          {stop.tagline}
        </p>
      </div>

      {/* Grapes */}
      {stop.grapes.length > 0 && (
        <div className="px-4 pb-2 flex items-center gap-1.5 flex-wrap">
          <Grape className="h-3 w-3 text-[#E8A08A] flex-shrink-0" />
          {stop.grapes.map((g) => (
            <span
              key={g}
              className="px-2 py-0.5 rounded-[6px] bg-white/[0.08] text-[10px] font-semibold text-white/70"
            >
              {g}
            </span>
          ))}
        </div>
      )}

      {/* Notable wines */}
      {stop.notableWines.length > 0 && (
        <div className="px-4 pb-3 border-t border-white/[0.06] pt-2">
          <div className="flex items-center gap-1 mb-1.5">
            <Wine className="h-3 w-3 text-cherry" />
            <span className="text-[9px] font-bold text-white/30 uppercase tracking-wider">Notable wines</span>
          </div>
          {stop.notableWines.slice(0, 2).map((w) => (
            <p key={w} className="text-[11px] text-white/60 leading-snug">{w}</p>
          ))}
        </div>
      )}

      {/* Actions */}
      <div className="px-4 pb-3 flex items-center gap-2">
        {region && (
          <Link
            href={`/wines?search=${encodeURIComponent(region)}`}
            className="flex items-center gap-1 text-[10px] font-bold text-cherry bg-cherry/[0.15] px-2.5 py-1.5 rounded-[7px] hover:bg-cherry/[0.25] transition-colors"
          >
            Explore wines <ArrowRight className="h-3 w-3" />
          </Link>
        )}
        {onNext && (
          <button
            onClick={onNext}
            className="ml-auto text-[10px] font-semibold text-white/40 hover:text-white/70 transition-colors"
          >
            Next &rarr;
          </button>
        )}
      </div>
    </div>
  );
}
