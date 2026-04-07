"use client";

import Link from "next/link";
import {
  ChevronLeft, Heart, Wine, MapPin, Grape, Calendar,
  DollarSign, Droplets, Utensils, FileText,
} from "lucide-react";
import { useState, useTransition } from "react";
import { toggleFavorite } from "@/lib/actions";

type WineData = {
  id: string;
  name: string;
  producer: string;
  vintage: number | null;
  grapes: string[];
  region: string;
  country: string;
  appellation: string | null;
  type: string;
  description: string | null;
  labelImage: string | null;
  priceRange: string | null;
  abv: number | null;
  tastingNotes: string | null;
  foodPairing: string | null;
};

function typeColor(type: string) {
  switch (type.toLowerCase()) {
    case "red": return "bg-red-500";
    case "white": return "bg-amber-200";
    case "rosé": return "bg-pink-300";
    case "sparkling": return "bg-yellow-300";
    case "orange": return "bg-orange-300";
    default: return "bg-gray-300";
  }
}

export function WineDetailClient({ wine }: { wine: WineData }) {
  const [favorited, setFavorited] = useState(false);
  const [, startTransition] = useTransition();

  function handleFav() {
    startTransition(async () => {
      const result = await toggleFavorite(wine.id);
      setFavorited(result.favorited);
    });
  }

  return (
    <div className="min-h-screen pb-28 safe-top bg-background">
      {/* Hero image or gradient */}
      <div className={`relative h-56 ${
        wine.labelImage ? "" : "bg-gradient-to-br from-widget-wine to-widget-wine-strong"
      }`}>
        {wine.labelImage ? (
          <img src={wine.labelImage} alt="" className="w-full h-full object-cover" />
        ) : (
          <div className="flex items-center justify-center h-full">
            <Wine className="h-16 w-16 text-cherry/20" />
          </div>
        )}

        {/* Top bar */}
        <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-4 pt-4 safe-top">
          <Link
            href="/wines"
            className="h-10 w-10 rounded-2xl glass-card flex items-center justify-center active:scale-90 transition-transform"
          >
            <ChevronLeft className="h-5 w-5 text-foreground" />
          </Link>
          <button
            onClick={handleFav}
            className="h-10 w-10 rounded-2xl glass-card flex items-center justify-center active:scale-90 transition-transform"
          >
            <Heart className={`h-5 w-5 ${favorited ? "fill-cherry text-cherry" : "text-foreground"}`} />
          </button>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-5 -mt-8 relative z-10">
        {/* Main info card */}
        <div className="wine-card p-5 mb-4">
          <div className="flex items-start gap-3 mb-3">
            <div className={`h-4 w-4 rounded-full ${typeColor(wine.type)} mt-1.5 flex-shrink-0`} />
            <div className="flex-1">
              <h1 className="text-xl font-bold text-foreground tracking-tight leading-tight">
                {wine.name}
              </h1>
              <p className="text-[14px] text-muted mt-0.5">{wine.producer}</p>
            </div>
          </div>

          {wine.description && (
            <p className="text-[14px] text-muted leading-relaxed mt-3">
              {wine.description}
            </p>
          )}
        </div>

        {/* Details grid */}
        <div className="grid grid-cols-2 gap-3 mb-4 stagger-children">
          <DetailWidget
            icon={<MapPin className="h-4 w-4 text-blue-600" />}
            bg="widget-sky"
            label="Region"
            value={wine.appellation ? `${wine.appellation}, ${wine.region}` : wine.region}
            sub={wine.country}
          />
          <DetailWidget
            icon={<Calendar className="h-4 w-4 text-emerald-700" />}
            bg="widget-sage"
            label="Vintage"
            value={wine.vintage?.toString() ?? "NV"}
          />
          <DetailWidget
            icon={<Grape className="h-4 w-4 text-cherry" />}
            bg="widget-wine"
            label="Grapes"
            value={wine.grapes.join(", ") || "—"}
          />
          <DetailWidget
            icon={<Wine className="h-4 w-4 text-purple-600" />}
            bg="widget-lavender"
            label="Type"
            value={wine.type}
          />
          {wine.priceRange && (
            <DetailWidget
              icon={<DollarSign className="h-4 w-4 text-amber-700" />}
              bg="widget-gold"
              label="Price"
              value={wine.priceRange}
            />
          )}
          {wine.abv && (
            <DetailWidget
              icon={<Droplets className="h-4 w-4 text-orange-600" />}
              bg="widget-peach"
              label="ABV"
              value={`${wine.abv}%`}
            />
          )}
        </div>

        {/* Tasting notes */}
        {wine.tastingNotes && (
          <div className="wine-card p-5 mb-3">
            <div className="flex items-center gap-2 mb-2">
              <FileText className="h-4 w-4 text-muted" />
              <h3 className="text-[13px] font-bold text-foreground uppercase tracking-wide">Tasting Notes</h3>
            </div>
            <p className="text-[14px] text-muted leading-relaxed">{wine.tastingNotes}</p>
          </div>
        )}

        {/* Food pairing */}
        {wine.foodPairing && (
          <div className="wine-card p-5 mb-3">
            <div className="flex items-center gap-2 mb-2">
              <Utensils className="h-4 w-4 text-muted" />
              <h3 className="text-[13px] font-bold text-foreground uppercase tracking-wide">Food Pairing</h3>
            </div>
            <p className="text-[14px] text-muted leading-relaxed">{wine.foodPairing}</p>
          </div>
        )}
      </div>
    </div>
  );
}

function DetailWidget({
  icon,
  bg,
  label,
  value,
  sub,
}: {
  icon: React.ReactNode;
  bg: string;
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div className={`widget-card ${bg} p-3.5`}>
      <div className="h-8 w-8 rounded-xl bg-white/50 flex items-center justify-center mb-2">
        {icon}
      </div>
      <p className="text-[10px] font-semibold text-muted uppercase tracking-wide">{label}</p>
      <p className="text-[14px] font-bold text-foreground mt-0.5 capitalize leading-tight">{value}</p>
      {sub && <p className="text-[11px] text-muted mt-0.5">{sub}</p>}
    </div>
  );
}
