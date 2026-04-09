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

/* ── Card style ── */
const cardStyle = "rounded-[14px] bg-white border border-card-border/60";

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
    <div className="safe-top px-5 md:px-8 pt-4 pb-28">
      <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">

        {/* ── LEFT SIDEBAR ── */}
        <div className="lg:w-[280px] lg:flex-shrink-0 lg:sticky lg:top-4 lg:self-start">

          {/* Profile + stats */}
          <div className={`${cardStyle} p-5 mb-4`}>
            <div className="flex items-center gap-3 mb-5">
              <Avatar avatarId={avatarIdFromString(userName)} size={40} />
              <div className="flex-1">
                <p className="text-[15px] font-bold text-foreground tracking-tight">{firstName}</p>
                <p className="text-[11px] text-muted">Host</p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="text-center">
                <p className="text-[22px] font-bold text-foreground leading-none nums">{totalEvents}</p>
                <p className="text-[10px] text-muted mt-1">Tastings</p>
              </div>
              <div className="text-center border-x border-card-border/40">
                <p className="text-[22px] font-bold text-foreground leading-none nums">{totalWines}</p>
                <p className="text-[10px] text-muted mt-1">Wines</p>
              </div>
              <div className="text-center">
                <p className="text-[22px] font-bold text-foreground leading-none nums">{totalGuests}</p>
                <p className="text-[10px] text-muted mt-1">Guests</p>
              </div>
            </div>
          </div>

          {/* New Tasting CTA */}
          <Link
            href="/arena/create"
            className="group flex items-center gap-3 p-4 rounded-[14px] border-2 border-cherry/15 bg-white hover:border-cherry/30 hover:shadow-[0_4px_16px_rgba(116,7,14,0.08)] transition-all"
          >
            <div className="h-10 w-10 rounded-[10px] bg-cherry flex items-center justify-center flex-shrink-0">
              <Plus className="h-5 w-5 text-white" strokeWidth={2.5} />
            </div>
            <div className="flex-1">
              <p className="text-[14px] font-bold text-foreground">New Tasting</p>
              <p className="text-[11px] text-muted">Create a blind tasting</p>
            </div>
            <ArrowRight className="h-4 w-4 text-cherry/30 group-hover:text-cherry transition-colors flex-shrink-0" />
          </Link>
        </div>

        {/* ── RIGHT — Content ── */}
        <div className="flex-1 min-w-0">

          {/* Hero Banner */}
          <div className="rounded-[14px] overflow-hidden mb-6" style={{ background: "linear-gradient(135deg, #74070E 0%, #5A0509 100%)" }}>
            <div className="p-6 md:p-8">
              <p className="text-[10px] font-bold text-white/40 uppercase tracking-[0.15em] mb-3">Blind Tasting</p>
              <h2 className="text-[26px] md:text-[30px] font-bold text-white tracking-tight leading-[1.1]" style={{ fontFamily: "var(--font-serif, Georgia, serif)" }}>
                Ready to taste?
              </h2>
              <p className="text-[13px] text-white/50 mt-2 max-w-[300px] leading-relaxed">
                Challenge your palate. Invite friends. See who knows their wine.
              </p>
              <Link
                href="/arena/create"
                className="inline-flex items-center gap-2 mt-5 h-10 px-5 rounded-[10px] bg-white text-cherry text-[13px] font-bold hover:bg-white/90 transition-colors"
              >
                Create Tasting <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>

          {/* Live Events */}
          {liveEvents.length > 0 && (
            <div className="mb-6">
              <p className="text-[11px] font-bold text-cherry uppercase tracking-widest mb-3 flex items-center gap-2 px-1">
                <span className="h-1.5 w-1.5 rounded-full bg-cherry animate-pulse" />
                Live Now
              </p>
              {liveEvents.map((event) => (
                <Link
                  key={event.id}
                  href={`/arena/event/${event.id}`}
                  className="block rounded-[14px] overflow-hidden mb-3 hover:opacity-95 transition-opacity"
                  style={{ background: "linear-gradient(135deg, #74070E 0%, #5A0509 100%)" }}
                >
                  <div className="p-5">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-bold text-white/50 uppercase tracking-wider">
                        {event.status === "live" ? "Tasting in progress" : "Waiting for guests"}
                      </span>
                      <span className="font-mono text-[10px] font-bold text-white/30 tracking-[0.15em]">{event.joinCode}</span>
                    </div>
                    <h3 className="text-[18px] font-bold text-white tracking-tight">{event.title}</h3>
                    <div className="mt-3 flex items-center gap-4 text-[12px] text-white/50 font-semibold">
                      <span className="nums">{event.wines.length} wines</span>
                      <span className="nums">{event.guests.length} guests</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}

          {/* Quick Start Templates */}
          {templates.length > 0 && (
            <div className="mb-6">
              <p className="text-[11px] font-bold text-muted uppercase tracking-widest mb-3 px-1">Quick Start</p>
              <div className={`${cardStyle} overflow-hidden divide-y divide-card-border/30`}>
                {templates.map((t) => (
                  <Link
                    key={t.id}
                    href={`/arena/create?template=${t.id}`}
                    className="group flex items-center gap-4 px-5 py-3.5 hover:bg-butter/60 transition-colors"
                  >
                    <div className="h-9 w-9 rounded-[8px] bg-cherry/8 flex items-center justify-center flex-shrink-0 text-[16px]">
                      {templateIcon(t)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[14px] font-medium text-foreground line-clamp-1">{t.name}</p>
                      <p className="text-[11px] text-muted mt-0.5">
                        {t.wineCount} wines · <span className="capitalize">{t.difficulty}</span>
                      </p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted/30 group-hover:text-muted/60 transition-colors flex-shrink-0" />
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Your Tastings */}
          <div>
            <p className="text-[11px] font-bold text-muted uppercase tracking-widest mb-3 px-1">Your Tastings</p>

            {events.length === 0 ? (
              <div className={`${cardStyle} p-12 text-center`}>
                <Wine className="h-7 w-7 text-muted/15 mx-auto mb-2" />
                <p className="text-[14px] font-semibold text-foreground">No tastings yet</p>
                <p className="text-[12px] text-muted mt-1">Create your first one above</p>
              </div>
            ) : (
              <div className={`${cardStyle} overflow-hidden divide-y divide-card-border/30`}>
                {pastEvents.map((event) => (
                  <Link
                    key={event.id}
                    href={`/arena/event/${event.id}`}
                    className="group flex items-center gap-3 px-5 py-3.5 hover:bg-butter/60 transition-colors"
                  >
                    <div className={`h-9 w-9 rounded-[8px] flex items-center justify-center flex-shrink-0 ${
                      event.status === "completed" ? "bg-amber-50" : "bg-cherry/8"
                    }`}>
                      {event.status === "completed"
                        ? <Trophy className="h-4 w-4 text-amber-600" />
                        : <Wine className="h-4 w-4 text-cherry" />
                      }
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-medium text-foreground truncate">{event.title}</p>
                      <p className="text-[11px] text-muted mt-0.5">
                        {timeAgo(event.createdAt)} · {event.wines.length} wines · {event.guests.length} guests
                      </p>
                    </div>
                    <CopyCode code={event.joinCode} />
                    <ChevronRight className="h-4 w-4 text-muted/20 group-hover:text-muted/40 transition-colors flex-shrink-0" />
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
