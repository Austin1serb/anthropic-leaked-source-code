"use client";

import { use, useState, useEffect, useCallback, useRef } from "react";
import { getEventById, submitGuess } from "@/lib/actions";
import {
  Wine,
  Clock,
  Check,
  X,
  Trophy,
  Users,
  Share2,
  Pencil,
  Crown,
  Loader2,
  ChevronRight,
  Sparkles,
  Grape,
  MapPin,
  Globe,
  Tag,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Types derived from Prisma includes returned by getEventById
// ---------------------------------------------------------------------------

type EventData = NonNullable<Awaited<ReturnType<typeof getEventById>>>;
type BlindWineWithWine = EventData["wines"][number];
type GuestParticipant = EventData["guests"][number];
type BlindGuess = EventData["guesses"][number];

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const GRAPE_SUGGESTIONS = [
  "Cabernet Sauvignon",
  "Pinot Noir",
  "Merlot",
  "Chardonnay",
  "Sauvignon Blanc",
  "Syrah",
  "Riesling",
  "Nebbiolo",
  "Tempranillo",
  "Sangiovese",
  "Grenache",
  "Gamay",
];

const WINE_TYPES = [
  { value: "Red", emoji: "🔴" },
  { value: "White", emoji: "⚪" },
  { value: "Rosé", emoji: "🩷" },
  { value: "Sparkling", emoji: "✨" },
  { value: "Orange", emoji: "🟠" },
  { value: "Dessert", emoji: "🍯" },
];

const WINE_COUNTRIES = [
  "Argentina", "Australia", "Austria", "Chile", "France", "Germany",
  "Greece", "Hungary", "Italy", "Lebanon", "New Zealand", "Portugal",
  "South Africa", "Spain", "United States", "Uruguay",
];

const POLL_INTERVAL = 3000;

// ---------------------------------------------------------------------------
// Guess form state
// ---------------------------------------------------------------------------

interface GuessForm {
  grape: string;
  region: string;
  country: string;
  vintage: string;
  producer: string;
  type: string;
  price: string;
  notes: string;
}

const emptyForm: GuessForm = {
  grape: "", region: "", country: "", vintage: "",
  producer: "", type: "", price: "", notes: "",
};

// ---------------------------------------------------------------------------
// Page component
// ---------------------------------------------------------------------------

export default function PlayPage({
  params,
  searchParams,
}: {
  params: Promise<{ eventId: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const { eventId } = use(params);
  const { guest: guestIdParam } = use(searchParams);
  const guestId = typeof guestIdParam === "string" ? guestIdParam : "";

  const [event, setEvent] = useState<EventData | null>(null);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<GuessForm>(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const startTimeRef = useRef<number>(Date.now());

  // ---- Polling ----
  const fetchEvent = useCallback(async () => {
    try {
      const data = await getEventById(eventId);
      if (data) setEvent(data);
    } catch {
      // silent poll failure
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  useEffect(() => {
    fetchEvent();
    const id = setInterval(fetchEvent, POLL_INTERVAL);
    return () => clearInterval(id);
  }, [fetchEvent]);

  // ---- Derive current state helpers ----
  const currentGuess: BlindGuess | undefined = event?.guesses.find(
    (g) => g.guestId === guestId && g.winePosition === event.currentWine
  );

  const currentBlindWine: BlindWineWithWine | undefined = event?.wines.find(
    (w) => w.position === event.currentWine
  );

  // Pre-fill form when wine changes or existing guess is found
  useEffect(() => {
    if (currentGuess && !editing) {
      setForm({
        grape: currentGuess.guessedGrape ?? "",
        region: currentGuess.guessedRegion ?? "",
        country: currentGuess.guessedCountry ?? "",
        vintage: currentGuess.guessedVintage?.toString() ?? "",
        producer: currentGuess.guessedProducer ?? "",
        type: currentGuess.guessedType ?? "",
        price: currentGuess.guessedPrice?.toString() ?? "",
        notes: currentGuess.notes ?? "",
      });
      setSubmitted(true);
    } else if (!currentGuess) {
      setForm(emptyForm);
      setSubmitted(false);
      setEditing(false);
      startTimeRef.current = Date.now();
    }
  }, [event?.currentWine, currentGuess?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // ---- Submit guess ----
  const handleSubmit = async () => {
    if (!event || !guestId) return;
    setSubmitting(true);
    setError(null);
    try {
      const elapsed = Math.round((Date.now() - startTimeRef.current) / 1000);
      await submitGuess({
        eventId,
        guestId,
        winePosition: event.currentWine,
        guessedGrape: form.grape || undefined,
        guessedRegion: form.region || undefined,
        guessedCountry: form.country || undefined,
        guessedVintage: form.vintage ? parseInt(form.vintage, 10) : undefined,
        guessedProducer: form.producer || undefined,
        guessedType: form.type || undefined,
        guessedPrice: form.price ? parseFloat(form.price) : undefined,
        notes: form.notes || undefined,
        timeElapsed: elapsed,
      });
      setSubmitted(true);
      setEditing(false);
      await fetchEvent();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to submit guess");
    } finally {
      setSubmitting(false);
    }
  };

  // ---- Share ----
  const handleShare = async () => {
    if (!event) return;
    const text = `I just finished a blind tasting: "${event.title}" on WineBob!`;
    if (navigator.share) {
      try {
        await navigator.share({ title: "WineBob Tasting", text });
      } catch { /* user cancelled */ }
    } else {
      await navigator.clipboard.writeText(text);
    }
  };

  // ---- Loading state ----
  if (loading) {
    return (
      <div className="fixed inset-0 flex flex-col items-center justify-center bg-background">
        <div className="h-16 w-16 rounded-3xl widget-wine flex items-center justify-center mb-5">
          <Wine className="h-8 w-8 text-cherry animate-pulse" />
        </div>
        <p className="text-muted text-[15px] font-medium">Loading tasting...</p>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="fixed inset-0 flex flex-col items-center justify-center bg-background px-6">
        <div className="h-16 w-16 rounded-3xl bg-red-50 flex items-center justify-center mb-5">
          <X className="h-8 w-8 text-red-500" />
        </div>
        <p className="text-xl font-bold">Event not found</p>
        <p className="mt-2 text-muted text-center text-[15px] mb-6">
          This tasting may have been deleted or the link is incorrect.
        </p>
        <a href="/" className="btn-primary px-8 touch-target">Back to Home</a>
      </div>
    );
  }

  // ---- STATE 1: Lobby / Waiting ----
  if (event.status === "draft" || event.status === "lobby") {
    return (
      <div className="fixed inset-0 flex flex-col bg-hero-gradient safe-top safe-bottom">
        {/* Top bar with leave option */}
        <div className="px-5 pt-5">
          <a
            href="/"
            className="inline-flex items-center gap-1 text-[13px] font-semibold text-muted active:text-foreground transition-colors touch-target"
          >
            <ChevronRight className="h-4 w-4 rotate-180" />
            Leave
          </a>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center px-6">
          <div className="animate-fade-in-up text-center">
            <div className="h-20 w-20 rounded-3xl widget-wine flex items-center justify-center mx-auto mb-6">
              <Wine className="h-10 w-10 text-cherry animate-pulse" />
            </div>
            <h1 className="text-3xl font-bold text-foreground tracking-tight">
              {event.title}
            </h1>
            {event.description && (
              <p className="mt-2 text-muted text-[16px] max-w-md mx-auto">
                {event.description}
              </p>
            )}
            <div className="mt-8 flex items-center gap-2 justify-center text-cherry">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span className="text-[16px] font-medium">
                Waiting for host to start...
              </span>
            </div>
          </div>

          <div className="mt-10 w-full max-w-sm">
            <div className="flex items-center gap-2 mb-3">
              <Users className="h-4 w-4 text-muted" />
              <span className="text-[13px] font-semibold text-muted">
                {event.guests.length} guest{event.guests.length !== 1 && "s"} joined
              </span>
            </div>
            <div className="wine-card divide-y divide-card-border/40">
              {event.guests.map((g: GuestParticipant) => (
                <div
                  key={g.id}
                  className={`flex items-center gap-3 px-4 py-3 ${
                    g.id === guestId ? "bg-widget-wine/30" : ""
                  }`}
                >
                  <div className="h-9 w-9 rounded-xl widget-wine flex items-center justify-center text-[13px] font-bold text-cherry">
                    {g.displayName.charAt(0).toUpperCase()}
                  </div>
                  <span className={`text-[14px] font-medium ${g.id === guestId ? "text-cherry font-semibold" : "text-foreground"}`}>
                    {g.displayName}
                  </span>
                  {g.id === guestId && (
                    <span className="text-[11px] text-muted ml-auto">(you)</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ---- STATE 4: Completed ----
  if (event.status === "completed") {
    return <CompletedView event={event} guestId={guestId} onShare={handleShare} />;
  }

  // ---- STATE 3: Reveal (current wine is revealed) ----
  if (currentBlindWine?.revealed && currentBlindWine.wine) {
    const actual = currentBlindWine.wine;
    return (
      <div className="fixed inset-0 flex flex-col bg-background safe-top safe-bottom overflow-y-auto">
        <div className="max-w-lg mx-auto w-full px-5 pt-6 pb-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <p className="text-[12px] font-bold text-cherry uppercase tracking-widest">
                Wine #{event.currentWine} — Revealed
              </p>
            </div>
            <div className="h-10 w-10 rounded-2xl widget-gold flex items-center justify-center">
              <Sparkles className="h-5 w-5 text-amber-600" />
            </div>
          </div>

          {/* Wine name card */}
          <div className="wine-card p-6 mb-4 animate-scale-in">
            <h2 className="text-2xl font-bold text-foreground tracking-tight mb-1">
              {actual.name}
            </h2>
            <p className="text-[14px] text-muted">
              {actual.producer}{actual.vintage ? ` · ${actual.vintage}` : " · NV"}
            </p>
          </div>

          {/* Comparison cards */}
          <div className="space-y-2.5 stagger-children">
            <RevealCard label="Grape" icon={<Grape className="h-4 w-4" />} actual={actual.grapes.join(", ")} guessed={currentGuess?.guessedGrape} color="widget-wine" />
            <RevealCard label="Region" icon={<MapPin className="h-4 w-4" />} actual={actual.region} guessed={currentGuess?.guessedRegion} color="widget-gold" />
            <RevealCard label="Country" icon={<Globe className="h-4 w-4" />} actual={actual.country} guessed={currentGuess?.guessedCountry} color="widget-sky" />
            <RevealCard label="Vintage" icon={<Clock className="h-4 w-4" />} actual={actual.vintage?.toString() ?? "NV"} guessed={currentGuess?.guessedVintage?.toString()} color="widget-sage" />
            <RevealCard label="Type" icon={<Wine className="h-4 w-4" />} actual={actual.type} guessed={currentGuess?.guessedType} color="widget-peach" />
            <RevealCard label="Producer" icon={<Tag className="h-4 w-4" />} actual={actual.producer} guessed={currentGuess?.guessedProducer} color="widget-lavender" />
          </div>

          {/* Score */}
          {currentGuess?.score != null && (
            <div className="wine-card p-5 mt-4 flex items-center justify-between animate-scale-in">
              <span className="text-[14px] font-medium text-muted">Your score</span>
              <span className="text-3xl font-bold text-cherry tracking-tight">
                {currentGuess.score} <span className="text-[14px] font-semibold text-muted">pts</span>
              </span>
            </div>
          )}

          {/* Progress indicator */}
          <div className="wine-card p-4 mt-6 flex items-center gap-3">
            <Loader2 className="h-4 w-4 animate-spin text-cherry flex-shrink-0" />
            <div className="flex-1">
              <p className="text-[14px] font-medium text-foreground">
                {event.currentWine < event.wines.length
                  ? "Waiting for next wine..."
                  : "Last wine — waiting for results..."}
              </p>
              <p className="text-[12px] text-muted mt-0.5">
                Wine {event.currentWine} of {event.wines.length}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ---- STATE 2: Active Wine (guessing) ----
  const guessFields = event.guessFields ?? [];

  return (
    <div className="fixed inset-0 flex flex-col bg-background safe-top safe-bottom">
      {/* Header */}
      <div className="max-w-lg mx-auto w-full px-5 pt-5 pb-3 flex items-center justify-between">
        <div>
          <p className="text-[11px] font-bold text-muted uppercase tracking-widest">
            {event.title}
          </p>
          <h1 className="text-[26px] font-bold text-foreground tracking-tight mt-0.5">
            Wine #{event.currentWine}
          </h1>
        </div>
        <div className="h-12 w-12 rounded-2xl widget-wine flex items-center justify-center">
          <Wine className="h-6 w-6 text-cherry" />
        </div>
      </div>

      {/* Form */}
      <div className="flex-1 overflow-y-auto scroll-smooth">
        <div className="max-w-lg mx-auto px-5 pb-32">
          {submitted && !editing ? (
            /* ---- Submitted confirmation ---- */
            <div className="wine-card p-6 animate-scale-in">
              <div className="flex items-center gap-3 mb-5">
                <div className="h-10 w-10 rounded-2xl bg-green-50 flex items-center justify-center">
                  <Check className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <span className="text-[16px] font-bold text-foreground">Guess submitted</span>
                  <p className="text-[12px] text-muted">Waiting for the reveal...</p>
                </div>
              </div>

              <div className="space-y-2">
                {form.type && <SummaryPill label="Type" value={form.type} />}
                {form.grape && <SummaryPill label="Grape" value={form.grape} />}
                {form.region && <SummaryPill label="Region" value={form.region} />}
                {form.country && <SummaryPill label="Country" value={form.country} />}
                {form.vintage && <SummaryPill label="Vintage" value={form.vintage} />}
                {form.producer && <SummaryPill label="Producer" value={form.producer} />}
                {form.price && <SummaryPill label="Price" value={`$${form.price}`} />}
                {form.notes && <SummaryPill label="Notes" value={form.notes} />}
              </div>

              <button
                onClick={() => setEditing(true)}
                className="mt-5 flex items-center gap-2 text-cherry font-semibold text-[14px] touch-target"
              >
                <Pencil className="h-4 w-4" />
                Edit guess
              </button>
            </div>
          ) : (
            /* ---- Guess form ---- */
            <div className="space-y-5">
              {/* Type — visual pill cards */}
              {guessFields.includes("type") && (
                <fieldset>
                  <legend className="text-[13px] font-bold text-foreground uppercase tracking-wide mb-3">
                    Type
                  </legend>
                  <div className="grid grid-cols-3 gap-2">
                    {WINE_TYPES.map((t) => (
                      <button
                        key={t.value}
                        type="button"
                        onClick={() =>
                          setForm((f) => ({ ...f, type: f.type === t.value ? "" : t.value }))
                        }
                        className={`touch-target rounded-2xl p-3 text-center transition-all ${
                          form.type === t.value
                            ? "bg-cherry text-white shadow-sm ring-2 ring-cherry/30"
                            : "bg-card-bg border border-card-border text-foreground"
                        }`}
                      >
                        <span className="text-lg block">{t.emoji}</span>
                        <span className="text-[12px] font-semibold mt-1 block">{t.value}</span>
                      </button>
                    ))}
                  </div>
                </fieldset>
              )}

              {/* Grape — input + suggestion chips */}
              {guessFields.includes("grape") && (
                <fieldset>
                  <legend className="text-[13px] font-bold text-foreground uppercase tracking-wide mb-2">
                    Grape
                  </legend>
                  <input
                    type="text"
                    value={form.grape}
                    onChange={(e) => setForm((f) => ({ ...f, grape: e.target.value }))}
                    placeholder="e.g. Pinot Noir"
                    className="input-field w-full touch-target"
                  />
                  <div className="flex flex-wrap gap-1.5 mt-2.5">
                    {GRAPE_SUGGESTIONS.map((g) => (
                      <button
                        key={g}
                        type="button"
                        onClick={() => setForm((f) => ({ ...f, grape: g }))}
                        className={`px-3 py-1.5 rounded-xl text-[12px] font-medium transition-all ${
                          form.grape === g
                            ? "bg-cherry text-white shadow-sm"
                            : "bg-widget-wine text-foreground"
                        }`}
                      >
                        {g}
                      </button>
                    ))}
                  </div>
                </fieldset>
              )}

              {/* Region */}
              {guessFields.includes("region") && (
                <fieldset>
                  <legend className="text-[13px] font-bold text-foreground uppercase tracking-wide mb-2">
                    Region
                  </legend>
                  <input
                    type="text"
                    value={form.region}
                    onChange={(e) => setForm((f) => ({ ...f, region: e.target.value }))}
                    placeholder="e.g. Burgundy, Napa Valley"
                    className="input-field w-full touch-target"
                  />
                </fieldset>
              )}

              {/* Country — visual selector */}
              {guessFields.includes("country") && (
                <fieldset>
                  <legend className="text-[13px] font-bold text-foreground uppercase tracking-wide mb-2">
                    Country
                  </legend>
                  <div className="wine-card overflow-hidden">
                    <select
                      value={form.country}
                      onChange={(e) => setForm((f) => ({ ...f, country: e.target.value }))}
                      className="w-full px-4 py-3.5 bg-transparent text-foreground text-[15px] touch-target appearance-none"
                    >
                      <option value="">Select a country</option>
                      {WINE_COUNTRIES.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                </fieldset>
              )}

              {/* Vintage */}
              {guessFields.includes("vintage") && (
                <fieldset>
                  <legend className="text-[13px] font-bold text-foreground uppercase tracking-wide mb-2">
                    Vintage
                  </legend>
                  <input
                    type="number"
                    inputMode="numeric"
                    value={form.vintage}
                    onChange={(e) => setForm((f) => ({ ...f, vintage: e.target.value }))}
                    placeholder="e.g. 2019"
                    min={1900}
                    max={2099}
                    className="input-field w-full touch-target"
                  />
                </fieldset>
              )}

              {/* Producer */}
              {guessFields.includes("producer") && (
                <fieldset>
                  <legend className="text-[13px] font-bold text-foreground uppercase tracking-wide mb-2">
                    Producer
                  </legend>
                  <input
                    type="text"
                    value={form.producer}
                    onChange={(e) => setForm((f) => ({ ...f, producer: e.target.value }))}
                    placeholder="e.g. Domaine de la Romanée-Conti"
                    className="input-field w-full touch-target"
                  />
                </fieldset>
              )}

              {/* Price */}
              {guessFields.includes("price") && (
                <fieldset>
                  <legend className="text-[13px] font-bold text-foreground uppercase tracking-wide mb-2">
                    Price ($)
                  </legend>
                  <input
                    type="number"
                    inputMode="decimal"
                    value={form.price}
                    onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
                    placeholder="e.g. 45"
                    min={0}
                    className="input-field w-full touch-target"
                  />
                </fieldset>
              )}

              {/* Notes — always shown */}
              <fieldset>
                <legend className="text-[13px] font-bold text-foreground uppercase tracking-wide mb-2">
                  Tasting Notes
                </legend>
                <textarea
                  value={form.notes}
                  onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                  placeholder="What do you taste? Aromas, flavors, texture..."
                  rows={3}
                  className="input-field w-full resize-none"
                />
              </fieldset>

              {error && (
                <div className="wine-card p-3 bg-red-50 border-red-200">
                  <p className="text-red-600 text-[13px] font-medium">{error}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Sticky submit button */}
      {(!submitted || editing) && (
        <div className="fixed bottom-0 left-0 right-0 safe-bottom z-50">
          <div className="max-w-lg mx-auto px-5 pb-5 pt-3 bg-gradient-to-t from-background via-background to-transparent">
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="btn-primary touch-target w-full"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  Submit Guess
                  <ChevronRight className="h-5 w-5" />
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Summary pill (submitted guess recap)
// ---------------------------------------------------------------------------

function SummaryPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-2 px-1">
      <span className="text-[12px] font-semibold text-muted uppercase tracking-wide">{label}</span>
      <span className="text-[14px] font-medium text-foreground">{value}</span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Reveal comparison card
// ---------------------------------------------------------------------------

function RevealCard({
  label,
  icon,
  actual,
  guessed,
  color,
}: {
  label: string;
  icon: React.ReactNode;
  actual: string;
  guessed?: string | null;
  color: string;
}) {
  const isMatch =
    guessed != null &&
    guessed !== "" &&
    actual.toLowerCase().includes(guessed.toLowerCase());

  return (
    <div className="wine-card p-4 flex items-center gap-3.5">
      <div className={`h-10 w-10 rounded-xl ${color} flex items-center justify-center flex-shrink-0 ${
        !guessed ? "text-muted/40" : isMatch ? "text-green-600" : "text-red-500"
      }`}>
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[11px] font-semibold text-muted uppercase tracking-wide">{label}</p>
        <p className="text-[15px] font-bold text-foreground mt-0.5">{actual}</p>
        {guessed && !isMatch && (
          <p className="text-[12px] text-red-400 line-through mt-0.5">{guessed}</p>
        )}
      </div>
      <div className="flex-shrink-0">
        {guessed ? (
          isMatch ? (
            <div className="h-7 w-7 rounded-full bg-green-100 flex items-center justify-center">
              <Check className="h-4 w-4 text-green-600" strokeWidth={3} />
            </div>
          ) : (
            <div className="h-7 w-7 rounded-full bg-red-50 flex items-center justify-center">
              <X className="h-4 w-4 text-red-500" strokeWidth={3} />
            </div>
          )
        ) : (
          <div className="h-7 w-7 rounded-full border-2 border-card-border" />
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Completed / Scoreboard view
// ---------------------------------------------------------------------------

function CompletedView({
  event,
  guestId,
  onShare,
}: {
  event: EventData;
  guestId: string;
  onShare: () => void;
}) {
  const scoresByGuest = new Map<string, number>();
  for (const guess of event.guesses) {
    scoresByGuest.set(
      guess.guestId,
      (scoresByGuest.get(guess.guestId) ?? 0) + (guess.score ?? 0)
    );
  }

  const ranked = event.guests
    .map((g: GuestParticipant) => ({
      ...g,
      totalScore: scoresByGuest.get(g.id) ?? 0,
    }))
    .sort((a, b) => b.totalScore - a.totalScore);

  const myRank = ranked.findIndex((g) => g.id === guestId) + 1;

  const MEDAL_COLORS = [
    "bg-amber-400 text-white",     // gold
    "bg-gray-300 text-gray-700",   // silver
    "bg-orange-300 text-orange-800", // bronze
  ];

  return (
    <div className="fixed inset-0 flex flex-col bg-hero-gradient safe-top safe-bottom overflow-y-auto">
      <div className="max-w-lg mx-auto w-full px-5 pt-8 pb-8">
        {/* Trophy header */}
        <div className="text-center mb-8 animate-fade-in-up">
          <div className="h-20 w-20 rounded-3xl widget-gold flex items-center justify-center mx-auto mb-5 animate-cheers">
            <Trophy className="h-10 w-10 text-amber-600" />
          </div>
          <h1 className="text-3xl font-bold text-foreground tracking-tight">Tasting Complete!</h1>
          <p className="text-muted mt-2 text-[16px]">{event.title}</p>
          {myRank > 0 && (
            <p className="mt-3 text-cherry font-bold text-[18px]">
              You placed #{myRank} of {ranked.length}
            </p>
          )}
        </div>

        {/* Scoreboard */}
        <h2 className="text-[13px] font-bold text-foreground uppercase tracking-wide mb-3">
          Scoreboard
        </h2>
        <div className="wine-card divide-y divide-card-border/40">
          {ranked.map((g, i) => (
            <div
              key={g.id}
              className={`flex items-center gap-3.5 px-4 py-3.5 ${
                g.id === guestId ? "bg-widget-wine/30" : ""
              }`}
            >
              <div className={`h-9 w-9 rounded-xl flex items-center justify-center text-[13px] font-bold flex-shrink-0 ${
                i < 3 ? MEDAL_COLORS[i] : "bg-card-border/30 text-muted"
              }`}>
                {i === 0 ? <Crown className="h-4 w-4" /> : i + 1}
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-[14px] font-semibold truncate ${
                  g.id === guestId ? "text-cherry" : "text-foreground"
                }`}>
                  {g.displayName}
                  {g.id === guestId && (
                    <span className="text-[11px] text-muted ml-1.5">(you)</span>
                  )}
                </p>
              </div>
              <span className="text-[16px] font-bold tabular-nums text-foreground">
                {g.totalScore}
              </span>
            </div>
          ))}
        </div>

        {/* Actions */}
        <div className="mt-8 space-y-3">
          <button
            onClick={onShare}
            className="btn-secondary w-full touch-target gap-2 border-2 border-cherry text-cherry font-semibold"
          >
            <Share2 className="h-5 w-5" />
            Share Results
          </button>
          <a
            href="/login"
            className="btn-primary block text-center touch-target"
          >
            Sign up to save your results
          </a>
        </div>
      </div>
    </div>
  );
}
