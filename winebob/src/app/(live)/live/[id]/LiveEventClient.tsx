"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Radio, ChevronLeft, Users, Wine, Clock, Check, Send,
  Loader2, Trophy, Crown, Sparkles, Eye, BadgeCheck, Zap,
} from "lucide-react";
import { getLiveEventById, submitLiveGuess, getCrowdStats, joinLiveEvent } from "@/lib/liveActions";

type EventData = NonNullable<Awaited<ReturnType<typeof getLiveEventById>>>;

const POLL_INTERVAL = 2000;
const REACTIONS = ["\ud83c\udf77", "\ud83d\udd25", "\ud83e\udd2f", "\ud83d\udc4f", "\u2764\ufe0f", "\ud83e\udd14"];

function FloatingReaction({ emoji, id }: { emoji: string; id: number }) {
  return (
    <div key={id} className="absolute pointer-events-none text-[20px]"
      style={{ bottom: 0, left: `${20 + Math.random() * 60}%`, animation: "floatUp 2s ease-out forwards", opacity: 0 }}>
      {emoji}
    </div>
  );
}

function FlightProgress({ wines, current }: { wines: EventData["wines"]; current: number }) {
  return (
    <div className="flex gap-1">
      {wines.map((w) => (
        <div key={w.id} className="flex-1 h-1 rounded-full transition-all duration-500"
          style={{
            background: w.revealed ? "var(--cherry)" : w.position === current ? "var(--cherry-light)" : "var(--card-border)",
            opacity: w.revealed ? 1 : w.position === current ? 0.6 : 0.2,
          }} />
      ))}
    </div>
  );
}

