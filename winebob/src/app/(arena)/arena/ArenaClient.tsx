"use client";

import Link from "next/link";
import { Plus, Wine, Copy, ChevronRight, Trophy, Users, Swords, ArrowRight } from "lucide-react";
import { useState } from "react";
import { Avatar, AvatarStack, avatarIdFromString } from "@/components/shared/Avatar";

/* ── Types ── */

type Event = {
  id: string;
  title: string;
  joinCode: string;
  status: string;
  difficulty: string;
  createdAt: Date;
  wines: { id: string }[];
  guests: { id: string; displayName: string }[];
};

type Template = {
  id: string;
  name: string;
  description: string | null;
  theme: string | null;
  difficulty: string;
  wineCount: number;
  guessFields: string[];
  category: string | null;
};

type ArenaClientProps = {
  events: Event[];
  templates: Template[];
  userName: string;
};

/* ── Helpers ── */

function timeAgo(date: Date) {
  const d = new Date(date);
  const diff = Math.floor((Date.now() - d.getTime()) / 1000);
  if (diff < 60) return "Just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function CopyCode({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={(e) => { e.preventDefault(); e.stopPropagation(); navigator.clipboard.writeText(code); setCopied(true); setTimeout(() => setCopied(false), 1500); }}
      className="font-mono text-[11px] font-bold tracking-[0.12em] text-cherry/50 active:text-cherry flex items-center gap-1"
    >
      {copied ? "Copied!" : <>{code} <Copy className="h-2.5 w-2.5 opacity-40" /></>}
    </button>
  );
}

/* ── Elevation styles ── */
const card = "rounded-[16px] bg-card-bg border border-card-border";
const cardRaised = `${card} shadow-[0_2px_8px_rgba(0,0,0,0.06),0_0_1px_rgba(0,0,0,0.04)]`;
const cardFloat = `rounded-[20px] shadow-[0_8px_24px_rgba(0,0,0,0.08)]`;

/* ── Template category icons ── */
const TEMPLATE_ICONS: Record<string, string> = {
  "italian": "🇮🇹",
  "french": "🇫🇷",
  "spanish": "🇪🇸",
  "region": "🌍",
  "grape": "🍇",
  "beginner": "🟢",
  "price": "💰",
  "freestyle": "✨",
};

function templateIcon(t: Template): string {
  const name = t.name.toLowerCase();
  if (name.includes("italian")) return "🇮🇹";
  if (name.includes("french") || name.includes("bordeaux") || name.includes("burgundy")) return "🇫🇷";
  if (name.includes("spanish") || name.includes("rioja")) return "🇪🇸";
  if (name.includes("world") || name.includes("region")) return "🌍";
  if (name.includes("grape") || name.includes("roulette")) return "🍇";
  if (name.includes("beginner")) return "🟢";
  if (name.includes("sparkling") || name.includes("champagne")) return "🥂";
  if (name.includes("price")) return "💰";
  return "✨";
}

/* ── Component ── */

