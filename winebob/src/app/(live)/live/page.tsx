import { getUpcomingLiveEvents } from "@/lib/liveActions";
import Link from "next/link";
import {
  Radio, Calendar, Users, Wine, BadgeCheck, Clock, Plus,
  Flame, Sparkles, Star, ChevronRight, Zap,
} from "lucide-react";

export const dynamic = "force-dynamic";

function getRelativeTime(date: Date): string {
  const now = new Date();
  const diff = date.getTime() - now.getTime();
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  if (diff < 0) return "Starting soon";
  if (hours > 24) {
    const days = Math.floor(hours / 24);
    return `in ${days}d ${hours % 24}h`;
  }
  if (hours > 0) return `in ${hours}h ${minutes}m`;
  return `in ${minutes}m`;
}

function getDifficultyBadge(difficulty: string) {
  switch (difficulty) {
    case "beginner": return { label: "Beginner", bg: "bg-emerald-50", text: "text-emerald-700" };
    case "intermediate": return { label: "Intermediate", bg: "bg-amber-50", text: "text-amber-700" };
    case "advanced": return { label: "Advanced", bg: "bg-red-50", text: "text-red-700" };
    case "expert": return { label: "Expert", bg: "bg-purple-50", text: "text-purple-700" };
    default: return { label: difficulty, bg: "bg-card-border/30", text: "text-muted" };
  }
}

