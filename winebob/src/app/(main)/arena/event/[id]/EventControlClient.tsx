"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import {
  Copy,
  QrCode,
  Play,
  Eye,
  ChevronRight,
  Trophy,
  Users,
  Wine,
  Check,
  DoorOpen,
  Flag,
} from "lucide-react";
import {
  updateEventStatus,
  advanceWine,
  revealWine,
  scoreEvent,
} from "@/lib/actions";

// ============ TYPES ============

type BlindWine = {
  id: string;
  eventId: string;
  wineId: string;
  position: number;
  hints: string[];
  revealed: boolean;
  wine: {
    id: string;
    name: string;
    producer: string;
    vintage: number | null;
    grapes: string[];
    region: string;
    country: string;
    type: string;
  };
};

type Guest = {
  id: string;
  displayName: string;
  eventId: string;
  birthYear: number;
  joinedAt: Date;
};

type Guess = {
  id: string;
  eventId: string;
  guestId: string;
  winePosition: number;
  score: number;
};

type Event = {
  id: string;
  hostId: string;
  title: string;
  description: string | null;
  joinCode: string;
  status: string;
  currentWine: number;
  difficulty: string;
  guessFields: string[];
  scoringConfig: unknown;
  timePerWine: number | null;
  startsAt: Date | null;
  completedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  host: {
    displayName: string | null;
    name: string | null;
    image: string | null;
  };
  wines: BlindWine[];
  guests: Guest[];
  guesses: Guess[];
};

type EventControlClientProps = {
  event: Event;
};

// ============ STATUS BADGES ============

const STATUS_CONFIG: Record<
  string,
  { label: string; className: string }
