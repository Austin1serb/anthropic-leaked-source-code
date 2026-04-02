"use client";

import Link from "next/link";
import { Plus, Users, Wine, Clock, Copy } from "lucide-react";
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

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  draft: {
    label: "Draft",
    className: "bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300",
  },
  lobby: {
    label: "Lobby",
    className: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  },
  live: {
    label: "Live",
    className: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 animate-pulse",
  },
  revealing: {
    label: "Revealing",
    className: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
  },
  completed: {
    label: "Completed",
    className: "bg-gray-100 text-muted dark:bg-gray-800 dark:text-gray-400",
  },
};

const DIFFICULTY_CONFIG: Record<string, { label: string; className: string }> = {
  beginner: {
    label: "Beginner",
    className: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  },
  intermediate: {
    label: "Intermediate",
    className: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  },
  advanced: {
    label: "Advanced",
    className: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  },
  expert: {
    label: "Expert",
    className: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
  },
};

function StatusBadge({ status }: { status: string }) {
  const config = STATUS_CONFIG[status] ?? STATUS_CONFIG.draft;
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${config.className}`}>
      {config.label}
    </span>
  );
}

function DifficultyBadge({ difficulty }: { difficulty: string }) {
  const config = DIFFICULTY_CONFIG[difficulty] ?? DIFFICULTY_CONFIG.beginner;
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${config.className}`}>
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
      className="touch-target inline-flex items-center gap-1.5 rounded-lg bg-wine-cream-dark dark:bg-wine-charcoal/30 px-3 py-1.5 font-mono text-sm font-bold tracking-widest text-wine-burgundy dark:text-wine-gold"
      aria-label={`Copy join code ${code}`}
    >
      {code}
      <Copy className="h-3.5 w-3.5 opacity-60" />
      {copied && (
        <span className="text-xs font-sans font-normal text-wine-sage">
          Copied!
        </span>
      )}
    </button>
  );
}

export function ArenaClient({ events, templates, userName }: ArenaClientProps) {
  return (
    <div className="min-h-screen px-4 pb-28 pt-6 safe-top">
      {/* Header */}
      <header className="mb-8">
        <h1 className="font-serif text-3xl font-bold text-foreground">
          Hey {userName}
        </h1>
        <p className="mt-1 text-muted text-base">Ready to host?</p>
      </header>

      {/* Create Event Section */}
      <section className="mb-10">
        <Link
          href="/arena/create"
          className="touch-target wine-card bg-wine-gradient flex items-center justify-center gap-3 px-6 py-5 text-white text-lg font-semibold font-serif shadow-lg active:scale-[0.98] transition-transform"
        >
          <Plus className="h-6 w-6" />
          Create New Tasting
        </Link>

        {templates.length > 0 && (
          <div className="mt-5">
            <h2 className="font-serif text-sm font-semibold text-muted uppercase tracking-wide mb-3">
              Quick Start Templates
            </h2>
            <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 scroll-smooth snap-x snap-mandatory">
              {templates.map((template) => (
                <Link
                  key={template.id}
                  href={`/arena/create?template=${template.id}`}
                  className="wine-card flex-shrink-0 w-52 snap-start p-4 active:scale-[0.97] transition-transform"
                >
                  <h3 className="font-serif font-semibold text-sm text-foreground leading-tight line-clamp-1">
                    {template.name}
                  </h3>
                  {template.description && (
                    <p className="mt-1.5 text-xs text-muted line-clamp-2 leading-relaxed">
                      {template.description}
                    </p>
                  )}
                  <div className="mt-3 flex items-center gap-2 flex-wrap">
                    <DifficultyBadge difficulty={template.difficulty} />
                    <span className="inline-flex items-center gap-1 text-xs text-muted">
                      <Wine className="h-3 w-3" />
                      {template.wineCount}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* Your Events Section */}
      <section>
        <h2 className="font-serif text-xl font-bold text-foreground mb-4">
          Your Events
        </h2>

        {events.length === 0 ? (
          <div className="wine-card flex flex-col items-center justify-center py-12 px-6 text-center">
            <Wine className="h-12 w-12 text-wine-gold mb-4 opacity-60" />
            <p className="font-serif text-lg font-semibold text-foreground">
              No tastings yet
            </p>
            <p className="mt-1 text-sm text-muted max-w-[240px]">
              Create your first blind tasting event and invite friends to join the fun.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {events.map((event) => (
              <Link
                key={event.id}
                href={`/arena/event/${event.id}`}
                className="wine-card p-4 active:scale-[0.98] transition-transform touch-target block"
              >
                <div className="flex items-start justify-between gap-3">
                  <h3 className="font-serif font-semibold text-base text-foreground leading-tight line-clamp-1 flex-1">
                    {event.title}
                  </h3>
                  <StatusBadge status={event.status} />
                </div>

                <div className="mt-3">
                  <JoinCodeDisplay code={event.joinCode} />
                </div>

                <div className="mt-3 flex items-center gap-4 text-xs text-muted">
                  <span className="inline-flex items-center gap-1">
                    <Wine className="h-3.5 w-3.5" />
                    {event.wines.length} {event.wines.length === 1 ? "wine" : "wines"}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Users className="h-3.5 w-3.5" />
                    {event.guests.length} {event.guests.length === 1 ? "guest" : "guests"}
                  </span>
                  <span className="inline-flex items-center gap-1 ml-auto">
                    <Clock className="h-3.5 w-3.5" />
                    {formatDate(event.createdAt)}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
