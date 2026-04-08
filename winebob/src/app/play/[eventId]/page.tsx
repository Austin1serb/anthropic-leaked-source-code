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
  DollarSign,
  Search,
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

const GRAPE_CATEGORIES = [
  {
    label: "Red Grapes",
    grapes: [
      "Cabernet Sauvignon", "Pinot Noir", "Merlot", "Syrah", "Nebbiolo",
      "Tempranillo", "Sangiovese", "Grenache", "Gamay", "Malbec",
      "Zinfandel", "Barbera", "Pinotage",
    ],
  },
  {
    label: "White Grapes",
    grapes: [
      "Chardonnay", "Sauvignon Blanc", "Riesling", "Pinot Grigio",
      "Viognier", "Chenin Blanc", "Albariño",
      "Marsanne", "Vermentino", "Muscadet",
    ],
  },
];

const QUICK_GRAPES = [
  "Cabernet Sauvignon", "Pinot Noir", "Merlot",
  "Chardonnay", "Sauvignon Blanc", "Syrah",
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
  { name: "France", flag: "🇫🇷" },
  { name: "Italy", flag: "🇮🇹" },
  { name: "Spain", flag: "🇪🇸" },
  { name: "Portugal", flag: "🇵🇹" },
  { name: "Germany", flag: "🇩🇪" },
  { name: "Austria", flag: "🇦🇹" },
  { name: "Greece", flag: "🇬🇷" },
  { name: "Hungary", flag: "🇭🇺" },
  { name: "United States", flag: "🇺🇸" },
  { name: "Argentina", flag: "🇦🇷" },
  { name: "Chile", flag: "🇨🇱" },
  { name: "Australia", flag: "🇦🇺" },
  { name: "New Zealand", flag: "🇳🇿" },
  { name: "South Africa", flag: "🇿🇦" },
  { name: "Lebanon", flag: "🇱🇧" },
  { name: "Uruguay", flag: "🇺🇾" },
];

