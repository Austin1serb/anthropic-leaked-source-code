"use client";

import Link from "next/link";
import { Plus, Users, Wine, Clock, Copy, ChevronRight, Sparkles } from "lucide-react";
import { useState } from "react";

type Event = {
  id: string;
  title: string;
  joinCode: string;
  status: string;
  difficulty: string;
  createdAt: Date;
  wines: { id: string }[];
  guests: { id: string }[];
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

const STATUS_CONFIG: Record<string, { label: string; dot: string; bg: string }> = {
  draft: { label: "Draft", dot: "bg-gray-400", bg: "bg-gray-100 text-gray-600" },
  lobby: { label: "Waiting", dot: "bg-amber-400", bg: "bg-amber-50 text-amber-700" },
  live: { label: "Live", dot: "bg-green-500 animate-pulse", bg: "bg-green-50 text-green-700" },
  revealing: { label: "Revealing", dot: "bg-purple-500", bg: "bg-purple-50 text-purple-700" },
  completed: { label: "Done", dot: "bg-gray-300", bg: "bg-gray-50 text-gray-500" },
};

const DIFFICULTY_EMOJI: Record<string, string> = {
  beginner: "🟢",
  intermediate: "🟡",
  advanced: "🔴",
  expert: "⚫",
};

function StatusBadge({ status }: { status: string }) {
  const config = STATUS_CONFIG[status] ?? STATUS_CONFIG.draft;
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ${config.bg}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${config.dot}`} />
      {config.label}
    </span>
  );
}

function formatDate(date: Date) {
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
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
      className="inline-flex items-center gap-1.5 rounded-lg bg-butter-dark/40 px-2.5 py-1 font-mono text-xs font-bold tracking-[0.2em] text-cherry"
      aria-label={`Copy join code ${code}`}
    >
      {code}
      <Copy className="h-3 w-3 opacity-50" />
      {copied && (
        <span className="text-[10px] font-sans font-normal text-green-600 tracking-normal">
          Copied!
        </span>
      )}
    </button>
  );
}

export function ArenaClient({ events, templates, userName }: ArenaClientProps) {
  const firstName = userName.split(" ")[0];

  return (
    <div className="min-h-screen pb-28 safe-top">
      {/* Hero header with gradient */}
      <header className="px-5 pt-8 pb-6 bg-gradient-to-b from-cherry to-cherry-dark text-white relative overflow-hidden">
        {/* Decorative circles */}
        <div className="absolute top-[-40px] right-[-30px] w-32 h-32 rounded-full bg-white/5" />
        <div className="absolute bottom-[-20px] left-[-20px] w-24 h-24 rounded-full bg-white/5" />

        <p className="text-white/70 text-sm font-medium">Welcome back</p>
        <h1 className="font-serif text-2xl font-bold mt-0.5">
          {firstName} 🍷
        </h1>

        {/* Create button */}
        <Link
          href="/arena/create"
          className="mt-5 flex items-center justify-center gap-2 w-full py-3.5 bg-white text-cherry rounded-2xl font-semibold text-[15px] shadow-lg shadow-black/10 active:scale-[0.97] transition-transform"
        >
          <Plus className="h-5 w-5" strokeWidth={2.5} />
          New Blind Tasting
        </Link>
      </header>

      <div className="px-5">
        {/* Templates */}
        {templates.length > 0 && (
          <section className="mt-6">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-serif text-lg font-bold text-foreground">
                Quick Start
              </h2>
              <span className="text-xs text-muted flex items-center gap-0.5">
                Swipe <ChevronRight className="h-3 w-3" />
              </span>
            </div>
            <div className="flex gap-3 overflow-x-auto pb-3 -mx-5 px-5 scroll-smooth snap-x snap-mandatory scrollbar-hide">
              {templates.map((template, i) => (
                <Link
                  key={template.id}
                  href={`/arena/create?template=${template.id}`}
                  className="flex-shrink-0 w-44 snap-start rounded-2xl border border-card-border bg-card-bg p-4 active:scale-[0.96] transition-all shadow-sm hover:shadow-md"
                  style={{ animationDelay: `${i * 50}ms` }}
                >
                  <div className="text-2xl mb-2">
                    {DIFFICULTY_EMOJI[template.difficulty] ?? "🟡"}
                  </div>
                  <h3 className="font-serif font-bold text-sm text-foreground leading-tight line-clamp-2">
                    {template.name}
                  </h3>
                  {template.description && (
                    <p className="mt-1.5 text-[11px] text-muted line-clamp-2 leading-relaxed">
                      {template.description}
                    </p>
                  )}
                  <div className="mt-3 flex items-center gap-1.5 text-[11px] text-muted">
                    <Wine className="h-3 w-3" />
                    <span>{template.wineCount} wines</span>
                    <span className="text-card-border">·</span>
                    <span className="capitalize">{template.difficulty}</span>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Events */}
        <section className="mt-8">
          <h2 className="font-serif text-lg font-bold text-foreground mb-3">
            Your Tastings
          </h2>

          {events.length === 0 ? (
            <div className="rounded-2xl border-2 border-dashed border-card-border flex flex-col items-center justify-center py-14 px-6 text-center">
              <div className="w-16 h-16 rounded-full bg-butter-dark/30 flex items-center justify-center mb-4">
                <Sparkles className="h-7 w-7 text-cherry/40" />
              </div>
              <p className="font-serif text-base font-bold text-foreground">
                No tastings yet
              </p>
              <p className="mt-1.5 text-sm text-muted max-w-[220px]">
                Create your first event and share the code with friends.
              </p>
              <Link
                href="/arena/create"
                className="mt-5 px-5 py-2.5 bg-cherry text-white text-sm font-semibold rounded-xl active:scale-[0.97] transition-transform"
              >
                Get started
              </Link>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {events.map((event) => (
                <Link
                  key={event.id}
                  href={`/arena/event/${event.id}`}
                  className="rounded-2xl border border-card-border bg-card-bg p-4 active:scale-[0.98] transition-transform block shadow-sm"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-serif font-bold text-[15px] text-foreground leading-tight truncate">
                        {event.title}
                      </h3>
                      <div className="mt-2">
                        <JoinCodeDisplay code={event.joinCode} />
                      </div>
                    </div>
                    <StatusBadge status={event.status} />
                  </div>

                  <div className="mt-3 pt-3 border-t border-card-border/60 flex items-center gap-4 text-xs text-muted">
                    <span className="inline-flex items-center gap-1">
                      <Wine className="h-3.5 w-3.5" />
                      {event.wines.length}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Users className="h-3.5 w-3.5" />
                      {event.guests.length}
                    </span>
                    <span className="inline-flex items-center gap-1 ml-auto">
                      <Clock className="h-3.5 w-3.5" />
                      {formatDate(event.createdAt)}
                    </span>
                    <ChevronRight className="h-4 w-4 text-muted/50" />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
