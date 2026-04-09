import { getUpcomingLiveEvents } from "@/lib/liveActions";
import Link from "next/link";
import {
  Radio, Calendar, Users, Wine, BadgeCheck, Clock,
  Plus, Sparkles, ChevronRight, Zap,
} from "lucide-react";

export const dynamic = "force-dynamic";

function getRelativeTime(date: Date): string {
  const now = new Date();
  const diff = date.getTime() - now.getTime();
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  if (diff < 0) return "Starting soon";
  if (hours > 24) return `in ${Math.floor(hours / 24)}d ${hours % 24}h`;
  if (hours > 0) return `in ${hours}h ${minutes}m`;
  return `in ${minutes}m`;
}

const DIFF_BADGE: Record<string, { label: string; bg: string; text: string }> = {
  beginner: { label: "Beginner", bg: "bg-emerald-50", text: "text-emerald-700" },
  intermediate: { label: "Intermediate", bg: "bg-amber-50", text: "text-amber-700" },
  advanced: { label: "Advanced", bg: "bg-red-50", text: "text-red-700" },
  expert: { label: "Expert", bg: "bg-purple-50", text: "text-purple-700" },
};

export default async function LiveEventsPage() {
  const events = await getUpcomingLiveEvents();
  const liveNow = events.filter((e) => e.status === "live");
  const upcoming = events.filter((e) => e.status === "scheduled");

  return (
    <div className="px-5 pt-6 pb-28">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-[24px] font-bold text-foreground tracking-tight font-serif">Live Tastings</h1>
          <p className="text-[13px] text-muted mt-0.5 max-w-[280px]">
            Join expert sommeliers for real-time blind tasting sessions.
          </p>
        </div>
        <Link href="/live/create" className="h-10 w-10 rounded-[10px] bg-cherry flex items-center justify-center flex-shrink-0 hover:bg-cherry/90 transition-colors">
          <Plus className="h-5 w-5 text-white" />
        </Link>
      </div>

      {/* Quick stats */}
      {(liveNow.length > 0 || upcoming.length > 0) && (
        <div className="flex items-center gap-3 mb-6">
          {liveNow.length > 0 && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cherry/[0.07] text-cherry text-[12px] font-bold">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cherry opacity-60" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-cherry" />
              </span>
              {liveNow.length} Live
            </span>
          )}
          {upcoming.length > 0 && (
            <span className="text-[12px] font-semibold text-muted flex items-center gap-1">
              <Calendar className="h-3 w-3" /> {upcoming.length} upcoming
            </span>
          )}
        </div>
      )}

      {/* Live Now */}
      {liveNow.length > 0 && (
        <section className="mb-8">
          <h2 className="text-[11px] font-bold text-cherry uppercase tracking-widest mb-3 flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-cherry animate-pulse" />
            Happening Now
          </h2>
          <div className="space-y-3">
            {liveNow.map((event) => {
              const diff = DIFF_BADGE[event.difficulty] || DIFF_BADGE.intermediate;
              return (
                <Link
                  key={event.id}
                  href={`/live/${event.id}`}
                  className="block rounded-[14px] overflow-hidden hover:opacity-95 transition-opacity"
                  style={{ background: "linear-gradient(135deg, #74070E 0%, #5A0509 100%)" }}
                >
                  <div className="p-5">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/15 text-[10px] font-bold text-white uppercase tracking-wider">
                          <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" /> Live
                        </span>
                        <span className="text-[10px] font-bold text-white/40 px-2 py-0.5 rounded-full bg-white/8">{diff.label}</span>
                      </div>
                      <span className="text-[12px] font-semibold text-white/50 flex items-center gap-1 nums">
                        <Users className="h-3 w-3" /> {event._count.participants}
                      </span>
                    </div>

                    <h3 className="text-[18px] font-bold text-white leading-tight">{event.title}</h3>
                    {event.description && (
                      <p className="text-[12px] mt-1 text-white/50 line-clamp-1">{event.description}</p>
                    )}

                    <div className="mt-3 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="h-6 w-6 rounded-full bg-white/15 flex items-center justify-center text-[10px] font-bold text-white">
                          {event.sommelier.displayName.charAt(0)}
                        </div>
                        <span className="text-[12px] font-semibold text-white/70">{event.sommelier.displayName}</span>
                        {event.sommelier.verified && <BadgeCheck className="h-3 w-3 text-white/50" />}
                      </div>
                      <span className="text-[11px] font-semibold text-white/50 flex items-center gap-1 nums">
                        <Wine className="h-3 w-3" /> {event._count.wines} wines
                      </span>
                    </div>

                    <div className="mt-3 flex items-center justify-center gap-2 py-2.5 rounded-[10px] bg-white/15">
                      <Zap className="h-4 w-4 text-white" />
                      <span className="text-[13px] font-bold text-white">Join Now</span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {/* Upcoming */}
      <section>
        <h2 className="text-[11px] font-bold text-muted uppercase tracking-widest mb-3 flex items-center gap-2">
          <Calendar className="h-3 w-3" /> Upcoming
        </h2>

        {upcoming.length === 0 && liveNow.length === 0 ? (
          <div className="bg-white rounded-[14px] border border-card-border/60 py-12 px-6 text-center">
            <Radio className="h-8 w-8 text-muted/20 mx-auto mb-3" />
            <h3 className="text-[15px] font-bold text-foreground mb-1">No upcoming tastings</h3>
            <p className="text-[13px] text-muted max-w-[260px] mx-auto mb-5">
              Be the first to host a live tasting for the community.
            </p>
            <div className="flex flex-col items-center gap-2">
              <Link href="/live/create" className="inline-flex items-center gap-2 h-10 px-5 rounded-[10px] bg-cherry text-white text-[13px] font-bold">
                <Plus className="h-4 w-4" /> Host a Tasting
              </Link>
              <Link href="/sommeliers/become" className="text-[12px] font-semibold text-cherry flex items-center gap-1">
                Become a Sommelier <ChevronRight className="h-3 w-3" />
              </Link>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-[14px] border border-card-border/60 overflow-hidden divide-y divide-card-border/30">
            {upcoming.map((event) => {
              const date = new Date(event.scheduledAt);
              const timeStr = date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
              const countdown = getRelativeTime(date);
              const diff = DIFF_BADGE[event.difficulty] || DIFF_BADGE.intermediate;

              return (
                <Link key={event.id} href={`/live/${event.id}`} className="group flex items-start gap-4 px-5 py-4 hover:bg-butter/60 transition-colors">
                  {/* Date block */}
                  <div className="bg-cherry/[0.06] rounded-[10px] px-3 py-2 text-center flex-shrink-0 min-w-[54px]">
                    <p className="text-[9px] font-bold text-cherry uppercase tracking-wider">{dateStr.split(",")[0]}</p>
                    <p className="text-[20px] font-bold text-foreground leading-tight">{date.getDate()}</p>
                    <p className="text-[9px] font-semibold text-muted">{date.toLocaleDateString("en-US", { month: "short" })}</p>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-1">
                      <span className="text-[10px] font-bold text-cherry bg-cherry/[0.07] px-2 py-0.5 rounded-full flex items-center gap-1">
                        <Clock className="h-2.5 w-2.5" /> {countdown}
                      </span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${diff.bg} ${diff.text}`}>{diff.label}</span>
                    </div>

                    <h3 className="text-[14px] font-semibold text-foreground leading-tight line-clamp-1">{event.title}</h3>

                    <div className="flex items-center gap-3 mt-1.5 text-[11px] text-muted">
                      <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {timeStr}</span>
                      <span className="flex items-center gap-1 nums"><Wine className="h-3 w-3" /> {event._count.wines}</span>
                      {event.maxParticipants && (
                        <span className="flex items-center gap-1 nums"><Users className="h-3 w-3" /> {event._count.participants}/{event.maxParticipants}</span>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5 mt-2">
                      <div className="h-5 w-5 rounded-full bg-cherry/8 flex items-center justify-center text-[9px] font-bold text-cherry">
                        {event.sommelier.displayName.charAt(0)}
                      </div>
                      <span className="text-[11px] font-medium text-muted">{event.sommelier.displayName}</span>
                      {event.sommelier.verified && <BadgeCheck className="h-3 w-3 text-cherry" />}
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

      {/* Become a Sommelier CTA */}
      <section className="mt-8">
        <Link href="/sommeliers/become" className="group flex items-center gap-4 p-4 rounded-[14px] border-2 border-cherry/15 bg-white hover:border-cherry/30 transition-all">
          <div className="h-10 w-10 rounded-[10px] bg-cherry/10 flex items-center justify-center flex-shrink-0">
            <Sparkles className="h-5 w-5 text-cherry/60" />
          </div>
          <div className="flex-1">
            <h3 className="text-[14px] font-bold text-foreground">Host Your Own Tastings</h3>
            <p className="text-[11px] text-muted mt-0.5">Share your expertise as a Winebob Sommelier.</p>
          </div>
          <ChevronRight className="h-4 w-4 text-cherry/30 group-hover:text-cherry transition-colors flex-shrink-0" />
        </Link>
      </section>
    </div>
  );
}