const LOBBY_TIPS = [
  "Swirl, sniff, sip — get ready!",
  "Look at the color and clarity first",
  "Trust your nose — it knows more than you think",
  "Don't overthink it — go with your gut",
  "Pay attention to the finish",
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

  // Accordion & bottom sheet state
  const [openField, setOpenField] = useState<string | null>("type");
  const [countrySheetOpen, setCountrySheetOpen] = useState(false);
  const [grapeSheetOpen, setGrapeSheetOpen] = useState(false);
  const [sheetSearch, setSheetSearch] = useState("");
  const sheetSearchRef = useRef<HTMLInputElement>(null);

  // Lobby tip rotation
  const [tipIndex, setTipIndex] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTipIndex((i) => (i + 1) % LOBBY_TIPS.length), 4000);
    return () => clearInterval(id);
  }, []);

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

  // Wine is locked once revealed — no more edits allowed
  const isWineLocked = currentBlindWine?.revealed ?? false;

  // Track which wine the form is currently for (prevents clearing on poll updates)
  const formWineRef = useRef<number>(0);

  // Pre-fill form when wine changes or existing guess is found
  useEffect(() => {
    const winePos = event?.currentWine ?? 0;

    // Only reset form when the wine position actually changes
    if (winePos !== formWineRef.current) {
      formWineRef.current = winePos;
      if (currentGuess) {
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
      } else {
        setForm(emptyForm);
        setSubmitted(false);
        startTimeRef.current = Date.now();
      }
      setEditing(false);
    } else if (currentGuess && !editing && !submitted) {
      // Existing guess found on same wine (e.g., after submit + poll)
      setSubmitted(true);
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
        <div className="h-16 w-16 rounded-[16px] bg-card-bg border border-card-border shadow-[0_2px_8px_rgba(0,0,0,0.06),0_0_1px_rgba(0,0,0,0.04)] flex items-center justify-center mb-5">
          <Wine className="h-8 w-8 text-cherry animate-pulse" />
        </div>
        <p className="text-muted text-[15px] font-medium">Loading tasting...</p>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="fixed inset-0 flex flex-col items-center justify-center bg-background px-6">
        <div className="h-16 w-16 rounded-[16px] bg-red-50 border border-red-200 flex items-center justify-center mb-5">
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
      <div className="fixed inset-0 flex flex-col bg-background safe-top safe-bottom">
        {/* Top bar with leave option */}
        <div className="px-4 md:px-8 lg:px-10 pt-5">
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
            <div className="h-20 w-20 rounded-[16px] bg-card-bg border border-card-border shadow-[0_2px_8px_rgba(0,0,0,0.06),0_0_1px_rgba(0,0,0,0.04)] flex items-center justify-center mx-auto mb-6 animate-gentle-bob">
              <Wine className="h-10 w-10 text-cherry" />
            </div>
            <h1 className="text-3xl font-bold font-serif text-foreground tracking-tight">
              {event.title}
            </h1>
            {event.description && (
              <p className="mt-2 text-muted text-[15px] max-w-md mx-auto">
                {event.description}
              </p>
            )}

            {/* Rotating tips */}
            <div className="mt-6 h-8 flex items-center justify-center">
              <p key={tipIndex} className="text-[14px] text-cherry/70 font-medium italic animate-fade-in-up">
                {LOBBY_TIPS[tipIndex]}
              </p>
            </div>

            <div className="mt-4 flex items-center gap-2 justify-center text-muted">
              <Loader2 className="h-4 w-4 animate-spin text-cherry" />
              <span className="text-[14px] font-medium">
                Waiting for host to start...
              </span>
            </div>
          </div>

          {/* Avatar stack + guest list */}
          <div className="mt-10 w-full max-w-sm">
            {/* Overlapping avatar stack */}
            {event.guests.length > 0 && (
              <div className="flex items-center justify-center mb-4">
                <div className="flex -space-x-2">
                  {event.guests.slice(0, 6).map((g: GuestParticipant) => (
                    <div
                      key={g.id}
                      className={`h-10 w-10 rounded-full border-2 border-background flex items-center justify-center text-[12px] font-bold ${
                        g.id === guestId
                          ? "bg-cherry text-white"
                          : "bg-cherry/10 text-cherry"
                      }`}
                    >
                      {g.displayName.charAt(0).toUpperCase()}
                    </div>
                  ))}
                  {event.guests.length > 6 && (
                    <div className="h-10 w-10 rounded-full border-2 border-background bg-card-border/30 flex items-center justify-center text-[11px] font-bold text-muted">
                      +{event.guests.length - 6}
                    </div>
                  )}
                </div>
                <span className="ml-3 text-[14px] font-semibold text-foreground nums">
                  {event.guests.length} <span className="text-muted font-medium">joined</span>
                </span>
              </div>
            )}

            {/* Full guest list card */}
            <div className="rounded-[16px] bg-card-bg border border-card-border shadow-[0_2px_8px_rgba(0,0,0,0.06),0_0_1px_rgba(0,0,0,0.04)] divide-y divide-card-border/40">
              {event.guests.map((g: GuestParticipant) => (
                <div
                  key={g.id}
                  className={`flex items-center gap-3 px-4 py-3 ${
                    g.id === guestId ? "bg-cherry/5" : ""
                  }`}
                >
                  <div className="h-9 w-9 rounded-[12px] bg-cherry/10 flex items-center justify-center text-[13px] font-bold text-cherry">
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
        <div className="px-4 md:px-8 lg:px-10 pt-6 pb-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <p className="text-[12px] font-bold text-cherry uppercase tracking-widest">
                Wine <span className="nums">#{event.currentWine}</span> — Revealed
              </p>
            </div>
            <div className="h-10 w-10 rounded-[16px] bg-amber-50 border border-amber-200 flex items-center justify-center">
              <Sparkles className="h-5 w-5 text-amber-600" />
            </div>
          </div>

          {/* Wine name card */}
          <div className="rounded-[16px] bg-card-bg border border-card-border shadow-[0_2px_8px_rgba(0,0,0,0.06),0_0_1px_rgba(0,0,0,0.04)] p-6 mb-4 animate-scale-in">
            <h2 className="text-2xl font-bold font-serif text-foreground tracking-tight mb-1">
              {actual.name}
            </h2>
            <p className="text-[14px] text-muted">
              {actual.producer}{actual.vintage ? ` · ${actual.vintage}` : " · NV"}
            </p>
          </div>

          {/* Comparison cards — staggered entrance */}
          <div className="space-y-2.5">
            <RevealCard label="Grape" icon={<Grape className="h-4 w-4" />} actual={actual.grapes.join(", ")} guessed={currentGuess?.guessedGrape} delay={0} />
            <RevealCard label="Region" icon={<MapPin className="h-4 w-4" />} actual={actual.region} guessed={currentGuess?.guessedRegion} delay={80} />
            <RevealCard label="Country" icon={<Globe className="h-4 w-4" />} actual={actual.country} guessed={currentGuess?.guessedCountry} delay={160} />
            <RevealCard label="Vintage" icon={<Clock className="h-4 w-4" />} actual={actual.vintage?.toString() ?? "NV"} guessed={currentGuess?.guessedVintage?.toString()} delay={240} />
            <RevealCard label="Type" icon={<Wine className="h-4 w-4" />} actual={actual.type} guessed={currentGuess?.guessedType} delay={320} />
            <RevealCard label="Producer" icon={<Tag className="h-4 w-4" />} actual={actual.producer} guessed={currentGuess?.guessedProducer} delay={400} />
          </div>

          {/* Score — animated count-up */}
          {currentGuess?.score != null && (
            <div className="rounded-[16px] bg-card-bg border border-card-border shadow-[0_2px_8px_rgba(0,0,0,0.06),0_0_1px_rgba(0,0,0,0.04)] p-5 mt-4 flex items-center justify-between">
              <span className="text-[14px] font-medium text-muted">Your score</span>
              <AnimatedScore value={currentGuess.score} />
            </div>
          )}

          {/* Progress indicator */}
          <div className="rounded-[16px] bg-card-bg border border-card-border shadow-[0_2px_8px_rgba(0,0,0,0.06),0_0_1px_rgba(0,0,0,0.04)] p-4 mt-6 flex items-center gap-3">
            <Loader2 className="h-4 w-4 animate-spin text-cherry flex-shrink-0" />
            <div className="flex-1">
              <p className="text-[14px] font-medium text-foreground">
                {event.currentWine < event.wines.length
                  ? "Waiting for next wine..."
                  : "Last wine — waiting for results..."}
              </p>
              <p className="text-[12px] text-muted mt-0.5 nums">
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

  // Toggle accordion — only one open at a time
  const toggleField = (field: string) => {
    setOpenField((prev) => (prev === field ? null : field));
  };

  // Filtered countries for bottom sheet search
  const filteredCountries = WINE_COUNTRIES.filter((c) =>
    c.name.toLowerCase().includes(sheetSearch.toLowerCase())
  );

  // Filtered grapes for bottom sheet search
  const filteredGrapeCategories = GRAPE_CATEGORIES.map((cat) => ({
    ...cat,
    grapes: cat.grapes.filter((g) => g.toLowerCase().includes(sheetSearch.toLowerCase())),
  })).filter((cat) => cat.grapes.length > 0);

  return (
    <div className="fixed inset-0 flex flex-col bg-background safe-top safe-bottom">
      {/* Header */}
      <div className="px-4 md:px-8 lg:px-10 pt-5 pb-2">
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-[11px] font-bold text-muted uppercase tracking-widest">
              {event.title}
            </p>
            <h1 className="text-[26px] font-bold text-foreground tracking-tight mt-0.5">
              Wine <span className="nums">#{event.currentWine}</span>
            </h1>
          </div>
          <div className="h-12 w-12 rounded-[16px] bg-cherry/10 flex items-center justify-center">
            <Wine className="h-6 w-6 text-cherry" />
          </div>
        </div>

        {/* Wine Progress Bar */}
        <WineProgressBar current={event.currentWine} total={event.wines.length} />
      </div>

      {/* Form */}
      <div className="flex-1 overflow-y-auto scroll-smooth">
        <div className="px-4 md:px-8 lg:px-10 pb-32 pt-2">
          {submitted && !editing ? (
            /* ---- Submitted confirmation ---- */
            <div className="rounded-[16px] bg-card-bg border border-card-border shadow-[0_2px_8px_rgba(0,0,0,0.06),0_0_1px_rgba(0,0,0,0.04)] p-6 animate-scale-in">
              <div className="flex items-center gap-3 mb-5">
                <div className="h-10 w-10 rounded-[16px] bg-green-50 border border-green-200 flex items-center justify-center">
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

              {!isWineLocked && (
                <button
                  onClick={() => setEditing(true)}
                  className="mt-5 flex items-center gap-2 text-cherry font-semibold text-[14px] touch-target"
                >
                  <Pencil className="h-4 w-4" />
                  Edit guess
                </button>
              )}
              {isWineLocked && (
                <p className="mt-4 text-[12px] text-muted flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5" />
                  Guesses locked — wine has been revealed
                </p>
              )}
            </div>
          ) : (
            /* ---- Accordion Guess form ---- */
            <div className="space-y-2">
              {/* Type */}
              {guessFields.includes("type") && (
                <AccordionField
                  label="Type"
                  icon={<Wine className="h-4 w-4" />}
                  value={form.type}
                  isOpen={openField === "type"}
                  onToggle={() => toggleField("type")}
                >
                  <div className="grid grid-cols-2 gap-2 pt-3">
                    {WINE_TYPES.map((t) => (
                      <button
                        key={t.value}
                        type="button"
                        onClick={() => {
                          setForm((f) => ({ ...f, type: f.type === t.value ? "" : t.value }));
                        }}
                        className={`touch-target rounded-[16px] py-4 px-3 text-center transition-all ${
                          form.type === t.value
                            ? "bg-cherry text-white shadow-sm ring-2 ring-cherry/30 scale-[1.02]"
                            : "bg-card-bg border border-card-border text-foreground active:scale-[0.97]"
                        }`}
                      >
                        <span className="text-2xl block">{t.emoji}</span>
                        <span className="text-[13px] font-semibold mt-1.5 block">{t.value}</span>
                      </button>
                    ))}
                  </div>
                </AccordionField>
              )}

              {/* Grape */}
              {guessFields.includes("grape") && (
                <AccordionField
                  label="Grape"
                  icon={<Grape className="h-4 w-4" />}
                  value={form.grape}
                  isOpen={openField === "grape"}
                  onToggle={() => toggleField("grape")}
                >
                  <div className="pt-3 space-y-3">
                    <input
                      type="text"
                      value={form.grape}
                      onChange={(e) => setForm((f) => ({ ...f, grape: e.target.value }))}
                      placeholder="e.g. Pinot Noir"
                      className="input-field w-full touch-target"
                    />
                    <div className="flex flex-wrap gap-1.5">
                      {QUICK_GRAPES.map((g) => (
                        <button
                          key={g}
                          type="button"
                          onClick={() => setForm((f) => ({ ...f, grape: g }))}
                          className={`px-3 py-2 rounded-[10px] text-[13px] font-medium transition-all ${
                            form.grape === g
                              ? "bg-cherry text-white shadow-sm"
                              : "bg-card-bg border border-card-border text-foreground active:scale-[0.95]"
                          }`}
                        >
                          {g}
                        </button>
                      ))}
                    </div>
                    <button
                      type="button"
                      onClick={() => { setSheetSearch(""); setGrapeSheetOpen(true); }}
                      className="w-full py-2.5 rounded-[12px] border-2 border-dashed border-cherry/20 text-cherry text-[13px] font-semibold touch-target active:bg-cherry/5 transition-colors"
                    >
                      Browse all grapes
                    </button>
                  </div>
                </AccordionField>
              )}

              {/* Region */}
              {guessFields.includes("region") && (
                <AccordionField
                  label="Region"
                  icon={<MapPin className="h-4 w-4" />}
                  value={form.region}
                  isOpen={openField === "region"}
                  onToggle={() => toggleField("region")}
                >
                  <div className="pt-3">
                    <input
                      type="text"
                      value={form.region}
                      onChange={(e) => setForm((f) => ({ ...f, region: e.target.value }))}
                      placeholder="e.g. Burgundy, Napa Valley"
                      className="input-field w-full touch-target"
                    />
                  </div>
                </AccordionField>
              )}

              {/* Country */}
              {guessFields.includes("country") && (
                <AccordionField
                  label="Country"
                  icon={<Globe className="h-4 w-4" />}
                  value={form.country ? `${WINE_COUNTRIES.find((c) => c.name === form.country)?.flag ?? ""} ${form.country}` : ""}
                  isOpen={openField === "country"}
                  onToggle={() => toggleField("country")}
                >
                  <div className="pt-3">
                    <button
                      type="button"
                      onClick={() => { setSheetSearch(""); setCountrySheetOpen(true); }}
                      className={`w-full py-3.5 px-4 rounded-[16px] border text-left touch-target transition-colors ${
                        form.country
                          ? "bg-card-bg border-card-border text-foreground"
                          : "border-dashed border-cherry/20 text-muted"
                      }`}
                    >
                      {form.country ? (
                        <span className="text-[15px] font-medium">
                          {WINE_COUNTRIES.find((c) => c.name === form.country)?.flag} {form.country}
                        </span>
                      ) : (
                        <span className="text-[15px]">Tap to select country</span>
                      )}
                    </button>
                  </div>
                </AccordionField>
              )}

              {/* Vintage */}
              {guessFields.includes("vintage") && (
                <AccordionField
                  label="Vintage"
                  icon={<Clock className="h-4 w-4" />}
                  value={form.vintage}
                  isOpen={openField === "vintage"}
                  onToggle={() => toggleField("vintage")}
                >
                  <div className="pt-3 flex justify-center">
                    <input
                      type="number"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      value={form.vintage}
                      onChange={(e) => setForm((f) => ({ ...f, vintage: e.target.value }))}
                      placeholder="2020"
                      min={1900}
                      max={2099}
                      className="input-field w-full text-center text-2xl font-bold nums touch-target tracking-wide"
                    />
                  </div>
                </AccordionField>
              )}

              {/* Producer */}
              {guessFields.includes("producer") && (
                <AccordionField
                  label="Producer"
                  icon={<Tag className="h-4 w-4" />}
                  value={form.producer}
                  isOpen={openField === "producer"}
                  onToggle={() => toggleField("producer")}
                >
                  <div className="pt-3">
                    <input
                      type="text"
                      value={form.producer}
                      onChange={(e) => setForm((f) => ({ ...f, producer: e.target.value }))}
                      placeholder="e.g. Domaine de la Romanée-Conti"
                      className="input-field w-full touch-target"
                    />
                  </div>
                </AccordionField>
              )}

              {/* Price */}
              {guessFields.includes("price") && (
                <AccordionField
                  label="Price"
                  icon={<DollarSign className="h-4 w-4" />}
                  value={form.price ? `$${form.price}` : ""}
                  isOpen={openField === "price"}
                  onToggle={() => toggleField("price")}
                >
                  <div className="pt-3 relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 mt-1.5 text-[16px] font-semibold text-muted">$</span>
                    <input
                      type="number"
                      inputMode="decimal"
                      value={form.price}
                      onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
                      placeholder="45"
                      min={0}
                      className="input-field w-full touch-target pl-8 nums"
                    />
                  </div>
                </AccordionField>
              )}

              {/* Tasting Notes — always visible, not in accordion */}
              <div className="rounded-[16px] bg-card-bg border border-card-border shadow-[0_2px_8px_rgba(0,0,0,0.06),0_0_1px_rgba(0,0,0,0.04)] p-4">
                <label className="text-[11px] font-bold text-muted uppercase tracking-wide block mb-2">
                  Tasting Notes
                </label>
                <textarea
                  value={form.notes}
                  onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                  placeholder="What do you taste? Aromas, flavors, texture..."
                  rows={3}
                  className="input-field w-full resize-none"
                />
              </div>

              {error && (
                <div className="rounded-[16px] bg-red-50 border border-red-200 p-3">
                  <p className="text-red-600 text-[13px] font-medium">{error}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Sticky submit button */}
      {(!submitted || editing) && !isWineLocked && (
        <div className="fixed bottom-0 left-0 right-0 safe-bottom z-50">
          <div className="px-4 md:px-8 lg:px-10 pb-5 pt-3 bg-gradient-to-t from-background via-background to-transparent">
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

      {/* Country Bottom Sheet */}
      <BottomSheet
        open={countrySheetOpen}
        onClose={() => setCountrySheetOpen(false)}
        title="Select Country"
      >
        <div className="px-5 pb-3 pt-1">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
            <input
              ref={sheetSearchRef}
              type="text"
              value={sheetSearch}
              onChange={(e) => setSheetSearch(e.target.value)}
              placeholder="Search countries..."
              className="input-field w-full pl-10 touch-target"
              autoFocus
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto overscroll-contain px-2 pb-safe">
          {filteredCountries.map((c) => (
            <button
              key={c.name}
              type="button"
              onClick={() => {
                setForm((f) => ({ ...f, country: c.name }));
                setCountrySheetOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-[12px] touch-target transition-colors ${
                form.country === c.name
                  ? "bg-cherry/10 text-cherry"
                  : "text-foreground active:bg-card-border/20"
              }`}
            >
              <span className="text-xl">{c.flag}</span>
              <span className="text-[15px] font-medium flex-1 text-left">{c.name}</span>
              {form.country === c.name && <Check className="h-4 w-4 text-cherry" />}
            </button>
          ))}
        </div>
      </BottomSheet>

      {/* Grape Bottom Sheet */}
      <BottomSheet
        open={grapeSheetOpen}
        onClose={() => setGrapeSheetOpen(false)}
        title="Select Grape"
      >
        <div className="px-5 pb-3 pt-1">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
            <input
              type="text"
              value={sheetSearch}
              onChange={(e) => setSheetSearch(e.target.value)}
              placeholder="Search grapes..."
              className="input-field w-full pl-10 touch-target"
              autoFocus
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto overscroll-contain px-2 pb-safe">
          {filteredGrapeCategories.map((cat) => (
            <div key={cat.label}>
              <div className="px-4 pt-3 pb-1.5 sticky top-0 bg-card-bg z-10">
                <span className="text-[11px] font-bold text-muted uppercase tracking-wide">{cat.label}</span>
              </div>
              {cat.grapes.map((g) => (
                <button
                  key={g}
                  type="button"
                  onClick={() => {
                    setForm((f) => ({ ...f, grape: g }));
                    setGrapeSheetOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-[12px] touch-target transition-colors ${
                    form.grape === g
                      ? "bg-cherry/10 text-cherry"
                      : "text-foreground active:bg-card-border/20"
                  }`}
                >
                  <span className="text-[15px] font-medium flex-1 text-left">{g}</span>
                  {form.grape === g && <Check className="h-4 w-4 text-cherry" />}
                </button>
              ))}
            </div>
          ))}
          {/* Custom entry */}
          {sheetSearch && !GRAPE_CATEGORIES.some((c) => c.grapes.some((g) => g.toLowerCase() === sheetSearch.toLowerCase())) && (
            <button
              type="button"
              onClick={() => {
                setForm((f) => ({ ...f, grape: sheetSearch }));
                setGrapeSheetOpen(false);
              }}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-[12px] touch-target text-cherry active:bg-cherry/5 transition-colors"
            >
              <span className="text-[15px] font-medium flex-1 text-left">Use &ldquo;{sheetSearch}&rdquo;</span>
              <ChevronRight className="h-4 w-4" />
            </button>
          )}
        </div>
      </BottomSheet>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Wine Progress Bar
// ---------------------------------------------------------------------------

function WineProgressBar({ current, total }: { current: number; total: number }) {
  return (
    <div>
      <div className="flex gap-1.5">
        {Array.from({ length: total }, (_, i) => {
          const pos = i + 1;
          const state = pos < current ? "done" : pos === current ? "current" : "future";
          return (
            <div
              key={pos}
              className="progress-segment flex-1"
              data-state={state}
            />
          );
        })}
      </div>
      <p className="text-[11px] font-semibold text-muted mt-1.5 nums">
        Wine {current} of {total}
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Accordion Field
// ---------------------------------------------------------------------------

function AccordionField({
  label,
  icon,
  value,
  isOpen,
  onToggle,
  children,
}: {
  label: string;
  icon: React.ReactNode;
  value: string;
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-[16px] bg-card-bg border border-card-border shadow-[0_2px_8px_rgba(0,0,0,0.06),0_0_1px_rgba(0,0,0,0.04)] overflow-hidden">
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center gap-3 px-4 py-3.5 touch-target"
      >
        <div className={`h-8 w-8 rounded-[10px] flex items-center justify-center flex-shrink-0 ${
          value ? "bg-green-50 text-green-600" : "bg-cherry/10 text-cherry"
        }`}>
          {value ? <Check className="h-4 w-4" strokeWidth={2.5} /> : icon}
        </div>
        <div className="flex-1 min-w-0 text-left">
          <span className="text-[11px] font-bold text-muted uppercase tracking-wide">{label}</span>
          {value && (
            <p className="text-[14px] font-semibold text-foreground truncate mt-0.5">{value}</p>
          )}
        </div>
        <ChevronRight
          className="h-4 w-4 text-muted flex-shrink-0 accordion-chevron"
          data-open={isOpen ? "true" : "false"}
        />
      </button>
      <div className="accordion-body" data-open={isOpen ? "true" : "false"}>
        <div>
          <div className="px-4 pb-4">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Bottom Sheet
// ---------------------------------------------------------------------------

function BottomSheet({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <>
      <div
        className="bottom-sheet-overlay"
        data-open={open ? "true" : "false"}
        onClick={onClose}
      />
      <div className="bottom-sheet safe-bottom" data-open={open ? "true" : "false"}>
        <div className="bottom-sheet-handle" />
        <div className="flex items-center justify-between px-5 py-3">
          <h3 className="text-[17px] font-bold text-foreground">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            className="h-8 w-8 rounded-[8px] bg-card-border/20 flex items-center justify-center touch-target"
          >
            <X className="h-4 w-4 text-muted" />
          </button>
        </div>
        {children}
      </div>
    </>
  );
}

// ---------------------------------------------------------------------------
// Summary pill (submitted guess recap)
// ---------------------------------------------------------------------------

function SummaryPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-2 px-1">
      <span className="text-[11px] font-bold text-muted uppercase tracking-wide">{label}</span>
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
  delay,
}: {
  label: string;
  icon: React.ReactNode;
  actual: string;
  guessed?: string | null;
  delay?: number;
}) {
  const isMatch =
    guessed != null &&
    guessed !== "" &&
    actual.toLowerCase().includes(guessed.toLowerCase());

  return (
    <div
      className="rounded-[16px] bg-card-bg border border-card-border shadow-[0_2px_8px_rgba(0,0,0,0.06),0_0_1px_rgba(0,0,0,0.04)] p-4 flex items-center gap-3.5 animate-card-reveal"
      style={delay ? { animationDelay: `${delay}ms` } : undefined}
    >
      <div className={`h-10 w-10 rounded-[12px] bg-card-bg border border-card-border flex items-center justify-center flex-shrink-0 ${
        !guessed ? "text-muted/40" : isMatch ? "text-green-600" : "text-red-500"
      }`}>
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[11px] font-bold text-muted uppercase tracking-wide">{label}</p>
        <p className="text-[15px] font-bold text-foreground mt-0.5">{actual}</p>
        {guessed && !isMatch && (
          <p className="text-[12px] text-red-400 line-through mt-0.5 animate-gentle-shake">{guessed}</p>
        )}
      </div>
      <div className="flex-shrink-0">
        {guessed ? (
          isMatch ? (
            <div className="h-7 w-7 rounded-full bg-green-100 flex items-center justify-center animate-match-pulse">
              <Check className="h-4 w-4 text-green-600" strokeWidth={3} />
            </div>
          ) : (
            <div className="h-7 w-7 rounded-full bg-red-50 flex items-center justify-center">
              <X className="h-4 w-4 text-red-500" strokeWidth={3} />
            </div>
          )
        ) : (
          <div className="h-7 w-7 rounded-full border-2 border-dashed border-card-border" />
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Animated Score Counter
// ---------------------------------------------------------------------------

function AnimatedScore({ value }: { value: number }) {
  const [display, setDisplay] = useState(0);
  const hasAnimated = useRef(false);

  useEffect(() => {
    if (hasAnimated.current) return;
    hasAnimated.current = true;
    const duration = 600;
    const start = performance.now();
    function step(now: number) {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // easeOutCubic
      setDisplay(Math.round(eased * value));
      if (progress < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }, [value]);

  return (
    <span className="text-4xl font-bold nums text-cherry animate-score-reveal">
      {display} <span className="text-[14px] font-semibold text-muted">pts</span>
    </span>
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

  // Per-wine score breakdown for current player
  const myWineScores = event.guesses
    .filter((g) => g.guestId === guestId)
    .sort((a, b) => a.winePosition - b.winePosition);

  const MEDAL_COLORS = [
    "bg-amber-400 text-white",     // gold
    "bg-gray-300 text-gray-700",   // silver
    "bg-orange-300 text-orange-800", // bronze
  ];

  return (
    <div className="fixed inset-0 flex flex-col bg-background safe-top safe-bottom overflow-y-auto">
      <div className="px-4 md:px-8 lg:px-10 pt-8 pb-8">
        {/* Trophy header */}
        <div className="text-center mb-8 animate-fade-in-up">
          <div className="h-20 w-20 rounded-[16px] bg-amber-50 border border-amber-200 flex items-center justify-center mx-auto mb-5 animate-cheers">
            <Trophy className="h-10 w-10 text-amber-600" />
          </div>
          <h1 className="text-3xl font-bold font-serif text-foreground tracking-tight">Tasting Complete!</h1>
          <p className="text-muted mt-2 text-[15px]">{event.title}</p>
          {myRank > 0 && (
            <p className="mt-3 text-cherry font-bold text-[18px] nums">
              You placed #{myRank} of {ranked.length}
            </p>
          )}
        </div>

        {/* Per-wine breakdown */}
        {myWineScores.length > 0 && (
          <div className="rounded-[16px] bg-card-bg border border-card-border shadow-[0_2px_8px_rgba(0,0,0,0.06),0_0_1px_rgba(0,0,0,0.04)] p-4 mb-6 animate-fade-in-up">
            <h3 className="text-[11px] font-bold text-muted uppercase tracking-wide mb-3">Your Breakdown</h3>
            <div className="space-y-1.5">
              {myWineScores.map((ws) => (
                <div key={ws.id} className="flex items-center justify-between py-1">
                  <span className="text-[13px] text-muted font-medium nums">Wine #{ws.winePosition}</span>
                  <span className="text-[14px] font-bold text-foreground nums">{ws.score ?? 0} pts</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Scoreboard */}
        <h2 className="text-[11px] font-bold text-muted uppercase tracking-wide mb-3">
          Scoreboard
        </h2>
        <div className="rounded-[16px] bg-card-bg border border-card-border shadow-[0_2px_8px_rgba(0,0,0,0.06),0_0_1px_rgba(0,0,0,0.04)] overflow-hidden stagger-children">
          {ranked.map((g, i) => (
            <div
              key={g.id}
              className={`flex items-center gap-3.5 px-4 ${
                i < 3 ? "py-4" : "py-3.5"
              } ${
                i === 0 ? "bg-widget-gold/30" : g.id === guestId ? "bg-cherry/5" : ""
              } ${
                g.id === guestId ? "border-l-4 border-cherry" : ""
              } ${
                i < ranked.length - 1 ? "border-b border-card-border/30" : ""
              }`}
            >
              <div className={`${i < 3 ? "h-10 w-10" : "h-9 w-9"} rounded-[12px] flex items-center justify-center text-[13px] font-bold flex-shrink-0 ${
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
              <span className="text-[16px] font-bold nums text-foreground">
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
