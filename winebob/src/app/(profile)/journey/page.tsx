import { getJourneyStats } from "@/lib/journeyActions";
import Link from "next/link";
import {
  Wine,
  MapPin,
  Globe,
  Grape,
  Heart,
  Navigation,
  Users,
  BookmarkCheck,
  Clock,
  Star,
  ArrowRight,
  Compass,
} from "lucide-react";

export const dynamic = "force-dynamic";

const TYPE_COLORS: Record<string, string> = {
  red: "#74070E",
  white: "#D4A843",
  rosé: "#E8A0B4",
  sparkling: "#C9B037",
  dessert: "#B5651D",
  fortified: "#5C1A1B",
  orange: "#D4782F",
};

export default async function JourneyPage() {
  let stats: Awaited<ReturnType<typeof getJourneyStats>> | null = null;
  try {
    stats = await getJourneyStats();
  } catch {
    // Not authenticated or DB error
  }

  if (!stats) {
    return (
      <div className="container-app py-16 text-center">
        <Compass className="h-12 w-12 text-cherry/30 mx-auto mb-4" />
        <h2 className="text-[20px] font-bold text-foreground" style={{ fontFamily: "Georgia, serif" }}>
          Your Wine Passport
        </h2>
        <p className="text-[14px] text-muted mt-2 max-w-[320px] mx-auto">
          Sign in to track your wine journey — tastings, check-ins, regions explored, and more.
        </p>
        <Link
          href="/login?callbackUrl=/journey"
          className="inline-flex items-center gap-2 mt-6 px-5 py-2.5 rounded-[10px] bg-cherry text-white font-semibold text-[14px]"
        >
          Sign in to start
        </Link>
      </div>
    );
  }

  const { counts, passport, recentTastings, recentCheckIns, timeline } = stats;
  const regionPct = Math.round((passport.regionsExplored.length / passport.totalRegions) * 100);
  const totalInteractions = counts.tastings + counts.checkIns + counts.favorites;

  return (
    <div className="pb-12">
      {/* Hero passport card */}
      <section className="container-app mt-4">
        <div className="wine-card p-5 bg-gradient-to-br from-cherry/[0.04] to-transparent">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-12 w-12 rounded-[14px] bg-cherry/10 flex items-center justify-center">
              <Compass className="h-6 w-6 text-cherry" />
            </div>
            <div>
              <h2
                className="text-[20px] font-bold text-foreground tracking-tight"
                style={{ fontFamily: "Georgia, serif" }}
              >
                Wine Passport
              </h2>
              <p className="text-[12px] text-muted">
                {passport.uniqueWines} wines discovered
              </p>
            </div>
          </div>

          {/* Stat grid */}
          <div className="grid grid-cols-3 gap-3">
            <StatBadge icon={<Wine className="h-4 w-4" />} value={counts.tastings} label="Tastings" />
            <StatBadge icon={<MapPin className="h-4 w-4" />} value={counts.checkIns} label="Check-ins" />
            <StatBadge icon={<Heart className="h-4 w-4" />} value={counts.favorites} label="Favorites" />
            <StatBadge icon={<Globe className="h-4 w-4" />} value={passport.regionsExplored.length} label="Regions" />
            <StatBadge icon={<Navigation className="h-4 w-4" />} value={counts.flights} label="Flights" />
            <StatBadge icon={<Users className="h-4 w-4" />} value={counts.follows} label="Following" />
          </div>
        </div>
      </section>

      {/* Region progress */}
      <section className="container-app mt-5">
        <div className="flex items-center justify-between mb-3 px-1">
          <h3 className="text-[15px] font-bold text-foreground" style={{ fontFamily: "Georgia, serif" }}>
            Regions Explored
          </h3>
          <Link href="/explore" className="text-[12px] font-semibold text-cherry">
            Explore map <ArrowRight className="inline h-3 w-3" />
          </Link>
        </div>
        <div className="wine-card p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[14px] font-semibold text-foreground">
              {passport.regionsExplored.length}/{passport.totalRegions}
            </span>
            <span className="text-[12px] text-muted">{regionPct}%</span>
          </div>
          <div className="h-3 rounded-full bg-card-border/30 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-cherry to-cherry/70 transition-all"
              style={{ width: `${Math.max(regionPct, 2)}%` }}
            />
          </div>
          {passport.regionsExplored.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-3">
              {passport.regionsExplored.map((region) => (
                <span
                  key={region}
                  className="text-[10px] font-medium text-cherry bg-cherry/10 px-2 py-0.5 rounded-full"
                >
                  {region}
                </span>
              ))}
            </div>
          )}
          {passport.regionsExplored.length === 0 && (
            <p className="text-[12px] text-muted mt-2">
              Start exploring wine regions to fill your passport!
            </p>
          )}
        </div>
      </section>

      {/* Countries visited */}
      {passport.countriesVisited.length > 0 && (
        <section className="container-app mt-5">
          <h3 className="text-[15px] font-bold text-foreground mb-3 px-1" style={{ fontFamily: "Georgia, serif" }}>
            Countries
          </h3>
          <div className="wine-card p-4">
            <div className="flex flex-wrap gap-2">
              {passport.countriesVisited.map((country) => (
                <span
                  key={country}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-[8px] bg-butter-dark text-[12px] font-semibold text-foreground/80"
                >
                  <Globe className="h-3 w-3 text-muted" />
                  {country}
                </span>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Grape varieties */}
      {passport.topGrapes.length > 0 && (
        <section className="container-app mt-5">
          <h3 className="text-[15px] font-bold text-foreground mb-3 px-1" style={{ fontFamily: "Georgia, serif" }}>
            Your Grapes
          </h3>
          <div className="wine-card p-4">
            <div className="space-y-2">
              {passport.topGrapes.map((g, i) => {
                const maxCount = passport.topGrapes[0].count;
                const pct = Math.round((g.count / maxCount) * 100);
                return (
                  <div key={g.name} className="flex items-center gap-3">
                    <span className="text-[12px] text-muted w-4 text-right">{i + 1}</span>
                    <Grape className="h-3.5 w-3.5 text-cherry/50 flex-shrink-0" />
                    <span className="text-[13px] font-medium text-foreground w-[140px] truncate">{g.name}</span>
                    <div className="flex-1 h-2 rounded-full bg-card-border/30 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-cherry/60"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="text-[11px] text-muted w-6 text-right">{g.count}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* Wine type breakdown */}
      {passport.typeBreakdown.length > 0 && (
        <section className="container-app mt-5">
          <h3 className="text-[15px] font-bold text-foreground mb-3 px-1" style={{ fontFamily: "Georgia, serif" }}>
            Wine Types
          </h3>
          <div className="wine-card p-4">
            {/* Color bar */}
            <div className="flex rounded-full overflow-hidden h-3 bg-card-border/30">
              {passport.typeBreakdown.map((seg) => {
                const total = passport.typeBreakdown.reduce((a, b) => a + b.count, 0) || 1;
                const pct = Math.round((seg.count / total) * 100);
                return (
                  <div
                    key={seg.type}
                    style={{
                      width: `${pct}%`,
                      backgroundColor: TYPE_COLORS[seg.type] || "#888",
                      minWidth: pct > 0 ? "4px" : "0",
                    }}
                  />
                );
              })}
            </div>
            <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2.5">
              {passport.typeBreakdown.map((seg) => {
                const total = passport.typeBreakdown.reduce((a, b) => a + b.count, 0) || 1;
                return (
                  <div key={seg.type} className="flex items-center gap-1.5">
                    <div
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: TYPE_COLORS[seg.type] || "#888" }}
                    />
                    <span className="text-[11px] text-muted capitalize">
                      {seg.type} {Math.round((seg.count / total) * 100)}%
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* Recent tastings */}
      <section className="container-app mt-5">
        <h3 className="text-[15px] font-bold text-foreground mb-3 px-1" style={{ fontFamily: "Georgia, serif" }}>
          Recent Tastings
        </h3>
        {recentTastings.length === 0 ? (
          <div className="wine-card px-4 py-8 text-center">
            <Wine className="h-8 w-8 text-muted/20 mx-auto mb-2" />
            <p className="text-[13px] text-muted">No tastings logged yet</p>
            <Link href="/wines" className="text-[12px] font-semibold text-cherry mt-2 inline-block">
              Browse wines to start <ArrowRight className="inline h-3 w-3" />
            </Link>
          </div>
        ) : (
          <div className="wine-card divide-y divide-card-border/40">
            {recentTastings.map((t) => (
              <Link
                key={t.id}
                href={`/wines/${t.wineId}`}
                className="flex items-center gap-3 px-4 py-3 active:bg-card-border/20 transition-colors"
              >
                <div
                  className="w-[4px] h-10 rounded-full flex-shrink-0"
                  style={{ backgroundColor: TYPE_COLORS[t.wine.type] || "#888" }}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-semibold text-foreground truncate">{t.wine.name}</p>
                  <p className="text-[11px] text-muted truncate">
                    {t.wine.producer} · {t.wine.region}
                  </p>
                </div>
                <div className="text-right flex-shrink-0">
                  {t.rating != null && (
                    <div className="flex items-center gap-0.5">
                      <Star className="h-3 w-3 text-amber-500 fill-amber-500" />
                      <span className="text-[12px] font-semibold text-foreground">{t.rating}</span>
                    </div>
                  )}
                  <p className="text-[10px] text-muted">
                    {new Date(t.tastedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Recent check-ins */}
      {recentCheckIns.length > 0 && (
        <section className="container-app mt-5">
          <h3 className="text-[15px] font-bold text-foreground mb-3 px-1" style={{ fontFamily: "Georgia, serif" }}>
            Recent Check-ins
          </h3>
          <div className="wine-card divide-y divide-card-border/40">
            {recentCheckIns.map((c) => (
              <div key={c.id} className="flex items-center gap-3 px-4 py-3">
                <div className="h-8 w-8 rounded-lg bg-cherry/10 flex items-center justify-center flex-shrink-0">
                  <MapPin className="h-4 w-4 text-cherry" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-semibold text-foreground truncate">{c.wine.name}</p>
                  <p className="text-[11px] text-muted">
                    {[c.city, c.country].filter(Boolean).join(", ") || c.wine.region}
                  </p>
                </div>
                <p className="text-[10px] text-muted flex-shrink-0">
                  {new Date(c.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Activity timeline */}
      {timeline.length > 0 && (
        <section className="container-app mt-5">
          <h3 className="text-[15px] font-bold text-foreground mb-3 px-1" style={{ fontFamily: "Georgia, serif" }}>
            Activity Timeline
          </h3>
          <div className="wine-card p-4">
            <div className="flex items-end gap-1 h-20">
              {timeline.map((m) => {
                const total = m.tastings + m.checkIns + m.favorites;
                const maxTotal = Math.max(...timeline.map((t) => t.tastings + t.checkIns + t.favorites), 1);
                const heightPct = Math.max((total / maxTotal) * 100, 4);
                return (
                  <div key={m.month} className="flex-1 flex flex-col items-center gap-1">
                    <div
                      className="w-full rounded-t-[3px] bg-cherry/70 transition-all"
                      style={{ height: `${heightPct}%` }}
                    />
                    <span className="text-[8px] text-muted">
                      {new Date(m.month + "-01").toLocaleDateString("en-US", { month: "short" })}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* Wishlist reminder */}
      {counts.wishlist > 0 && (
        <section className="container-app mt-5">
          <div className="wine-card p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-amber-50 flex items-center justify-center flex-shrink-0">
              <BookmarkCheck className="h-5 w-5 text-amber-600" />
            </div>
            <div className="flex-1">
              <p className="text-[13px] font-semibold text-foreground">
                {counts.wishlist} wine{counts.wishlist !== 1 ? "s" : ""} on your wishlist
              </p>
              <p className="text-[11px] text-muted">Wines you want to try next</p>
            </div>
            <Link href="/wines" className="text-[11px] font-semibold text-cherry">
              View <ArrowRight className="inline h-3 w-3" />
            </Link>
          </div>
        </section>
      )}

      {/* Empty state call to action */}
      {totalInteractions === 0 && (
        <section className="container-app mt-5">
          <div className="wine-card p-6 text-center">
            <Wine className="h-10 w-10 text-cherry/20 mx-auto mb-3" />
            <h3 className="text-[16px] font-bold text-foreground" style={{ fontFamily: "Georgia, serif" }}>
              Start your wine journey
            </h3>
            <p className="text-[13px] text-muted mt-1 max-w-[280px] mx-auto">
              Explore regions, taste wines, check in at wineries — your passport fills as you go.
            </p>
            <div className="flex gap-2 justify-center mt-4">
              <Link
                href="/explore"
                className="px-4 py-2 rounded-[8px] bg-cherry text-white text-[13px] font-semibold"
              >
                Explore map
              </Link>
              <Link
                href="/wines"
                className="px-4 py-2 rounded-[8px] bg-card-border/30 text-foreground text-[13px] font-semibold"
              >
                Browse wines
              </Link>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}

function StatBadge({
  icon,
  value,
  label,
}: {
  icon: React.ReactNode;
  value: number;
  label: string;
}) {
  return (
    <div className="flex items-center gap-2 rounded-[10px] bg-card-bg border border-card-border/40 px-3 py-2.5">
      <div className="text-cherry/60">{icon}</div>
      <div>
        <p className="text-[16px] font-bold text-foreground leading-none">{value}</p>
        <p className="text-[10px] text-muted mt-0.5">{label}</p>
      </div>
    </div>
  );
}
