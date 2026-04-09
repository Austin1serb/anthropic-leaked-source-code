import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import Link from "next/link";
import {
  Wine,
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
  Compass,
} from "lucide-react";

export const dynamic = "force-dynamic";

const TYPE_COLORS: Record<string, string> = {
  red: "#74070E",
  white: "#D4A843",
  "rosé": "#E8A0B4",
  sparkling: "#C9B037",
  dessert: "#B5651D",
  fortified: "#5C1A1B",
  orange: "#D4782F",
};

export default async function ProfilePage() {
  const session = await requireAuth();
  const userId = session.user.id;

  const [
    user,
    eventCount,
    totalGuests,
    recentEvents,
    favorites,
  ] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId }, select: { createdAt: true } }),
    prisma.blindTastingEvent.count({ where: { hostId: userId } }),
    prisma.guestParticipant.count({ where: { event: { hostId: userId } } }),
    prisma.blindTastingEvent.findMany({
      where: { hostId: userId },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: { id: true, title: true, status: true, createdAt: true, _count: { select: { guests: true } } },
    }),
    prisma.wineFavorite.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      include: { wine: true },
    }),
  ]);

  let wishlistItems: Array<{ id: string; wine: { id: string; name: string; producer: string; region: string; type: string } }> = [];
  try {
    wishlistItems = await (prisma as any).wineWishlist.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      include: { wine: { select: { id: true, name: true, producer: true, region: true, type: true } } },
    });
  } catch { /* not migrated */ }

  const favoriteCount = favorites.length;
  const initials = (session.user.name ?? "U").split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2);
  const memberSince = new Date(user?.createdAt ?? Date.now()).toLocaleDateString("en-US", { month: "long", year: "numeric" });

  // Taste profile
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
    .map(([type, count]) => ({ type, pct: Math.round((count / totalTyped) * 100), color: TYPE_COLORS[type] || "#888" }));

  const topGrapes = Object.entries(grapeCount).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([grape]) => grape);
  const regionsExplored = regionSet.size;
  const totalRegions = 28;
  const regionPct = Math.round((regionsExplored / totalRegions) * 100);
  const regionNames = Array.from(regionSet).sort();

  return (
    <div className="min-h-screen pb-28 safe-top bg-background">
      {/* ── Header ── */}
      <section className="flex flex-col items-center pt-6 pb-6 px-5">
        <div className="h-20 w-20 rounded-full bg-cherry/10 flex items-center justify-center">
          {session.user.image ? (
            <img src={session.user.image} alt="" className="w-full h-full object-cover rounded-full" />
          ) : (
            <span className="text-[26px] font-bold text-cherry">{initials}</span>
          )}
        </div>
        <h2 className="mt-3 text-[20px] font-bold text-foreground tracking-tight font-serif">
          {session.user.name ?? "Host"}
        </h2>
        <p className="text-[12px] text-muted mt-0.5">Member since {memberSince}</p>

        {/* Stats row */}
        <div className="flex items-center gap-6 mt-4">
          <div className="text-center">
            <p className="text-[18px] font-bold text-foreground nums">{eventCount}</p>
            <p className="text-[10px] text-muted">Events</p>
          </div>
          <div className="h-6 w-px bg-card-border/50" />
          <div className="text-center">
            <p className="text-[18px] font-bold text-foreground nums">{favoriteCount}</p>
            <p className="text-[10px] text-muted">Favorites</p>
          </div>
          <div className="h-6 w-px bg-card-border/50" />
          <div className="text-center">
            <p className="text-[18px] font-bold text-foreground nums">{totalGuests}</p>
            <p className="text-[10px] text-muted">Guests</p>
          </div>
        </div>
      </section>

      <div className="px-5 max-w-lg mx-auto space-y-5">

        {/* ── Wine Passport link ── */}
        <Link href="/journey" className="group flex items-center gap-4 p-4 rounded-[14px] border-2 border-cherry/15 bg-white hover:border-cherry/30 transition-all">
          <div className="h-10 w-10 rounded-[10px] bg-cherry flex items-center justify-center flex-shrink-0">
            <Compass className="h-5 w-5 text-white" />
          </div>
          <div className="flex-1">
            <p className="text-[14px] font-bold text-foreground">Wine Passport</p>
            <p className="text-[11px] text-muted">Your journey — regions, grapes, tastings</p>
          </div>
          <ChevronRight className="h-4 w-4 text-cherry/30 group-hover:text-cherry transition-colors flex-shrink-0" />
        </Link>

        {/* ── My Cellar ── */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-[11px] font-bold text-muted uppercase tracking-widest">My Cellar</h3>
            {favoriteCount > 0 && (
              <Link href="/wines" className="text-[11px] font-semibold text-cherry">
                See all <ChevronRight className="inline h-3 w-3" />
              </Link>
            )}
          </div>
          {favoriteCount === 0 ? (
            <Link href="/wines" className="block bg-white rounded-[14px] border border-card-border/60 px-5 py-8 text-center">
              <Plus className="h-6 w-6 text-cherry/30 mx-auto mb-2" />
              <p className="text-[13px] font-semibold text-foreground">Start building your cellar</p>
              <p className="text-[12px] text-muted mt-0.5">Browse wines and add your favorites</p>
            </Link>
          ) : (
            <div className="bg-white rounded-[14px] border border-card-border/60 overflow-hidden divide-y divide-card-border/30">
              {favorites.slice(0, 6).map((fav) => (
                <Link key={fav.id} href={`/wines/${fav.wine.id}`} className="flex items-center gap-3 px-5 py-3 hover:bg-butter/60 transition-colors">
                  <div className="h-2 w-2 rounded-full flex-shrink-0" style={{ backgroundColor: TYPE_COLORS[fav.wine.type] || "#888" }} />
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-medium text-foreground truncate">{fav.wine.name}</p>
                    <p className="text-[11px] text-muted truncate">{fav.wine.producer} · {fav.wine.region}</p>
                  </div>
                  {fav.rating != null && (
                    <div className="flex items-center gap-0.5 flex-shrink-0">
                      <Star className="h-3 w-3 text-amber-500 fill-amber-500" />
                      <span className="text-[11px] font-semibold text-foreground">{fav.rating}</span>
                    </div>
                  )}
                </Link>
              ))}
            </div>
          )}
        </section>

        {/* ── Taste Profile ── */}
        {favoriteCount > 0 && (
          <section>
            <h3 className="text-[11px] font-bold text-muted uppercase tracking-widest mb-3">Taste Profile</h3>
            <div className="bg-white rounded-[14px] border border-card-border/60 p-5">
              <div className="flex rounded-full overflow-hidden h-2.5 bg-card-border/20">
                {typeSegments.map((seg) => (
                  <div key={seg.type} style={{ width: `${seg.pct}%`, backgroundColor: seg.color, minWidth: seg.pct > 0 ? "4px" : "0" }} />
                ))}
              </div>
              <div className="flex flex-wrap gap-x-4 gap-y-1 mt-3">
                {typeSegments.map((seg) => (
                  <div key={seg.type} className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: seg.color }} />
                    <span className="text-[11px] text-muted capitalize">{seg.type} {seg.pct}%</span>
                  </div>
                ))}
              </div>
              {topGrapes.length > 0 && (
                <div className="mt-3 pt-3 border-t border-card-border/30">
                  <p className="text-[11px] text-muted">
                    Top grapes: <span className="font-semibold text-foreground">{topGrapes.join(", ")}</span>
                  </p>
                </div>
              )}
            </div>
          </section>
        )}

        {/* ── Regions Explored ── */}
        {favoriteCount > 0 && (
          <section>
            <h3 className="text-[11px] font-bold text-muted uppercase tracking-widest mb-3">Regions Explored</h3>
            <div className="bg-white rounded-[14px] border border-card-border/60 p-5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[13px] font-semibold text-foreground nums">{regionsExplored}/{totalRegions}</span>
                <span className="text-[11px] text-muted">{regionPct}%</span>
              </div>
              <div className="h-2 rounded-full bg-card-border/20 overflow-hidden">
                <div className="h-full rounded-full bg-cherry transition-all" style={{ width: `${Math.max(regionPct, 2)}%` }} />
              </div>
              {regionNames.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {regionNames.map((region) => (
                    <span key={region} className="text-[10px] font-medium text-cherry bg-cherry/[0.07] px-2 py-0.5 rounded-full">{region}</span>
                  ))}
                </div>
              )}
            </div>
          </section>
        )}

        {/* ── Tasting History ── */}
        <section>
          <h3 className="text-[11px] font-bold text-muted uppercase tracking-widest mb-3">Tasting History</h3>
          {recentEvents.length === 0 ? (
            <div className="bg-white rounded-[14px] border border-card-border/60 px-5 py-8 text-center">
              <Trophy className="h-6 w-6 text-muted/20 mx-auto mb-2" />
              <p className="text-[13px] text-muted">No events yet</p>
            </div>
          ) : (
            <div className="bg-white rounded-[14px] border border-card-border/60 overflow-hidden divide-y divide-card-border/30">
              {recentEvents.map((event) => (
                <Link key={event.id} href={`/arena/event/${event.id}`} className="flex items-center gap-3 px-5 py-3 hover:bg-butter/60 transition-colors">
                  <div className={`h-8 w-8 rounded-[8px] flex items-center justify-center flex-shrink-0 ${
                    event.status === "completed" ? "bg-amber-50" : "bg-cherry/8"
                  }`}>
                    {event.status === "completed" ? <Trophy className="h-4 w-4 text-amber-600" /> : <Clock className="h-4 w-4 text-cherry" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-medium text-foreground truncate">{event.title}</p>
                    <p className="text-[11px] text-muted">
                      {new Date(event.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })} · {event._count.guests} guests
                    </p>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    event.status === "completed" ? "bg-emerald-50 text-emerald-700"
                      : event.status === "live" ? "bg-cherry/[0.07] text-cherry"
                      : "bg-card-border/20 text-muted"
                  }`}>
                    {event.status}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </section>

        {/* ── Wishlist ── */}
        <section>
          <h3 className="text-[11px] font-bold text-muted uppercase tracking-widest mb-3">Wishlist</h3>
          {wishlistItems.length === 0 ? (
            <Link href="/wines" className="block bg-white rounded-[14px] border border-card-border/60 px-5 py-8 text-center">
              <Heart className="h-6 w-6 text-cherry/30 mx-auto mb-2" />
              <p className="text-[13px] font-semibold text-foreground">Add wines to your wishlist</p>
              <p className="text-[12px] text-muted mt-0.5">Wines you want to try next</p>
            </Link>
          ) : (
            <div className="bg-white rounded-[14px] border border-card-border/60 overflow-hidden divide-y divide-card-border/30">
              {wishlistItems.slice(0, 6).map((item) => (
                <Link key={item.id} href={`/wines/${item.wine.id}`} className="flex items-center gap-3 px-5 py-3 hover:bg-butter/60 transition-colors">
                  <div className="h-2 w-2 rounded-full flex-shrink-0" style={{ backgroundColor: TYPE_COLORS[item.wine.type] || "#888" }} />
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-medium text-foreground truncate">{item.wine.name}</p>
                    <p className="text-[11px] text-muted truncate">{item.wine.producer} · {item.wine.region}</p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>

        {/* ── Settings ── */}
        <section>
          <details className="group">
            <summary className="flex items-center justify-between cursor-pointer mb-3 list-none">
              <h3 className="text-[11px] font-bold text-muted uppercase tracking-widest">Settings</h3>
              <ChevronDown className="h-4 w-4 text-muted transition-transform group-open:rotate-180" />
            </summary>
            <div className="bg-white rounded-[14px] border border-card-border/60 overflow-hidden divide-y divide-card-border/30">
              <SettingsRow icon={<Bell className="h-4 w-4 text-blue-600" />} bg="bg-blue-50" label="Notifications" />
              <SettingsRow icon={<Palette className="h-4 w-4 text-purple-600" />} bg="bg-purple-50" label="Appearance" />
              <SettingsRow icon={<Shield className="h-4 w-4 text-emerald-600" />} bg="bg-emerald-50" label="Privacy" />
              <SettingsRow icon={<HelpCircle className="h-4 w-4 text-amber-600" />} bg="bg-amber-50" label="Help & Support" />
            </div>
          </details>
        </section>

        {/* ── Sign Out ── */}
        <a
          href="/api/auth/signout"
          className="flex items-center gap-3 px-5 py-3 rounded-[14px] bg-white border border-card-border/60 hover:bg-red-50 transition-colors"
        >
          <div className="h-8 w-8 rounded-[8px] bg-red-50 flex items-center justify-center">
            <LogOut className="h-4 w-4 text-red-500" />
          </div>
          <span className="text-[13px] font-semibold text-red-500">Sign Out</span>
        </a>
      </div>
    </div>
  );
}

function SettingsRow({ icon, bg, label }: { icon: React.ReactNode; bg: string; label: string }) {
  return (
    <button className="w-full px-5 py-3 flex items-center gap-3 hover:bg-butter/60 transition-colors touch-target">
      <div className={`h-8 w-8 rounded-[8px] ${bg} flex items-center justify-center flex-shrink-0`}>
        {icon}
      </div>
      <span className="text-[13px] font-medium text-foreground flex-1 text-left">{label}</span>
      <ChevronRight className="h-4 w-4 text-muted/30 flex-shrink-0" />
    </button>
  );
}
