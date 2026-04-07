"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import {
  Copy,
  QrCode,
  Play,
  Eye,
  ChevronRight,
  ChevronLeft,
  Trophy,
  Users,
  Wine,
  Check,
  DoorOpen,
  Flag,
  Crown,
  Plus,
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
  } | null;
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

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  draft: { label: "Draft", color: "text-muted", bg: "bg-card-border/30" },
  lobby: { label: "Lobby Open", color: "text-amber-700", bg: "widget-gold" },
  live: { label: "Live", color: "text-green-700", bg: "widget-sage" },
  revealing: { label: "Revealing", color: "text-purple-700", bg: "widget-lavender" },
  completed: { label: "Completed", color: "text-muted", bg: "bg-card-border/30" },
};

function StatusBadge({ status }: { status: string }) {
  const config = STATUS_CONFIG[status] ?? STATUS_CONFIG.draft;
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-[12px] font-bold ${config.bg} ${config.color}`}>
      {status === "live" && <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />}
      {config.label}
    </span>
  );
}

// ============ GUEST SCORES HELPERS ============

function computeGuestScores(guests: Guest[], guesses: Guess[]) {
  const scoreMap = new Map<string, number>();
  for (const guess of guesses) {
    scoreMap.set(guess.guestId, (scoreMap.get(guess.guestId) ?? 0) + guess.score);
  }
  return guests
    .map((g) => ({ id: g.id, displayName: g.displayName, totalScore: scoreMap.get(g.id) ?? 0 }))
    .sort((a, b) => b.totalScore - a.totalScore);
}

// ============ MAIN COMPONENT ============

export function EventControlClient({ event }: EventControlClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => router.refresh(), 5000);
    return () => clearInterval(interval);
  }, [router]);

  function refreshAfterAction() { router.refresh(); }

  function handleOpenLobby() {
    startTransition(async () => { await updateEventStatus(event.id, "lobby"); refreshAfterAction(); });
  }
  function handleStartTasting() {
    startTransition(async () => { await updateEventStatus(event.id, "live"); await advanceWine(event.id); refreshAfterAction(); });
  }
  function handleRevealWine() {
    startTransition(async () => {
      await revealWine(event.id, event.currentWine);
      // Score all guesses (may already be scored, but re-scoring is safe)
      try { await scoreEvent(event.id); } catch { /* scoring error — will retry on finish */ }
      refreshAfterAction();
    });
  }
  function handleNextWine() {
    startTransition(async () => { await advanceWine(event.id); refreshAfterAction(); });
  }
  function handleFinishTasting() {
    startTransition(async () => {
      // Final scoring pass before completing — catches any missed guesses
      try { await scoreEvent(event.id); } catch { /* best effort */ }
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
    const url = `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(event.joinCode)}`;
    window.open(url, "_blank");
  }

  const currentWineObj = event.wines.find((w) => w.position === event.currentWine);
  const isCurrentRevealed = currentWineObj?.revealed ?? false;
  const isLastWine = event.currentWine >= event.wines.length;
  const rankedGuests = computeGuestScores(event.guests, event.guesses);
  const hasAnyScores = event.guesses.some((g) => g.score > 0);

  const MEDAL_COLORS = [
    "bg-amber-400 text-white",
    "bg-gray-300 text-gray-700",
    "bg-orange-300 text-orange-800",
  ];

  return (
    <div className="min-h-screen pb-36 pt-6 safe-top bg-background">
      <div className="max-w-lg mx-auto px-5">
        {/* ========== HEADER ========== */}
        <header className="mb-6">
          <Link
            href="/arena"
            className="inline-flex items-center gap-1 text-[13px] font-semibold text-muted mb-3 active:text-foreground transition-colors touch-target"
          >
            <ChevronLeft className="h-4 w-4" />
            Tastings
          </Link>
          <div className="flex items-start justify-between gap-3 mb-5">
            <h1 className="text-2xl font-bold text-foreground tracking-tight leading-tight flex-1">
              {event.title}
            </h1>
            <StatusBadge status={event.status} />
          </div>

          {/* Join Code card */}
          <div className="wine-card p-6 flex flex-col items-center gap-4">
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-muted">
              Join Code
            </p>
            <p className="font-mono text-5xl sm:text-6xl font-black tracking-[0.3em] text-cherry select-all leading-none">
              {event.joinCode}
            </p>
            <div className="flex items-center gap-2.5">
              <button
                onClick={handleCopyCode}
                className="touch-target inline-flex items-center gap-2 rounded-xl bg-widget-wine px-4 py-2.5 text-[13px] font-semibold text-foreground active:scale-95 transition-transform"
              >
                {copied ? <><Check className="h-4 w-4 text-green-600" /> Copied!</> : <><Copy className="h-4 w-4" /> Copy</>}
              </button>
              <button
                onClick={handleShareQR}
                className="touch-target inline-flex items-center gap-2 rounded-xl bg-widget-sky px-4 py-2.5 text-[13px] font-semibold text-foreground active:scale-95 transition-transform"
              >
                <QrCode className="h-4 w-4" /> Share QR
              </button>
            </div>
          </div>
        </header>

        {/* ========== GUEST LIST ========== */}
        <section className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <div className="h-7 w-7 rounded-lg widget-sage flex items-center justify-center">
              <Users className="h-3.5 w-3.5 text-emerald-700" />
            </div>
            <h2 className="text-[15px] font-bold text-foreground">Guests</h2>
            <span className="ml-auto text-[13px] font-semibold text-muted">{event.guests.length}</span>
          </div>

          {event.guests.length === 0 ? (
            <div className="wine-card py-10 flex flex-col items-center text-center px-4">
              <div className="h-12 w-12 rounded-2xl widget-sage flex items-center justify-center mb-3">
                <Users className="h-6 w-6 text-emerald-700/30" />
              </div>
              <p className="text-[13px] text-muted">No guests yet. Share the join code.</p>
            </div>
          ) : (
            <div className="wine-card divide-y divide-card-border/40">
              {event.guests.map((guest) => (
                <div key={guest.id} className="flex items-center gap-3 px-4 py-3">
                  <div className="h-9 w-9 rounded-xl widget-wine flex items-center justify-center text-[13px] font-bold text-cherry">
                    {guest.displayName.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-[14px] font-medium text-foreground">{guest.displayName}</span>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* ========== WINE FLIGHT ========== */}
        <section className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <div className="h-7 w-7 rounded-lg widget-wine flex items-center justify-center">
              <Wine className="h-3.5 w-3.5 text-cherry" />
            </div>
            <h2 className="text-[15px] font-bold text-foreground">Wine Flight</h2>
            <span className="ml-auto text-[13px] font-semibold text-muted">{event.wines.length} wines</span>
          </div>

          <div className="space-y-2">
            {event.wines.map((bw) => {
              const isCurrent = bw.position === event.currentWine;
              const isPast = bw.position < event.currentWine;
              const typeColor =
                bw.wine?.type.toLowerCase() === "red" ? "bg-red-500" :
                bw.wine?.type.toLowerCase() === "white" ? "bg-amber-200" :
                bw.wine?.type.toLowerCase() === "rosé" ? "bg-pink-300" : "bg-gray-300";

              return (
                <div
                  key={bw.id}
                  className={`wine-card px-4 py-3.5 flex items-center gap-3 transition-all ${
                    isCurrent ? "ring-2 ring-cherry shadow-md" : ""
                  } ${isPast && bw.revealed ? "opacity-60" : ""}`}
                >
                  <div className={`flex-shrink-0 h-9 w-9 rounded-xl flex items-center justify-center text-[13px] font-bold ${
                    isCurrent
                      ? "bg-cherry text-white"
                      : bw.revealed
                        ? "bg-green-50 text-green-600"
                        : "bg-card-border/30 text-muted"
                  }`}>
                    {bw.revealed ? <Check className="h-4 w-4" strokeWidth={3} /> : bw.position}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <div className={`h-2.5 w-2.5 rounded-full ${typeColor} flex-shrink-0`} />
                      <p className="text-[14px] font-semibold text-foreground truncate">{bw.wine?.name ?? "Unknown"}</p>
                    </div>
                    <p className="text-[11px] text-muted truncate mt-0.5">
                      {bw.wine?.producer}{bw.wine?.vintage ? ` ${bw.wine.vintage}` : " NV"} · {bw.wine?.region}, {bw.wine?.country}
                    </p>
                  </div>

                  {bw.revealed && (
                    <span className="flex-shrink-0 text-[11px] font-semibold text-green-600 flex items-center gap-1">
                      <Eye className="h-3 w-3" /> Revealed
                    </span>
                  )}
                  {isCurrent && !bw.revealed && (
                    <span className="flex-shrink-0 text-[11px] font-bold text-cherry animate-pulse">Current</span>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* ========== LEADERBOARD ========== */}
        {hasAnyScores && (
          <section className="mb-6">
            <div className="flex items-center gap-2 mb-3">
              <div className="h-7 w-7 rounded-lg widget-gold flex items-center justify-center">
                <Trophy className="h-3.5 w-3.5 text-amber-700" />
              </div>
              <h2 className="text-[15px] font-bold text-foreground">
                {event.status === "completed" ? "Final Scoreboard" : "Leaderboard"}
              </h2>
            </div>

            <div className="wine-card divide-y divide-card-border/40">
              {rankedGuests.map((guest, idx) => (
                <div key={guest.id} className={`flex items-center gap-3 px-4 py-3 ${idx === 0 ? "bg-widget-gold/30" : ""}`}>
                  <div className={`flex-shrink-0 h-8 w-8 rounded-xl flex items-center justify-center text-[12px] font-bold ${
                    idx < 3 ? MEDAL_COLORS[idx] : "bg-card-border/30 text-muted"
                  }`}>
                    {idx === 0 ? <Crown className="h-3.5 w-3.5" /> : idx + 1}
                  </div>
                  <span className="flex-1 text-[14px] font-medium text-foreground truncate">
                    {guest.displayName}
                  </span>
                  <span className="text-[14px] font-bold tabular-nums text-cherry">
                    {guest.totalScore} pts
                  </span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Completed — no scores */}
        {event.status === "completed" && !hasAnyScores && (
          <section className="mb-6">
            <div className="wine-card py-10 flex flex-col items-center text-center px-4">
              <div className="h-14 w-14 rounded-2xl widget-gold flex items-center justify-center mb-3">
                <Trophy className="h-7 w-7 text-amber-600/40" />
              </div>
              <p className="text-[16px] font-bold text-foreground">Tasting Complete</p>
              <p className="mt-1 text-[13px] text-muted">No scores were recorded.</p>
            </div>
          </section>
        )}
      </div>

      {/* ========== CONTROL BUTTONS (fixed bottom) ========== */}
      <div className="fixed bottom-0 inset-x-0 glass-card border-t border-card-border/30 safe-bottom z-50">
        <div className="max-w-lg mx-auto px-5 py-4 flex flex-col gap-3">
          {event.status === "draft" && (
            <button onClick={handleOpenLobby} disabled={isPending} className="btn-primary touch-target">
              <DoorOpen className="h-5 w-5" />
              {isPending ? "Opening..." : "Open Lobby"}
            </button>
          )}

          {event.status === "lobby" && (
            <button onClick={handleStartTasting} disabled={isPending || event.wines.length === 0} className="btn-primary touch-target">
              <Play className="h-5 w-5" />
              {isPending ? "Starting..." : `Start Tasting (${event.guests.length} guests)`}
            </button>
          )}

          {event.status === "live" && (
            <>
              {!isCurrentRevealed && event.currentWine > 0 && (
                <button onClick={handleRevealWine} disabled={isPending} className="btn-primary touch-target">
                  <Eye className="h-5 w-5" />
                  {isPending ? "Revealing..." : `Reveal Wine #${event.currentWine}`}
                </button>
              )}
              {isCurrentRevealed && !isLastWine && (
                <button onClick={handleNextWine} disabled={isPending} className="btn-primary touch-target">
                  <ChevronRight className="h-5 w-5" />
                  {isPending ? "Advancing..." : "Next Wine"}
                </button>
              )}
              {isCurrentRevealed && isLastWine && (
                <button onClick={handleFinishTasting} disabled={isPending} className="btn-primary touch-target">
                  <Flag className="h-5 w-5" />
                  {isPending ? "Finishing..." : "Finish Tasting"}
                </button>
              )}
            </>
          )}

          {event.status === "completed" && (
            <div className="flex gap-3">
              <Link href="/arena" className="btn-secondary flex-1 touch-target">
                <ChevronLeft className="h-4 w-4" />
                Dashboard
              </Link>
              <Link href="/arena/create" className="btn-primary flex-1 touch-target">
                <Plus className="h-4 w-4" />
                New Tasting
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
