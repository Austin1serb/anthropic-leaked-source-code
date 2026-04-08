"use client";

import Link from "next/link";
import { ChevronLeft, Heart, Wine, MapPin, Grape, Calendar, DollarSign, Droplets, Utensils, FileText } from "lucide-react";
import { useState, useTransition, useCallback } from "react";
import { useSession } from "next-auth/react";
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

const PRICE_LABELS: Record<string, string> = { budget: "Under $15", mid: "$15–40", premium: "$40–100", luxury: "$100+" };

export function WineDetailClient({ wine }: { wine: WineData }) {
  const [favorited, setFavorited] = useState(false);
  const [, startTransition] = useTransition();
  const { data: session } = useSession();
  const [checkInStatus, setCheckInStatus] = useState<"idle" | "loading" | "success" | "error">("idle");

  function handleFav() {
    startTransition(async () => {
      const result = await toggleFavorite(wine.id);
      setFavorited(result.favorited);
    });
  }

  const handleCheckIn = useCallback(async () => {
    setCheckInStatus("loading");

    let lat: number | undefined;
    let lng: number | undefined;

    try {
      const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          timeout: 8000,
          maximumAge: 60000,
        });
      });
      lat = pos.coords.latitude;
      lng = pos.coords.longitude;
    } catch {
      // Location denied or unavailable — proceed without coords
    }

    if (lat === undefined || lng === undefined) {
      // Fall back to 0, 0 — the API requires coords
      lat = 0;
      lng = 0;
    }

    try {
      const res = await fetch("/api/checkin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ wineId: wine.id, lat, lng }),
      });

      if (res.ok) {
        setCheckInStatus("success");
        setTimeout(() => setCheckInStatus("idle"), 3000);
      } else {
        setCheckInStatus("error");
        setTimeout(() => setCheckInStatus("idle"), 3000);
      }
    } catch {
      setCheckInStatus("error");
      setTimeout(() => setCheckInStatus("idle"), 3000);
    }
  }, [wine.id]);

  return (
    <div className="min-h-screen pb-28 safe-top bg-background">
      {/* Hero */}
      <div className={`relative bg-gradient-to-b ${typeGradient(wine.type)}`}>
        {/* Nav */}
        <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-4 pt-4 safe-top z-10">
          <Link href="/wines" className="h-10 w-10 rounded-xl bg-black/20 backdrop-blur-sm flex items-center justify-center active:scale-90 transition-transform">
            <ChevronLeft className="h-5 w-5 text-white" />
          </Link>
          <button onClick={handleFav} className="h-10 w-10 rounded-xl bg-black/20 backdrop-blur-sm flex items-center justify-center active:scale-90 transition-transform">
            <Heart className={`h-5 w-5 ${favorited ? "fill-white text-white" : "text-white/70"}`} />
          </button>
        </div>

        {/* Bottle area */}
        <div className="pt-20 pb-8 flex items-center justify-center min-h-[280px] md:min-h-[360px]">
          {wine.labelImage ? (
            <img src={wine.labelImage} alt="" className="max-h-[220px] md:max-h-[300px] object-contain drop-shadow-2xl" />
          ) : (
            <svg width="64" height="160" viewBox="0 0 48 120" className="opacity-15">
              <rect x="18" y="0" width="12" height="20" rx="3" fill="white" />
              <rect x="20" y="18" width="8" height="8" fill="white" />
              <path d="M20 26 C20 26 12 40 12 52 L12 110 C12 115 17 120 24 120 C31 120 36 115 36 110 L36 52 C36 40 28 26 28 26 Z" fill="white" />
            </svg>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="container-app -mt-6 relative z-10">
        {/* Title card */}
        <div className="wine-card p-5 md:p-6 mb-4 animate-fade-in-up">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="label mb-1 capitalize">{wine.type}</p>
              <h1 className="heading-lg text-foreground">{wine.name}</h1>
              <p className="body text-stone mt-1">{wine.producer}{wine.vintage ? ` · ${wine.vintage}` : " · NV"}</p>
            </div>
          </div>
          {wine.description && (
            <p className="body-sm mt-4 leading-relaxed">{wine.description}</p>
          )}
        </div>

        {/* Details grid — responsive */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4 stagger">
          <DetailCard icon={<MapPin className="h-4 w-4 text-sky" />} tint="tint-sky" label="Region" value={wine.appellation ? `${wine.appellation}` : wine.region} sub={wine.country} />
          <DetailCard icon={<Calendar className="h-4 w-4 text-sage" />} tint="tint-sage" label="Vintage" value={wine.vintage?.toString() ?? "NV"} />
          <DetailCard icon={<Grape className="h-4 w-4 text-cherry" />} tint="tint-wine" label="Grapes" value={wine.grapes.join(", ") || "—"} />
          {wine.abv != null && (
            <DetailCard icon={<Droplets className="h-4 w-4 text-terracotta" />} tint="tint-terracotta" label="Alcohol" value={`${wine.abv}%`} />
          )}
          {wine.priceRange && (
            <DetailCard icon={<DollarSign className="h-4 w-4 text-gold" />} tint="tint-gold" label="Price" value={PRICE_LABELS[wine.priceRange] ?? wine.priceRange} />
          )}
          <DetailCard icon={<Wine className="h-4 w-4 text-plum" />} tint="tint-plum" label="Type" value={wine.type} />
        </div>

        {/* Tasting notes */}
        {wine.tastingNotes && (
          <div className="wine-card p-5 mb-3 animate-fade-in-up">
            <div className="flex items-center gap-2 mb-3">
              <FileText className="h-4 w-4 text-stone" />
              <h3 className="label">Tasting Notes</h3>
            </div>
            <p className="body leading-relaxed">{wine.tastingNotes}</p>
          </div>
        )}

        {/* Food pairing */}
        {wine.foodPairing && (
          <div className="wine-card p-5 mb-3 animate-fade-in-up">
            <div className="flex items-center gap-2 mb-3">
              <Utensils className="h-4 w-4 text-stone" />
              <h3 className="label">Food Pairing</h3>
            </div>
            <p className="body leading-relaxed">{wine.foodPairing}</p>
          </div>
        )}

        {/* Check-in button — only for authenticated users */}
        {session?.user && (
          <div className="mt-4 mb-3 animate-fade-in-up">
            {checkInStatus === "success" ? (
              <div className="rounded-full bg-green-800/80 backdrop-blur-sm h-[44px] flex items-center justify-center px-6">
                <p className="text-[14px] font-semibold text-white">
                  Checked in! You&apos;re now on the live map.
                </p>
              </div>
            ) : (
              <button
                onClick={handleCheckIn}
                disabled={checkInStatus === "loading"}
                className="w-full h-[44px] rounded-full bg-[#74070E] hover:bg-[#8B0000] active:scale-[0.98] transition-all text-white text-[14px] font-semibold flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {checkInStatus === "loading" ? (
                  "Locating..."
                ) : checkInStatus === "error" ? (
                  "Something went wrong — tap to retry"
                ) : (
                  <>I&apos;m drinking this 🍷</>
                )}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function DetailCard({ icon, tint, label, value, sub }: {
  icon: React.ReactNode;
  tint: string;
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div className={`widget-card bg-${tint} p-3.5`}>
      <div className="h-8 w-8 rounded-lg bg-white/50 flex items-center justify-center mb-2.5">
        {icon}
      </div>
      <p className="caption mb-0.5">{label}</p>
      <p className="heading-sm text-foreground capitalize leading-tight">{value}</p>
      {sub && <p className="caption mt-0.5">{sub}</p>}
    </div>
  );
}