> = {
  draft: {
    label: "Draft",
    className:
      "bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300",
  },
  lobby: {
    label: "Lobby Open",
    className:
      "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  },
  live: {
    label: "Live",
    className:
      "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 animate-pulse",
  },
  revealing: {
    label: "Revealing",
    className:
      "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
  },
  completed: {
    label: "Completed",
    className:
      "bg-gray-100 text-muted dark:bg-gray-800 dark:text-gray-400",
  },
};

function StatusBadge({ status }: { status: string }) {
  const config = STATUS_CONFIG[status] ?? STATUS_CONFIG.draft;
  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${config.className}`}
    >
      {config.label}
    </span>
  );
}

// ============ GUEST SCORES HELPERS ============

function computeGuestScores(guests: Guest[], guesses: Guess[]) {
  const scoreMap = new Map<string, number>();
  for (const guess of guesses) {
    scoreMap.set(
      guess.guestId,
      (scoreMap.get(guess.guestId) ?? 0) + guess.score
    );
  }

  return guests
    .map((g) => ({
      id: g.id,
      displayName: g.displayName,
      totalScore: scoreMap.get(g.id) ?? 0,
    }))
    .sort((a, b) => b.totalScore - a.totalScore);
}

// ============ MAIN COMPONENT ============

export function EventControlClient({ event }: EventControlClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [copied, setCopied] = useState(false);

  // Auto-refresh every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      router.refresh();
    }, 5000);
    return () => clearInterval(interval);
  }, [router]);

  // Refresh helper after actions
  function refreshAfterAction() {
    router.refresh();
  }

  // ---- Action handlers ----

  function handleOpenLobby() {
    startTransition(async () => {
      await updateEventStatus(event.id, "lobby");
      refreshAfterAction();
    });
  }

  function handleStartTasting() {
    startTransition(async () => {
      await updateEventStatus(event.id, "live");
      await advanceWine(event.id);
      refreshAfterAction();
    });
  }

  function handleRevealWine() {
    startTransition(async () => {
      await revealWine(event.id, event.currentWine);
      await scoreEvent(event.id);
      refreshAfterAction();
    });
  }

  function handleNextWine() {
    startTransition(async () => {
      await advanceWine(event.id);
      refreshAfterAction();
    });
  }

  function handleFinishTasting() {
    startTransition(async () => {
      await updateEventStatus(event.id, "completed");
      refreshAfterAction();
    });
  }

  function handleCopyCode() {
    navigator.clipboard.writeText(event.joinCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleShareQR() {
    // Open a QR code generator in a new tab as a lightweight approach
    const url = `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(event.joinCode)}`;
    window.open(url, "_blank");
  }

  // ---- Derived state ----

  const currentWineObj = event.wines.find(
    (w) => w.position === event.currentWine
  );
  const isCurrentRevealed = currentWineObj?.revealed ?? false;
  const isLastWine = event.currentWine >= event.wines.length;
  const rankedGuests = computeGuestScores(event.guests, event.guesses);
  const hasAnyScores = event.guesses.some((g) => g.score > 0);

  return (
    <div className="min-h-screen px-4 pb-56 pt-6 safe-top">
      {/* ========== HEADER ========== */}
      <header className="mb-6">
        <div className="flex items-start justify-between gap-3">
          <h1 className="font-serif text-2xl font-bold text-foreground leading-tight flex-1">
            {event.title}
          </h1>
          <StatusBadge status={event.status} />
        </div>

        {/* Join Code -- BIG */}
        <div className="mt-5 wine-card p-6 flex flex-col items-center gap-4">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted">
            Join Code
          </p>
          <p className="font-mono text-5xl sm:text-6xl font-black tracking-[0.3em] text-wine-burgundy dark:text-wine-gold select-all leading-none">
            {event.joinCode}
          </p>
          <div className="flex items-center gap-3">
            <button
              onClick={handleCopyCode}
              className="touch-target inline-flex items-center gap-2 rounded-xl bg-wine-cream-dark dark:bg-wine-charcoal/40 px-4 py-2.5 text-sm font-semibold text-foreground active:scale-95 transition-transform"
            >
              {copied ? (
                <>
                  <Check className="h-4 w-4 text-wine-sage" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4" />
                  Copy
                </>
              )}
            </button>
            <button
              onClick={handleShareQR}
              className="touch-target inline-flex items-center gap-2 rounded-xl bg-wine-cream-dark dark:bg-wine-charcoal/40 px-4 py-2.5 text-sm font-semibold text-foreground active:scale-95 transition-transform"
            >
              <QrCode className="h-4 w-4" />
              Share QR
            </button>
          </div>
        </div>
      </header>

      {/* ========== GUEST LIST ========== */}
      <section className="mb-6">
        <h2 className="font-serif text-lg font-bold text-foreground mb-3 flex items-center gap-2">
          <Users className="h-5 w-5 text-wine-burgundy dark:text-wine-gold" />
          Guests
          <span className="ml-auto text-sm font-normal text-muted">
            {event.guests.length}
          </span>
        </h2>

        {event.guests.length === 0 ? (
          <div className="wine-card py-8 flex flex-col items-center text-center px-4">
            <Users className="h-8 w-8 text-muted mb-2 opacity-40" />
            <p className="text-sm text-muted">
              No guests yet. Share the join code to get started.
            </p>
          </div>
        ) : (
          <div className="wine-card divide-y divide-card-border">
            {event.guests.map((guest) => (
              <div
                key={guest.id}
                className="flex items-center gap-3 px-4 py-3"
              >
                <div className="h-8 w-8 rounded-full bg-wine-burgundy/10 dark:bg-wine-gold/10 flex items-center justify-center text-xs font-bold text-wine-burgundy dark:text-wine-gold">
                  {guest.displayName.charAt(0).toUpperCase()}
                </div>
                <span className="text-sm font-medium text-foreground">
                  {guest.displayName}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ========== WINE FLIGHT ========== */}
      <section className="mb-6">
        <h2 className="font-serif text-lg font-bold text-foreground mb-3 flex items-center gap-2">
          <Wine className="h-5 w-5 text-wine-burgundy dark:text-wine-gold" />
          Wine Flight
          <span className="ml-auto text-sm font-normal text-muted">
            {event.wines.length} wines
          </span>
        </h2>

        <div className="flex flex-col gap-2">
          {event.wines.map((bw) => {
            const isCurrent = bw.position === event.currentWine;
            const isPast = bw.position < event.currentWine;

            return (
              <div
                key={bw.id}
                className={`wine-card px-4 py-3 flex items-start gap-3 transition-all ${
                  isCurrent
                    ? "ring-2 ring-wine-burgundy dark:ring-wine-gold shadow-md"
                    : ""
                } ${isPast && bw.revealed ? "opacity-70" : ""}`}
              >
                {/* Position number */}
                <div
                  className={`flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center text-sm font-bold ${
                    isCurrent
                      ? "bg-wine-burgundy text-white dark:bg-wine-gold dark:text-wine-charcoal"
                      : bw.revealed
                        ? "bg-wine-sage/20 text-wine-sage"
                        : "bg-wine-cream-dark dark:bg-wine-charcoal/40 text-muted"
                  }`}
                >
                  {bw.revealed ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    bw.position
                  )}
                </div>

                {/* Wine info -- only show details for revealed wines or to give the host context */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground truncate">
                    {bw.wine.name}
                  </p>
                  <p className="text-xs text-muted truncate">
                    {bw.wine.producer}
                    {bw.wine.vintage ? ` ${bw.wine.vintage}` : " NV"}
                  </p>
                  <p className="text-xs text-muted truncate">
                    {bw.wine.region}, {bw.wine.country} &middot;{" "}
                    <span className="capitalize">{bw.wine.type}</span>
                  </p>
                </div>

                {/* Revealed badge */}
                {bw.revealed && (
                  <span className="flex-shrink-0 text-xs font-medium text-wine-sage flex items-center gap-1">
                    <Eye className="h-3 w-3" />
                    Revealed
                  </span>
                )}
                {isCurrent && !bw.revealed && (
                  <span className="flex-shrink-0 text-xs font-semibold text-wine-burgundy dark:text-wine-gold animate-pulse">
                    Current
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* ========== LIVE GUEST SCORES / LEADERBOARD ========== */}
      {hasAnyScores && (
        <section className="mb-6">
          <h2 className="font-serif text-lg font-bold text-foreground mb-3 flex items-center gap-2">
            <Trophy className="h-5 w-5 text-wine-gold" />
            {event.status === "completed" ? "Final Scoreboard" : "Leaderboard"}
          </h2>

          <div className="wine-card divide-y divide-card-border">
            {rankedGuests.map((guest, idx) => (
              <div
                key={guest.id}
                className={`flex items-center gap-3 px-4 py-3 ${
                  idx === 0 ? "bg-wine-gold/5" : ""
                }`}
              >
                <span
                  className={`flex-shrink-0 h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold ${
                    idx === 0
                      ? "bg-wine-gold text-white"
                      : idx === 1
                        ? "bg-gray-300 text-gray-700 dark:bg-gray-600 dark:text-gray-200"
                        : idx === 2
                          ? "bg-orange-300 text-orange-800 dark:bg-orange-700 dark:text-orange-200"
                          : "bg-wine-cream-dark dark:bg-wine-charcoal/40 text-muted"
                  }`}
                >
                  {idx + 1}
                </span>
                <span className="flex-1 text-sm font-medium text-foreground truncate">
                  {guest.displayName}
                </span>
                <span className="text-sm font-bold tabular-nums text-wine-burgundy dark:text-wine-gold">
                  {guest.totalScore} pts
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ========== COMPLETED -- FINAL SCOREBOARD (no scores yet) ========== */}
      {event.status === "completed" && !hasAnyScores && (
        <section className="mb-6">
          <div className="wine-card py-10 flex flex-col items-center text-center px-4">
            <Trophy className="h-10 w-10 text-wine-gold mb-3 opacity-60" />
            <p className="font-serif text-lg font-semibold text-foreground">
              Tasting Complete
            </p>
            <p className="mt-1 text-sm text-muted">
              No scores were recorded for this event.
            </p>
          </div>
        </section>
      )}

      {/* ========== CONTROL BUTTONS (fixed bottom) ========== */}
      <div className="fixed bottom-0 inset-x-0 bg-background/95 backdrop-blur-sm border-t border-card-border px-4 pt-4 safe-bottom z-50">
        <div className="max-w-lg mx-auto pb-4 flex flex-col gap-3">
          {/* DRAFT -> Open Lobby */}
          {event.status === "draft" && (
            <button
              onClick={handleOpenLobby}
              disabled={isPending}
              className="touch-target w-full rounded-2xl bg-wine-burgundy text-white font-serif text-lg font-bold py-4 flex items-center justify-center gap-3 active:scale-[0.97] transition-transform disabled:opacity-50"
            >
              <DoorOpen className="h-6 w-6" />
              {isPending ? "Opening..." : "Open Lobby"}
            </button>
          )}

          {/* LOBBY -> Start Tasting */}
          {event.status === "lobby" && (
            <button
              onClick={handleStartTasting}
              disabled={isPending || event.wines.length === 0}
              className="touch-target w-full rounded-2xl bg-wine-burgundy text-white font-serif text-lg font-bold py-4 flex items-center justify-center gap-3 active:scale-[0.97] transition-transform disabled:opacity-50"
            >
              <Play className="h-6 w-6" />
              {isPending
                ? "Starting..."
                : `Start Tasting (${event.guests.length} guests)`}
            </button>
          )}

          {/* LIVE -> Reveal / Next / Finish */}
          {event.status === "live" && (
            <>
              {!isCurrentRevealed && event.currentWine > 0 && (
                <button
                  onClick={handleRevealWine}
                  disabled={isPending}
                  className="touch-target w-full rounded-2xl bg-wine-burgundy text-white font-serif text-lg font-bold py-4 flex items-center justify-center gap-3 active:scale-[0.97] transition-transform disabled:opacity-50"
                >
                  <Eye className="h-6 w-6" />
                  {isPending
                    ? "Revealing..."
                    : `Reveal Wine #${event.currentWine}`}
                </button>
              )}

              {isCurrentRevealed && !isLastWine && (
                <button
                  onClick={handleNextWine}
                  disabled={isPending}
                  className="touch-target w-full rounded-2xl bg-wine-burgundy text-white font-serif text-lg font-bold py-4 flex items-center justify-center gap-3 active:scale-[0.97] transition-transform disabled:opacity-50"
                >
                  <ChevronRight className="h-6 w-6" />
                  {isPending ? "Advancing..." : "Next Wine"}
                </button>
              )}

              {isCurrentRevealed && isLastWine && (
                <button
                  onClick={handleFinishTasting}
                  disabled={isPending}
                  className="touch-target w-full rounded-2xl bg-wine-burgundy text-white font-serif text-lg font-bold py-4 flex items-center justify-center gap-3 active:scale-[0.97] transition-transform disabled:opacity-50"
                >
                  <Flag className="h-6 w-6" />
                  {isPending ? "Finishing..." : "Finish Tasting"}
                </button>
              )}
            </>
          )}

          {/* COMPLETED -- no action buttons, just a subtle note */}
          {event.status === "completed" && (
            <p className="text-center text-sm text-muted py-2">
              This tasting has ended.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
