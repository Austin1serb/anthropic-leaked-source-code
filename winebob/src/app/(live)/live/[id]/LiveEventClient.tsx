"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Radio, ChevronLeft, Users, Wine, Clock, Check, Send,
  Loader2, Trophy, Crown, Sparkles, Eye, BadgeCheck,
  Grape, MapPin, Globe, Tag,
} from "lucide-react";
import { getLiveEventById, submitLiveGuess, getCrowdStats, joinLiveEvent } from "@/lib/liveActions";

type EventData = NonNullable<Awaited<ReturnType<typeof getLiveEventById>>>;
type LiveWineWithDetails = EventData["wines"][number];

const POLL_INTERVAL = 2000;

// ============ MAIN COMPONENT ============

export function LiveEventClient({ event: initialEvent }: { event: EventData }) {
  const router = useRouter();
  const [event, setEvent] = useState(initialEvent);
  const [participantId, setParticipantId] = useState<string | null>(null);
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [joined, setJoined] = useState(false);
  const [joinName, setJoinName] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [joinError, setJoinError] = useState("");

  // Guess form
  const [form, setForm] = useState({ grape: "", region: "", country: "", vintage: "", producer: "", type: "", notes: "" });
  const [submitting, setSubmitting] = useState(false);
  const [guessSubmitted, setGuessSubmitted] = useState(false);

  // Crowd stats
  const [crowd, setCrowd] = useState<{ stats: Record<string, Record<string, number>>; totalGuesses: number } | null>(null);

  // Current wine tracking
  const currentWineIdx = event.wines.findIndex((w) => !w.revealed);
  const currentWine = currentWineIdx >= 0 ? event.wines[currentWineIdx] : null;
  const lastRevealed = [...event.wines].reverse().find((w) => w.revealed);
  const revealedHints = currentWine?.hints.filter((h) => h.revealed) ?? [];

  // Check localStorage for existing session
  useEffect(() => {
    const storedPid = localStorage.getItem(`live-${event.id}-pid`);
    const storedToken = localStorage.getItem(`live-${event.id}-token`);
    if (storedPid && storedToken) {
      setParticipantId(storedPid);
      setSessionToken(storedToken);
      setJoined(true);
    }
  }, [event.id]);

  // Polling
  const fetchEvent = useCallback(async () => {
    try {
      const data = await getLiveEventById(event.id);
      if (data) setEvent(data);
    } catch { /* silent */ }
  }, [event.id]);

  useEffect(() => {
    if (event.status !== "live" && event.status !== "scheduled") return;
    const id = setInterval(fetchEvent, POLL_INTERVAL);
    return () => clearInterval(id);
  }, [fetchEvent, event.status]);

  // Fetch crowd stats for current wine
  useEffect(() => {
    if (!currentWine || !event.showCrowdStats) return;
    getCrowdStats(event.id, currentWine.position).then(setCrowd).catch(() => {});
  }, [event.id, currentWine?.position, event.showCrowdStats, guessSubmitted]);

  // Reset form on wine change
  const prevWineRef = useRef(currentWine?.position);
  useEffect(() => {
    if (currentWine?.position !== prevWineRef.current) {
      prevWineRef.current = currentWine?.position;
      setForm({ grape: "", region: "", country: "", vintage: "", producer: "", type: "", notes: "" });
      setGuessSubmitted(false);
    }
  }, [currentWine?.position]);

  // ---- Join handler ----
  async function handleJoin() {
    if (!joinName.trim()) { setJoinError("Name is required"); return; }
    setJoinError("");
    try {
      const result = await joinLiveEvent({
        eventId: event.id,
        displayName: joinName.trim(),
        joinCode: event.isPublic ? undefined : joinCode.toUpperCase(),
      });
      setParticipantId(result.participantId);
      setSessionToken(result.sessionToken);
      setJoined(true);
      localStorage.setItem(`live-${event.id}-pid`, result.participantId);
      localStorage.setItem(`live-${event.id}-token`, result.sessionToken);
    } catch (err) {
      setJoinError(err instanceof Error ? err.message : "Failed to join");
    }
  }

  // ---- Submit guess ----
  async function handleSubmitGuess() {
    if (!participantId || !sessionToken || !currentWine) return;
    setSubmitting(true);
    try {
      await submitLiveGuess({
        eventId: event.id,
        participantId,
        sessionToken,
        winePosition: currentWine.position,
        guessedGrape: form.grape || undefined,
        guessedRegion: form.region || undefined,
        guessedCountry: form.country || undefined,
        guessedVintage: form.vintage ? parseInt(form.vintage, 10) : undefined,
        guessedProducer: form.producer || undefined,
        guessedType: form.type || undefined,
        notes: form.notes || undefined,
      });
      setGuessSubmitted(true);
    } catch { /* silent */ }
    setSubmitting(false);
  }

  const sommelier = event.sommelier;

  // ============ NOT JOINED — Join screen ============
  if (!joined) {
    return (
      <div className="min-h-dvh flex flex-col bg-background safe-top safe-bottom">
        <div className="px-5 pt-5">
          <Link href="/live" className="inline-flex items-center gap-1 text-[13px] font-semibold text-muted touch-target">
            <ChevronLeft className="h-4 w-4" /> Back
          </Link>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center px-6">
          <div className="w-full max-w-sm text-center animate-fade-in-up">
            {/* Sommelier */}
            <div className="flex items-center justify-center gap-2 mb-4">
              <div className="h-10 w-10 rounded-full widget-wine flex items-center justify-center text-[14px] font-bold text-cherry">
                {sommelier.displayName.charAt(0)}
              </div>
              <span className="text-[14px] font-semibold text-foreground">{sommelier.displayName}</span>
              {sommelier.verified && <BadgeCheck className="h-4 w-4 text-cherry" />}
            </div>

            <h1 className="text-[24px] font-bold text-foreground tracking-tight mb-2">{event.title}</h1>
            {event.description && <p className="text-[14px] text-muted mb-6">{event.description}</p>}

            <div className="flex items-center justify-center gap-4 mb-8 text-[12px] text-muted font-semibold">
              <span className="flex items-center gap-1"><Wine className="h-3.5 w-3.5" /> {event.wines.length} wines</span>
              <span className="flex items-center gap-1"><Users className="h-3.5 w-3.5" /> {event.participants.length} joined</span>
            </div>

            {/* Join form */}
            <div className="wine-card p-5 text-left">
              <input
                type="text"
                value={joinName}
                onChange={(e) => setJoinName(e.target.value)}
                placeholder="Your name"
                className="input-field w-full mb-3 touch-target"
              />
              {!event.isPublic && (
                <input
                  type="text"
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                  placeholder="Join code"
                  className="input-field w-full mb-3 touch-target text-center font-mono font-bold tracking-widest"
                />
              )}
              {joinError && <p className="text-red-500 text-[13px] mb-3">{joinError}</p>}
              <button onClick={handleJoin} className="btn-primary w-full touch-target">
                <Radio className="h-4 w-4" /> Join Live Tasting
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ============ SCHEDULED — Waiting ============
  if (event.status === "scheduled") {
    const date = new Date(event.scheduledAt);
    return (
      <div className="min-h-dvh flex flex-col items-center justify-center bg-hero-gradient safe-top safe-bottom px-6">
        <div className="h-20 w-20 rounded-3xl widget-lavender flex items-center justify-center mb-6">
          <Clock className="h-10 w-10 text-purple-600 animate-pulse" />
        </div>
        <h1 className="text-[24px] font-bold text-foreground tracking-tight text-center">{event.title}</h1>
        <p className="text-[16px] text-muted mt-2">Starts {date.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}</p>
        <p className="text-[20px] font-bold text-cherry mt-1">{date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}</p>
        <p className="text-[13px] text-muted mt-6">{event.participants.length} people waiting</p>
      </div>
    );
  }

  // ============ COMPLETED — Scoreboard ============
  if (event.status === "completed") {
    const scoreMap = new Map<string, number>();
    for (const g of event.guesses) {
      scoreMap.set(g.participantId, (scoreMap.get(g.participantId) ?? 0) + (g.score ?? 0));
    }
    const ranked = event.participants
      .map((p) => ({ ...p, totalScore: scoreMap.get(p.id) ?? 0 }))
      .sort((a, b) => b.totalScore - a.totalScore);

    const MEDALS = ["bg-amber-400 text-white", "bg-gray-300 text-gray-700", "bg-orange-300 text-orange-800"];

    return (
      <div className="min-h-dvh safe-top safe-bottom bg-hero-gradient">
        <div className="container-app pt-8 pb-28">
          <Link href="/live" className="inline-flex items-center gap-1 text-[13px] font-semibold text-muted mb-6 touch-target">
            <ChevronLeft className="h-4 w-4" /> Back to Live
          </Link>

          <div className="text-center mb-8 animate-fade-in-up">
            <div className="h-20 w-20 rounded-3xl widget-gold flex items-center justify-center mx-auto mb-5 animate-cheers">
              <Trophy className="h-10 w-10 text-amber-600" />
            </div>
            <h1 className="text-[24px] font-bold text-foreground tracking-tight">Tasting Complete!</h1>
            <p className="text-muted mt-1">{event.title}</p>
          </div>

          <div className="wine-card divide-y divide-card-border/40">
            {ranked.slice(0, 20).map((p, i) => (
              <div key={p.id} className={`flex items-center gap-3.5 px-4 py-3.5 ${
                p.id === participantId ? "bg-widget-wine/30" : ""
              }`}>
                <div className={`h-9 w-9 rounded-xl flex items-center justify-center text-[13px] font-bold flex-shrink-0 ${
                  i < 3 ? MEDALS[i] : "bg-card-border/30 text-muted"
                }`}>
                  {i === 0 ? <Crown className="h-4 w-4" /> : i + 1}
                </div>
                <span className={`text-[14px] font-semibold flex-1 truncate ${
                  p.id === participantId ? "text-cherry" : "text-foreground"
                }`}>
                  {p.displayName}{p.id === participantId ? " (you)" : ""}
                </span>
                <span className="text-[15px] font-bold tabular-nums text-foreground">{p.totalScore}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ============ LIVE — Main experience ============
  return (
    <div className="min-h-dvh flex flex-col bg-background safe-top safe-bottom">
      {/* Header */}
      <div className="px-5 pt-4 pb-3 flex items-center justify-between border-b border-card-border/30">
        <Link href="/live" className="touch-target">
          <ChevronLeft className="h-5 w-5 text-muted" />
        </Link>
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
          <span className="text-[12px] font-bold text-red-500 uppercase tracking-wider">Live</span>
        </div>
        <span className="text-[12px] font-semibold text-muted flex items-center gap-1">
          <Users className="h-3.5 w-3.5" /> {event.participants.length}
        </span>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="container-app py-4">
          {/* Sommelier + event title */}
          <div className="flex items-center gap-2 mb-1">
            <div className="h-6 w-6 rounded-full widget-wine flex items-center justify-center text-[9px] font-bold text-cherry">
              {sommelier.displayName.charAt(0)}
            </div>
            <span className="text-[12px] font-semibold text-muted">{sommelier.displayName}</span>
            {sommelier.verified && <BadgeCheck className="h-3 w-3 text-cherry" />}
          </div>
          <h2 className="text-[13px] font-bold text-muted uppercase tracking-widest mb-4">
            Wine {currentWine?.position ?? "?"} of {event.wines.length}
          </h2>

          {/* Latest hint — prominent */}
          {revealedHints.length > 0 && (
            <div className="mb-4 animate-scale-in">
              <div className="rounded-[24px] bg-cherry-gradient p-5 text-white">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="h-4 w-4 text-white/60" />
                  <span className="text-[11px] font-bold uppercase tracking-widest text-white/60">
                    Hint #{revealedHints.length}
                  </span>
                </div>
                <p className="text-[18px] font-bold leading-snug">
                  {revealedHints[revealedHints.length - 1].content}
                </p>
              </div>
            </div>
          )}

          {/* Previous hints — collapsed */}
          {revealedHints.length > 1 && (
            <div className="space-y-2 mb-5 stagger-children">
              {revealedHints.slice(0, -1).reverse().map((hint) => (
                <div key={hint.id} className="wine-card px-4 py-3 flex items-start gap-3">
                  <span className="text-[11px] font-bold text-muted mt-0.5">#{hint.position}</span>
                  <p className="text-[13px] text-muted flex-1">{hint.content}</p>
                  <span className="text-[10px] font-semibold text-muted/50 capitalize flex-shrink-0">{hint.hintType}</span>
                </div>
              ))}
            </div>
          )}

          {/* Crowd stats */}
          {event.showCrowdStats && crowd && crowd.totalGuesses > 0 && (
            <div className="wine-card p-4 mb-5">
              <div className="flex items-center gap-2 mb-3">
                <Users className="h-3.5 w-3.5 text-muted" />
                <span className="text-[11px] font-bold text-muted uppercase tracking-wide">
                  Crowd Pulse · {crowd.totalGuesses} guesses
                </span>
              </div>
              <div className="space-y-2.5">
                {Object.entries(crowd.stats).map(([field, values]) => (
                  <div key={field}>
                    <span className="text-[10px] font-bold text-muted uppercase tracking-wide capitalize">{field}</span>
                    <div className="flex gap-1.5 mt-1 flex-wrap">
                      {Object.entries(values).slice(0, 3).map(([val, pct]) => (
                        <span key={val} className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-widget-lavender text-[11px] font-semibold text-purple-700">
                          {val} <span className="text-purple-400">{pct}%</span>
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Last revealed wine (if any) */}
          {lastRevealed?.revealed && lastRevealed.wine && (
            <div className="wine-card p-4 mb-5 border-l-4 border-green-500">
              <div className="flex items-center gap-2 mb-2">
                <Eye className="h-4 w-4 text-green-600" />
                <span className="text-[11px] font-bold text-green-600 uppercase tracking-wide">
                  Wine #{lastRevealed.position} Revealed
                </span>
              </div>
              <h3 className="text-[16px] font-bold text-foreground">{lastRevealed.wine.name}</h3>
              <p className="text-[12px] text-muted mt-0.5">
                {[lastRevealed.wine.producer, lastRevealed.wine.vintage ? String(lastRevealed.wine.vintage) : "", [lastRevealed.wine.region, lastRevealed.wine.country].filter(Boolean).join(", ")].filter(Boolean).join(" · ")}
              </p>
            </div>
          )}

          {/* No hints yet */}
          {currentWine && revealedHints.length === 0 && (
            <div className="wine-card flex flex-col items-center justify-center py-12 text-center mb-5">
              <Loader2 className="h-6 w-6 text-cherry animate-spin mb-3" />
              <p className="text-[14px] font-semibold text-foreground">Sommelier is tasting...</p>
              <p className="text-[12px] text-muted mt-1">Hints will appear here</p>
            </div>
          )}
        </div>
      </div>

      {/* Sticky guess form */}
      {currentWine && !currentWine.revealed && (
        <div className="border-t border-card-border/30 bg-card-bg safe-bottom">
          <div className="container-app py-3">
            {guessSubmitted ? (
              <div className="flex items-center justify-center gap-2 py-2 text-[13px] font-semibold text-green-600">
                <Check className="h-4 w-4" /> Guess submitted — you can update anytime
              </div>
            ) : null}
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={form.grape}
                onChange={(e) => setForm((f) => ({ ...f, grape: e.target.value }))}
                placeholder="Grape"
                className="input-field flex-1 py-2 text-[13px]"
              />
              <input
                type="text"
                value={form.region}
                onChange={(e) => setForm((f) => ({ ...f, region: e.target.value }))}
                placeholder="Region"
                className="input-field flex-1 py-2 text-[13px]"
              />
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={form.country}
                onChange={(e) => setForm((f) => ({ ...f, country: e.target.value }))}
                placeholder="Country"
                className="input-field flex-1 py-2 text-[13px]"
              />
              <input
                type="text"
                value={form.vintage}
                onChange={(e) => setForm((f) => ({ ...f, vintage: e.target.value }))}
                placeholder="Year"
                className="input-field w-20 py-2 text-[13px] text-center"
              />
              <button
                onClick={handleSubmitGuess}
                disabled={submitting}
                className="h-[42px] w-[42px] rounded-2xl bg-cherry text-white flex items-center justify-center flex-shrink-0 active:scale-90 transition-transform disabled:opacity-50"
              >
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