export default async function LiveEventsPage() {
  const events = await getUpcomingLiveEvents();

  const liveNow = events.filter((e) => e.status === "live");
  const upcoming = events.filter((e) => e.status === "scheduled");

  return (
    <div className="min-h-screen pb-28 bg-background">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none bg-hero-gradient" />
        <div className="container-app pt-8 pb-6 relative">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2.5 mb-3">
                <div className="h-8 w-8 rounded-xl bg-cherry flex items-center justify-center float-action">
                  <Radio className="h-4 w-4 text-white" />
                </div>
                <h1 className="heading-xl text-foreground">Live Tastings</h1>
              </div>
              <p className="text-[14px] leading-relaxed text-muted">
                Join expert sommeliers for real-time blind tasting sessions.
                <br />
                Guess, compete, and learn together.
              </p>
            </div>
            <Link
              href="/live/create"
              className="h-12 w-12 rounded-2xl bg-cherry flex items-center justify-center active:scale-90 transition-transform flex-shrink-0 float-action"
            >
              <Plus className="h-5 w-5 text-white" strokeWidth={2.5} />
            </Link>
          </div>

          {/* Quick Stats Bar */}
          {(liveNow.length > 0 || upcoming.length > 0) && (
            <div className="flex items-center gap-4 mt-5">
              {liveNow.length > 0 && (
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full widget-wine">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cherry opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-cherry" />
                  </span>
                  <span className="text-[12px] font-bold text-cherry">{liveNow.length} Live Now</span>
                </div>
              )}
              {upcoming.length > 0 && (
                <div className="flex items-center gap-1.5 text-[12px] font-semibold text-muted">
                  <Calendar className="h-3.5 w-3.5" />
                  {upcoming.length} upcoming
                </div>
              )}
              <div className="flex items-center gap-1.5 text-[12px] font-semibold text-muted">
                <Users className="h-3.5 w-3.5" />
                {events.reduce((sum, e) => sum + e._count.participants, 0)} tasters
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Live Now — Prominent Cards */}
      {liveNow.length > 0 && (
        <section className="container-app mt-2">
          <div className="flex items-center gap-2 mb-4">
            <Flame className="h-4.5 w-4.5 text-cherry" />
            <h2 className="text-[16px] font-bold text-foreground">Happening Now</h2>
          </div>
          <div className="space-y-4">
            {liveNow.map((event) => {
              const diff = getDifficultyBadge(event.difficulty);
              return (
                <Link
                  key={event.id}
                  href={`/live/${event.id}`}
                  className="block rounded-[24px] bg-cherry-gradient p-5 text-white active:scale-[0.98] transition-transform float-action"
                >
                  {/* Live badge + viewers */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2.5">
                      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/15">
                        <span className="relative flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-white" />
                        </span>
                        <span className="text-[11px] font-bold uppercase tracking-wider text-white/90">Live</span>
                      </div>
                      <span className="bg-white/10 text-white/70 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide">
                        {diff.label}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Users className="h-3.5 w-3.5 text-white/50" />
                      <span className="text-[13px] font-bold text-white/70 tabular-nums">
                        {event._count.participants}
                      </span>
                    </div>
                  </div>

                  {/* Title + description */}
                  <h3 className="text-[20px] font-bold leading-tight">{event.title}</h3>
                  {event.description && (
                    <p className="text-[13px] mt-1.5 text-white/60 line-clamp-2">{event.description}</p>
                  )}

                  {/* Sommelier + wine count */}
                  <div className="mt-4 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      {event.sommelier.avatar ? (
                        <img src={event.sommelier.avatar} alt="" className="h-8 w-8 rounded-full object-cover ring-2 ring-white/20" />
                      ) : (
                        <div className="h-8 w-8 rounded-full bg-white/20 flex items-center justify-center text-[12px] font-bold">
                          {event.sommelier.displayName.charAt(0)}
                        </div>
                      )}
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-[13px] font-semibold text-white/90">
                            {event.sommelier.displayName}
                          </span>
                          {event.sommelier.verified && <BadgeCheck className="h-3.5 w-3.5 text-white/60" />}
                        </div>
                        {event.sommelier.expertise.length > 0 && (
                          <span className="text-[10px] font-medium text-white/40">
                            {event.sommelier.expertise.slice(0, 2).join(" & ")}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10">
                      <Wine className="h-3.5 w-3.5 text-white/50" />
                      <span className="text-[12px] font-bold text-white/80">{event._count.wines} wines</span>
                    </div>
                  </div>

                  {/* Join CTA */}
                  <div className="mt-4 flex items-center justify-center gap-2 py-3 rounded-2xl bg-white/15 active:bg-white/20 transition-colors">
                    <Zap className="h-4 w-4 text-white" />
                    <span className="text-[14px] font-bold text-white">Join Now</span>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {/* Upcoming Events */}
      <section className="container-app mt-8">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted" />
            <h2 className="text-[16px] font-bold text-foreground">Upcoming</h2>
          </div>
        </div>

        {upcoming.length === 0 && liveNow.length === 0 ? (
          <div className="wine-card p-8 text-center">
            {/* Empty state */}
            <div className="relative mx-auto mb-6" style={{ width: 80, height: 80 }}>
              <div className="absolute inset-0 rounded-3xl widget-lavender animate-pulse" />
              <div className="absolute inset-0 flex items-center justify-center">
                <Radio className="h-8 w-8 text-purple-600/40" />
              </div>
            </div>
            <h3 className="text-[18px] font-bold text-foreground mb-2">No upcoming tastings</h3>
            <p className="text-[14px] leading-relaxed text-muted max-w-[260px] mx-auto mb-6">
              Be the first to host a live tasting session for the community.
            </p>
            <div className="flex flex-col items-center gap-3">
              <Link
                href="/live/create"
                className="btn-primary px-8 w-auto touch-target"
              >
                <Plus className="h-4 w-4" /> Host a Tasting
              </Link>
              <Link
                href="/sommeliers/become"
                className="inline-flex items-center gap-1 text-[13px] font-semibold text-cherry"
              >
                Become a Sommelier <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-3 stagger-children">
            {upcoming.map((event) => {
              const date = new Date(event.scheduledAt);
              const dateStr = date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
              const timeStr = date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
              const countdown = getRelativeTime(date);
              const diff = getDifficultyBadge(event.difficulty);

              return (
                <Link
                  key={event.id}
                  href={`/live/${event.id}`}
                  className="wine-card p-4 block active:scale-[0.98] transition-transform"
                >
                  <div className="flex items-start gap-3.5">
                    {/* Date Block */}
                    <div className="widget-card widget-wine p-3 text-center flex-shrink-0 min-w-[60px]">
                      <p className="text-[10px] font-bold text-cherry uppercase tracking-wide">
                        {dateStr.split(",")[0]}
                      </p>
                      <p className="text-[22px] font-bold text-foreground leading-tight">
                        {date.getDate()}
                      </p>
                      <p className="text-[10px] font-semibold text-muted">
                        {date.toLocaleDateString("en-US", { month: "short" })}
                      </p>
                    </div>

                    <div className="flex-1 min-w-0">
                      {/* Countdown + difficulty badges */}
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full widget-wine text-cherry">
                          <Clock className="h-2.5 w-2.5" /> {countdown}
                        </span>
                        <span className={`${diff.bg} ${diff.text} text-[10px] font-bold px-2 py-0.5 rounded-full`}>
                          {diff.label}
                        </span>
                      </div>

                      <h3 className="font-bold text-[15px] text-foreground leading-tight line-clamp-1">
                        {event.title}
                      </h3>
                      {event.description && (
                        <p className="text-[12px] text-muted mt-0.5 line-clamp-1">{event.description}</p>
                      )}

                      {/* Meta row */}
                      <div className="flex items-center gap-3 mt-2.5 flex-wrap">
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-muted">
                          <Clock className="h-3 w-3" /> {timeStr}
                        </span>
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-muted">
                          <Wine className="h-3 w-3" /> {event._count.wines} wines
                        </span>
                        {event.maxParticipants && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-muted">
                            <Users className="h-3 w-3" /> {event._count.participants}/{event.maxParticipants}
                          </span>
                        )}
                      </div>

                      {/* Sommelier */}
                      <div className="flex items-center gap-2 mt-2.5">
                        {event.sommelier.avatar ? (
                          <img src={event.sommelier.avatar} alt="" className="h-5 w-5 rounded-full object-cover" />
                        ) : (
                          <div className="h-5 w-5 rounded-full widget-wine flex items-center justify-center text-[9px] font-bold text-cherry">
                            {event.sommelier.displayName.charAt(0)}
                          </div>
                        )}
                        <span className="text-[11px] font-semibold text-muted">
                          {event.sommelier.displayName}
                        </span>
                        {event.sommelier.verified && <BadgeCheck className="h-3 w-3 text-cherry" />}
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>

      {/* Become a Sommelier CTA */}
      <section className="container-app mt-8">
        <Link
          href="/sommeliers/become"
          className="wine-card p-5 block active:scale-[0.98] transition-transform"
        >
          <div className="flex items-center gap-4">
            <div className="h-14 w-14 rounded-2xl widget-wine flex items-center justify-center flex-shrink-0">
              <Sparkles className="h-6 w-6 text-cherry/50" />
            </div>
            <div className="flex-1">
              <h3 className="text-[15px] font-bold text-foreground">Host Your Own Tastings</h3>
              <p className="text-[12px] text-muted mt-0.5">
                Share your expertise and build your audience as a Winebob Sommelier.
              </p>
            </div>
            <ChevronRight className="h-5 w-5 text-muted flex-shrink-0" />
          </div>
        </Link>
      </section>
    </div>
  );
}
