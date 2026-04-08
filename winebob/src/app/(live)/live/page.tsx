import { getUpcomingLiveEvents } from "@/lib/liveActions";
import Link from "next/link";
import {
  Radio, Calendar, Users, Wine, BadgeCheck, Clock, Plus,
  Sparkles, ChevronRight, Zap,
} from "lucide-react";

export const dynamic = "force-dynamic";

function getRelativeTime(date: Date): string {
  const now = new Date();
  const diff = date.getTime() - now.getTime();
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  if (diff < 0) return "Starting soon";
  if (hours > 24) return `${Math.floor(hours / 24)}d ${hours % 24}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

function diffBadge(d: string) {
  const m: Record<string, [string, string]> = {
    beginner: ["bg-emerald-50", "text-emerald-700"], intermediate: ["bg-amber-50", "text-amber-700"],
    advanced: ["bg-red-50", "text-red-700"], expert: ["bg-purple-50", "text-purple-700"],
  };
  const [bg, text] = m[d] ?? ["bg-card-border/30", "text-muted"];
  return `${bg} ${text}`;
}

export default async function LiveEventsPage() {
  const events = await getUpcomingLiveEvents();
  const liveNow = events.filter((e) => e.status === "live");
  const upcoming = events.filter((e) => e.status === "scheduled");

  return (
    <div className="min-h-screen pb-28 bg-background">
      {/* Header */}
      <div className="container-app pt-5 pb-3">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="heading-lg text-foreground">Live Tastings</h1>
            <p className="text-[12px] text-muted mt-0.5">Join sommeliers tasting wine in real-time</p>
          </div>
          <Link href="/live/create" className="h-9 w-9 rounded-xl bg-cherry flex items-center justify-center active:scale-90 transition-transform">
            <Plus className="h-4 w-4 text-white" strokeWidth={2.5} />
          </Link>
        </div>

        {/* Stats */}
        {(liveNow.length > 0 || upcoming.length > 0) && (
          <div className="flex items-center gap-3 mt-3">
            {liveNow.length > 0 && (
              <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-cherry bg-widget-wine px-2 py-1 rounded-md">
                <span className="h-1.5 w-1.5 rounded-full bg-cherry animate-pulse" />
                {liveNow.length} Live
              </span>
            )}
            <span className="text-[11px] font-semibold text-muted">{upcoming.length} upcoming</span>
            <span className="text-[11px] font-semibold text-muted">{events.reduce((s, e) => s + e._count.participants, 0)} tasters</span>
          </div>
        )}
      </div>

      {/* Live Now */}
      {liveNow.length > 0 && (
        <section className="container-app mt-1">
          <div className="space-y-2">
            {liveNow.map((event) => (
              <Link
                key={event.id}
                href={`/live/${event.id}`}
                className="block rounded-2xl bg-cherry-gradient px-4 py-3.5 text-white active:scale-[0.99] transition-transform"
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider bg-white/15 px-1.5 py-0.5 rounded">
                    <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" /> Live
                  </span>
                  <span className="text-[10px] font-semibold text-white/50 ml-auto">
                    <Users className="h-3 w-3 inline -mt-px" /> {event._count.participants}
                  </span>
                </div>
                <h3 className="text-[15px] font-bold leading-tight">{event.title}</h3>
                <div className="flex items-center gap-2 mt-2 text-[11px] text-white/60">
                  <span className="font-semibold text-white/80">{event.sommelier.displayName}</span>
                  {event.sommelier.verified && <BadgeCheck className="h-3 w-3 text-white/50" />}
                  <span className="ml-auto">{event._count.wines} wines</span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Upcoming */}
      <section className="container-app mt-4">
        <h2 className="label mb-2 flex items-center gap-1.5">
          <Calendar className="h-3 w-3" /> Upcoming
        </h2>

        {upcoming.length === 0 && liveNow.length === 0 ? (
          <div className="wine-card px-6 py-10 text-center">
            <Radio className="h-6 w-6 text-muted/30 mx-auto mb-3" />
            <p className="text-[14px] font-bold text-foreground">No upcoming tastings</p>
            <p className="text-[12px] text-muted mt-1 max-w-[220px] mx-auto">
              Be the first to host a live tasting session.
            </p>
            <div className="flex items-center justify-center gap-4 mt-4">
              <Link href="/live/create" className="text-[12px] font-bold text-cherry">
                + Host a Tasting
              </Link>
              <Link href="/sommeliers/become" className="text-[12px] font-semibold text-muted">
                Become a Som <ChevronRight className="h-3 w-3 inline" />
              </Link>
            </div>
          </div>
        ) : (
          <div className="wine-card divide-y divide-card-border/40">
            {upcoming.map((event) => {
              const date = new Date(event.scheduledAt);
              const timeStr = date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
              const dateStr = date.toLocaleDateString("en-US", { month: "short", day: "numeric" });

              return (
                <Link key={event.id} href={`/live/${event.id}`} className="flex items-center gap-3 px-3.5 py-3 active:bg-widget-wine/30 transition-colors">
                  {/* Date */}
                  <div className="text-center flex-shrink-0 w-10">
                    <p className="text-[10px] font-bold text-cherry uppercase">{date.toLocaleDateString("en-US", { weekday: "short" })}</p>
                    <p className="text-[16px] font-bold text-foreground leading-tight">{date.getDate()}</p>
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <h3 className="text-[13px] font-bold text-foreground truncate">{event.title}</h3>
                      <span className={`${diffBadge(event.difficulty)} text-[9px] font-bold px-1.5 py-0.5 rounded flex-shrink-0 capitalize`}>
                        {event.difficulty}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-0.5 text-[11px] text-muted">
                      <span>{event.sommelier.displayName}</span>
                      {event.sommelier.verified && <BadgeCheck className="h-2.5 w-2.5 text-cherry" />}
                      <span>{event._count.wines} wines</span>
                      {event.maxParticipants && <span>{event._count.participants}/{event.maxParticipants}</span>}
                    </div>
                  </div>

                  {/* Time + countdown */}
                  <div className="text-right flex-shrink-0">
                    <p className="text-[12px] font-semibold text-foreground">{timeStr}</p>
                    <p className="text-[10px] text-cherry font-semibold">{getRelativeTime(date)}</p>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>

      {/* CTA */}
      <section className="container-app mt-4">
        <Link href="/sommeliers/become" className="wine-card px-3.5 py-3 flex items-center gap-3 active:bg-widget-wine/20 transition-colors">
          <Sparkles className="h-4 w-4 text-cherry/50 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-[13px] font-bold text-foreground">Host Your Own Tastings</p>
            <p className="text-[11px] text-muted">Become a Winebob Sommelier</p>
          </div>
          <ChevronRight className="h-4 w-4 text-muted flex-shrink-0" />
        </Link>
      </section>
    </div>
  );
}
