"use client";

import { useState, useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ChevronLeft, Play, Eye, Flag, Radio, Users, Wine,
  Check, Sparkles, Crown, Trophy,
} from "lucide-react";
import {
  getLiveEventById, startLiveEvent, releaseHint,
  revealLiveWine, completeLiveEvent,
} from "@/lib/liveActions";

type EventData = NonNullable<Awaited<ReturnType<typeof getLiveEventById>>>;

export function LiveHostClient({ event: initialEvent }: { event: EventData }) {
  const router = useRouter();
  const [event, setEvent] = useState(initialEvent);
  const [isPending, startTransition] = useTransition();

  // Auto-refresh
  useEffect(() => {
    if (event.status === "completed") return;
    const id = setInterval(async () => {
      const data = await getLiveEventById(event.id);
      if (data) setEvent(data);
    }, 3000);
    return () => clearInterval(id);
  }, [event.id, event.status]);

  function handleStart() {
    startTransition(async () => {
      await startLiveEvent(event.id);
      router.refresh();
      const data = await getLiveEventById(event.id);
      if (data) setEvent(data);
    });
  }

  function handleReleaseHint(hintId: string) {
    startTransition(async () => {
      await releaseHint(hintId);
      const data = await getLiveEventById(event.id);
      if (data) setEvent(data);
    });
  }

  function handleRevealWine(position: number) {
    startTransition(async () => {
      await revealLiveWine(event.id, position);
      const data = await getLiveEventById(event.id);
      if (data) setEvent(data);
    });
  }

  function handleComplete() {
    startTransition(async () => {
      await completeLiveEvent(event.id);
      const data = await getLiveEventById(event.id);
      if (data) setEvent(data);
    });
  }

  // Current wine = first unrevealed
  const currentWineIdx = event.wines.findIndex((w) => !w.revealed);
  const currentWine = currentWineIdx >= 0 ? event.wines[currentWineIdx] : null;
  const allRevealed = event.wines.every((w) => w.revealed);

  // Guess count for current wine
  const currentGuessCount = currentWine
    ? event.guesses.filter((g) => g.winePosition === currentWine.position).length
    : 0;

  return (
    <div className="min-h-dvh safe-top safe-bottom bg-background">
      <div className="container-app pt-5 pb-32">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <Link href="/live" className="inline-flex items-center gap-1 text-[13px] font-semibold text-muted touch-target">
            <ChevronLeft className="h-4 w-4" /> Back
          </Link>
          <div className="flex items-center gap-2">
            {event.status === "live" && (
              <>
                <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
                <span className="text-[12px] font-bold text-red-500 uppercase">Live</span>
              </>
            )}
            <span className="text-[12px] font-semibold text-muted flex items-center gap-1">
              <Users className="h-3.5 w-3.5" /> {event.participants.length}
            </span>
          </div>
        </div>

        <h1 className="text-[22px] font-bold text-foreground tracking-tight mb-1">{event.title}</h1>
        <p className="text-[13px] text-muted mb-6">Host Control Panel</p>

        {/* Status: Scheduled */}
        {event.status === "scheduled" && (
          <div className="wine-card p-6 text-center mb-6">
            <p className="text-[14px] text-muted mb-4">{event.participants.length} participants waiting</p>
            <button onClick={handleStart} disabled={isPending} className="btn-primary touch-target mx-auto max-w-xs">
              <Play className="h-5 w-5" /> {isPending ? "Starting..." : "Go Live"}
            </button>
          </div>
        )}

        {/* Wine flight with hints */}
        {event.status === "live" && (
          <div className="space-y-4">
            {event.wines.map((lw) => {
              const isCurrent = lw.id === currentWine?.id;
              const unreveledHints = lw.hints.filter((h) => !h.revealed);
              const revealedHints = lw.hints.filter((h) => h.revealed);
              const nextHint = unreveledHints[0];

              return (
                <div
                  key={lw.id}
                  className={`wine-card p-4 transition-all ${
                    isCurrent ? "ring-2 ring-cherry shadow-md" : lw.revealed ? "opacity-50" : "opacity-30"
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className={`h-8 w-8 rounded-xl flex items-center justify-center text-[12px] font-bold ${
                        lw.revealed ? "bg-green-50 text-green-600" : isCurrent ? "bg-cherry text-white" : "bg-card-border/30 text-muted"
                      }`}>
                        {lw.revealed ? <Check className="h-4 w-4" strokeWidth={3} /> : lw.position}
                      </div>
                      <div>
                        <span className="text-[14px] font-bold text-foreground">{lw.wine?.name ?? "Wine"}</span>
                        <p className="text-[11px] text-muted">{lw.wine?.producer}{lw.wine?.vintage ? ` · ${lw.wine.vintage}` : ""}</p>
                      </div>
                    </div>
                    {isCurrent && (
                      <span className="text-[11px] font-bold text-cherry animate-pulse">Current</span>
                    )}
                    {lw.revealed && (
                      <span className="text-[11px] font-semibold text-green-600 flex items-center gap-1">
                        <Eye className="h-3 w-3" /> Revealed
                      </span>
                    )}
                  </div>

                  {/* Hints */}
                  {isCurrent && (
                    <div className="space-y-2 mt-3">
                      {/* Released hints */}
                      {revealedHints.map((h) => (
                        <div key={h.id} className="flex items-center gap-2 px-3 py-2 rounded-xl bg-widget-sage/50">
                          <Check className="h-3.5 w-3.5 text-green-600 flex-shrink-0" />
                          <span className="text-[12px] text-foreground flex-1">{h.content}</span>
                          <span className="text-[10px] text-muted capitalize">{h.hintType}</span>
                        </div>
                      ))}

                      {/* Next hint to release */}
                      {nextHint && (
                        <button
                          onClick={() => handleReleaseHint(nextHint.id)}
                          disabled={isPending}
                          className="w-full flex items-center gap-2 px-3 py-3 rounded-xl border-2 border-dashed border-cherry/30 text-cherry font-semibold text-[13px] active:bg-widget-wine/30 transition-colors touch-target"
                        >
                          <Sparkles className="h-4 w-4" />
                          {isPending ? "Releasing..." : `Drop Hint #${nextHint.position}: "${nextHint.content}"`}
                        </button>
                      )}

                      {/* Unrevealed hints remaining */}
                      {unreveledHints.length > 1 && (
                        <p className="text-[11px] text-muted text-center">
                          {unreveledHints.length - 1} more hint{unreveledHints.length > 2 ? "s" : ""} remaining
                        </p>
                      )}

                      {/* Reveal wine button */}
                      <div className="pt-2 flex items-center justify-between">
                        <span className="text-[12px] text-muted">
                          {currentGuessCount} guesses submitted
                        </span>
                        <button
                          onClick={() => handleRevealWine(lw.position)}
                          disabled={isPending}
                          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-cherry text-white text-[13px] font-semibold active:scale-95 transition-transform disabled:opacity-50 touch-target"
                        >
                          <Eye className="h-4 w-4" /> {isPending ? "Revealing..." : "Reveal Wine"}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}

            {/* Finish button */}
            {allRevealed && (
              <button onClick={handleComplete} disabled={isPending} className="btn-primary w-full touch-target mt-4">
                <Flag className="h-5 w-5" /> {isPending ? "Finishing..." : "End Tasting"}
              </button>
            )}
          </div>
        )}

        {/* Completed */}
        {event.status === "completed" && (
          <div className="wine-card p-8 text-center">
            <div className="h-16 w-16 rounded-3xl widget-gold flex items-center justify-center mx-auto mb-4">
              <Trophy className="h-8 w-8 text-amber-600" />
            </div>
            <h2 className="text-[18px] font-bold text-foreground">Tasting Complete</h2>
            <p className="text-[13px] text-muted mt-1">{event.participants.length} participants · {event.wines.length} wines</p>
            <Link href="/live" className="btn-primary mt-6 inline-flex touch-target px-8">
              Back to Live Events
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
