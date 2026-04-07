import { getUpcomingLiveEvents } from "@/lib/liveActions";
import Link from "next/link";
import { Radio, Calendar, Users, Wine, BadgeCheck, Clock } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function LiveEventsPage() {
  const events = await getUpcomingLiveEvents();

  const liveNow = events.filter((e) => e.status === "live");
  const upcoming = events.filter((e) => e.status === "scheduled");

  return (
    <div className="min-h-screen pb-28 safe-top bg-background">
      <div className="container-app pt-8 pb-2">
        <h1 className="text-2xl font-bold text-foreground tracking-tight">
          Live Tastings
        </h1>
        <p className="text-[13px] text-muted mt-0.5">Join sommeliers tasting wine in real-time</p>
      </div>

      {/* Live Now */}
      {liveNow.length > 0 && (
        <section className="container-app mt-5">
          <div className="flex items-center gap-2 mb-3">
            <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
            <h2 className="text-[15px] font-bold text-foreground">Live Now</h2>
          </div>
          <div className="space-y-3">
            {liveNow.map((event) => (
              <Link
                key={event.id}
                href={`/live/${event.id}`}
                className="block rounded-[24px] bg-cherry-gradient p-5 text-white float-action active:scale-[0.98] transition-transform"
              >
                <div className="flex items-center gap-2 mb-3">
                  <Radio className="h-4 w-4 animate-pulse" />
                  <span className="text-[12px] font-bold uppercase tracking-widest text-white/70">Live</span>
                  <span className="ml-auto text-[12px] font-semibold text-white/60">
                    {event._count.participants} watching
                  </span>
                </div>
                <h3 className="text-[20px] font-bold leading-tight">{event.title}</h3>
                {event.description && (
                  <p className="text-[13px] text-white/60 mt-1 line-clamp-2">{event.description}</p>
                )}
                <div className="mt-4 flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    {event.sommelier.avatar ? (
                      <img src={event.sommelier.avatar} alt="" className="h-7 w-7 rounded-full object-cover" />
                    ) : (
                      <div className="h-7 w-7 rounded-full bg-white/20 flex items-center justify-center text-[11px] font-bold">
                        {event.sommelier.displayName.charAt(0)}
                      </div>
                    )}
                    <span className="text-[13px] font-semibold text-white/80">
                      {event.sommelier.displayName}
                    </span>
                    {event.sommelier.verified && <BadgeCheck className="h-3.5 w-3.5 text-white/60" />}
                  </div>
                  <span className="ml-auto text-[12px] text-white/50">
                    {event._count.wines} wines
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Upcoming */}
      <section className="container-app mt-7">
        <h2 className="text-[15px] font-bold text-foreground mb-3 flex items-center gap-2">
          <Calendar className="h-4 w-4 text-muted" />
          Upcoming
        </h2>

        {upcoming.length === 0 && liveNow.length === 0 ? (
          <div className="wine-card flex flex-col items-center justify-center py-16 px-6 text-center">
            <div className="h-16 w-16 rounded-3xl widget-lavender flex items-center justify-center mb-4">
              <Radio className="h-7 w-7 text-purple-600/40" />
            </div>
            <p className="text-[17px] font-bold text-foreground">No upcoming tastings</p>
            <p className="mt-2 text-[14px] text-muted max-w-[240px]">
              Check back later or become a sommelier to host your own.
            </p>
            <Link href="/sommeliers" className="mt-4 text-[13px] font-semibold text-cherry">
              Become a Sommelier →
            </Link>
          </div>
        ) : (
          <div className="space-y-3 stagger-children">
            {upcoming.map((event) => {
              const date = new Date(event.scheduledAt);
              const dateStr = date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
              const timeStr = date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });

              return (
                <Link
                  key={event.id}
                  href={`/live/${event.id}`}
                  className="wine-card p-4 block active:scale-[0.98] transition-transform"
                >
                  <div className="flex items-start gap-3.5">
                    {/* Date block */}
                    <div className="widget-card widget-lavender p-3 text-center flex-shrink-0 min-w-[56px]">
                      <p className="text-[10px] font-bold text-purple-600 uppercase">{dateStr.split(",")[0]}</p>
                      <p className="text-[20px] font-bold text-foreground leading-tight">{date.getDate()}</p>
                    </div>

                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-[15px] text-foreground leading-tight line-clamp-1">
                        {event.title}
                      </h3>
                      {event.description && (
                        <p className="text-[12px] text-muted mt-0.5 line-clamp-1">{event.description}</p>
                      )}

                      <div className="flex items-center gap-3 mt-2.5 flex-wrap">
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-muted">
                          <Clock className="h-3 w-3" /> {timeStr}
                        </span>
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-muted">
                          <Wine className="h-3 w-3" /> {event._count.wines} wines
                        </span>
                        {event.maxParticipants && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-muted">
                            <Users className="h-3 w-3" /> Max {event.maxParticipants}
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
    </div>
  );
}
