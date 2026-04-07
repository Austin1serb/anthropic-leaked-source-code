"use client";

import Link from "next/link";
import { Plus, Wine, Copy, ChevronRight, Sparkles, Trophy, Users, Swords } from "lucide-react";
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

export function ArenaClient({ events, templates, userName }: ArenaClientProps) {
  const firstName = userName.split(" ")[0];
  const totalEvents = events.length;
  const totalWines = events.reduce((sum, e) => sum + e.wines.length, 0);
  const totalGuests = events.reduce((sum, e) => sum + e.guests.length, 0);
  const liveEvents = events.filter((e) => e.status === "live" || e.status === "lobby");
  const pastEvents = events.filter((e) => e.status !== "live" && e.status !== "lobby");

  return (
    <div className="safe-top px-4 md:px-8 lg:px-10 pt-4">

      {/* ══════════════════════════════════════════════
          DESKTOP: 2-column layout (sidebar + main)
          MOBILE: single column, top to bottom
          ══════════════════════════════════════════════ */}

      <div className="flex flex-col lg:flex-row gap-5 lg:gap-8">

        {/* ════════════ LEFT — Command Center ════════════ */}
        <div className="lg:w-[300px] xl:w-[340px] lg:flex-shrink-0 lg:sticky lg:top-4 lg:self-start">

          {/* Profile card */}
          <div className="wine-card p-5 mb-4">
            <div className="flex items-center gap-3 mb-5">
              <Avatar avatarId={avatarIdFromString(userName)} size={48} />
              <div>
                <p className="text-[17px] font-bold text-foreground tracking-tight">{firstName}</p>
                <p className="text-[12px] text-muted">Host</p>
              </div>
            </div>

            {/* Stats — stacked, big numbers */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="h-9 w-9 rounded-xl widget-wine flex items-center justify-center">
                    <Swords className="h-4 w-4 text-cherry" />
                  </div>
                  <p className="text-[13px] text-muted font-medium">Tastings</p>
                </div>
                <p className="text-[28px] font-bold text-foreground tracking-tight leading-none">{totalEvents}</p>
              </div>

              <div className="h-px bg-card-border" />

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="h-9 w-9 rounded-xl widget-gold flex items-center justify-center">
                    <Wine className="h-4 w-4 text-amber-600" />
                  </div>
                  <p className="text-[13px] text-muted font-medium">Wines</p>
                </div>
                <p className="text-[28px] font-bold text-foreground tracking-tight leading-none">{totalWines}</p>
              </div>

              <div className="h-px bg-card-border" />

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="h-9 w-9 rounded-xl widget-sage flex items-center justify-center">
                    <Users className="h-4 w-4 text-emerald-600" />
                  </div>
                  <p className="text-[13px] text-muted font-medium">Guests</p>
                </div>
                <p className="text-[28px] font-bold text-foreground tracking-tight leading-none">{totalGuests}</p>
              </div>
            </div>
          </div>

          {/* New Tasting — primary CTA, always visible */}
          <Link
            href="/arena/create"
            className="wine-card p-5 flex items-center gap-4 active:scale-[0.98] transition-transform group"
            style={{ background: "var(--widget-wine)" }}
          >
            <div className="h-12 w-12 rounded-2xl bg-cherry flex items-center justify-center float-action group-active:scale-90 transition-transform flex-shrink-0">
              <Plus className="h-5 w-5 text-white" strokeWidth={2.5} />
            </div>
            <div>
              <p className="text-[16px] font-bold text-foreground tracking-tight">New Tasting</p>
              <p className="text-[12px] text-muted mt-0.5">Create a blind tasting</p>
            </div>
          </Link>
        </div>

        {/* ════════════ RIGHT — Dynamic Content ════════════ */}
        <div className="flex-1 min-w-0">

          {/* ── Live Event — dominates when active ── */}
          {liveEvents.length > 0 && (
            <div className="mb-5">
              {liveEvents.map((event) => (
                <Link
                  key={event.id}
                  href={`/arena/event/${event.id}`}
                  className="block rounded-3xl overflow-hidden active:scale-[0.99] transition-transform"
                  style={{ background: "linear-gradient(135deg, #74070E 0%, #5A0509 100%)" }}
                >
                  <div className="p-6 md:p-8">
                    <div className="flex items-center gap-2 mb-5">
                      <span className="h-2.5 w-2.5 rounded-full bg-white animate-pulse" />
                      <span className="text-[11px] font-bold text-white/60 uppercase tracking-widest">
                        {event.status === "live" ? "Live Now" : "Lobby Open"}
                      </span>
                      <span className="ml-auto font-mono text-[12px] font-bold text-white/30 tracking-[0.15em]">{event.joinCode}</span>
                    </div>

                    <h2 className="text-[26px] md:text-[32px] font-bold text-white tracking-tight leading-tight" style={{ fontFamily: "var(--font-serif, Georgia, serif)" }}>
                      {event.title}
                    </h2>

                    <div className="mt-6 flex items-end justify-between">
                      <div className="flex gap-8">
                        <div>
                          <p className="text-[36px] font-bold text-white leading-none">{event.wines.length}</p>
                          <p className="text-[10px] text-white/40 font-semibold uppercase tracking-wider mt-1">Wines</p>
                        </div>
                        <div>
                          <p className="text-[36px] font-bold text-white leading-none">{event.guests.length}</p>
                          <p className="text-[10px] text-white/40 font-semibold uppercase tracking-wider mt-1">Guests</p>
                        </div>
                      </div>
                      {event.guests.length > 0 && (
                        <AvatarStack ids={event.guests.map((g) => avatarIdFromString(g.id))} size={32} max={5} />
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}

          {/* ── Templates Grid ── */}
          {templates.length > 0 && (
            <div className="mb-5">
              <div className="flex items-baseline justify-between mb-3">
                <p className="text-[15px] font-bold text-foreground">Quick Start</p>
                <p className="text-[11px] text-muted">{templates.length} templates</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
                {templates.map((t) => (
                  <Link
                    key={t.id}
                    href={`/arena/create?template=${t.id}`}
                    className="wine-card p-4 active:scale-[0.98] transition-transform flex flex-col"
                  >
                    <p className="text-[14px] font-bold text-foreground leading-snug">{t.name}</p>
                    {t.description && (
                      <p className="text-[12px] text-muted mt-1.5 leading-relaxed line-clamp-2 flex-1">{t.description}</p>
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
          <div>
            <p className="text-[15px] font-bold text-foreground mb-3">Your Tastings</p>

            {events.length === 0 ? (
              <div className="wine-card p-12 text-center">
                <Sparkles className="h-8 w-8 text-muted/15 mx-auto mb-3" />
                <p className="text-[15px] font-bold text-foreground">No tastings yet</p>
                <p className="text-[13px] text-muted mt-1">Create your first one</p>
              </div>
            ) : (
              <div className="space-y-2">
                {pastEvents.map((event) => (
                  <Link
                    key={event.id}
                    href={`/arena/event/${event.id}`}
                    className="wine-card p-4 flex items-center gap-3.5 active:scale-[0.99] transition-transform"
                  >
                    <div className={`h-11 w-11 rounded-2xl flex items-center justify-center flex-shrink-0 ${
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
