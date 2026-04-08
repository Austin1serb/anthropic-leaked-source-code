"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition, useRef } from "react";
import Link from "next/link";
import QRCode from "qrcode";
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
  X,
  Download,
  Share2,
  Link as LinkIcon,
} from "lucide-react";
import {
  updateEventStatus,
  advanceWine,
  revealWine,
  scoreEvent,
} from "@/lib/actions";
import { decodeHtmlEntities } from "@/lib/importers/normalize";

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
    <span className={`inline-flex items-center gap-1.5 rounded-[8px] px-3 py-1.5 text-[12px] font-bold ${config.bg} ${config.color}`}>
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
  const [showQR, setShowQR] = useState(false);
  const qrCanvasRef = useRef<HTMLCanvasElement>(null);

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

  async function handleShowQR() {
    setShowQR(true);
    // Wait for canvas to mount, then render QR
    setTimeout(async () => {
      if (!qrCanvasRef.current) return;
      const joinUrl = `${window.location.origin}/join/${event.joinCode}`;
      const canvas = qrCanvasRef.current;
      await QRCode.toCanvas(canvas, joinUrl, {
        width: 240,
        margin: 2,
        color: { dark: "#6B0F18", light: "#FAF6EF" },
        errorCorrectionLevel: "M",
      });
    }, 50);
  }

  function handleDownloadQR() {
    if (!qrCanvasRef.current) return;
    // Create a branded image with logo + code
    const exportCanvas = document.createElement("canvas");
    exportCanvas.width = 400;
    exportCanvas.height = 520;
    const ctx = exportCanvas.getContext("2d");
    if (!ctx) return;

    // Background
    ctx.fillStyle = "#FAF6EF";
    ctx.fillRect(0, 0, 400, 520);

    // Header
    ctx.fillStyle = "#6B0F18";
    ctx.font = "bold 24px 'DM Sans', system-ui";
    ctx.textAlign = "center";
    ctx.fillText("Winebob", 200, 48);

    // QR code
    ctx.drawImage(qrCanvasRef.current, 80, 70, 240, 240);

    // Join code
    ctx.fillStyle = "#6B0F18";
    ctx.font = "bold 40px 'DM Sans', monospace";
    ctx.letterSpacing = "8px";
    ctx.fillText(event.joinCode, 200, 360);

    // Event title
    ctx.fillStyle = "#8E8278";
    ctx.font = "500 16px 'DM Sans', system-ui";
    ctx.letterSpacing = "0px";
    ctx.fillText(event.title, 200, 400);

    // URL
    ctx.fillStyle = "#B8AFA6";
    ctx.font = "14px 'DM Sans', system-ui";
    ctx.fillText("winebob.vercel.app", 200, 480);

    // Download
    const link = document.createElement("a");
    link.download = `winebob-${event.joinCode}.png`;
    link.href = exportCanvas.toDataURL("image/png");
    link.click();
  }

  const currentWineObj = event.wines.find((w) => w.position === event.currentWine);
  const isCurrentRevealed = currentWineObj?.revealed ?? false;
  const isLastWine = event.currentWine >= event.wines.length;
  const rankedGuests = computeGuestScores(event.guests, event.guesses);
  const hasAnyScores = event.guesses.some((g) => g.score > 0);

  // Guests who have submitted for current wine
  const guestsWhoGuessed = new Set(
    event.guesses
      .filter((g) => g.winePosition === event.currentWine)
      .map((g) => g.guestId)
  );
  const guessCount = guestsWhoGuessed.size;

  const MEDAL_COLORS = [
    "bg-amber-400 text-white",
    "bg-gray-300 text-gray-700",
    "bg-orange-300 text-orange-800",
  ];

  return (
    <div className="min-h-screen pb-36 pt-6 safe-top bg-background">
      <div className="px-4 md:px-8 lg:px-10">
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

          {/* Join Code hero card */}
          <div className="rounded-[20px] bg-gradient-to-br from-cherry to-cherry/90 p-6 flex flex-col items-center gap-4 shadow-[0_2px_8px_rgba(0,0,0,0.06),0_0_1px_rgba(0,0,0,0.04)]">
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-white/70">
              Join Code
            </p>
            <p className="font-mono text-5xl sm:text-6xl font-black tracking-[0.3em] text-white select-all leading-none nums">
              {event.joinCode}
            </p>
            {event.guests.length > 0 && (
              <p className="text-[13px] font-semibold text-white/60 nums">
                {event.guests.length} participant{event.guests.length !== 1 ? "s" : ""} joined
              </p>
            )}
            <div className="flex items-center gap-2.5">
              <button
                onClick={handleCopyCode}
                className="touch-target inline-flex items-center gap-2 rounded-[12px] bg-white/20 px-4 py-2.5 text-[13px] font-semibold text-white active:scale-95 transition-transform"
              >
                {copied ? <><Check className="h-4 w-4 text-green-300" /> Copied!</> : <><Copy className="h-4 w-4" /> Copy</>}
              </button>
              <button
                onClick={handleShowQR}
                className="touch-target inline-flex items-center gap-2 rounded-[12px] bg-white/20 px-4 py-2.5 text-[13px] font-semibold text-white active:scale-95 transition-transform"
              >
                <QrCode className="h-4 w-4" /> Share QR
              </button>
            </div>
          </div>
        </header>

        {/* ========== GUEST LIST + WINE FLIGHT — 2 col on desktop ========== */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* ========== GUEST LIST ========== */}
          <section>
            <div className="flex items-center gap-2 mb-3">
              <div className="h-7 w-7 rounded-[8px] widget-sage flex items-center justify-center">
                <Users className="h-3.5 w-3.5 text-emerald-700" />
              </div>
              <h2 className="text-[15px] font-bold text-foreground">Guests</h2>
              <span className="ml-auto text-[13px] font-semibold text-muted nums">{event.guests.length}</span>
            </div>

            {event.guests.length === 0 ? (
              <div className="bg-white rounded-[16px] border border-card-border/40 shadow-[0_2px_8px_rgba(0,0,0,0.06),0_0_1px_rgba(0,0,0,0.04)] py-10 flex flex-col items-center text-center px-4">
                <div className="h-12 w-12 rounded-[16px] widget-sage flex items-center justify-center mb-3">
                  <Users className="h-6 w-6 text-emerald-700/30" />
                </div>
                <p className="text-[13px] text-muted">No guests yet. Share the join code.</p>
              </div>
            ) : (
              <>
                {/* Guess progress indicator (only during live tasting) */}
                {event.status === "live" && event.currentWine > 0 && !isCurrentRevealed && (
                  <div className="mb-2 px-1">
                    <p className="text-[12px] font-semibold text-muted nums">
                      <span className="text-cherry font-bold">{guessCount}</span> of {event.guests.length} guessed
                    </p>
                  </div>
                )}
                <div className="bg-white rounded-[16px] border border-card-border/40 shadow-[0_2px_8px_rgba(0,0,0,0.06),0_0_1px_rgba(0,0,0,0.04)] divide-y divide-card-border/40">
                  {event.guests.map((guest) => {
                    const hasGuessed = guestsWhoGuessed.has(guest.id);
                    return (
                      <div key={guest.id} className="flex items-center gap-3 px-4 py-3">
                        <div className="relative">
                          <div className="h-9 w-9 rounded-[8px] widget-wine flex items-center justify-center text-[13px] font-bold text-cherry">
                            {guest.displayName.charAt(0).toUpperCase()}
                          </div>
                          {event.status === "live" && event.currentWine > 0 && !isCurrentRevealed && hasGuessed && (
                            <div className="absolute -top-0.5 -right-0.5 h-3 w-3 rounded-full bg-green-500 border-2 border-white" />
                          )}
                        </div>
                        <span className="text-[14px] font-medium text-foreground">{guest.displayName}</span>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </section>

          {/* ========== WINE FLIGHT ========== */}
          <section>
            <div className="flex items-center gap-2 mb-3">
              <div className="h-7 w-7 rounded-[8px] widget-wine flex items-center justify-center">
                <Wine className="h-3.5 w-3.5 text-cherry" />
              </div>
              <h2 className="text-[15px] font-bold text-foreground">Wine Flight</h2>
              <span className="ml-auto text-[13px] font-semibold text-muted nums">{event.wines.length} wines</span>
            </div>

            <div className="space-y-2">
              {event.wines.map((bw) => {
                const isCurrent = bw.position === event.currentWine;
                const isPast = bw.position < event.currentWine;
                const typeColor =
                  bw.wine?.type.toLowerCase() === "red" ? "bg-red-500" :
                  bw.wine?.type.toLowerCase() === "white" ? "bg-amber-200" :
                  bw.wine?.type.toLowerCase() === "rosé" ? "bg-pink-300" :
                  bw.wine?.type.toLowerCase() === "sparkling" ? "bg-yellow-300" :
                  bw.wine?.type.toLowerCase() === "orange" ? "bg-orange-300" :
                  bw.wine?.type.toLowerCase() === "dessert" ? "bg-amber-300" : "bg-gray-300";

                return (
                  <div
                    key={bw.id}
                    className={`bg-white rounded-[16px] border border-card-border/40 shadow-[0_2px_8px_rgba(0,0,0,0.06),0_0_1px_rgba(0,0,0,0.04)] px-4 py-3.5 flex items-center gap-3 transition-all ${
                      isCurrent ? "ring-2 ring-cherry shadow-md border-l-4 border-l-cherry" : ""
                    } ${isPast && bw.revealed ? "opacity-60" : ""}`}
                  >
                    <div className={`flex-shrink-0 h-9 w-9 rounded-[8px] flex items-center justify-center text-[13px] font-bold nums ${
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
                        <p className="text-[14px] font-semibold font-serif text-foreground truncate">{decodeHtmlEntities(bw.wine?.name ?? "Unknown")}</p>
                      </div>
                      <p className="text-[11px] text-muted truncate mt-0.5">
                        {decodeHtmlEntities(bw.wine?.producer ?? "")}{bw.wine?.vintage ? <span className="nums"> {bw.wine.vintage}</span> : " NV"} · {bw.wine?.region}, {bw.wine?.country}
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
        </div>

        {/* ========== LEADERBOARD ========== */}
        {hasAnyScores && (
          <section className="mb-6">
            <div className="flex items-center gap-2 mb-3">
              <div className="h-7 w-7 rounded-[8px] widget-gold flex items-center justify-center">
                <Trophy className="h-3.5 w-3.5 text-amber-700" />
              </div>
              <h2 className="text-[15px] font-bold text-foreground">
                {event.status === "completed" ? "Final Scoreboard" : "Leaderboard"}
              </h2>
            </div>

            <div className="bg-white rounded-[16px] border border-card-border/40 shadow-[0_2px_8px_rgba(0,0,0,0.06),0_0_1px_rgba(0,0,0,0.04)] overflow-hidden">
              {/* Table header */}
              <div className="flex items-center gap-3 px-4 py-2.5 border-b border-card-border/40 bg-card-border/10">
                <span className="flex-shrink-0 w-8 text-[11px] font-bold text-muted uppercase tracking-wider">#</span>
                <span className="flex-1 text-[11px] font-bold text-muted uppercase tracking-wider">Guest</span>
                <span className="text-[11px] font-bold text-muted uppercase tracking-wider">Score</span>
              </div>
              {rankedGuests.map((guest, idx) => (
                <div key={guest.id} className={`flex items-center gap-3 px-4 py-3 ${idx === 0 ? "bg-widget-gold/30" : ""} ${idx < rankedGuests.length - 1 ? "border-b border-card-border/20" : ""}`}>
                  <div className={`flex-shrink-0 h-8 w-8 rounded-[8px] flex items-center justify-center text-[12px] font-bold ${
                    idx < 3 ? MEDAL_COLORS[idx] : "bg-card-border/30 text-muted"
                  }`}>
                    {idx === 0 ? <Crown className="h-3.5 w-3.5" /> : idx + 1}
                  </div>
                  <span className="flex-1 text-[14px] font-medium text-foreground truncate">
                    {guest.displayName}
                  </span>
                  <span className="text-[14px] font-bold nums text-cherry">
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
            <div className="bg-white rounded-[16px] border border-card-border/40 shadow-[0_2px_8px_rgba(0,0,0,0.06),0_0_1px_rgba(0,0,0,0.04)] py-10 flex flex-col items-center text-center px-4">
              <div className="h-14 w-14 rounded-[16px] widget-gold flex items-center justify-center mb-3">
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
        <div className="px-4 md:px-8 lg:px-10 py-4 flex flex-col gap-3">
          {event.status === "draft" && (
            <button onClick={handleOpenLobby} disabled={isPending} className="btn-primary w-full rounded-[12px] touch-target">
              <DoorOpen className="h-5 w-5" />
              {isPending ? "Opening..." : "Open Lobby"}
            </button>
          )}

          {event.status === "lobby" && (
            <button onClick={handleStartTasting} disabled={isPending || event.wines.length === 0} className="btn-primary w-full rounded-[12px] touch-target">
              <Play className="h-5 w-5" />
              {isPending ? "Starting..." : `Start Tasting (${event.guests.length} guest${event.guests.length !== 1 ? "s" : ""})`}
            </button>
          )}

          {event.status === "live" && (
            <>
              {!isCurrentRevealed && event.currentWine > 0 && (
                <button onClick={handleRevealWine} disabled={isPending} className="btn-primary w-full rounded-[12px] touch-target">
                  <Eye className="h-5 w-5" />
                  {isPending ? "Revealing..." : `Reveal Wine #${event.currentWine} of ${event.wines.length}`}
                </button>
              )}
              {isCurrentRevealed && !isLastWine && (
                <button onClick={handleNextWine} disabled={isPending} className="btn-primary w-full rounded-[12px] touch-target">
                  <ChevronRight className="h-5 w-5" />
                  {isPending ? "Advancing..." : `Next Wine (${event.currentWine + 1} of ${event.wines.length})`}
                </button>
              )}
              {isCurrentRevealed && isLastWine && (
                <button onClick={handleFinishTasting} disabled={isPending} className="btn-primary w-full rounded-[12px] touch-target">
                  <Flag className="h-5 w-5" />
                  {isPending ? "Finishing..." : "Finish Tasting"}
                </button>
              )}
            </>
          )}

          {event.status === "completed" && (
            <div className="flex gap-3">
              <Link href="/arena" className="btn-secondary flex-1 rounded-[12px] touch-target">
                <ChevronLeft className="h-4 w-4" />
                Dashboard
              </Link>
              <Link href="/arena/create" className="btn-primary flex-1 rounded-[12px] touch-target">
                <Plus className="h-4 w-4" />
                New Tasting
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* ========== QR CODE MODAL ========== */}
      {showQR && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setShowQR(false)}>
          <div className="bg-white rounded-[16px] border border-card-border/40 shadow-[0_2px_8px_rgba(0,0,0,0.06),0_0_1px_rgba(0,0,0,0.04)] p-8 max-w-[340px] w-full mx-4 text-center animate-scale-in relative" onClick={(e) => e.stopPropagation()}>
            {/* Close */}
            <button onClick={() => setShowQR(false)} className="absolute top-4 right-4 h-8 w-8 rounded-[8px] bg-card-border/20 flex items-center justify-center touch-target">
              <X className="h-4 w-4 text-stone" />
            </button>

            {/* Logo */}
            <p className="heading-md text-cherry mb-1">Winebob</p>
            <p className="caption mb-5">Scan to join this tasting</p>

            {/* QR Canvas */}
            <div className="flex justify-center mb-5">
              <div className="p-4 rounded-[16px]" style={{ background: "#FAF6EF" }}>
                <canvas ref={qrCanvasRef} />
              </div>
            </div>

            {/* Join code */}
            <p className="font-mono text-3xl font-black tracking-[0.25em] text-cherry mb-1">
              {event.joinCode}
            </p>
            <p className="caption mb-5">{event.title}</p>

            {/* Actions */}
            <div className="space-y-2">
              <button
                onClick={() => {
                  const url = `${window.location.origin}/join/${event.joinCode}`;
                  navigator.clipboard.writeText(url);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2000);
                }}
                className="btn-primary w-full rounded-[12px] touch-target"
              >
                <LinkIcon className="h-4 w-4" />
                {copied ? "Link Copied!" : "Copy Join Link"}
              </button>
              <div className="flex gap-2">
                <button onClick={handleDownloadQR} className="btn-secondary flex-1 rounded-[12px] touch-target">
                  <Download className="h-4 w-4" />
                  Save Image
                </button>
                <button
                  onClick={async () => {
                    const url = `${window.location.origin}/join/${event.joinCode}`;
                    if (navigator.share) {
                      try { await navigator.share({ title: `Join "${event.title}" on Winebob`, text: `Join code: ${event.joinCode}`, url }); } catch {}
                    } else {
                      navigator.clipboard.writeText(url);
                      setCopied(true);
                      setTimeout(() => setCopied(false), 2000);
                    }
                  }}
                  className="btn-secondary flex-1 rounded-[12px] touch-target"
                >
                  <Share2 className="h-4 w-4" />
                  Share
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
