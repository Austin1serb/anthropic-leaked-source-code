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
      <div className="container-app pt-4 pb-28">
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
          <button onClick={() => { navigator.clipboard.writeText(event.joinCode!).catch(() => {}); setCopiedCode(true); setTimeout(() => setCopiedCode(false), 2000); }}
            className="wine-card flex items-center gap-3 w-full px-3.5 py-2.5 mb-4 active:scale-[0.99] transition-transform text-left">
            <div>
              <p className="text-[9px] font-bold text-muted uppercase tracking-wide">Join Code</p>
              <p className="text-[15px] font-bold font-mono tracking-widest text-foreground">{event.joinCode}</p>
            </div>
            <div className="ml-auto">
              {copiedCode ? <CheckCircle2 className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4 text-muted" />}
            </div>
          </button>
        )}

        {/* Live Stats */}
        {event.status === "live" && (
          <div className="grid grid-cols-3 gap-2 mb-4">
            {[
              [event.participants.length, "Viewers"],
              [currentGuessCount, "Guesses"],
              [`${currentWine?.position ?? event.wines.length}/${event.wines.length}`, "Wine"],
            ].map(([val, label]) => (
              <div key={String(label)} className="wine-card px-3 py-2 text-center">
                <p className="text-[15px] font-bold tabular-nums text-foreground">{val}</p>
                <p className="text-[9px] font-bold text-muted uppercase tracking-wide">{label}</p>
              </div>
            ))}
          </div>
        )}

        {/* Scheduled */}
        {event.status === "scheduled" && (
          <div className="wine-card p-5 text-center mb-4">
            <p className="text-[13px] text-muted mb-3">{event.participants.length} participants waiting</p>
            <button onClick={() => act(() => startLiveEvent(event.id))} disabled={isPending}
              className="btn-primary py-3 text-[14px] mx-auto max-w-xs">
              <Play className="h-4 w-4" /> {isPending ? "Starting..." : "Go Live"}
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
                <div key={lw.id} className={`wine-card p-3 transition-all ${isCurrent ? "ring-1.5 ring-cherry" : lw.revealed ? "opacity-50" : "opacity-25"}`}>
                  <div className="flex items-center gap-2 mb-1">
                    <div className={`h-6 w-6 rounded-lg flex items-center justify-center text-[10px] font-bold ${
                      lw.revealed ? "bg-green-50 text-green-600" : isCurrent ? "bg-cherry text-white" : "bg-card-border/30 text-muted"
                    }`}>
                      {lw.revealed ? <Check className="h-3 w-3" strokeWidth={3} /> : lw.position}
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="text-[12px] font-bold text-foreground truncate block">{lw.wine?.name ?? "Wine"}</span>
                      <span className="text-[10px] text-muted">{lw.wine?.producer}{lw.wine?.vintage ? ` \u00b7 ${lw.wine.vintage}` : ""}</span>
                    </div>
                    {isCurrent && <span className="text-[9px] font-bold text-cherry">Current</span>}
                    {lw.revealed && <span className="text-[9px] font-semibold text-green-600"><Eye className="h-2.5 w-2.5 inline" /> Revealed</span>}
                  </div>

                  {isCurrent && (
                    <div className="mt-2 space-y-1.5">
                      {revealed.map((h) => (
                        <div key={h.id} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-widget-sage/50 text-[11px]">
                          <Check className="h-3 w-3 text-green-600 flex-shrink-0" />
                          <span className="text-foreground flex-1">{h.content}</span>
                          <span className="text-[9px] text-muted capitalize">{h.hintType}</span>
                        </div>
                      ))}
                      {next && (
                        <button onClick={() => act(() => releaseHint(next.id))} disabled={isPending}
                          className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg border border-dashed border-cherry/25 text-cherry text-[11px] font-semibold active:bg-widget-wine/20 transition-colors touch-target">
                          <Sparkles className="h-3.5 w-3.5" />
                          <span className="flex-1 text-left">{isPending ? "Releasing..." : `Drop Hint #${next.position}`}</span>
                          <span className="text-[9px] text-muted max-w-[100px] truncate">{next.content}</span>
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
          <div className="wine-card p-6 text-center">
            <Trophy className="h-7 w-7 text-amber-500 mx-auto mb-2" />
            <h2 className="text-[15px] font-bold text-foreground">Tasting Complete</h2>
            <p className="text-[11px] text-muted mt-1">{event.participants.length} participants \u00b7 {event.wines.length} wines \u00b7 {event.guesses.length} guesses</p>
            <Link href="/live" className="btn-primary mt-4 inline-flex px-8 py-2.5 text-[13px]">Back to Live</Link>
          </div>
        )}
      </div>
    </div>
  );
}
