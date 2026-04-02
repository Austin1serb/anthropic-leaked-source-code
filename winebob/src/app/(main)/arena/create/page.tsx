"use client";

import { useState, useEffect, useTransition, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import {
  Search,
  Plus,
  X,
  ChevronRight,
  ChevronLeft,
  Wine,
  Check,
} from "lucide-react";
import { createEvent, getTemplates, searchWines } from "@/lib/actions";

// ============ TYPES ============

type Template = {
  id: string;
  name: string;
  description: string | null;
  theme: string | null;
  difficulty: string;
  wineCount: number;
  guessFields: string[];
  scoringConfig: unknown;
  category: string | null;
};

type WineResult = {
  id: string;
  name: string;
  producer: string;
  vintage: number | null;
  grapes: string[];
  region: string;
  country: string;
  type: string;
};

// ============ CONSTANTS ============

const DIFFICULTIES = ["beginner", "intermediate", "advanced", "master"] as const;

const ALL_GUESS_FIELDS = [
  "grape",
  "region",
  "country",
  "vintage",
  "producer",
  "type",
  "price",
] as const;

const GUESS_FIELD_LABELS: Record<string, string> = {
  grape: "Grape",
  region: "Region",
  country: "Country",
  vintage: "Vintage",
  producer: "Producer",
  type: "Type",
  price: "Price",
};

const DEFAULT_SCORING: Record<string, number> = {
  grape: 25,
  region: 20,
  country: 15,
  vintage: 15,
  producer: 15,
  type: 10,
};

const STEP_LABELS = ["Start", "Configure", "Wines", "Review"];

// ============ INNER COMPONENT (uses useSearchParams) ============

function CreateEventInner() {
  const searchParams = useSearchParams();
  const templateParam = searchParams.get("template");

  const [step, setStep] = useState(templateParam ? 2 : 1);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [templatesLoading, setTemplatesLoading] = useState(true);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(
    templateParam
  );

  // Step 2 state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [difficulty, setDifficulty] = useState("intermediate");
  const [guessFields, setGuessFields] = useState<string[]>([
    "grape",
    "region",
    "country",
    "vintage",
  ]);
  const [timerEnabled, setTimerEnabled] = useState(false);
  const [timePerWine, setTimePerWine] = useState(120);

  // Step 3 state
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<WineResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedWines, setSelectedWines] = useState<WineResult[]>([]);

  // Step 4 state
  const [isPending, startTransition] = useTransition();

  // ============ LOAD TEMPLATES ============

  useEffect(() => {
    getTemplates().then((data) => {
      setTemplates(data as Template[]);
      setTemplatesLoading(false);

      // If template param exists, pre-fill from it
      if (templateParam) {
        const tmpl = (data as Template[]).find((t) => t.id === templateParam);
        if (tmpl) {
          applyTemplate(tmpl);
        }
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ============ TEMPLATE HELPERS ============

  function applyTemplate(tmpl: Template) {
    setSelectedTemplateId(tmpl.id);
    setTitle(tmpl.name);
    setDescription(tmpl.description ?? "");
    setDifficulty(tmpl.difficulty);
    if (tmpl.guessFields.length > 0) {
      setGuessFields(tmpl.guessFields);
    }
  }

  // ============ WINE SEARCH ============

  const handleSearch = useCallback(async (query: string) => {
    setSearchQuery(query);
    if (query.trim().length < 2) {
      setSearchResults([]);
      return;
    }
    setSearching(true);
    try {
      const results = await searchWines(query);
      setSearchResults(results as WineResult[]);
    } finally {
      setSearching(false);
    }
  }, []);

  function addWine(wine: WineResult) {
    if (selectedWines.some((w) => w.id === wine.id)) return;
    setSelectedWines((prev) => [...prev, wine]);
  }

  function removeWine(wineId: string) {
    setSelectedWines((prev) => prev.filter((w) => w.id !== wineId));
  }

  // ============ GUESS FIELD TOGGLE ============

  function toggleGuessField(field: string) {
    setGuessFields((prev) =>
      prev.includes(field)
        ? prev.filter((f) => f !== field)
        : [...prev, field]
    );
  }

  // ============ CREATE EVENT ============

  function handleCreate() {
    startTransition(async () => {
      const scoringConfig: Record<string, number> = {};
      for (const field of guessFields) {
        scoringConfig[field] = DEFAULT_SCORING[field] ?? 10;
      }

      await createEvent({
        title: title.trim() || "Blind Tasting",
        description: description.trim() || undefined,
        templateId: selectedTemplateId ?? undefined,
        guessFields,
        scoringConfig,
        difficulty,
        timePerWine: timerEnabled ? timePerWine : undefined,
        wineIds: selectedWines.map((w) => w.id),
      });
      // createEvent redirects on success
    });
  }

  // ============ NAVIGATION ============

  function canGoNext(): boolean {
    if (step === 2) return title.trim().length > 0 && guessFields.length > 0;
    if (step === 3) return selectedWines.length > 0;
    return true;
  }

  // ============ RENDER: PROGRESS BAR ============

  function renderProgress() {
    return (
      <div className="flex items-center gap-1 mb-8">
        {STEP_LABELS.map((label, i) => {
          const stepNum = i + 1;
          const isActive = step === stepNum;
          const isDone = step > stepNum;
          return (
            <div key={label} className="flex-1 flex flex-col items-center gap-1.5">
              <div
                className={`h-1.5 w-full rounded-full transition-colors ${
                  isDone
                    ? "bg-wine-burgundy"
                    : isActive
                    ? "bg-wine-burgundy-light"
                    : "bg-card-border"
                }`}
              />
              <span
                className={`text-[10px] font-medium uppercase tracking-wider ${
                  isActive
                    ? "text-wine-burgundy"
                    : isDone
                    ? "text-wine-burgundy/70"
                    : "text-muted"
                }`}
              >
                {label}
              </span>
            </div>
          );
        })}
      </div>
    );
  }

  // ============ STEP 1: CHOOSE STARTING POINT ============

  function renderStep1() {
    return (
      <div className="animate-fade-in-up">
        <h1 className="font-serif text-2xl font-bold text-foreground mb-2">
          New Blind Tasting
        </h1>
        <p className="text-muted text-sm mb-8">
          Start from scratch or pick a template.
        </p>

        <button
          onClick={() => {
            setSelectedTemplateId(null);
            setStep(2);
          }}
          className="touch-target wine-card w-full flex items-center gap-4 p-5 mb-4 active:scale-[0.98] transition-transform"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-wine-burgundy/10">
            <Plus className="h-6 w-6 text-wine-burgundy" />
          </div>
          <div className="text-left flex-1">
            <p className="font-serif font-semibold text-foreground">
              Start from scratch
            </p>
            <p className="text-xs text-muted mt-0.5">
              Full control over every detail
            </p>
          </div>
          <ChevronRight className="h-5 w-5 text-muted" />
        </button>

        {templatesLoading ? (
          <div className="flex justify-center py-12">
            <div className="h-8 w-8 rounded-full border-2 border-wine-burgundy border-t-transparent animate-spin" />
          </div>
        ) : templates.length > 0 ? (
          <>
            <h2 className="font-serif text-sm font-semibold text-muted uppercase tracking-wide mb-3 mt-8">
              Templates
            </h2>
            <div className="flex flex-col gap-3">
              {templates.map((tmpl) => (
                <button
                  key={tmpl.id}
                  onClick={() => {
                    applyTemplate(tmpl);
                    setStep(2);
                  }}
                  className="touch-target wine-card w-full text-left p-4 active:scale-[0.98] transition-transform"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-serif font-semibold text-sm text-foreground leading-tight line-clamp-1">
                        {tmpl.name}
                      </h3>
                      {tmpl.description && (
                        <p className="mt-1 text-xs text-muted line-clamp-2 leading-relaxed">
                          {tmpl.description}
                        </p>
                      )}
                      <div className="mt-2.5 flex items-center gap-2 flex-wrap">
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                            tmpl.difficulty === "beginner"
                              ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                              : tmpl.difficulty === "intermediate"
                              ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                              : tmpl.difficulty === "advanced"
                              ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                              : "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200"
                          }`}
                        >
                          {tmpl.difficulty.charAt(0).toUpperCase() +
                            tmpl.difficulty.slice(1)}
                        </span>
                        <span className="inline-flex items-center gap-1 text-xs text-muted">
                          <Wine className="h-3 w-3" />
                          {tmpl.wineCount} wines
                        </span>
                      </div>
                    </div>
                    <ChevronRight className="h-5 w-5 text-muted flex-shrink-0 mt-0.5" />
                  </div>
                </button>
              ))}
            </div>
          </>
        ) : null}
      </div>
    );
  }

  // ============ STEP 2: CONFIGURE ============

  function renderStep2() {
    return (
      <div className="animate-fade-in-up">
        <h1 className="font-serif text-2xl font-bold text-foreground mb-6">
          Configure Event
        </h1>

        {/* Title */}
        <label className="block mb-5">
          <span className="text-sm font-semibold text-foreground">
            Event Title
          </span>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Friday Night Flight"
            className="touch-target mt-2 block w-full rounded-xl border border-card-border bg-card-bg px-4 py-3 text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-wine-burgundy/40"
          />
        </label>

        {/* Description */}
        <label className="block mb-5">
          <span className="text-sm font-semibold text-foreground">
            Description{" "}
            <span className="font-normal text-muted">(optional)</span>
          </span>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="A few words about this tasting..."
            rows={3}
            className="mt-2 block w-full rounded-xl border border-card-border bg-card-bg px-4 py-3 text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-wine-burgundy/40 resize-none"
          />
        </label>

        {/* Difficulty */}
        <div className="mb-5">
          <span className="text-sm font-semibold text-foreground block mb-2">
            Difficulty
          </span>
          <div className="flex gap-2 flex-wrap">
            {DIFFICULTIES.map((d) => (
              <button
                key={d}
                onClick={() => setDifficulty(d)}
                className={`touch-target rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                  difficulty === d
                    ? "bg-wine-burgundy text-white"
                    : "bg-card-bg border border-card-border text-foreground active:bg-wine-cream-dark"
                }`}
              >
                {d.charAt(0).toUpperCase() + d.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Guess Fields */}
        <div className="mb-5">
          <span className="text-sm font-semibold text-foreground block mb-2">
            Guess Fields
          </span>
          <p className="text-xs text-muted mb-3">
            What will your guests try to identify?
          </p>
          <div className="flex gap-2 flex-wrap">
            {ALL_GUESS_FIELDS.map((field) => {
              const active = guessFields.includes(field);
              return (
                <button
                  key={field}
                  onClick={() => toggleGuessField(field)}
                  className={`touch-target inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                    active
                      ? "bg-wine-burgundy text-white"
                      : "bg-card-bg border border-card-border text-foreground active:bg-wine-cream-dark"
                  }`}
                >
                  {active && <Check className="h-3.5 w-3.5" />}
                  {GUESS_FIELD_LABELS[field]}
                </button>
              );
            })}
          </div>
        </div>

        {/* Timer */}
        <div className="mb-2">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold text-foreground">
              Timer per wine
            </span>
            <button
              onClick={() => setTimerEnabled(!timerEnabled)}
              className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${
                timerEnabled ? "bg-wine-burgundy" : "bg-card-border"
              }`}
            >
              <span
                className={`inline-block h-5 w-5 rounded-full bg-white shadow transition-transform ${
                  timerEnabled ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
          </div>
          {timerEnabled && (
            <div className="flex items-center gap-3 mt-2">
              <input
                type="range"
                min={30}
                max={600}
                step={30}
                value={timePerWine}
                onChange={(e) => setTimePerWine(Number(e.target.value))}
                className="flex-1 accent-wine-burgundy"
              />
              <span className="text-sm font-medium text-foreground w-16 text-right">
                {Math.floor(timePerWine / 60)}:{String(timePerWine % 60).padStart(2, "0")}
              </span>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ============ STEP 3: ADD WINES ============

  function renderStep3() {
    return (
      <div className="animate-fade-in-up">
        <h1 className="font-serif text-2xl font-bold text-foreground mb-2">
          Add Wines
        </h1>
        <p className="text-muted text-sm mb-6">
          Search and add wines for your tasting flight.
        </p>

        {/* Search */}
        <div className="relative mb-5">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-muted pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Search by name, producer, region..."
            className="touch-target block w-full rounded-xl border border-card-border bg-card-bg pl-11 pr-4 py-3 text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-wine-burgundy/40"
          />
          {searching && (
            <div className="absolute right-3.5 top-1/2 -translate-y-1/2">
              <div className="h-4 w-4 rounded-full border-2 border-wine-burgundy border-t-transparent animate-spin" />
            </div>
          )}
        </div>

        {/* Search Results */}
        {searchResults.length > 0 && (
          <div className="flex flex-col gap-2 mb-6 max-h-64 overflow-y-auto scroll-smooth">
            {searchResults.map((wine) => {
              const alreadyAdded = selectedWines.some((w) => w.id === wine.id);
              return (
                <button
                  key={wine.id}
                  onClick={() => addWine(wine)}
                  disabled={alreadyAdded}
                  className={`touch-target wine-card w-full text-left p-3.5 transition-all ${
                    alreadyAdded
                      ? "opacity-50"
                      : "active:scale-[0.98]"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm text-foreground line-clamp-1">
                        {wine.name}
                      </p>
                      <p className="text-xs text-muted mt-0.5">
                        {wine.producer} &middot; {wine.region} &middot;{" "}
                        {wine.type}
                        {wine.vintage ? ` &middot; ${wine.vintage}` : ""}
                      </p>
                    </div>
                    {alreadyAdded ? (
                      <Check className="h-5 w-5 text-wine-sage flex-shrink-0" />
                    ) : (
                      <Plus className="h-5 w-5 text-wine-burgundy flex-shrink-0" />
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {/* Selected Wines */}
        <div className="mt-2">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-serif text-sm font-semibold text-foreground">
              Flight Order
            </h2>
            <span className="text-xs font-medium text-muted">
              {selectedWines.length} wine{selectedWines.length !== 1 ? "s" : ""}{" "}
              selected
            </span>
          </div>

          {selectedWines.length === 0 ? (
            <div className="wine-card flex flex-col items-center justify-center py-10 px-6 text-center">
              <Wine className="h-10 w-10 text-wine-gold/50 mb-3" />
              <p className="text-sm text-muted">
                Search above to add wines to your flight.
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {selectedWines.map((wine, idx) => (
                <div
                  key={wine.id}
                  className="wine-card flex items-center gap-3 p-3.5"
                >
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-wine-burgundy/10 text-xs font-bold text-wine-burgundy flex-shrink-0">
                    {idx + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm text-foreground line-clamp-1">
                      {wine.name}
                    </p>
                    <p className="text-xs text-muted mt-0.5 line-clamp-1">
                      {wine.producer} &middot; {wine.region}
                    </p>
                  </div>
                  <button
                    onClick={() => removeWine(wine.id)}
                    className="touch-target flex h-8 w-8 items-center justify-center rounded-full text-muted hover:text-red-500 active:bg-red-50 transition-colors flex-shrink-0"
                    aria-label={`Remove ${wine.name}`}
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // ============ STEP 4: REVIEW & CREATE ============

  function renderStep4() {
    return (
      <div className="animate-fade-in-up">
        <h1 className="font-serif text-2xl font-bold text-foreground mb-6">
          Review & Create
        </h1>

        <div className="wine-card p-5 mb-4">
          <h2 className="font-serif text-lg font-bold text-foreground">
            {title || "Blind Tasting"}
          </h2>
          {description && (
            <p className="text-sm text-muted mt-1">{description}</p>
          )}

          <div className="mt-4 flex flex-col gap-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted">Difficulty</span>
              <span className="font-medium text-foreground capitalize">
                {difficulty}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted">Timer</span>
              <span className="font-medium text-foreground">
                {timerEnabled
                  ? `${Math.floor(timePerWine / 60)}:${String(
                      timePerWine % 60
                    ).padStart(2, "0")} per wine`
                  : "Off"}
              </span>
            </div>
            <div>
              <span className="text-muted block mb-1.5">Guess Fields</span>
              <div className="flex gap-1.5 flex-wrap">
                {guessFields.map((f) => (
                  <span
                    key={f}
                    className="inline-flex items-center rounded-full bg-wine-burgundy/10 px-2.5 py-0.5 text-xs font-medium text-wine-burgundy"
                  >
                    {GUESS_FIELD_LABELS[f] ?? f}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="wine-card p-5 mb-6">
          <h3 className="font-serif text-sm font-semibold text-foreground mb-3">
            Wines ({selectedWines.length})
          </h3>
          <div className="flex flex-col gap-2">
            {selectedWines.map((wine, idx) => (
              <div key={wine.id} className="flex items-center gap-3">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-wine-burgundy/10 text-[10px] font-bold text-wine-burgundy flex-shrink-0">
                  {idx + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-foreground line-clamp-1">
                    {wine.name}
                  </p>
                  <p className="text-xs text-muted">{wine.producer}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <button
          onClick={handleCreate}
          disabled={isPending}
          className="touch-target w-full rounded-2xl bg-wine-burgundy py-4 text-white text-lg font-serif font-semibold shadow-lg active:scale-[0.98] transition-transform disabled:opacity-60 flex items-center justify-center gap-2"
        >
          {isPending ? (
            <>
              <div className="h-5 w-5 rounded-full border-2 border-white border-t-transparent animate-spin" />
              Creating...
            </>
          ) : (
            <>
              <Wine className="h-5 w-5" />
              Create Event
            </>
          )}
        </button>
      </div>
    );
  }

  // ============ MAIN RENDER ============

  return (
    <div className="min-h-screen px-4 pb-28 pt-6 safe-top">
      {renderProgress()}

      {step === 1 && renderStep1()}
      {step === 2 && renderStep2()}
      {step === 3 && renderStep3()}
      {step === 4 && renderStep4()}

      {/* Back / Next buttons */}
      {step > 1 && (
        <div className="fixed bottom-0 left-0 right-0 bg-background/90 backdrop-blur-sm border-t border-card-border px-4 py-3 safe-bottom flex gap-3">
          <button
            onClick={() => setStep((s) => s - 1)}
            className="touch-target flex-1 rounded-xl border border-card-border bg-card-bg py-3 text-foreground font-medium flex items-center justify-center gap-1.5 active:scale-[0.98] transition-transform"
          >
            <ChevronLeft className="h-4 w-4" />
            Back
          </button>
          {step < 4 ? (
            <button
              onClick={() => setStep((s) => s + 1)}
              disabled={!canGoNext()}
              className="touch-target flex-1 rounded-xl bg-wine-burgundy py-3 text-white font-medium flex items-center justify-center gap-1.5 active:scale-[0.98] transition-transform disabled:opacity-40"
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </button>
          ) : null}
        </div>
      )}
    </div>
  );
}

// ============ PAGE EXPORT (wrapped in Suspense) ============

export default function CreateEventPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="h-8 w-8 rounded-full border-2 border-wine-burgundy border-t-transparent animate-spin" />
        </div>
      }
    >
      <CreateEventInner />
    </Suspense>
  );
}
