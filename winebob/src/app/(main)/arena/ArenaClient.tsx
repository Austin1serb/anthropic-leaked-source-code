"use client";

import Link from "next/link";
import { Plus, Wine, Copy, ChevronRight, Sparkles, Trophy, Calendar, Users, GlassWater } from "lucide-react";
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

function StatusBadge({ status }: { status: string }) {
  const config = STATUS_CONFIG[status] ?? STATUS_CONFIG.draft;
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-card-bg/60 backdrop-blur-sm text-[11px] font-semibold text-muted">
      <span className={`h-1.5 w-1.5 rounded-full ${config.dot}`} />
      {config.label}
    </span>
  );
}

function JoinCodeDisplay({ code, variant = "default" }: { code: string; variant?: "default" | "large" }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  if (variant === "large") {
    return (
      <button
        onClick={handleCopy}
        className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-white/15 backdrop-blur-sm active:scale-95 transition-transform"
        aria-label={`Copy join code ${code}`}
      >
        {copied ? (
          <span className="text-sm font-semibold text-white/90">Copied!</span>
        ) : (
          <>
            <span className="font-mono text-lg font-bold tracking-[0.2em] text-white">{code}</span>
            <Copy className="h-3.5 w-3.5 text-white/60" />
          </>
        )}
      </button>
    );
  }

  return (
    <button
      onClick={handleCopy}
      className="inline-flex items-center gap-1.5 font-mono text-xs font-bold tracking-[0.2em] text-cherry/70 active:text-cherry transition-colors"
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

/* Widget-color presets for templates */
const TEMPLATE_COLORS = [
  { bg: "bg-widget-wine", icon: "text-cherry" },
  { bg: "bg-widget-gold", icon: "text-amber-700" },
  { bg: "bg-widget-sage", icon: "text-emerald-700" },
  { bg: "bg-widget-sky", icon: "text-blue-600" },
  { bg: "bg-widget-lavender", icon: "text-purple-600" },
  { bg: "bg-widget-peach", icon: "text-orange-600" },
];

const DIFFICULTY_COLORS: Record<string, string> = {
  beginner: "text-emerald-600",
  intermediate: "text-amber-600",
  advanced: "text-red-600",
  master: "text-purple-600",
};

export function ArenaClient({ events, templates, userName }: ArenaClientProps) {
  const firstName = userName.split(" ")[0];

  const totalEvents = events.length;
  const totalWines = events.reduce((sum, e) => sum + e.wines.length, 0);
  const totalGuests = events.reduce((sum, e) => sum + e.guests.length, 0);
  const liveEvents = events.filter((e) => e.status === "live" || e.status === "lobby");

  return (
    <div className="min-h-screen pb-28 safe-top bg-hero-gradient">
      {/* ── Header ── */}
      <div className="container-app pt-8 pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            <div className="relative">
              <Avatar avatarId={avatarIdFromString(userName)} size={52} />
              <div className="absolute -bottom-0.5 -right-0.5 h-4 w-4 rounded-full bg-green-500 border-2 border-background" />
            </div>
            <div>
              <p className="text-[13px] text-muted font-medium">Welcome back</p>
              <h1 className="text-2xl font-bold text-foreground tracking-tight leading-tight">
                {firstName}
              </h1>
            </div>
          </div>
          <Link
            href="/arena/create"
            className="h-12 w-12 rounded-2xl bg-cherry flex items-center justify-center float-action active:scale-90 transition-transform"
          >
            <Plus className="h-5 w-5 text-white" strokeWidth={2.5} />
          </Link>
        </div>
      </div>

      {/* ── Stats Widgets ── */}
      <div className="container-app mt-5 stagger-children">
        <div className="flex items-stretch gap-3">
          <div className="flex-1 widget-card widget-wine p-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="h-8 w-8 rounded-xl bg-cherry/10 flex items-center justify-center">
                <Wine className="h-4 w-4 text-cherry" />
              </div>
            </div>
            <p className="text-3xl font-bold text-foreground tracking-tight">{totalEvents}</p>
            <p className="text-[11px] font-medium text-muted mt-1">Tastings</p>
          </div>
          <div className="flex-1 widget-card widget-gold p-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="h-8 w-8 rounded-xl bg-amber-600/10 flex items-center justify-center">
                <GlassWater className="h-4 w-4 text-amber-700" />
              </div>
            </div>
            <p className="text-3xl font-bold text-foreground tracking-tight">{totalWines}</p>
            <p className="text-[11px] font-medium text-muted mt-1">Wines</p>
          </div>
          <div className="flex-1 widget-card widget-sage p-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="h-8 w-8 rounded-xl bg-emerald-600/10 flex items-center justify-center">
                <Users className="h-4 w-4 text-emerald-700" />
              </div>
            </div>
            <p className="text-3xl font-bold text-foreground tracking-tight">{totalGuests}</p>
            <p className="text-[11px] font-medium text-muted mt-1">Guests</p>
          </div>
        </div>
      </div>

      {/* ── Live / Active Events ── */}
      {liveEvents.length > 0 && (
        <div className="container-app mt-6">
          {liveEvents.map((event) => (
            <Link
              key={event.id}
              href={`/arena/event/${event.id}`}
              className="block rounded-[24px] bg-cherry-gradient p-6 text-white float-action active:scale-[0.98] transition-transform animate-scale-in"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-white animate-pulse" />
                  <span className="text-[12px] font-bold uppercase tracking-widest text-white/70">
                    {event.status === "live" ? "Live Now" : "Waiting for guests"}
                  </span>
                </div>
                <JoinCodeDisplay code={event.joinCode} variant="large" />
              </div>

              <h3 className="font-bold text-[22px] leading-tight tracking-tight">
                {event.title}
              </h3>

              <div className="mt-5 flex items-end justify-between">
                <div className="flex gap-6">
                  <div>
                    <p className="text-3xl font-bold">{event.wines.length}</p>
                    <p className="text-[10px] text-white/50 font-semibold uppercase tracking-wider">Wines</p>
                  </div>
                  <div>
                    <p className="text-3xl font-bold">{event.guests.length}</p>
                    <p className="text-[10px] text-white/50 font-semibold uppercase tracking-wider">Guests</p>
                  </div>
                </div>
                {event.guests.length > 0 && (
                  <AvatarStack
                    ids={event.guests.map((g) => avatarIdFromString(g.id))}
                    size={32}
                    max={5}
                  />
                )}
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* ── Templates — Start a Tasting ── */}
      {templates.length > 0 && (
        <section className="mt-7">
          <div className="flex items-center justify-between container-app mb-4">
            <h2 className="text-lg font-bold text-foreground tracking-tight">
              Start a Tasting
            </h2>
            <span className="text-[12px] font-medium text-muted">{templates.length} templates</span>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-3 container-app scroll-smooth snap-x snap-mandatory scrollbar-hide">
            {/* From scratch card */}
            <Link
              href="/arena/create"
              className="flex-shrink-0 w-40 snap-start widget-card p-4 active:scale-[0.95] transition-all"
              style={{ background: "var(--card-bg)" }}
            >
              <div className="h-11 w-11 rounded-2xl bg-cherry/8 flex items-center justify-center mb-4">
                <Plus className="h-5 w-5 text-cherry" />
              </div>
              <h3 className="font-bold text-[14px] text-foreground leading-tight">
                From Scratch
              </h3>
              <p className="mt-1.5 text-[11px] text-muted leading-relaxed">
                Full control over details
              </p>
            </Link>

            {/* Template cards */}
            {templates.map((template, i) => {
              const color = TEMPLATE_COLORS[i % TEMPLATE_COLORS.length];
              return (
                <Link
                  key={template.id}
                  href={`/arena/create?template=${template.id}`}
                  className={`flex-shrink-0 w-40 snap-start widget-card ${color.bg} p-4 active:scale-[0.95] transition-all`}
                >
                  <div className={`h-11 w-11 rounded-2xl bg-white/50 flex items-center justify-center mb-4`}>
                    <Wine className={`h-5 w-5 ${color.icon}`} />
                  </div>
                  <h3 className="font-bold text-[14px] text-foreground leading-tight line-clamp-2">
                    {template.name}
                  </h3>
                  <p className="mt-1.5 text-[11px] text-muted leading-relaxed line-clamp-2">
                    {template.description}
                  </p>
                  <div className="mt-3 flex items-center gap-2">
                    <span className="text-[11px] font-semibold text-muted">
                      {template.wineCount} wines
                    </span>
                    <span className="text-muted/30">·</span>
                    <span className={`text-[11px] font-semibold capitalize ${DIFFICULTY_COLORS[template.difficulty] ?? "text-muted"}`}>
                      {template.difficulty}
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {/* ── Activity Feed ── */}
      <section className="container-app mt-7">
        <h2 className="text-lg font-bold text-foreground tracking-tight mb-4">
          Activity
        </h2>

        {events.length === 0 ? (
          <div className="wine-card flex flex-col items-center justify-center py-16 px-6 text-center">
            <div className="w-16 h-16 rounded-3xl widget-gold flex items-center justify-center mb-4">
              <Sparkles className="h-7 w-7 text-amber-600/40" />
            </div>
            <p className="text-[17px] font-bold text-foreground">
              Your tastings will appear here
            </p>
            <p className="mt-2 text-sm text-muted max-w-[240px]">
              Create your first tasting and invite some friends.
            </p>
          </div>
        ) : (
          <div className="space-y-3 stagger-children">
            {events
              .filter((e) => e.status !== "live" && e.status !== "lobby")
              .map((event) => (
              <Link
                key={event.id}
                href={`/arena/event/${event.id}`}
                className="block wine-card active:scale-[0.98] transition-transform"
              >
                <div className="p-4 flex items-center gap-3.5">
                  {/* Colored icon */}
                  <div className="w-12 h-12 rounded-2xl widget-wine flex items-center justify-center flex-shrink-0">
                    <Trophy className="h-5 w-5 text-cherry" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-[15px] text-foreground leading-tight truncate">
                      {event.title}
                    </h3>
                    <div className="flex items-center gap-2 mt-1">
                      <StatusBadge status={event.status} />
                      <span className="text-[11px] text-muted flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {timeAgo(event.createdAt)}
                      </span>
                    </div>
                  </div>

                  <ChevronRight className="h-4 w-4 text-muted/30 flex-shrink-0" />
                </div>

                {/* Stats strip */}
                <div className="px-4 py-3 flex items-center border-t border-card-border/40">
                  {event.guests.length > 0 && (
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <AvatarStack
                        ids={event.guests.map((g) => avatarIdFromString(g.id))}
                        size={24}
                        max={4}
                      />
                      <span className="text-[11px] text-muted truncate">
                        {event.guests.map((g) => g.displayName.split(" ")[0]).slice(0, 2).join(", ")}
                        {event.guests.length > 2 && ` +${event.guests.length - 2}`}
                      </span>
                    </div>
                  )}
                  <div className="flex items-center gap-4 ml-auto">
                    <div className="text-center">
                      <p className="text-[15px] font-bold text-foreground">{event.wines.length}</p>
                      <p className="text-[9px] font-semibold text-muted uppercase tracking-wider">Wines</p>
                    </div>
                    <div className="text-center">
                      <p className="text-[15px] font-bold text-foreground">{event.guests.length}</p>
                      <p className="text-[9px] font-semibold text-muted uppercase tracking-wider">Guests</p>
                    </div>
                    <JoinCodeDisplay code={event.joinCode} />
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
