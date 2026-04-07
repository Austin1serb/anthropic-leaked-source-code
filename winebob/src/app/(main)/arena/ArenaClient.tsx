"use client";

import Link from "next/link";
import { Plus, Wine, Copy, ChevronRight, Sparkles, Trophy, Calendar } from "lucide-react";
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

const STATUS_CONFIG: Record<string, { label: string; dot: string }> = {
  draft: { label: "Draft", dot: "bg-gray-400" },
  lobby: { label: "Waiting", dot: "bg-amber-400 animate-pulse" },
  live: { label: "Live", dot: "bg-green-500 animate-pulse" },
  revealing: { label: "Revealing", dot: "bg-purple-500 animate-pulse" },
  completed: { label: "Completed", dot: "bg-muted" },
};

function StatusDot({ status }: { status: string }) {
  const config = STATUS_CONFIG[status] ?? STATUS_CONFIG.draft;
  return (
    <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-muted">
      <span className={`h-2 w-2 rounded-full ${config.dot}`} />
      {config.label}
    </span>
  );
}

function JoinCodeDisplay({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <button
      onClick={handleCopy}
      className="inline-flex items-center gap-1.5 font-mono text-xs font-bold tracking-[0.2em] text-cherry/80 active:text-cherry"
      aria-label={`Copy join code ${code}`}
    >
      {copied ? (
        <span className="text-[11px] font-sans font-semibold text-green-600 tracking-normal">
          Copied!
        </span>
      ) : (
        <>
          {code}
          <Copy className="h-3 w-3 opacity-40" />
        </>
      )}
    </button>
  );
}

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

