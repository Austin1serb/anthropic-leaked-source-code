"use client";

import Link from "next/link";
import { Plus, Wine, Copy, ChevronRight, Sparkles, Trophy, Calendar, Users } from "lucide-react";
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
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        navigator.clipboard.writeText(code);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      }}
      className="font-mono text-[11px] font-bold tracking-[0.15em] text-cherry/60 active:text-cherry flex items-center gap-1"
    >
      {copied ? "Copied!" : <>{code} <Copy className="h-2.5 w-2.5 opacity-40" /></>}
    </button>
  );
}

export function ArenaClient({ events, templates, userName }: ArenaClientProps) {
  const firstName = userName.split(" ")[0];
  const liveEvents = events.filter((e) => e.status === "live" || e.status === "lobby");
  const pastEvents = events.filter((e) => e.status !== "live" && e.status !== "lobby");

  return (
    <div className="pb-28">

      {/* ════════════════════════════════════════════
          GREETING + NEW TASTING CTA
          ════════════════════════════════════════════ */}

      <section className="container-app pt-6">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <Avatar avatarId={avatarIdFromString(userName)} size={44} />
            <div>
              <p className="text-[12px] text-muted font-medium">Welcome back</p>
              <p className="text-[18px] font-bold text-foreground tracking-tight">{firstName}</p>
            </div>
          </div>
        </div>

        {/* Big CTA — the main action */}
        <Link
          href="/arena/create"
          className="block wine-card p-6 active:scale-[0.99] transition-transform group"
        >
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-[20px] font-bold text-foreground tracking-tight" style={{ fontFamily: "var(--font-serif, Georgia, serif)" }}>
                New Tasting
              </h2>
              <p className="text-[13px] text-muted mt-1">
                Create a blind tasting for your group
              </p>
            </div>
            <div className="h-12 w-12 rounded-2xl bg-cherry flex items-center justify-center float-action group-active:scale-90 transition-transform">
              <Plus className="h-5 w-5 text-white" strokeWidth={2.5} />
            </div>
          </div>
        </Link>
      </section>

      {/* ════════════════════════════════════════════
          LIVE NOW — takes over when active
          ════════════════════════════════════════════ */}

      {liveEvents.length > 0 && (
        <section className="container-app mt-6">
          <p className="text-[11px] font-bold text-cherry uppercase tracking-[0.1em] mb-3 flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-cherry animate-pulse" />
            Live Now
          </p>
          <div className="space-y-3">
            {liveEvents.map((event) => (
              <Link
                key={event.id}
                href={`/arena/event/${event.id}`}
                className="block rounded-2xl overflow-hidden active:scale-[0.99] transition-transform"
                style={{ background: "linear-gradient(135deg, #74070E 0%, #5A0509 100%)" }}
              >
                <div className="p-5">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-[11px] font-bold text-white/50 uppercase tracking-wider">
                      {event.status === "live" ? "Tasting in progress" : "Waiting for guests"}
                    </span>
                    <span className="font-mono text-[12px] font-bold text-white/40 tracking-[0.15em]">
                      {event.joinCode}
                    </span>
                  </div>

                  <h3 className="text-[20px] font-bold text-white tracking-tight leading-tight">
                    {event.title}
                  </h3>

                  <div className="mt-5 flex items-end justify-between">
                    <div className="flex gap-5">
                      <div>
                        <p className="text-[24px] font-bold text-white">{event.wines.length}</p>
                        <p className="text-[10px] text-white/40 font-semibold uppercase tracking-wider">Wines</p>
                      </div>
                      <div>
                        <p className="text-[24px] font-bold text-white">{event.guests.length}</p>
                        <p className="text-[10px] text-white/40 font-semibold uppercase tracking-wider">Guests</p>
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
        </section>
      )}

      {/* ════════════════════════════════════════════
          QUICK START — template cards
          ════════════════════════════════════════════ */}

      {templates.length > 0 && (
        <section className="mt-8">
          <div className="container-app flex items-baseline justify-between mb-3">
            <h2 className="text-[16px] font-bold text-foreground tracking-tight">Quick Start</h2>
            <span className="text-[11px] text-muted">{templates.length} templates</span>
          </div>

          <div className="flex gap-3 overflow-x-auto pb-1 container-app scrollbar-hide">
            {templates.map((t, i) => {
              const colors = [
                "border-l-cherry", "border-l-amber-500", "border-l-emerald-500",
                "border-l-blue-500", "border-l-purple-500", "border-l-orange-500",
              ];
              return (
                <Link
                  key={t.id}
                  href={`/arena/create?template=${t.id}`}
                  className={`flex-shrink-0 w-[200px] wine-card border-l-[3px] ${colors[i % colors.length]} p-4 active:scale-[0.97] transition-transform`}
                >
                  <h3 className="text-[14px] font-bold text-foreground leading-tight line-clamp-2">
                    {t.name}
                  </h3>
                  {t.description && (
                    <p className="text-[11px] text-muted mt-1.5 line-clamp-2 leading-relaxed">{t.description}</p>
                  )}
                  <div className="mt-3 flex items-center gap-1.5 text-[11px] text-muted">
                    <Wine className="h-3 w-3" />
                    <span>{t.wineCount} wines</span>
                    <span className="mx-1">·</span>
                    <span className="capitalize">{t.difficulty}</span>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {/* ════════════════════════════════════════════
          YOUR TASTINGS — history
          ════════════════════════════════════════════ */}

      <section className="container-app mt-8">
        <h2 className="text-[16px] font-bold text-foreground tracking-tight mb-3">
          Your Tastings
        </h2>

        {events.length === 0 ? (
          <div className="wine-card flex flex-col items-center py-16 text-center">
            <Sparkles className="h-8 w-8 text-muted/20 mb-3" />
            <p className="text-[15px] font-bold text-foreground">No tastings yet</p>
            <p className="text-[13px] text-muted mt-1 max-w-[220px]">
              Create your first tasting and invite friends.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {pastEvents.map((event) => (
              <Link
                key={event.id}
                href={`/arena/event/${event.id}`}
                className="flex items-center gap-3 wine-card p-4 active:scale-[0.99] transition-transform"
              >
                {/* Left: status indicator */}
                <div className={`h-10 w-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                  event.status === "completed" ? "widget-gold" : "widget-wine"
                }`}>
                  {event.status === "completed"
                    ? <Trophy className="h-4 w-4 text-amber-600" />
                    : <Wine className="h-4 w-4 text-cherry" />
                  }
                </div>

                {/* Middle: info */}
                <div className="flex-1 min-w-0">
                  <p className="text-[14px] font-semibold text-foreground truncate">{event.title}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[11px] text-muted">{timeAgo(event.createdAt)}</span>
                    <span className="text-muted/30">·</span>
                    <span className="text-[11px] text-muted">{event.wines.length} wines</span>
                    <span className="text-muted/30">·</span>
                    <span className="text-[11px] text-muted">{event.guests.length} guests</span>
                  </div>
                </div>

                {/* Right: code + arrow */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  <CopyCode code={event.joinCode} />
                  <ChevronRight className="h-4 w-4 text-muted/20" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
