"use client";

import { useState, useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ChevronLeft, Play, Eye, Flag, Users, Wine,
  Check, Sparkles, Trophy, Copy, CheckCircle2, BarChart3,
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
  const [copiedCode, setCopiedCode] = useState(false);

  useEffect(() => {
    if (event.status === "completed") return;
    const id = setInterval(async () => {
      const d = await getLiveEventById(event.id); if (d) setEvent(d);
    }, 3000);
    return () => clearInterval(id);
  }, [event.id, event.status]);

  const act = (fn: () => Promise<void>) => startTransition(async () => { await fn(); const d = await getLiveEventById(event.id); if (d) setEvent(d); });

  const currentWine = event.wines.find((w) => !w.revealed) ?? null;
  const allRevealed = event.wines.every((w) => w.revealed);
  const currentGuessCount = currentWine ? event.guesses.filter((g) => g.winePosition === currentWine.position).length : 0;

  return (
    <div className="min-h-dvh safe-top safe-bottom bg-background">
      <div className="px-5 pt-5 pb-32">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <Link href="/live" className="inline-flex items-center gap-1 text-[11px] font-semibold text-muted touch-target">
            <ChevronLeft className="h-3.5 w-3.5" /> Back
          </Link>
          <div className="flex items-center gap-2">
            {event.status === "live" && (
              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-red-500 uppercase">
                <span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse" /> Live
              </span>
            )}
            <span className="text-[11px] font-semibold text-muted"><Users className="h-3 w-3 inline -mt-px" /> {event.participants.length}</span>
          </div>
        </div>

        <h1 className="text-[16px] font-bold text-foreground tracking-tight">{event.title}</h1>
        <p className="text-[11px] text-muted mb-4">Host Control Panel</p>

        {/* Join Code */}
        {event.joinCode && (
          <button
            onClick={copyJoinCode}
            className="bg-white rounded-[14px] border border-card-border/60 flex items-center gap-3 w-full px-4 py-3 mb-5 hover:opacity-95 transition-transform"
          >
            <div className="flex-1 text-left">
              <p className="label">Join Code</p>
              <p className="text-[18px] font-bold font-mono tracking-widest text-foreground mt-1">{event.joinCode}</p>
            </div>
          </button>
        )}

        {/* Live Stats */}
        {event.status === "live" && (
          <div className="grid grid-cols-3 gap-3 mb-5">
            <div className="bg-white rounded-[14px] border border-card-border/60 p-3 text-center">
              <p className="text-[20px] font-bold tabular-nums text-foreground">{event.participants.length}</p>
              <p className="label mt-1">Viewers</p>
            </div>
            <div className="bg-white rounded-[14px] border border-card-border/60 p-3 text-center">
              <p className="text-[20px] font-bold tabular-nums text-foreground">{currentGuessCount}</p>
              <p className="label mt-1">Guesses</p>
            </div>
            <div className="bg-white rounded-[14px] border border-card-border/60 p-3 text-center">
              <p className="text-[20px] font-bold tabular-nums text-foreground">
                {currentWine?.position ?? event.wines.length}/{event.wines.length}
              </p>
              <p className="label mt-1">Wine</p>
            </div>
          </div>
        )}

        {/* Scheduled */}
        {event.status === "scheduled" && (
          <div className="bg-white rounded-[14px] border border-card-border/60 p-6 text-center mb-6">
            <p className="text-[14px] text-muted mb-4">{event.participants.length} participants waiting</p>
            <button onClick={handleStart} disabled={isPending} className="btn-primary touch-target mx-auto max-w-xs">
              <Play className="h-5 w-5" /> {isPending ? "Starting..." : "Go Live"}
            </button>
          </div>
        )}

        {/* Wine flight */}
        {event.status === "live" && (
          <div className="space-y-2">
            {/* Progress */}
            <div className="flex gap-1 mb-1">
              {event.wines.map((w) => (
                <div key={w.id} className="flex-1 h-1 rounded-full transition-all duration-500"
                  style={{
                    background: w.revealed ? "var(--cherry)" : w.id === currentWine?.id ? "var(--cherry-light)" : "var(--card-border)",
                    opacity: w.revealed ? 1 : w.id === currentWine?.id ? 0.6 : 0.2,
                  }} />
              ))}
            </div>

            {event.wines.map((lw) => {
              const isCurrent = lw.id === currentWine?.id;
              const unrevealed = lw.hints.filter((h) => !h.revealed);
              const revealed = lw.hints.filter((h) => h.revealed);
              const next = unrevealed[0];
              const gc = event.guesses.filter((g) => g.winePosition === lw.position).length;

              return (
                <div
                  key={lw.id}
                  className={`bg-white rounded-[14px] border border-card-border/60 p-4 transition-all ${
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
                        <p className="text-[11px] text-muted">{lw.wine?.producer}{lw.wine?.vintage ? ` \u00b7 ${lw.wine.vintage}` : ""}</p>
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="text-[12px] font-bold text-foreground truncate block">{lw.wine?.name ?? "Wine"}</span>
                      <span className="text-[10px] text-muted">{lw.wine?.producer}{lw.wine?.vintage ? ` \u00b7 ${lw.wine.vintage}` : ""}</span>
                    </div>
                    {isCurrent && <span className="text-[9px] font-bold text-cherry">Current</span>}
                    {lw.revealed && <span className="text-[9px] font-semibold text-green-600"><Eye className="h-2.5 w-2.5 inline" /> Revealed</span>}
                  </div>

                  {isCurrent && (
                    <div className="space-y-2 mt-3">
                      {revealedHints.map((h) => (
                        <div key={h.id} className="flex items-center gap-2 px-3 py-2 rounded-xl bg-bg-emerald-50/50">
                          <Check className="h-3.5 w-3.5 text-green-600 flex-shrink-0" />
                          <span className="text-[12px] text-foreground flex-1">{h.content}</span>
                          <span className="text-[10px] text-muted capitalize">{h.hintType}</span>
                        </div>
                      ))}

                      {nextHint && (
                        <button
                          onClick={() => handleReleaseHint(nextHint.id)}
                          disabled={isPending}
                          className="w-full flex items-center gap-2 px-3 py-3 rounded-xl border-2 border-dashed border-cherry/30 text-cherry font-semibold text-[13px] active:bg-bg-cherry/8/30 transition-colors touch-target"
                        >
                          <Sparkles className="h-4 w-4" />
                          <span className="flex-1 text-left">
                            {isPending ? "Releasing..." : `Drop Hint #${nextHint.position}`}
                          </span>
                          <span className="text-[11px] text-muted max-w-[120px] truncate">
                            &ldquo;{nextHint.content}&rdquo;
                          </span>
                        </button>
                      )}
                      {unrevealed.length > 1 && <p className="text-[9px] text-muted text-center">{unrevealed.length - 1} more hint{unrevealed.length > 2 ? "s" : ""}</p>}
                      <div className="flex items-center justify-between pt-1">
                        <span className="text-[10px] text-muted"><BarChart3 className="h-3 w-3 inline -mt-px" /> {gc} guesses</span>
                        <button onClick={() => act(() => revealLiveWine(event.id, lw.position))} disabled={isPending}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-cherry text-white text-[11px] font-semibold active:scale-95 transition-transform disabled:opacity-50 touch-target">
                          <Eye className="h-3 w-3" /> {isPending ? "..." : "Reveal"}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}

            {allRevealed && (
              <button onClick={() => act(() => completeLiveEvent(event.id))} disabled={isPending}
                className="btn-primary w-full py-3 text-[14px] mt-2">
                <Flag className="h-4 w-4" /> {isPending ? "Finishing..." : "End Tasting"}
              </button>
            )}
          </div>
        )}

        {/* Completed */}
        {event.status === "completed" && (
          <div className="bg-white rounded-[14px] border border-card-border/60 p-8 text-center">
            <div className="h-16 w-16 rounded-3xl bg-amber-50 flex items-center justify-center mx-auto mb-4">
              <Trophy className="h-8 w-8 text-amber-600" />
            </div>
            <h2 className="text-[18px] font-bold text-foreground">Tasting Complete</h2>
            <div className="flex items-center justify-center gap-4 mt-3 mb-6">
              <div className="text-center">
                <p className="text-[18px] font-bold tabular-nums text-foreground">{event.participants.length}</p>
                <p className="label mt-0.5">Participants</p>
              </div>
              <div className="h-6 w-px bg-card-border" />
              <div className="text-center">
                <p className="text-[18px] font-bold tabular-nums text-foreground">{event.wines.length}</p>
                <p className="label mt-0.5">Wines</p>
              </div>
              <div className="h-6 w-px bg-card-border" />
              <div className="text-center">
                <p className="text-[18px] font-bold tabular-nums text-foreground">{totalGuesses}</p>
                <p className="label mt-0.5">Guesses</p>
              </div>
            </div>
            <Link href="/live" className="btn-primary mt-6 inline-flex touch-target px-8">
              Back to Live Events
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
