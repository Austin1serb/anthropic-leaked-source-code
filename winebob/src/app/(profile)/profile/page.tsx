import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import {
  Wine,
  Users,
  Trophy,
  ChevronRight,
  LogOut,
  Bell,
  Shield,
  HelpCircle,
  Palette,
  Heart,
  MapPin,
  Star,
  Plus,
  Clock,
  ChevronDown,
} from "lucide-react";

export const dynamic = "force-dynamic";

// Wine type to color mapping
const wineTypeColors: Record<string, string> = {
  red: "#74070E",
  white: "#D4A843",
  rosé: "#E8A0B4",
  sparkling: "#C9B037",
  dessert: "#B5651D",
  fortified: "#5C1A1B",
  orange: "#D4782F",
};

export default async function ProfilePage() {
  const session = await requireAuth();
  const userId = session.user.id;

  // Core queries (always available)
  const [
    user,
    eventCount,
    totalGuests,
    recentEvents,
    favorites,
  ] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId }, select: { createdAt: true } }),
    prisma.blindTastingEvent.count({ where: { hostId: userId } }),
    prisma.guestParticipant.count({
      where: { event: { hostId: userId } },
    }),
    prisma.blindTastingEvent.findMany({
      where: { hostId: userId },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: {
        id: true,
        title: true,
        status: true,
        createdAt: true,
        completedAt: true,
        _count: { select: { guests: true } },
      },
    }),
    prisma.wineFavorite.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      include: { wine: true },
    }),
  ]);

  // New model queries -- wrapped in try/catch since migrations may not have run
  let wishlistItems: Array<{ id: string; wine: { id: string; name: string; producer: string; region: string; type: string } }> = [];
  try {
    wishlistItems = await (prisma as any).wineWishlist.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      include: { wine: { select: { id: true, name: true, producer: true, region: true, type: true } } },
    });
  } catch {
    // Model not yet migrated
  }

  let recentTastings: Array<{ id: string; rating: number | null; notes: string | null; tastedAt: Date; wine: { name: string; producer: string } }> = [];
  try {
    recentTastings = await (prisma as any).wineTasting.findMany({
      where: { userId },
      orderBy: { tastedAt: "desc" },
      take: 5,
      include: { wine: { select: { name: true, producer: true } } },
    });
  } catch {
    // Model not yet migrated
  }

  // Derived data
  const favoriteCount = favorites.length;
  const initials = (session.user.name ?? "U")
    .split(" ")
    .map((n: string) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const memberSince = new Date(user?.createdAt ?? Date.now()).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  // Taste profile: compute wine type distribution from favorites
  const typeDistribution: Record<string, number> = {};
  const grapeCount: Record<string, number> = {};
  const regionSet = new Set<string>();

  for (const fav of favorites) {
    const w = fav.wine;
    typeDistribution[w.type] = (typeDistribution[w.type] || 0) + 1;
    regionSet.add(w.region);
    for (const grape of w.grapes ?? []) {
      grapeCount[grape] = (grapeCount[grape] || 0) + 1;
    }
  }

  const totalTyped = Object.values(typeDistribution).reduce((a, b) => a + b, 0) || 1;
  const typeSegments = Object.entries(typeDistribution)
    .sort((a, b) => b[1] - a[1])
    .map(([type, count]) => ({
      type,
      pct: Math.round((count / totalTyped) * 100),
      color: wineTypeColors[type] || "#888",
    }));

  const topGrapes = Object.entries(grapeCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([grape]) => grape);

  const regionsExplored = regionSet.size;
  const totalRegions = 27;
  const regionPct = Math.round((regionsExplored / totalRegions) * 100);
  const regionNames = Array.from(regionSet).sort();

  return (
    <div className="min-h-screen pb-28 safe-top bg-profile-gradient">
      {/* ── Header: Avatar + Name + Stats ── */}
      <section className="flex flex-col items-center pt-4 pb-5 px-5">
        <div className="relative">
          <div className="w-24 h-24 rounded-[28px] bg-card-bg flex items-center justify-center shadow-lg shadow-black/5 border border-card-border overflow-hidden">
            {session.user.image ? (
              <img
                src={session.user.image}
                alt=""
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-3xl font-bold text-cherry">{initials}</span>
            )}
          </div>
          <div className="absolute -bottom-1 -right-1 h-6 w-6 rounded-full bg-green-500 border-[3px] border-background" />
        </div>
        <h2
          className="mt-4 text-xl font-bold text-foreground tracking-tight"
          style={{ fontFamily: "serif" }}
        >
          {session.user.name ?? "Host"}
        </h2>
        <p className="text-[12px] text-muted mt-0.5">
          Member since {memberSince}
        </p>
        <p className="text-[13px] text-muted mt-1">
          {eventCount} events hosted · {favoriteCount} wines favorited
        </p>
      </section>

      {/* ── My Cellar ── */}
      <section className="container-app mt-2 stagger-children">
        <div className="flex items-center justify-between mb-3 px-1">
          <h3
            className="text-[15px] font-bold text-foreground"
            style={{ fontFamily: "serif" }}
          >
            My Cellar
          </h3>
          {favoriteCount > 0 && (
            <a href="/wines" className="text-[12px] font-semibold text-cherry">
              See all <ChevronRight className="inline h-3 w-3" />
            </a>
          )}
        </div>
        {favoriteCount === 0 ? (
          <a
            href="/wines"
            className="wine-card px-4 py-5 flex flex-col items-center gap-2 text-center"
          >
            <div className="h-10 w-10 rounded-2xl bg-cherry/10 flex items-center justify-center">
              <Plus className="h-5 w-5 text-cherry" />
            </div>
            <p className="text-[14px] font-semibold text-foreground">Start building your cellar</p>
            <p className="text-[12px] text-muted">Browse wines and add your favorites</p>
          </a>
        ) : (
          <div className="flex gap-3 overflow-x-auto pb-2 -mx-5 px-5 scrollbar-hide">
            {favorites.slice(0, 10).map((fav) => (
              <div
                key={fav.id}
                className="wine-card flex-shrink-0 w-[160px] overflow-hidden"
              >
                <div className="flex">
                  <div
                    className="w-[4px] min-h-full flex-shrink-0"
                    style={{ backgroundColor: wineTypeColors[fav.wine.type] || "#888" }}
                  />
                  <div className="p-3 flex-1 min-w-0">
                    <p className="text-[14px] font-bold text-foreground truncate">
                      {fav.wine.name}
                    </p>
                    <p className="text-[11px] text-muted mt-0.5 truncate">
                      {[fav.wine.producer, fav.wine.region].filter(Boolean).join(" · ")}
                    </p>
                    {fav.rating != null && (
                      <div className="flex items-center gap-1 mt-1.5">
                        <Star className="h-3 w-3 text-amber-500 fill-amber-500" />
                        <span className="text-[11px] font-semibold text-foreground">
                          {fav.rating}/5
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ── Taste Profile ── */}
      {favoriteCount > 0 && (
        <section className="container-app mt-6 stagger-children">
          <h3
            className="text-[15px] font-bold text-foreground mb-3 px-1"
            style={{ fontFamily: "serif" }}
          >
            Taste Profile
          </h3>
          <div className="wine-card p-4">
            {/* Type distribution bar */}
            <div className="flex rounded-full overflow-hidden h-3 bg-card-border/30">
              {typeSegments.map((seg) => (
                <div
                  key={seg.type}
                  style={{
                    width: `${seg.pct}%`,
                    backgroundColor: seg.color,
                    minWidth: seg.pct > 0 ? "4px" : "0",
                  }}
                />
              ))}
            </div>
            {/* Type legend */}
            <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2.5">
              {typeSegments.map((seg) => (
                <div key={seg.type} className="flex items-center gap-1.5">
                  <div
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: seg.color }}
                  />
                  <span className="text-[11px] text-muted capitalize">
                    {seg.type} {seg.pct}%
                  </span>
                </div>
              ))}
            </div>
            {/* Top grapes */}
            {topGrapes.length > 0 && (
              <div className="mt-3 pt-3 border-t border-card-border/30">
                <p className="text-[11px] text-muted">
                  Your top grapes:{" "}
                  <span className="font-semibold text-foreground">
                    {topGrapes.join(", ")}
                  </span>
                </p>
              </div>
            )}
          </div>
        </section>
      )}

      {/* ── Tasting History ── */}
      <section className="container-app mt-6 stagger-children">
        <h3
          className="text-[15px] font-bold text-foreground mb-3 px-1"
          style={{ fontFamily: "serif" }}
        >
          Tasting History
        </h3>
        {recentEvents.length === 0 ? (
          <div className="wine-card px-4 py-4 text-center">
            <p className="text-[13px] text-muted">No events yet</p>
          </div>
        ) : (
          <div className="wine-card divide-y divide-card-border/40">
            {recentEvents.map((event) => (
              <a
                key={event.id}
                href={`/events/${event.id}`}
                className="flex items-center gap-3 px-4 py-3 active:bg-card-border/20 transition-colors"
              >
                <div className="h-9 w-9 rounded-xl bg-cherry/10 flex items-center justify-center flex-shrink-0">
                  <Clock className="h-4 w-4 text-cherry" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[14px] font-semibold text-foreground truncate">
                    {event.title}
                  </p>
                  <p className="text-[11px] text-muted">
                    {new Date(event.createdAt).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}{" "}
                    · {event._count.guests} guests
                  </p>
                </div>
                <span
                  className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                    event.status === "completed"
                      ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                      : event.status === "live"
                        ? "bg-cherry/10 text-cherry"
                        : "bg-card-border/30 text-muted"
                  }`}
                >
                  {event.status}
                </span>
              </a>
            ))}
          </div>
        )}
      </section>

      {/* ── Wishlist ── */}
      <section className="container-app mt-6 stagger-children">
        <h3
          className="text-[15px] font-bold text-foreground mb-3 px-1"
          style={{ fontFamily: "serif" }}
        >
          Wishlist
        </h3>
        {wishlistItems.length === 0 ? (
          <a
            href="/wines"
            className="wine-card px-4 py-5 flex flex-col items-center gap-2 text-center"
          >
            <div className="h-10 w-10 rounded-2xl bg-cherry/10 flex items-center justify-center">
              <Heart className="h-5 w-5 text-cherry" />
            </div>
            <p className="text-[14px] font-semibold text-foreground">Add wines to your wishlist</p>
            <p className="text-[12px] text-muted">Wines you want to try next</p>
          </a>
        ) : (
          <div className="flex gap-3 overflow-x-auto pb-2 -mx-5 px-5 scrollbar-hide">
            {wishlistItems.slice(0, 10).map((item) => (
              <div
                key={item.id}
                className="wine-card flex-shrink-0 w-[160px] overflow-hidden"
              >
                <div className="flex">
                  <div
                    className="w-[4px] min-h-full flex-shrink-0"
                    style={{ backgroundColor: wineTypeColors[item.wine.type] || "#888" }}
                  />
                  <div className="p-3 flex-1 min-w-0">
                    <p className="text-[14px] font-bold text-foreground truncate">
                      {item.wine.name}
                    </p>
                    <p className="text-[11px] text-muted mt-0.5 truncate">
                      {[item.wine.producer, item.wine.region].filter(Boolean).join(" · ")}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ── Regions Explored ── */}
      {favoriteCount > 0 && (
        <section className="container-app mt-6 stagger-children">
          <h3
            className="text-[15px] font-bold text-foreground mb-3 px-1"
            style={{ fontFamily: "serif" }}
          >
            Regions Explored
          </h3>
          <div className="wine-card p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-cherry" />
                <span className="text-[14px] font-semibold text-foreground">
                  {regionsExplored}/{totalRegions} regions
                </span>
              </div>
              <span className="text-[12px] text-muted">{regionPct}%</span>
            </div>
            {/* Progress bar */}
            <div className="h-2 rounded-full bg-card-border/30 overflow-hidden">
              <div
                className="h-full rounded-full bg-cherry transition-all"
                style={{ width: `${regionPct}%` }}
              />
            </div>
            {/* Region pills */}
            {regionNames.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-3">
                {regionNames.map((region) => (
                  <span
                    key={region}
                    className="text-[10px] font-medium text-cherry bg-cherry/10 px-2 py-0.5 rounded-full"
                  >
                    {region}
                  </span>
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {/* ── Settings (compact) ── */}
      <section className="container-app mt-6">
        <details className="group">
          <summary className="flex items-center justify-between cursor-pointer px-1 mb-3 list-none">
            <h3
              className="text-[15px] font-bold text-foreground"
              style={{ fontFamily: "serif" }}
            >
              Settings
            </h3>
            <ChevronDown className="h-4 w-4 text-muted transition-transform group-open:rotate-180" />
          </summary>
          <div className="wine-card divide-y divide-card-border/40">
            <SettingsRow
              icon={<Bell className="h-[18px] w-[18px] text-blue-600" />}
              iconBg="widget-sky"
              label="Notifications"
            />
            <SettingsRow
              icon={<Palette className="h-[18px] w-[18px] text-purple-600" />}
              iconBg="widget-lavender"
              label="Appearance"
            />
            <SettingsRow
              icon={<Shield className="h-[18px] w-[18px] text-emerald-700" />}
              iconBg="widget-sage"
              label="Privacy"
            />
            <SettingsRow
              icon={<HelpCircle className="h-[18px] w-[18px] text-amber-700" />}
              iconBg="widget-gold"
              label="Help & Support"
            />
          </div>
        </details>
      </section>

      {/* ── Sign Out ── */}
      <section className="container-app mt-4 mb-6">
        <a
          href="/api/auth/signout"
          className="wine-card px-4 py-3 flex items-center gap-3 active:scale-[0.98] transition-transform"
        >
          <div className="h-8 w-8 rounded-lg bg-red-50 flex items-center justify-center dark:bg-red-900/20">
            <LogOut className="h-4 w-4 text-red-500" />
          </div>
          <span className="text-[14px] font-semibold text-red-500">Sign Out</span>
        </a>
      </section>
    </div>
  );
}

function SettingsRow({
  icon,
  iconBg,
  label,
}: {
  icon: React.ReactNode;
  iconBg: string;
  label: string;
}) {
  return (
    <button className="w-full px-4 py-3 flex items-center gap-3 active:bg-card-border/20 transition-colors touch-target">
      <div className={`h-8 w-8 rounded-lg ${iconBg} flex items-center justify-center flex-shrink-0`}>
        {icon}
      </div>
      <span className="text-[14px] font-medium text-foreground flex-1 text-left">{label}</span>
      <ChevronRight className="h-4 w-4 text-muted/30 flex-shrink-0" />
    </button>
  );
}