export function ArenaClient({ events, templates, userName }: ArenaClientProps) {
  const firstName = userName.split(" ")[0];
  const totalEvents = events.length;
  const totalWines = events.reduce((sum, e) => sum + e.wines.length, 0);
  const totalGuests = events.reduce((sum, e) => sum + e.guests.length, 0);
  const liveEvents = events.filter((e) => e.status === "live" || e.status === "lobby");
  const pastEvents = events.filter((e) => e.status !== "live" && e.status !== "lobby");

  return (
    <div className="safe-top px-4 md:px-8 lg:px-10 pt-4 pb-28">
      <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">

        {/* ════════════════════════════════════════
            LEFT SIDEBAR — Command Center
            Desktop: sticky, 300px
            Mobile: horizontal stats row
            ════════════════════════════════════════ */}

        <div className="lg:w-[300px] xl:w-[320px] lg:flex-shrink-0 lg:sticky lg:top-4 lg:self-start">

          {/* Profile + stats card */}
          <div className={`${cardRaised} p-5 mb-4`}>
            <div className="flex items-center gap-3 mb-5">
              <Avatar avatarId={avatarIdFromString(userName)} size={44} />
              <div className="flex-1">
                <p className="text-[16px] font-bold text-foreground tracking-tight">{firstName}</p>
                <p className="text-[11px] text-muted">Host</p>
              </div>
            </div>

            {/* Stats — stacked rows */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-[8px] widget-wine flex items-center justify-center">
                    <Swords className="h-3.5 w-3.5 text-cherry" />
                  </div>
                  <span className="text-[13px] text-muted">Tastings</span>
                </div>
                <span className="text-[24px] font-bold text-foreground tracking-tight leading-none">{totalEvents}</span>
              </div>

              <div className="h-px bg-card-border" />

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-[8px] widget-gold flex items-center justify-center">
                    <Wine className="h-3.5 w-3.5 text-amber-600" />
                  </div>
                  <span className="text-[13px] text-muted">Wines</span>
                </div>
                <span className="text-[24px] font-bold text-foreground tracking-tight leading-none">{totalWines}</span>
              </div>

              <div className="h-px bg-card-border" />

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-[8px] widget-sage flex items-center justify-center">
                    <Users className="h-3.5 w-3.5 text-emerald-600" />
                  </div>
                  <span className="text-[13px] text-muted">Guests</span>
                </div>
                <span className="text-[24px] font-bold text-foreground tracking-tight leading-none">{totalGuests}</span>
              </div>
            </div>
          </div>

          {/* New Tasting CTA */}
          <Link
            href="/arena/create"
            className={`${cardRaised} p-4 flex items-center gap-3 active:scale-[0.98] transition-transform group`}
            style={{ background: "var(--widget-wine)" }}
          >
            <div className="h-11 w-11 rounded-[12px] bg-cherry flex items-center justify-center float-action group-active:scale-90 transition-transform flex-shrink-0">
              <Plus className="h-5 w-5 text-white" strokeWidth={2.5} />
            </div>
            <div className="flex-1">
              <p className="text-[14px] font-bold text-foreground">New Tasting</p>
              <p className="text-[11px] text-muted">Create a blind tasting</p>
            </div>
            <ArrowRight className="h-4 w-4 text-cherry/40 flex-shrink-0" />
          </Link>
        </div>

        {/* ════════════════════════════════════════
            RIGHT — Dynamic Content
            ════════════════════════════════════════ */}

        <div className="flex-1 min-w-0">

          {/* ── Hero Banner ── */}
          <div
            className={`${cardFloat} overflow-hidden mb-6`}
            style={{ background: "linear-gradient(135deg, #74070E 0%, #5A0509 60%, #3A0306 100%)" }}
          >
            <div className="p-6 md:p-8 relative">
              {/* Decorative circles */}
              <div className="absolute top-0 right-0 w-40 h-40 rounded-full opacity-[0.06]" style={{ background: "radial-gradient(circle, white 0%, transparent 70%)", transform: "translate(20%, -30%)" }} />
              <div className="absolute bottom-0 left-1/2 w-60 h-60 rounded-full opacity-[0.04]" style={{ background: "radial-gradient(circle, white 0%, transparent 70%)", transform: "translate(-50%, 50%)" }} />

              <div className="relative z-10">
                <p className="text-[11px] font-bold text-white/40 uppercase tracking-[0.15em] mb-3">Blind Tasting</p>
                <h2 className="text-[28px] md:text-[32px] font-bold text-white tracking-tight leading-[1.1]" style={{ fontFamily: "var(--font-serif, Georgia, serif)" }}>
                  Ready to taste?
                </h2>
                <p className="text-[14px] text-white/50 mt-2 max-w-[320px]">
                  Challenge your palate. Invite friends. See who knows their wine.
                </p>
                <Link
                  href="/arena/create"
                  className="inline-flex items-center gap-2 mt-5 h-11 px-6 rounded-[12px] bg-white text-cherry text-[14px] font-bold active:scale-95 transition-transform"
                >
                  Create Tasting <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>

          {/* ── Live Events ── */}
          {liveEvents.length > 0 && (
            <div className="mb-6">
              <p className="text-[11px] font-bold text-cherry uppercase tracking-[0.1em] mb-3 flex items-center gap-2 px-1">
                <span className="h-2 w-2 rounded-full bg-cherry animate-pulse" />
                Live Now
              </p>
              {liveEvents.map((event) => (
                <Link
                  key={event.id}
                  href={`/arena/event/${event.id}`}
                  className={`block ${cardFloat} overflow-hidden active:scale-[0.99] transition-transform mb-3`}
                  style={{ background: "linear-gradient(135deg, #74070E 0%, #5A0509 100%)" }}
                >
                  <div className="p-5 md:p-6">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-[11px] font-bold text-white/50 uppercase tracking-wider">
                        {event.status === "live" ? "Tasting in progress" : "Waiting for guests"}
                      </span>
                      <span className="font-mono text-[11px] font-bold text-white/30 tracking-[0.15em]">{event.joinCode}</span>
                    </div>
                    <h3 className="text-[20px] font-bold text-white tracking-tight">{event.title}</h3>
                    <div className="mt-4 flex items-end justify-between">
                      <div className="flex gap-6">
                        <div>
                          <p className="text-[28px] font-bold text-white leading-none">{event.wines.length}</p>
                          <p className="text-[10px] text-white/35 font-semibold uppercase tracking-wider mt-1">Wines</p>
                        </div>
                        <div>
                          <p className="text-[28px] font-bold text-white leading-none">{event.guests.length}</p>
                          <p className="text-[10px] text-white/35 font-semibold uppercase tracking-wider mt-1">Guests</p>
                        </div>
                      </div>
                      {event.guests.length > 0 && (
                        <AvatarStack ids={event.guests.map((g) => avatarIdFromString(g.id))} size={28} max={4} />
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}

          {/* ── Quick Start — Category Grid ── */}
          {templates.length > 0 && (
            <div className="mb-6">
              <div className="flex items-baseline justify-between mb-3 px-1">
                <p className="text-[16px] font-bold text-foreground">Quick Start</p>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3">
                {templates.map((t) => (
                  <Link
                    key={t.id}
                    href={`/arena/create?template=${t.id}`}
                    className={`${cardRaised} p-4 active:scale-[0.97] transition-transform`}
                  >
                    {/* Category icon */}
                    <div className="h-11 w-11 rounded-[12px] bg-background flex items-center justify-center mb-3 text-[20px]">
                      {templateIcon(t)}
                    </div>
                    <p className="text-[14px] font-bold text-foreground leading-snug line-clamp-2">{t.name}</p>
                    <p className="text-[11px] text-muted mt-1">
                      {t.wineCount} wines · <span className="capitalize">{t.difficulty}</span>
                    </p>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* ── Your Tastings ── */}
          <div>
            <p className="text-[16px] font-bold text-foreground mb-3 px-1">Your Tastings</p>

            {events.length === 0 ? (
              <div className={`${cardRaised} p-12 text-center`}>
                <Wine className="h-8 w-8 text-muted/15 mx-auto mb-3" />
                <p className="text-[14px] font-bold text-foreground">No tastings yet</p>
                <p className="text-[13px] text-muted mt-1">Create your first one above</p>
              </div>
            ) : (
              <div className="space-y-2">
                {pastEvents.map((event) => (
                  <Link
                    key={event.id}
                    href={`/arena/event/${event.id}`}
                    className={`${cardRaised} p-4 flex items-center gap-3 active:scale-[0.99] transition-transform`}
                  >
                    <div className={`h-10 w-10 rounded-[12px] flex items-center justify-center flex-shrink-0 ${
                      event.status === "completed" ? "widget-gold" : "widget-wine"
                    }`}>
                      {event.status === "completed"
                        ? <Trophy className="h-4 w-4 text-amber-600" />
                        : <Wine className="h-4 w-4 text-cherry" />
                      }
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[14px] font-semibold text-foreground truncate">{event.title}</p>
                      <p className="text-[11px] text-muted mt-0.5">
                        {timeAgo(event.createdAt)} · {event.wines.length} wines · {event.guests.length} guests
                      </p>
                    </div>
                    <CopyCode code={event.joinCode} />
                    <ChevronRight className="h-4 w-4 text-muted/20 flex-shrink-0" />
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
