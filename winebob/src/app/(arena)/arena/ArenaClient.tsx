"use client";

import Link from "next/link";
import { Plus, Wine, Copy, ChevronRight, Sparkles, Trophy, Users } from "lucide-react";
import { useState } from "react";
import { Avatar, AvatarStack, avatarIdFromString } from "@/components/shared/Avatar";

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

function timeAgo(date: Date) {
  const now = new Date();
  const d = new Date(date);
  const diff = Math.floor((now.getTime() - d.getTime()) / 1000);
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
      className="font-mono text-[11px] font-bold tracking-[0.15em] text-cherry/50 active:text-cherry flex items-center gap-1"
    >
      {copied ? "Copied!" : <>{code} <Copy className="h-2.5 w-2.5 opacity-40" /></>}
    </button>
  );
}

/* Glass card style */
const glass = "rounded-3xl bg-card-bg border border-card-border shadow-[0_2px_20px_rgba(0,0,0,0.04)] backdrop-blur-sm";

export function ArenaClient({ events, templates, userName }: ArenaClientProps) {
  const firstName = userName.split(" ")[0];
  const totalEvents = events.length;
  const totalWines = events.reduce((sum, e) => sum + e.wines.length, 0);
  const totalGuests = events.reduce((sum, e) => sum + e.guests.length, 0);
  const liveEvents = events.filter((e) => e.status === "live" || e.status === "lobby");
  const pastEvents = events.filter((e) => e.status !== "live" && e.status !== "lobby");

  return (
    <div className="px-4 md:px-8 lg:px-12 pt-4 pb-28">

      {/* ── Top bar ── */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Avatar avatarId={avatarIdFromString(userName)} size={40} />
          <div>
            <p className="text-[11px] text-muted font-medium">Welcome back</p>
            <p className="text-[17px] font-bold text-foreground tracking-tight">{firstName}</p>
          </div>
        </div>
        <Link
          href="/arena/create"
          className="h-10 px-4 rounded-2xl bg-card-bg border border-card-border flex items-center gap-2 text-[13px] font-semibold text-foreground active:scale-95 transition-transform shadow-sm"
        >
          <Plus className="h-4 w-4 text-cherry" /> New Tasting
        </Link>
      </div>

      {/* ══════════ BENTO GRID ══════════ */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 md:gap-4">

        {/* ── Stat: Tastings ── */}
        <div className={`col-span-1 ${glass} p-5`}>
          <div className="h-10 w-10 rounded-2xl widget-wine flex items-center justify-center mb-4">
            <Wine className="h-5 w-5 text-cherry" />
          </div>
          <p className="text-[40px] font-bold text-foreground tracking-tighter leading-none">{totalEvents}</p>
          <p className="text-[11px] text-muted font-medium mt-1.5">Tastings</p>
        </div>

        {/* ── Stat: Wines ── */}
        <div className={`col-span-1 ${glass} p-5`}>
          <div className="h-10 w-10 rounded-2xl widget-gold flex items-center justify-center mb-4">
            <Sparkles className="h-5 w-5 text-amber-600" />
          </div>
          <p className="text-[40px] font-bold text-foreground tracking-tighter leading-none">{totalWines}</p>
          <p className="text-[11px] text-muted font-medium mt-1.5">Wines tasted</p>
        </div>

        {/* ── Stat: Guests ── */}
        <div className={`col-span-1 ${glass} p-5`}>
          <div className="h-10 w-10 rounded-2xl widget-sage flex items-center justify-center mb-4">
            <Users className="h-5 w-5 text-emerald-600" />
          </div>
          <p className="text-[40px] font-bold text-foreground tracking-tighter leading-none">{totalGuests}</p>
          <p className="text-[11px] text-muted font-medium mt-1.5">Guests hosted</p>
        </div>

        {/* ── New Tasting CTA — spans remaining cols ── */}
        <Link
          href="/arena/create"
          className={`col-span-1 md:col-span-1 lg:col-span-3 ${glass} p-5 flex flex-col justify-between active:scale-[0.99] transition-transform group`}
          style={{ background: "var(--widget-wine)" }}
        >
          <div className="flex items-start justify-between">
            <p className="text-[11px] text-cherry/60 font-bold uppercase tracking-wider">Create</p>
            <div className="h-11 w-11 rounded-2xl bg-cherry flex items-center justify-center float-action group-active:scale-90 transition-transform">
              <Plus className="h-5 w-5 text-white" strokeWidth={2.5} />
            </div>
          </div>
          <div className="mt-6">
            <p className="text-[24px] font-bold text-foreground tracking-tight leading-tight" style={{ fontFamily: "var(--font-serif, Georgia, serif)" }}>
              New Tasting
            </p>
            <p className="text-[13px] text-muted mt-1">Start a blind tasting for your group</p>
          </div>
        </Link>

        {/* ── Live Events ── */}
        {liveEvents.map((event) => (
          <Link
            key={event.id}
            href={`/arena/event/${event.id}`}
            className="col-span-2 md:col-span-2 lg:col-span-3 rounded-3xl overflow-hidden active:scale-[0.99] transition-transform"
            style={{ background: "linear-gradient(135deg, #74070E 0%, #5A0509 100%)" }}
          >
            <div className="p-5">
              <div className="flex items-center gap-2 mb-4">
                <span className="h-2 w-2 rounded-full bg-white animate-pulse" />
                <span className="text-[11px] font-bold text-white/60 uppercase tracking-wider">
                  {event.status === "live" ? "Live Now" : "Lobby Open"}
                </span>
                <span className="ml-auto font-mono text-[11px] font-bold text-white/30 tracking-[0.15em]">{event.joinCode}</span>
              </div>
              <p className="text-[22px] font-bold text-white tracking-tight leading-tight">{event.title}</p>
              <div className="mt-5 flex items-end justify-between">
                <div className="flex gap-5">
                  <div>
                    <p className="text-[32px] font-bold text-white leading-none">{event.wines.length}</p>
                    <p className="text-[10px] text-white/40 font-semibold uppercase tracking-wider mt-0.5">Wines</p>
                  </div>
                  <div>
                    <p className="text-[32px] font-bold text-white leading-none">{event.guests.length}</p>
                    <p className="text-[10px] text-white/40 font-semibold uppercase tracking-wider mt-0.5">Guests</p>
                  </div>
                </div>
                {event.guests.length > 0 && (
                  <AvatarStack ids={event.guests.map((g) => avatarIdFromString(g.id))} size={30} max={4} />
                )}
              </div>
            </div>
          </Link>
        ))}

        {/* ── Quick Start Templates ── */}
        {templates.length > 0 && (
          <div className="col-span-2 md:col-span-4 lg:col-span-6">
            <div className="flex items-baseline justify-between mb-3 px-1">
              <p className="text-[15px] font-bold text-foreground">Quick Start</p>
              <p className="text-[11px] text-muted">{templates.length} templates</p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {templates.map((t) => (
                <Link
                  key={t.id}
                  href={`/arena/create?template=${t.id}`}
                  className={`${glass} p-4 active:scale-[0.98] transition-transform`}
                >
                  <p className="text-[14px] font-bold text-foreground leading-tight line-clamp-2">{t.name}</p>
                  {t.description && (
                    <p className="text-[11px] text-muted mt-1.5 line-clamp-2 leading-relaxed">{t.description}</p>
                  )}
                  <div className="mt-3 flex items-center gap-1.5 text-[11px] text-muted">
                    <Wine className="h-3 w-3" />
                    <span>{t.wineCount} wines</span>
                    <span className="mx-0.5">·</span>
                    <span className="capitalize">{t.difficulty}</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* ── Past Tastings ── */}
        <div className="col-span-2 md:col-span-4 lg:col-span-6">
          <p className="text-[15px] font-bold text-foreground mb-3 px-1">Your Tastings</p>

          {events.length === 0 ? (
            <div className={`${glass} p-14 text-center`}>
              <Sparkles className="h-8 w-8 text-muted/20 mx-auto mb-3" />
              <p className="text-[16px] font-bold text-foreground">No tastings yet</p>
              <p className="text-[13px] text-muted mt-1">Create your first one above</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {pastEvents.map((event) => (
                <Link
                  key={event.id}
                  href={`/arena/event/${event.id}`}
                  className={`${glass} p-4 flex items-center gap-4 active:scale-[0.99] transition-transform`}
                >
                  <div className={`h-12 w-12 rounded-2xl flex items-center justify-center flex-shrink-0 ${
                    event.status === "completed" ? "widget-gold" : "widget-wine"
                  }`}>
                    {event.status === "completed"
                      ? <Trophy className="h-5 w-5 text-amber-600" />
                      : <Wine className="h-5 w-5 text-cherry" />
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[14px] font-semibold text-foreground truncate">{event.title}</p>
                    <p className="text-[11px] text-muted mt-0.5">
                      {timeAgo(event.createdAt)} · {event.wines.length} wines · {event.guests.length} guests
                    </p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <CopyCode code={event.joinCode} />
                    <ChevronRight className="h-4 w-4 text-muted/20" />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
