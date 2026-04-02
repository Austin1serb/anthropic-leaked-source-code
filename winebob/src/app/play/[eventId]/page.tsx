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

const WINE_TYPES = ["Red", "White", "Rosé", "Sparkling", "Orange", "Dessert"];

const WINE_COUNTRIES = [
  "Argentina",
  "Australia",
  "Austria",
  "Chile",
  "France",
  "Germany",
  "Greece",
  "Hungary",
  "Italy",
  "Lebanon",
  "New Zealand",
  "Portugal",
  "South Africa",
  "Spain",
  "United States",
  "Uruguay",
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
  grape: "",
  region: "",
  country: "",
  vintage: "",
  producer: "",
  type: "",
  price: "",
  notes: "",
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
      // Re-fetch immediately so the guess is reflected
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
      } catch {
        // user cancelled
      }
    } else {
      await navigator.clipboard.writeText(text);
    }
  };

  // ---- Loading state ----
  if (loading) {
    return (
      <div className="fixed inset-0 flex flex-col items-center justify-center bg-background">
        <Wine className="h-12 w-12 text-wine-burgundy animate-pulse" />
        <p className="mt-4 text-muted text-lg">Loading tasting...</p>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="fixed inset-0 flex flex-col items-center justify-center bg-background px-6">
        <X className="h-12 w-12 text-red-500" />
        <p className="mt-4 text-xl font-semibold">Event not found</p>
        <p className="mt-2 text-muted text-center">
          This tasting may have been deleted or the link is incorrect.
        </p>
      </div>
    );
  }

  // ---- STATE 1: Lobby / Waiting ----
  if (event.status === "draft" || event.status === "lobby") {
    return (
      <div className="fixed inset-0 flex flex-col bg-background safe-top safe-bottom">
        <div className="flex-1 flex flex-col items-center justify-center px-6">
          <div className="animate-fade-in-up text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-wine-burgundy/10 mb-6">
              <Wine className="h-10 w-10 text-wine-burgundy animate-pulse" />
            </div>
            <h1 className="font-serif text-3xl font-bold text-foreground">
              {event.title}
            </h1>
            {event.description && (
              <p className="mt-2 text-muted text-lg max-w-md">
                {event.description}
              </p>
            )}
            <div className="mt-8 flex items-center gap-2 justify-center text-wine-burgundy">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span className="text-lg font-medium">
                Waiting for host to start...
              </span>
            </div>
          </div>

          <div className="mt-10 w-full max-w-sm">
            <div className="flex items-center gap-2 mb-4">
              <Users className="h-5 w-5 text-muted" />
              <span className="text-muted font-medium">
                {event.guests.length} guest{event.guests.length !== 1 && "s"}{" "}
                joined
              </span>
            </div>
            <div className="wine-card p-4 space-y-3">
              {event.guests.map((g: GuestParticipant) => (
                <div
                  key={g.id}
                  className={`flex items-center gap-3 ${
                    g.id === guestId ? "font-semibold text-wine-burgundy" : ""
                  }`}
                >
                  <div className="w-8 h-8 rounded-full bg-wine-burgundy/10 flex items-center justify-center text-sm font-bold text-wine-burgundy">
                    {g.displayName.charAt(0).toUpperCase()}
                  </div>
                  <span>{g.displayName}</span>
                  {g.id === guestId && (
                    <span className="text-xs text-muted">(you)</span>
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
        <div className="px-6 pt-6 pb-4">
          <p className="text-sm font-medium text-wine-burgundy uppercase tracking-wide">
            Wine #{event.currentWine} — Revealed
          </p>
        </div>

        <div className="flex-1 px-6 pb-8">
          <div className="wine-card p-6 animate-fade-in-up">
            <div className="flex items-center gap-3 mb-6">
              <Sparkles className="h-6 w-6 text-wine-gold" />
              <h2 className="font-serif text-2xl font-bold">{actual.name}</h2>
            </div>

            <div className="space-y-4">
              <RevealRow
                label="Producer"
                actual={actual.producer}
                guessed={currentGuess?.guessedProducer}
              />
              <RevealRow
                label="Grape"
                actual={actual.grapes.join(", ")}
                guessed={currentGuess?.guessedGrape}
              />
              <RevealRow
                label="Region"
                actual={actual.region}
                guessed={currentGuess?.guessedRegion}
              />
              <RevealRow
                label="Country"
                actual={actual.country}
                guessed={currentGuess?.guessedCountry}
              />
              <RevealRow
                label="Vintage"
                actual={actual.vintage?.toString() ?? "NV"}
                guessed={currentGuess?.guessedVintage?.toString()}
              />
              <RevealRow
                label="Type"
                actual={actual.type}
                guessed={currentGuess?.guessedType}
              />
            </div>

            {currentGuess?.score != null && (
              <div className="mt-6 pt-4 border-t border-card-border flex items-center justify-between">
                <span className="text-muted font-medium">Score</span>
                <span className="text-2xl font-bold text-wine-burgundy">
                  {currentGuess.score} pts
                </span>
              </div>
            )}
          </div>

          <p className="text-center text-muted mt-6 flex items-center justify-center gap-2">
            <Clock className="h-4 w-4" />
            Waiting for next wine...
          </p>
        </div>
      </div>
    );
  }

  // ---- STATE 2: Active Wine (guessing) ----
  const guessFields = event.guessFields ?? [];

  return (
    <div className="fixed inset-0 flex flex-col bg-background safe-top safe-bottom">
      {/* Header */}
      <div className="px-6 pt-6 pb-3 flex items-center justify-between">
        <div>
          <p className="text-sm text-muted uppercase tracking-wide font-medium">
            {event.title}
          </p>
          <h1 className="font-serif text-2xl font-bold mt-1">
            Wine #{event.currentWine}
          </h1>
        </div>
        <div className="w-12 h-12 rounded-full bg-wine-burgundy/10 flex items-center justify-center">
          <Wine className="h-6 w-6 text-wine-burgundy" />
        </div>
      </div>

      {/* Form */}
      <div className="flex-1 overflow-y-auto px-6 pb-32 scroll-smooth">
        {submitted && !editing ? (
          <div className="wine-card p-6 animate-fade-in-up">
            <div className="flex items-center gap-3 text-green-600 mb-4">
              <Check className="h-6 w-6" />
              <span className="text-lg font-semibold">Guess submitted</span>
            </div>
            <div className="space-y-2 text-sm text-muted">
              {form.grape && <p>Grape: {form.grape}</p>}
              {form.region && <p>Region: {form.region}</p>}
              {form.country && <p>Country: {form.country}</p>}
              {form.vintage && <p>Vintage: {form.vintage}</p>}
              {form.producer && <p>Producer: {form.producer}</p>}
              {form.type && <p>Type: {form.type}</p>}
              {form.price && <p>Price: ${form.price}</p>}
              {form.notes && <p>Notes: {form.notes}</p>}
            </div>
            <button
              onClick={() => setEditing(true)}
              className="mt-4 flex items-center gap-2 text-wine-burgundy font-medium touch-target"
            >
              <Pencil className="h-4 w-4" />
              Edit guess
            </button>
          </div>
        ) : (
          <div className="space-y-5">
            {/* Type pills */}
            {guessFields.includes("type") && (
              <fieldset>
                <legend className="text-sm font-medium text-muted mb-2">
                  Type
                </legend>
                <div className="flex flex-wrap gap-2">
                  {WINE_TYPES.map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() =>
                        setForm((f) => ({
                          ...f,
                          type: f.type === t ? "" : t,
                        }))
                      }
                      className={`px-4 py-2.5 rounded-full text-sm font-medium transition-colors touch-target ${
                        form.type === t
                          ? "bg-wine-burgundy text-white"
                          : "bg-card-bg border border-card-border text-foreground"
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </fieldset>
            )}

            {/* Grape */}
            {guessFields.includes("grape") && (
              <fieldset>
                <legend className="text-sm font-medium text-muted mb-2">
                  Grape
                </legend>
                <input
                  type="text"
                  value={form.grape}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, grape: e.target.value }))
                  }
                  placeholder="e.g. Pinot Noir"
                  className="w-full px-4 py-3 rounded-xl border border-card-border bg-card-bg text-foreground text-base touch-target"
                />
                <div className="flex flex-wrap gap-2 mt-2">
                  {GRAPE_SUGGESTIONS.map((g) => (
                    <button
                      key={g}
                      type="button"
                      onClick={() => setForm((f) => ({ ...f, grape: g }))}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                        form.grape === g
                          ? "bg-wine-burgundy text-white"
                          : "bg-wine-cream-dark text-foreground"
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
                <legend className="text-sm font-medium text-muted mb-2">
                  Region
                </legend>
                <input
                  type="text"
                  value={form.region}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, region: e.target.value }))
                  }
                  placeholder="e.g. Burgundy, Napa Valley"
                  className="w-full px-4 py-3 rounded-xl border border-card-border bg-card-bg text-foreground text-base touch-target"
                />
              </fieldset>
            )}

            {/* Country */}
            {guessFields.includes("country") && (
              <fieldset>
                <legend className="text-sm font-medium text-muted mb-2">
                  Country
                </legend>
                <select
                  value={form.country}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, country: e.target.value }))
                  }
                  className="w-full px-4 py-3 rounded-xl border border-card-border bg-card-bg text-foreground text-base touch-target appearance-none"
                >
                  <option value="">Select a country</option>
                  {WINE_COUNTRIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </fieldset>
            )}

            {/* Vintage */}
            {guessFields.includes("vintage") && (
              <fieldset>
                <legend className="text-sm font-medium text-muted mb-2">
                  Vintage
                </legend>
                <input
                  type="number"
                  inputMode="numeric"
                  value={form.vintage}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, vintage: e.target.value }))
                  }
                  placeholder="e.g. 2019"
                  min={1900}
                  max={2099}
                  className="w-full px-4 py-3 rounded-xl border border-card-border bg-card-bg text-foreground text-base touch-target"
                />
              </fieldset>
            )}

            {/* Producer */}
            {guessFields.includes("producer") && (
              <fieldset>
                <legend className="text-sm font-medium text-muted mb-2">
                  Producer
                </legend>
                <input
                  type="text"
                  value={form.producer}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, producer: e.target.value }))
                  }
                  placeholder="e.g. Domaine de la Romanée-Conti"
                  className="w-full px-4 py-3 rounded-xl border border-card-border bg-card-bg text-foreground text-base touch-target"
                />
              </fieldset>
            )}

            {/* Price */}
            {guessFields.includes("price") && (
              <fieldset>
                <legend className="text-sm font-medium text-muted mb-2">
                  Price ($)
                </legend>
                <input
                  type="number"
                  inputMode="decimal"
                  value={form.price}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, price: e.target.value }))
                  }
                  placeholder="e.g. 45"
                  min={0}
                  className="w-full px-4 py-3 rounded-xl border border-card-border bg-card-bg text-foreground text-base touch-target"
                />
              </fieldset>
            )}

            {/* Notes — always shown */}
            <fieldset>
              <legend className="text-sm font-medium text-muted mb-2">
                Tasting Notes
              </legend>
              <textarea
                value={form.notes}
                onChange={(e) =>
                  setForm((f) => ({ ...f, notes: e.target.value }))
                }
                placeholder="What do you taste? Aromas, flavors, texture..."
                rows={3}
                className="w-full px-4 py-3 rounded-xl border border-card-border bg-card-bg text-foreground text-base resize-none"
              />
            </fieldset>

            {error && (
              <p className="text-red-500 text-sm font-medium">{error}</p>
            )}
          </div>
        )}
      </div>

      {/* Sticky submit button */}
      {(!submitted || editing) && (
        <div className="fixed bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-background via-background to-transparent safe-bottom">
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="w-full py-4 rounded-2xl bg-wine-burgundy text-white text-lg font-semibold flex items-center justify-center gap-2 touch-target disabled:opacity-60 transition-opacity active:scale-[0.98]"
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
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Reveal comparison row
// ---------------------------------------------------------------------------

function RevealRow({
  label,
  actual,
  guessed,
}: {
  label: string;
  actual: string;
  guessed?: string | null;
}) {
  const isMatch =
    guessed != null &&
    guessed !== "" &&
    actual.toLowerCase().includes(guessed.toLowerCase());

  return (
    <div className="flex items-start gap-3">
      <div className="mt-0.5">
        {guessed ? (
          isMatch ? (
            <Check className="h-5 w-5 text-green-600" />
          ) : (
            <X className="h-5 w-5 text-red-500" />
          )
        ) : (
          <div className="h-5 w-5 rounded-full border-2 border-muted/30" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-muted uppercase tracking-wide">{label}</p>
        <p className="font-semibold text-foreground">{actual}</p>
        {guessed && !isMatch && (
          <p className="text-sm text-red-400 line-through">{guessed}</p>
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
  // Compute total scores per guest
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

  return (
    <div className="fixed inset-0 flex flex-col bg-background safe-top safe-bottom overflow-y-auto">
      <div className="px-6 pt-8 pb-4 text-center animate-fade-in-up">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-wine-gold/20 mb-4 animate-cheers">
          <Trophy className="h-8 w-8 text-wine-gold" />
        </div>
        <h1 className="font-serif text-3xl font-bold">Tasting Complete!</h1>
        <p className="text-muted mt-2 text-lg">{event.title}</p>
        {myRank > 0 && (
          <p className="mt-3 text-wine-burgundy font-semibold text-lg">
            You placed #{myRank} of {ranked.length}
          </p>
        )}
      </div>

      <div className="flex-1 px-6 pb-8">
        <h2 className="font-serif text-xl font-bold mb-4">Scoreboard</h2>
        <div className="wine-card divide-y divide-card-border">
          {ranked.map((g, i) => (
            <div
              key={g.id}
              className={`flex items-center gap-4 px-5 py-4 ${
                g.id === guestId ? "bg-wine-burgundy/5" : ""
              }`}
            >
              <div className="w-8 text-center">
                {i === 0 ? (
                  <Crown className="h-6 w-6 text-wine-gold mx-auto" />
                ) : (
                  <span className="text-lg font-bold text-muted">
                    {i + 1}
                  </span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p
                  className={`font-semibold truncate ${
                    g.id === guestId ? "text-wine-burgundy" : ""
                  }`}
                >
                  {g.displayName}
                  {g.id === guestId && (
                    <span className="text-xs text-muted ml-2">(you)</span>
                  )}
                </p>
              </div>
              <span className="text-lg font-bold tabular-nums">
                {g.totalScore}
              </span>
            </div>
          ))}
        </div>

        {/* Actions */}
        <div className="mt-8 space-y-3">
          <button
            onClick={onShare}
            className="w-full py-4 rounded-2xl border-2 border-wine-burgundy text-wine-burgundy font-semibold text-lg flex items-center justify-center gap-2 touch-target active:scale-[0.98]"
          >
            <Share2 className="h-5 w-5" />
            Share Results
          </button>
          <a
            href="/login"
            className="block w-full py-4 rounded-2xl bg-wine-burgundy text-white font-semibold text-lg text-center touch-target active:scale-[0.98]"
          >
            Sign up to save your results
          </a>
        </div>
      </div>
    </div>
  );
}