export function LiveEventClient({ event: initialEvent }: { event: EventData }) {
  const [event, setEvent] = useState(initialEvent);
  const [participantId, setParticipantId] = useState<string | null>(null);
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [joined, setJoined] = useState(false);
  const [joinName, setJoinName] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [joinError, setJoinError] = useState("");
  const [form, setForm] = useState({ grape: "", region: "", country: "", vintage: "", producer: "", type: "", notes: "" });
  const [submitting, setSubmitting] = useState(false);
  const [guessSubmitted, setGuessSubmitted] = useState(false);
  const [crowd, setCrowd] = useState<{ stats: Record<string, Record<string, number>>; totalGuesses: number } | null>(null);
  const [floatingReactions, setFloatingReactions] = useState<{ id: number; emoji: string }[]>([]);
  const reactionCounter = useRef(0);

  const currentWineIdx = event.wines.findIndex((w) => !w.revealed);
  const currentWine = currentWineIdx >= 0 ? event.wines[currentWineIdx] : null;
  const lastRevealed = [...event.wines].reverse().find((w) => w.revealed);
  const revealedHints = currentWine?.hints.filter((h) => h.revealed) ?? [];
  const sommelier = event.sommelier;

  useEffect(() => {
    const pid = localStorage.getItem(`live-${event.id}-pid`);
    const tok = localStorage.getItem(`live-${event.id}-token`);
    if (pid && tok) { setParticipantId(pid); setSessionToken(tok); setJoined(true); }
  }, [event.id]);

  const fetchEvent = useCallback(async () => {
    try { const d = await getLiveEventById(event.id); if (d) setEvent(d); } catch {}
  }, [event.id]);

  useEffect(() => {
    if (event.status !== "live" && event.status !== "scheduled") return;
    const id = setInterval(fetchEvent, POLL_INTERVAL);
    return () => clearInterval(id);
  }, [fetchEvent, event.status]);

  useEffect(() => {
    if (!currentWine || !event.showCrowdStats) return;
    getCrowdStats(event.id, currentWine.position).then(setCrowd).catch(() => {});
  }, [event.id, currentWine?.position, event.showCrowdStats, guessSubmitted]);

  const prevWineRef = useRef(currentWine?.position);
  useEffect(() => {
    if (currentWine?.position !== prevWineRef.current) {
      prevWineRef.current = currentWine?.position;
      setForm({ grape: "", region: "", country: "", vintage: "", producer: "", type: "", notes: "" });
      setGuessSubmitted(false);
    }
  }, [currentWine?.position]);

  useEffect(() => {
    const c = setInterval(() => setFloatingReactions((p) => p.slice(-8)), 3000);
    return () => clearInterval(c);
  }, []);

  function addReaction(emoji: string) {
    reactionCounter.current += 1;
    setFloatingReactions((p) => [...p, { id: reactionCounter.current, emoji }]);
  }

  async function handleJoin() {
    if (!joinName.trim()) { setJoinError("Name is required"); return; }
    setJoinError("");
    try {
      const r = await joinLiveEvent({ eventId: event.id, displayName: joinName.trim(), joinCode: event.isPublic ? undefined : joinCode.toUpperCase() });
      setParticipantId(r.participantId); setSessionToken(r.sessionToken); setJoined(true);
      localStorage.setItem(`live-${event.id}-pid`, r.participantId);
      localStorage.setItem(`live-${event.id}-token`, r.sessionToken);
    } catch (err) { setJoinError(err instanceof Error ? err.message : "Failed to join"); }
  }

  async function handleSubmitGuess() {
    if (!participantId || !sessionToken || !currentWine) return;
    setSubmitting(true);
    try {
      await submitLiveGuess({
        eventId: event.id, participantId, sessionToken, winePosition: currentWine.position,
        guessedGrape: form.grape || undefined, guessedRegion: form.region || undefined,
        guessedCountry: form.country || undefined, guessedVintage: form.vintage ? parseInt(form.vintage, 10) : undefined,
        guessedProducer: form.producer || undefined, guessedType: form.type || undefined, notes: form.notes || undefined,
      });
      setGuessSubmitted(true);
    } catch {}
    setSubmitting(false);
  }

  // ============ JOIN SCREEN ============
  if (!joined) {
    return (
      <div className="min-h-dvh flex flex-col bg-background safe-top safe-bottom">
        <div className="px-5 pt-4">
          <Link href="/live" className="inline-flex items-center gap-1 text-[11px] font-semibold text-muted touch-target">
            <ChevronLeft className="h-3.5 w-3.5" /> Back
          </Link>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center px-5">
          <div className="w-full max-w-sm">
            {event.status === "live" && (
              <div className="flex items-center justify-center gap-1.5 mb-4">
                <span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse" />
                <span className="text-[10px] font-bold text-red-500 uppercase tracking-wider">Live Now</span>
              </div>
            )}
            <div className="text-center mb-5">
              <div className="flex items-center justify-center gap-2 mb-3">
                <div className="h-8 w-8 rounded-full widget-wine flex items-center justify-center text-[11px] font-bold text-cherry">
                  {sommelier.displayName.charAt(0)}
                </div>
                <span className="text-[13px] font-semibold text-foreground">{sommelier.displayName}</span>
                {sommelier.verified && <BadgeCheck className="h-3 w-3 text-cherry" />}
              </div>
              <h1 className="text-[18px] font-bold text-foreground tracking-tight">{event.title}</h1>
              {event.description && <p className="text-[12px] text-muted mt-1">{event.description}</p>}
              <div className="flex items-center justify-center gap-3 mt-2 text-[11px] text-muted font-semibold">
                <span><Wine className="h-3 w-3 inline -mt-px" /> {event.wines.length} wines</span>
                <span><Users className="h-3 w-3 inline -mt-px" /> {event.participants.length} joined</span>
              </div>
            </div>
            <div className="wine-card p-4">
              <input type="text" value={joinName} onChange={(e) => setJoinName(e.target.value)}
                placeholder="Your name" className="input-field w-full mb-2 text-[14px]"
                onKeyDown={(e) => e.key === "Enter" && handleJoin()} />
              {!event.isPublic && (
                <input type="text" value={joinCode} onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                  placeholder="Join code" className="input-field w-full mb-2 text-center font-mono font-bold tracking-widest text-[14px]" />
              )}
              {joinError && <p className="text-red-500 text-[12px] mb-2">{joinError}</p>}
              <button onClick={handleJoin} className="btn-primary w-full text-[14px] py-3">
                Join Tasting
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ============ SCHEDULED ============
  if (event.status === "scheduled") {
    const date = new Date(event.scheduledAt);
    return (
      <div className="min-h-dvh flex flex-col items-center justify-center bg-background safe-top safe-bottom px-5">
        <Clock className="h-8 w-8 text-muted/40 mb-3 animate-pulse" />
        <h1 className="text-[16px] font-bold text-foreground text-center">{event.title}</h1>
        <p className="text-[12px] text-muted mt-1">
          {date.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
        </p>
        <p className="text-[16px] font-bold text-cherry mt-0.5">
          {date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
        </p>
        <p className="text-[11px] text-muted mt-4">{event.participants.length} waiting</p>
      </div>
    );
  }

  // ============ COMPLETED ============
  if (event.status === "completed") {
    const scoreMap = new Map<string, number>();
    for (const g of event.guesses) scoreMap.set(g.participantId, (scoreMap.get(g.participantId) ?? 0) + (g.score ?? 0));
    const ranked = event.participants.map((p) => ({ ...p, totalScore: scoreMap.get(p.id) ?? 0 })).sort((a, b) => b.totalScore - a.totalScore);
    const MEDALS = ["bg-amber-400 text-white", "bg-gray-300 text-gray-700", "bg-orange-300 text-orange-800"];

    return (
      <div className="min-h-dvh safe-top safe-bottom bg-background">
        <div className="container-app pt-5 pb-28">
          <Link href="/live" className="inline-flex items-center gap-1 text-[11px] font-semibold text-muted mb-4 touch-target">
            <ChevronLeft className="h-3.5 w-3.5" /> Back
          </Link>
          <div className="text-center mb-5">
            <Trophy className="h-7 w-7 text-amber-500 mx-auto mb-2" />
            <h1 className="text-[16px] font-bold text-foreground">Tasting Complete</h1>
            <p className="text-[12px] text-muted">{event.title}</p>
            <div className="flex items-center justify-center gap-5 mt-3 text-[11px]">
              <span><span className="font-bold text-foreground text-[15px]">{event.wines.length}</span> <span className="text-muted">wines</span></span>
              <span><span className="font-bold text-foreground text-[15px]">{ranked.length}</span> <span className="text-muted">tasters</span></span>
              <span><span className="font-bold text-foreground text-[15px]">{event.guesses.length}</span> <span className="text-muted">guesses</span></span>
            </div>
          </div>
          <div className="wine-card divide-y divide-card-border/40">
            {ranked.slice(0, 20).map((p, i) => (
              <div key={p.id} className={`flex items-center gap-3 px-3.5 py-2.5 ${p.id === participantId ? "bg-widget-wine/30" : ""}`}>
                <div className={`h-7 w-7 rounded-lg flex items-center justify-center text-[11px] font-bold flex-shrink-0 ${i < 3 ? MEDALS[i] : "bg-card-border/30 text-muted"}`}>
                  {i === 0 ? <Crown className="h-3.5 w-3.5" /> : i + 1}
                </div>
                <span className={`text-[13px] font-semibold flex-1 truncate ${p.id === participantId ? "text-cherry" : "text-foreground"}`}>
                  {p.displayName}{p.id === participantId ? " (you)" : ""}
                </span>
                <span className="text-[13px] font-bold tabular-nums text-foreground">{p.totalScore}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ============ LIVE ============
  return (
    <div className="min-h-dvh flex flex-col bg-background safe-top safe-bottom">
      {/* Header */}
      <div className="px-4 py-2.5 flex items-center justify-between border-b border-card-border/30">
        <Link href="/live" className="touch-target"><ChevronLeft className="h-4 w-4 text-muted" /></Link>
        <div className="flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse" />
          <span className="text-[10px] font-bold text-red-500 uppercase tracking-wider">Live</span>
        </div>
        <span className="text-[11px] font-semibold text-muted"><Users className="h-3 w-3 inline -mt-px" /> {event.participants.length}</span>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="container-app py-3">
          {/* Sommelier + progress */}
          <div className="flex items-center gap-2 mb-2">
            <div className="h-5 w-5 rounded-full widget-wine flex items-center justify-center text-[8px] font-bold text-cherry">
              {sommelier.displayName.charAt(0)}
            </div>
            <span className="text-[11px] font-semibold text-muted">{sommelier.displayName}</span>
            {sommelier.verified && <BadgeCheck className="h-2.5 w-2.5 text-cherry" />}
            <span className="ml-auto text-[10px] font-bold text-muted uppercase tracking-wide">
              Wine {currentWine?.position ?? "?"}/{event.wines.length}
            </span>
          </div>
          <FlightProgress wines={event.wines} current={currentWine?.position ?? 0} />

          {/* Latest hint */}
          {revealedHints.length > 0 && (
            <div className="mt-3 mb-3 animate-scale-in">
              <div className="rounded-xl bg-cherry-gradient px-4 py-3 text-white">
                <div className="flex items-center gap-1.5 mb-1">
                  <Sparkles className="h-3 w-3 text-white/50" />
                  <span className="text-[9px] font-bold uppercase tracking-widest text-white/50">
                    Hint {revealedHints.length}
                  </span>
                  <span className="text-[9px] font-semibold capitalize text-white/30 ml-auto">
                    {revealedHints[revealedHints.length - 1].hintType}
                  </span>
                </div>
                <p className="text-[14px] font-bold leading-snug">{revealedHints[revealedHints.length - 1].content}</p>
              </div>
            </div>
          )}

          {/* Previous hints */}
          {revealedHints.length > 1 && (
            <div className="space-y-1 mb-3">
              {revealedHints.slice(0, -1).reverse().map((h) => (
                <div key={h.id} className="flex items-start gap-2 px-3 py-2 rounded-lg bg-card-bg border border-card-border">
                  <span className="text-[9px] font-bold text-muted">{h.position}</span>
                  <p className="text-[12px] text-muted flex-1">{h.content}</p>
                  <span className="text-[9px] text-muted/40 capitalize">{h.hintType}</span>
                </div>
              ))}
            </div>
          )}

          {/* Crowd stats */}
          {event.showCrowdStats && crowd && crowd.totalGuesses > 0 && (
            <div className="rounded-xl border border-card-border p-3 mb-3">
              <div className="flex items-center gap-1.5 mb-2">
                <Users className="h-3 w-3 text-muted" />
                <span className="text-[10px] font-bold text-muted uppercase tracking-wide">Crowd Pulse</span>
                <span className="text-[9px] text-muted ml-auto">{crowd.totalGuesses} guesses</span>
              </div>
              <div className="space-y-2">
                {Object.entries(crowd.stats).map(([field, values]) => (
                  <div key={field}>
                    <span className="text-[9px] font-bold text-muted uppercase capitalize">{field}</span>
                    <div className="flex gap-1 mt-0.5 flex-wrap">
                      {Object.entries(values).slice(0, 3).map(([val, pct]) => (
                        <span key={val} className="px-1.5 py-0.5 rounded bg-widget-lavender text-[10px] font-semibold text-purple-700">
                          {val} <span className="text-purple-400">{pct}%</span>
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Last revealed */}
          {lastRevealed?.revealed && lastRevealed.wine && (
            <div className="rounded-xl border border-card-border p-3 mb-3 border-l-3 border-l-green-500">
              <div className="flex items-center gap-1.5 mb-1">
                <Eye className="h-3 w-3 text-green-600" />
                <span className="text-[10px] font-bold text-green-600 uppercase">Wine #{lastRevealed.position} Revealed</span>
              </div>
              <p className="text-[13px] font-bold text-foreground">{lastRevealed.wine.name}</p>
              <p className="text-[11px] text-muted">
                {[lastRevealed.wine.producer, lastRevealed.wine.vintage, [lastRevealed.wine.region, lastRevealed.wine.country].filter(Boolean).join(", ")].filter(Boolean).join(" \u00b7 ")}
              </p>
            </div>
          )}

          {/* Waiting */}
          {currentWine && revealedHints.length === 0 && (
            <div className="rounded-xl border border-card-border py-8 text-center mb-3">
              <Loader2 className="h-5 w-5 text-cherry animate-spin mx-auto mb-2" />
              <p className="text-[13px] font-semibold text-foreground">Sommelier is tasting...</p>
              <p className="text-[11px] text-muted">Hints will appear here</p>
            </div>
          )}

          {/* Reactions float area */}
          <div className="relative" style={{ minHeight: 28 }}>
            {floatingReactions.map((r) => <FloatingReaction key={r.id} emoji={r.emoji} id={r.id} />)}
          </div>
        </div>
      </div>

      {/* Bottom: Reactions + Guess */}
      <div className="border-t border-card-border/30 bg-card-bg safe-bottom">
        <div className="container-app pt-2 pb-1 flex gap-1.5">
          {REACTIONS.map((e) => (
            <button key={e} onClick={() => addReaction(e)}
              className="h-8 w-8 rounded-lg flex items-center justify-center text-[16px] active:scale-90 transition-transform bg-card-border/15">
              {e}
            </button>
          ))}
        </div>
        {currentWine && !currentWine.revealed && (
          <div className="container-app py-2">
            {guessSubmitted && (
              <p className="text-[10px] font-semibold text-green-600 text-center mb-1.5">
                <Check className="h-3 w-3 inline -mt-px" /> Submitted — update anytime
              </p>
            )}
            <div className="flex gap-1.5 mb-1.5">
              <input type="text" value={form.grape} onChange={(e) => setForm((f) => ({ ...f, grape: e.target.value }))}
                placeholder="Grape" className="input-field flex-1 py-1.5 px-2.5 text-[12px] rounded-lg" />
              <input type="text" value={form.region} onChange={(e) => setForm((f) => ({ ...f, region: e.target.value }))}
                placeholder="Region" className="input-field flex-1 py-1.5 px-2.5 text-[12px] rounded-lg" />
            </div>
            <div className="flex gap-1.5">
              <input type="text" value={form.country} onChange={(e) => setForm((f) => ({ ...f, country: e.target.value }))}
                placeholder="Country" className="input-field flex-1 py-1.5 px-2.5 text-[12px] rounded-lg" />
              <input type="text" value={form.vintage} onChange={(e) => setForm((f) => ({ ...f, vintage: e.target.value }))}
                placeholder="Year" className="input-field w-16 py-1.5 px-2 text-[12px] text-center rounded-lg" />
              <button onClick={handleSubmitGuess} disabled={submitting}
                className="h-[34px] w-[34px] rounded-lg bg-cherry text-white flex items-center justify-center flex-shrink-0 active:scale-90 transition-transform disabled:opacity-50">
                {submitting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