export function ArenaClient({ events, templates, userName }: ArenaClientProps) {
  const firstName = userName.split(" ")[0];

  // Stats
  const totalEvents = events.length;
  const totalWines = events.reduce((sum, e) => sum + e.wines.length, 0);
  const totalGuests = events.reduce((sum, e) => sum + e.guests.length, 0);
  const liveEvents = events.filter((e) => e.status === "live" || e.status === "lobby");

  return (
    <div className="min-h-screen pb-28 safe-top bg-background">
      {/* ── Header ── */}
      <div className="px-5 pt-8 pb-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Avatar avatarId={avatarIdFromString(userName)} size={48} />
            <div>
              <h1 className="font-serif text-xl font-bold text-foreground leading-tight">
                {firstName}
              </h1>
              <p className="text-xs text-muted mt-0.5">Host Dashboard</p>
            </div>
          </div>
          <Link
            href="/arena/create"
            className="h-11 w-11 rounded-full bg-cherry flex items-center justify-center shadow-lg shadow-cherry/25 active:scale-90 transition-transform"
          >
            <Plus className="h-5 w-5 text-white" strokeWidth={2.5} />
          </Link>
        </div>

        {/* ── Stats Row (Strava-style) ── */}
        <div className="mt-5 flex items-stretch gap-2">
          <div className="flex-1 rounded-2xl bg-card-bg border border-card-border p-3 text-center">
            <p className="text-2xl font-bold text-foreground font-serif">{totalEvents}</p>
            <p className="text-[10px] font-semibold text-muted uppercase tracking-wider mt-0.5">Tastings</p>
          </div>
          <div className="flex-1 rounded-2xl bg-card-bg border border-card-border p-3 text-center">
            <p className="text-2xl font-bold text-cherry font-serif">{totalWines}</p>
            <p className="text-[10px] font-semibold text-muted uppercase tracking-wider mt-0.5">Wines</p>
          </div>
          <div className="flex-1 rounded-2xl bg-card-bg border border-card-border p-3 text-center">
            <p className="text-2xl font-bold text-foreground font-serif">{totalGuests}</p>
            <p className="text-[10px] font-semibold text-muted uppercase tracking-wider mt-0.5">Guests</p>
          </div>
        </div>
      </div>

      {/* ── Live / Active Events (Strava "In Progress" style) ── */}
      {liveEvents.length > 0 && (
        <div className="px-5 mb-5">
          {liveEvents.map((event) => (
            <Link
              key={event.id}
              href={`/arena/event/${event.id}`}
              className="block rounded-2xl bg-gradient-to-br from-cherry to-cherry-dark p-5 text-white shadow-lg shadow-cherry/20 active:scale-[0.98] transition-transform"
            >
              <div className="flex items-center gap-2 mb-3">
                <span className="h-2.5 w-2.5 rounded-full bg-white animate-pulse" />
                <span className="text-xs font-bold uppercase tracking-wider text-white/80">
                  {event.status === "live" ? "Live Now" : "Waiting for guests"}
                </span>
              </div>
              <h3 className="font-serif font-bold text-xl leading-tight">
                {event.title}
              </h3>
              {/* Guest avatars */}
              {event.guests.length > 0 && (
                <div className="mt-3">
                  <AvatarStack
                    ids={event.guests.map((g) => avatarIdFromString(g.id))}
                    size={28}
                    max={6}
                  />
                </div>
              )}
              <div className="mt-3 flex items-center gap-5">
                <div>
                  <p className="text-2xl font-bold">{event.wines.length}</p>
                  <p className="text-[10px] text-white/60 font-medium uppercase tracking-wider">Wines</p>
                </div>
                <div>
                  <p className="text-2xl font-bold">{event.guests.length}</p>
                  <p className="text-[10px] text-white/60 font-medium uppercase tracking-wider">Guests</p>
                </div>
                <div className="ml-auto font-mono text-lg font-bold tracking-[0.15em] bg-white/15 rounded-xl px-3 py-1.5">
                  {event.joinCode}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* ── Templates (Strava "Suggested Routes" style) ── */}
      {templates.length > 0 && (
        <section className="mb-6">
          <div className="flex items-center justify-between px-5 mb-3">
            <h2 className="font-serif text-base font-bold text-foreground">
              Start a Tasting
            </h2>
          </div>
          <div className="flex gap-2.5 overflow-x-auto pb-2 px-5 scroll-smooth snap-x snap-mandatory scrollbar-hide">
            {templates.map((template) => (
              <Link
                key={template.id}
                href={`/arena/create?template=${template.id}`}
                className="flex-shrink-0 w-36 snap-start rounded-2xl border border-card-border bg-card-bg p-3.5 active:scale-[0.95] transition-all"
              >
                <div className="w-9 h-9 rounded-xl bg-butter-dark/40 flex items-center justify-center mb-2.5">
                  <Wine className="h-4 w-4 text-cherry" />
                </div>
                <h3 className="font-serif font-bold text-[13px] text-foreground leading-tight line-clamp-2">
                  {template.name}
                </h3>
                <p className="mt-1.5 text-[10px] text-muted leading-relaxed line-clamp-2">
                  {template.description}
                </p>
                <div className="mt-2 text-[10px] font-semibold text-muted">
                  {template.wineCount} wines · {template.difficulty}
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* ── Activity Feed (past events as Strava activities) ── */}
      <section className="px-5">
        <h2 className="font-serif text-base font-bold text-foreground mb-3">
          Activity
        </h2>

        {events.length === 0 ? (
          <div className="rounded-2xl border-2 border-dashed border-card-border/60 flex flex-col items-center justify-center py-16 px-6 text-center">
            <div className="w-14 h-14 rounded-full bg-butter-dark/30 flex items-center justify-center mb-3">
              <Sparkles className="h-6 w-6 text-cherry/30" />
            </div>
            <p className="font-serif text-base font-bold text-foreground">
              Your tastings will appear here
            </p>
            <p className="mt-1 text-sm text-muted">
              Like a feed of all your wine adventures.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {events
              .filter((e) => e.status !== "live" && e.status !== "lobby")
              .map((event) => (
              <Link
                key={event.id}
                href={`/arena/event/${event.id}`}
                className="block rounded-2xl border border-card-border bg-card-bg overflow-hidden active:scale-[0.98] transition-transform"
              >
                {/* Activity header */}
                <div className="px-4 pt-3.5 pb-3 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-cherry/10 flex items-center justify-center flex-shrink-0">
                    <Trophy className="h-4 w-4 text-cherry" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-serif font-bold text-[14px] text-foreground leading-tight truncate">
                      {event.title}
                    </h3>
                    <div className="flex items-center gap-2 mt-0.5">
                      <StatusDot status={event.status} />
                      <span className="text-[11px] text-muted">·</span>
                      <span className="text-[11px] text-muted flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {timeAgo(event.createdAt)}
                      </span>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted/40 flex-shrink-0" />
                </div>

                {/* Guest avatars + stats bar */}
                <div className="px-4 py-3 bg-butter-dark/15 border-t border-card-border/40">
                  {event.guests.length > 0 && (
                    <div className="flex items-center gap-2 mb-3">
                      <AvatarStack
                        ids={event.guests.map((g) => avatarIdFromString(g.id))}
                        size={26}
                        max={5}
                      />
                      <span className="text-[11px] text-muted">
                        {event.guests.map((g) => g.displayName.split(" ")[0]).slice(0, 3).join(", ")}
                        {event.guests.length > 3 && ` +${event.guests.length - 3}`}
                      </span>
                    </div>
                  )}
                  <div className="flex items-center">
                    <div className="flex-1 text-center">
                      <p className="text-lg font-bold text-foreground font-serif">{event.wines.length}</p>
                      <p className="text-[9px] font-semibold text-muted uppercase tracking-wider">Wines</p>
                    </div>
                    <div className="w-px h-8 bg-card-border/60" />
                    <div className="flex-1 text-center">
                      <p className="text-lg font-bold text-foreground font-serif">{event.guests.length}</p>
                      <p className="text-[9px] font-semibold text-muted uppercase tracking-wider">Guests</p>
                    </div>
                    <div className="w-px h-8 bg-card-border/60" />
                    <div className="flex-1 text-center">
                      <JoinCodeDisplay code={event.joinCode} />
                      <p className="text-[9px] font-semibold text-muted uppercase tracking-wider mt-0.5">Code</p>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
