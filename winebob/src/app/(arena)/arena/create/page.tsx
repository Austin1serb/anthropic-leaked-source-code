"use client";

import { useState, useEffect, useTransition, useCallback, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Search,
  Plus,
  X,
  ChevronRight,
  ChevronLeft,
  Wine,
  Check,
  Grape,
  MapPin,
  Globe,
  Clock,
  Tag,
  DollarSign,
  Sparkles,
  GlassWater,
} from "lucide-react";
import { createEvent, getTemplates, searchWines, getBrowseWines } from "@/lib/actions";
import { decodeHtmlEntities } from "@/lib/importers/normalize";

// Display-safe wine name (strips HTML entities from imported data)
function wineName(name: string): string {
  return decodeHtmlEntities(name);
}

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

const DIFFICULTIES = [
  { value: "beginner", label: "Beginner", emoji: "\u{1F331}", color: "bg-widget-sage", textColor: "text-emerald-700" },
  { value: "intermediate", label: "Intermediate", emoji: "\u{1F377}", color: "bg-widget-gold", textColor: "text-amber-700" },
  { value: "advanced", label: "Advanced", emoji: "\u{1F525}", color: "bg-widget-wine", textColor: "text-cherry" },
  { value: "master", label: "Master", emoji: "\u{1F451}", color: "bg-widget-lavender", textColor: "text-purple-700" },
] as const;

const ALL_GUESS_FIELDS = [
  { key: "grape", label: "Grape", icon: Grape, color: "bg-widget-wine", iconColor: "text-cherry" },
  { key: "region", label: "Region", icon: MapPin, color: "bg-widget-gold", iconColor: "text-amber-700" },
  { key: "country", label: "Country", icon: Globe, color: "bg-widget-sky", iconColor: "text-blue-600" },
  { key: "vintage", label: "Vintage", icon: Clock, color: "bg-widget-sage", iconColor: "text-emerald-700" },
  { key: "producer", label: "Producer", icon: Tag, color: "bg-widget-lavender", iconColor: "text-purple-600" },
  { key: "type", label: "Type", icon: Wine, color: "bg-widget-peach", iconColor: "text-orange-600" },
  { key: "price", label: "Price", icon: DollarSign, color: "bg-widget-gold", iconColor: "text-amber-700" },
] as const;

const DEFAULT_SCORING: Record<string, number> = {
  grape: 25,
  region: 20,
  country: 15,
  vintage: 15,
  producer: 15,
  type: 10,
};

const STEP_ICONS = [Sparkles, Wine, GlassWater, Check];
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
  const [browseWines, setBrowseWines] = useState<WineResult[]>([]);
  const [browseLoaded, setBrowseLoaded] = useState(false);
  const [typeFilter, setTypeFilter] = useState<string | null>(null);

  // Step 4 state
  const [isPending, startTransition] = useTransition();

  // ============ LOAD TEMPLATES ============

  useEffect(() => {
    getTemplates().then((data) => {
      setTemplates(data as Template[]);
      setTemplatesLoading(false);

      if (templateParam) {
        const tmpl = (data as Template[]).find((t) => t.id === templateParam);
        if (tmpl) {
          applyTemplate(tmpl);
        }
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ============ LOAD BROWSE WINES (on step 3 entry) ============

  useEffect(() => {
    if (step === 3 && !browseLoaded) {
      getBrowseWines().then((data) => {
        setBrowseWines(data as WineResult[]);
        setBrowseLoaded(true);
      });
    }
  }, [step, browseLoaded]);

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
    });
  }

  // ============ NAVIGATION ============

  function canGoNext(): boolean {
    if (step === 2) return title.trim().length > 0 && guessFields.length > 0;
    if (step === 3) return selectedWines.length > 0;
    return true;
  }

  function goNext() {
    if (step < 4 && canGoNext()) setStep((s) => s + 1);
  }

  function goBack() {
    if (step > 1) setStep((s) => s - 1);
  }

  // ============ SWIPE GESTURE ============

  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);

  function handleTouchStart(e: React.TouchEvent) {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  }

  function handleTouchEnd(e: React.TouchEvent) {
    if (touchStartX.current === null || touchStartY.current === null) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    const dy = e.changedTouches[0].clientY - touchStartY.current;
    touchStartX.current = null;
    touchStartY.current = null;

    // Only count horizontal swipes (not vertical scrolling)
    if (Math.abs(dx) < 60 || Math.abs(dy) > Math.abs(dx)) return;

    if (dx < 0) goNext();   // swipe left → next
    if (dx > 0) goBack();   // swipe right → back
  }

  // ============ RENDER: PROGRESS BAR ============

  function renderProgress() {
    return (
      <div className="mb-6 px-1">
        {/* Segmented bar */}
        <div className="flex gap-1.5 mb-2">
          {STEP_LABELS.map((label, i) => {
            const stepNum = i + 1;
            const state = step > stepNum ? "done" : step === stepNum ? "current" : "future";
            return (
              <div
                key={label}
                className="progress-segment flex-1"
                data-state={state}
              />
            );
          })}
        </div>
        {/* Labels */}
        <div className="flex">
          {STEP_LABELS.map((label, i) => {
            const stepNum = i + 1;
            const isActive = step === stepNum;
            const isDone = step > stepNum;
            return (
              <span
                key={label}
                className={`flex-1 text-center text-[10px] font-semibold tracking-wide ${
                  isActive ? "text-cherry" : isDone ? "text-foreground" : "text-muted/60"
                }`}
              >
                {label}
              </span>
            );
          })}
        </div>
      </div>
    );
  }

  // ============ STEP 1: CHOOSE STARTING POINT ============

  function renderStep1() {
    return (
      <div className="animate-fade-in-up">
        <h1 className="text-[28px] font-bold font-serif text-foreground tracking-tight mb-1">
          New Blind Tasting
        </h1>
        <p className="text-muted text-[15px] mb-8">
          Start from scratch or pick a template.
        </p>

        {/* From scratch */}
        <button
          onClick={() => {
            setSelectedTemplateId(null);
            setStep(2);
          }}
          className="touch-target w-full flex items-center gap-4 p-5 mb-6 active:scale-[0.98] transition-transform bg-card-bg border border-card-border rounded-[16px] shadow-[0_2px_8px_rgba(0,0,0,0.06),0_0_1px_rgba(0,0,0,0.04)]"
        >
          <div className="h-14 w-14 rounded-[16px] bg-cherry/10 flex items-center justify-center flex-shrink-0">
            <Plus className="h-6 w-6 text-cherry" />
          </div>
          <div className="text-left flex-1">
            <p className="font-bold text-[16px] text-foreground">
              Start from scratch
            </p>
            <p className="text-[13px] text-muted mt-0.5">
              Full control over every detail
            </p>
          </div>
          <ChevronRight className="h-5 w-5 text-muted/40" />
        </button>

        {templatesLoading ? (
          <div className="flex justify-center py-16">
            <div className="h-8 w-8 rounded-full border-2 border-cherry border-t-transparent animate-spin" />
          </div>
        ) : templates.length > 0 ? (
          <>
            <h2 className="text-[11px] font-bold text-muted uppercase tracking-wide mb-4">
              Templates
            </h2>
            <div className="space-y-3 stagger-children">
              {templates.map((tmpl, i) => {
                const color = [
                  "bg-widget-wine", "bg-widget-gold", "bg-widget-sage",
                  "bg-widget-sky", "bg-widget-lavender", "bg-widget-peach",
                ][i % 6];
                const iconColor = [
                  "text-cherry", "text-amber-700", "text-emerald-700",
                  "text-blue-600", "text-purple-600", "text-orange-600",
                ][i % 6];

                return (
                  <button
                    key={tmpl.id}
                    onClick={() => {
                      applyTemplate(tmpl);
                      setStep(2);
                    }}
                    className="touch-target w-full text-left p-4 active:scale-[0.98] transition-transform bg-card-bg border border-card-border rounded-[16px] shadow-[0_2px_8px_rgba(0,0,0,0.06),0_0_1px_rgba(0,0,0,0.04)]"
                  >
                    <div className="flex items-center gap-3.5">
                      <div className={`h-12 w-12 rounded-[16px] ${color} flex items-center justify-center flex-shrink-0`}>
                        <Wine className={`h-5 w-5 ${iconColor}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-[15px] text-foreground leading-tight line-clamp-1">
                          {tmpl.name}
                        </h3>
                        {tmpl.description && (
                          <p className="mt-1 text-[12px] text-muted line-clamp-1 leading-relaxed">
                            {tmpl.description}
                          </p>
                        )}
                        <div className="mt-2 flex items-center gap-2">
                          <span className="text-[11px] font-semibold text-muted nums">
                            {tmpl.wineCount} wines
                          </span>
                          <span className="text-muted/30">&middot;</span>
                          <span className={`text-[11px] font-semibold capitalize ${
                            tmpl.difficulty === "beginner" ? "text-emerald-600" :
                            tmpl.difficulty === "intermediate" ? "text-amber-600" :
                            tmpl.difficulty === "advanced" ? "text-red-600" : "text-purple-600"
                          }`}>
                            {tmpl.difficulty}
                          </span>
                        </div>
                      </div>
                      <ChevronRight className="h-5 w-5 text-muted/30 flex-shrink-0" />
                    </div>
                  </button>
                );
              })}
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
        <h1 className="text-[28px] font-bold font-serif text-foreground tracking-tight mb-1">
          Configure
        </h1>
        <p className="text-muted text-[15px] mb-7">
          Set up the details for your tasting.
        </p>

        {/* Title */}
        <label className="block mb-6">
          <span className="text-[11px] font-bold text-foreground uppercase tracking-wide">
            Event Title
          </span>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Friday Night Flight"
            className="input-field touch-target mt-2 block w-full"
          />
        </label>

        {/* Description */}
        <label className="block mb-6">
          <span className="text-[11px] font-bold text-foreground uppercase tracking-wide">
            Description{" "}
            <span className="font-normal normal-case text-muted tracking-normal">(optional)</span>
          </span>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="A few words about this tasting..."
            rows={3}
            className="input-field mt-2 block w-full resize-none"
          />
        </label>

        {/* Difficulty — 2x2 grid with 16px radius */}
        <div className="mb-6">
          <span className="text-[13px] font-bold text-foreground uppercase tracking-wide block mb-3">
            Difficulty
          </span>
          <div className="grid grid-cols-2 gap-2.5">
            {DIFFICULTIES.map((d) => {
              const isActive = difficulty === d.value;
              return (
                <button
                  key={d.value}
                  onClick={() => setDifficulty(d.value)}
                  className={`touch-target rounded-[16px] p-3.5 text-left transition-all ${
                    isActive
                      ? `${d.color} ring-2 ring-cherry/30 shadow-sm`
                      : "bg-card-bg border border-card-border"
                  }`}
                >
                  <span className="text-xl">{d.emoji}</span>
                  <p className={`mt-1.5 font-bold text-[14px] ${isActive ? d.textColor : "text-foreground"}`}>
                    {d.label}
                  </p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Guess Fields — 2-column grid */}
        <div className="mb-6">
          <span className="text-[13px] font-bold text-foreground uppercase tracking-wide block mb-1">
            Guess Fields
          </span>
          <p className="text-[12px] text-muted mb-3">
            What will your guests try to identify?
          </p>
          <div className="grid grid-cols-2 gap-2.5">
            {ALL_GUESS_FIELDS.map((field) => {
              const active = guessFields.includes(field.key);
              const Icon = field.icon;
              return (
                <button
                  key={field.key}
                  onClick={() => toggleGuessField(field.key)}
                  className={`touch-target rounded-[16px] p-3.5 flex items-center gap-3 transition-all ${
                    active
                      ? `${field.color} ring-2 ring-cherry/20 shadow-sm`
                      : "bg-card-bg border border-card-border"
                  }`}
                >
                  <div className={`h-9 w-9 rounded-[12px] flex items-center justify-center flex-shrink-0 ${
                    active ? "bg-white/50" : "bg-card-border/30"
                  }`}>
                    <Icon className={`h-4 w-4 ${active ? field.iconColor : "text-muted"}`} />
                  </div>
                  <div className="flex-1 text-left">
                    <p className={`font-semibold text-[13px] ${active ? "text-foreground" : "text-muted"}`}>
                      {field.label}
                    </p>
                  </div>
                  {active && (
                    <div className="h-5 w-5 rounded-full bg-cherry flex items-center justify-center flex-shrink-0">
                      <Check className="h-3 w-3 text-white" strokeWidth={3} />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Timer */}
        <div className="bg-card-bg border border-card-border rounded-[16px] shadow-[0_2px_8px_rgba(0,0,0,0.06),0_0_1px_rgba(0,0,0,0.04)] p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-[12px] widget-sky flex items-center justify-center">
                <Clock className="h-4.5 w-4.5 text-blue-600" />
              </div>
              <div>
                <span className="text-[14px] font-bold text-foreground">Timer per wine</span>
                {timerEnabled && (
                  <p className="text-[12px] text-muted mt-0.5 nums">
                    {Math.floor(timePerWine / 60)}:{String(timePerWine % 60).padStart(2, "0")} per wine
                  </p>
                )}
              </div>
            </div>
            <button
              onClick={() => setTimerEnabled(!timerEnabled)}
              className={`toggle-track ${timerEnabled ? "toggle-track-on" : "toggle-track-off"}`}
            >
              <span className={`toggle-thumb ${timerEnabled ? "toggle-thumb-on" : "toggle-thumb-off"}`} />
            </button>
          </div>
          {timerEnabled && (
            <div className="mt-4 pt-3 border-t border-card-border/40">
              <input
                type="range"
                min={30}
                max={600}
                step={30}
                value={timePerWine}
                onChange={(e) => setTimePerWine(Number(e.target.value))}
                className="w-full accent-cherry h-1.5"
              />
              <div className="flex justify-between mt-1">
                <span className="text-[10px] text-muted">0:30</span>
                <span className="text-[10px] text-muted">10:00</span>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ============ STEP 3: ADD WINES ============

  const WINE_TYPE_FILTERS = [
    { value: null, label: "All", emoji: "\u{1F377}" },
    { value: "red", label: "Red", emoji: "\u{1F534}" },
    { value: "white", label: "White", emoji: "\u26AA" },
    { value: "ros\u00E9", label: "Ros\u00E9", emoji: "\u{1FA77}" },
    { value: "sparkling", label: "Sparkling", emoji: "\u2728" },
    { value: "orange", label: "Orange", emoji: "\u{1F7E0}" },
    { value: "dessert", label: "Dessert", emoji: "\u{1F36F}" },
  ];

  // Wine list to display: search results take priority, then browse wines
  const displayWines = searchQuery.trim().length >= 2
    ? searchResults
    : browseWines.filter((w) => !typeFilter || w.type.toLowerCase() === typeFilter);

  function renderStep3() {
    return (
      <div className="animate-fade-in-up">
        {/* Selected wines count badge in header */}
        <div className="flex items-start justify-between mb-1">
          <h1 className="text-[28px] font-bold font-serif text-foreground tracking-tight">
            Add Wines
          </h1>
          {selectedWines.length > 0 && (
            <span className="mt-1.5 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-cherry text-white text-[12px] font-bold nums">
              <Wine className="h-3 w-3" />
              {selectedWines.length} selected
            </span>
          )}
        </div>
        <p className="text-muted text-[15px] mb-5">
          Tap to add wines to your flight.
        </p>

        {/* Search */}
        <div className="relative mb-4">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted/50 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Search by name, producer, region..."
            className="input-field touch-target block w-full pl-12 pr-4"
          />
          {searching && (
            <div className="absolute right-4 top-1/2 -translate-y-1/2">
              <div className="h-4 w-4 rounded-full border-2 border-cherry border-t-transparent animate-spin" />
            </div>
          )}
        </div>

        {/* Type filter chips (only show when browsing, not searching) */}
        {searchQuery.trim().length < 2 && (
          <div className="flex gap-2 overflow-x-auto pb-3 scrollbar-hide mb-2">
            {WINE_TYPE_FILTERS.map((f) => (
              <button
                key={f.label}
                onClick={() => setTypeFilter(f.value)}
                className={`flex-shrink-0 inline-flex items-center gap-1.5 px-3.5 py-2 rounded-[12px] text-[13px] font-semibold transition-all ${
                  typeFilter === f.value
                    ? "bg-cherry text-white shadow-sm"
                    : "bg-card-bg border border-card-border text-foreground active:scale-[0.95]"
                }`}
              >
                <span className="text-[14px]">{f.emoji}</span>
                {f.label}
              </button>
            ))}
          </div>
        )}

        {/* Wine list */}
        {!browseLoaded && searchQuery.trim().length < 2 ? (
          <div className="flex justify-center py-12">
            <div className="h-6 w-6 rounded-full border-2 border-cherry border-t-transparent animate-spin" />
          </div>
        ) : displayWines.length === 0 ? (
          <div className="bg-card-bg border border-card-border rounded-[16px] shadow-[0_2px_8px_rgba(0,0,0,0.06),0_0_1px_rgba(0,0,0,0.04)] flex flex-col items-center justify-center py-10 px-6 text-center mb-4">
            <p className="text-[14px] text-muted">
              {searchQuery.trim().length >= 2 ? "No wines found" : "No wines in this category"}
            </p>
          </div>
        ) : (
          <div className="bg-card-bg border border-card-border rounded-[16px] shadow-[0_2px_8px_rgba(0,0,0,0.06),0_0_1px_rgba(0,0,0,0.04)] divide-y divide-card-border/40 mb-4 max-h-[340px] overflow-y-auto">
            {displayWines.map((wine) => {
              const alreadyAdded = selectedWines.some((w) => w.id === wine.id);
              const typeColor =
                wine.type.toLowerCase() === "red" ? "bg-red-500" :
                wine.type.toLowerCase() === "white" ? "bg-amber-200" :
                wine.type.toLowerCase() === "ros\u00E9" ? "bg-pink-300" :
                wine.type.toLowerCase() === "sparkling" ? "bg-yellow-300" :
                wine.type.toLowerCase() === "orange" ? "bg-orange-300" :
                wine.type.toLowerCase() === "dessert" ? "bg-amber-300" : "bg-gray-300";

              return (
                <button
                  key={wine.id}
                  onClick={() => alreadyAdded ? removeWine(wine.id) : addWine(wine)}
                  className={`touch-target w-full text-left px-4 py-3 flex items-center gap-3 transition-all ${
                    alreadyAdded ? "bg-widget-wine/40" : "active:bg-widget-wine/20"
                  }`}
                >
                  {/* Wine type dot */}
                  <div className={`h-3 w-3 rounded-full ${typeColor} flex-shrink-0`} />

                  <div className="flex-1 min-w-0">
                    <p className={`font-semibold font-serif text-[14px] leading-tight line-clamp-1 ${alreadyAdded ? "text-cherry" : "text-foreground"}`}>
                      {wineName(wine.name)}
                    </p>
                    <p className="text-[11px] text-muted mt-0.5 line-clamp-1">
                      {wineName(wine.producer)}{wine.region ? ` \u00B7 ${wine.region}` : ""}
                      {wine.vintage ? <span className="nums"> \u00B7 {wine.vintage}</span> : ""}
                    </p>
                  </div>

                  {alreadyAdded ? (
                    <div className="h-7 w-7 rounded-full bg-cherry flex items-center justify-center flex-shrink-0">
                      <Check className="h-3.5 w-3.5 text-white" strokeWidth={3} />
                    </div>
                  ) : (
                    <div className="h-7 w-7 rounded-full bg-card-border/30 flex items-center justify-center flex-shrink-0">
                      <Plus className="h-4 w-4 text-muted" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        )}

        {/* Selected wines — Flight Order */}
        {selectedWines.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-3 mt-2">
              <h2 className="text-[11px] font-bold text-foreground uppercase tracking-wide">
                Flight Order
              </h2>
              <button
                onClick={() => setSelectedWines([])}
                className="text-[11px] font-semibold text-cherry active:opacity-70"
              >
                Clear all
              </button>
            </div>
            <div className="space-y-2">
              {selectedWines.map((wine, idx) => (
                <div
                  key={wine.id}
                  className="bg-card-bg border border-card-border rounded-[16px] shadow-[0_2px_8px_rgba(0,0,0,0.06),0_0_1px_rgba(0,0,0,0.04)] flex items-center gap-3 p-3.5 animate-scale-in"
                >
                  <span className="flex h-9 w-9 items-center justify-center rounded-[12px] widget-wine text-[13px] font-bold text-cherry flex-shrink-0 nums">
                    {idx + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold font-serif text-[14px] text-foreground line-clamp-1">
                      {wineName(wine.name)}
                    </p>
                    <p className="text-[11px] text-muted mt-0.5 line-clamp-1">
                      {wineName(wine.producer)}{wine.region ? ` \u00B7 ${wine.region}` : ""}
                    </p>
                  </div>
                  <button
                    onClick={() => removeWine(wine.id)}
                    className="touch-target flex h-9 w-9 items-center justify-center rounded-[12px] text-muted/60 active:bg-red-50 active:text-red-500 transition-colors flex-shrink-0"
                    aria-label={`Remove ${wine.name}`}
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  // ============ STEP 4: REVIEW & CREATE ============

  function renderStep4() {
    const selectedDifficulty = DIFFICULTIES.find((d) => d.value === difficulty);

    return (
      <div className="animate-fade-in-up">
        <h1 className="text-[28px] font-bold font-serif text-foreground tracking-tight mb-1">
          Review & Create
        </h1>
        <p className="text-muted text-[15px] mb-7">
          Everything look good?
        </p>

        {/* Event summary card */}
        <div className="bg-card-bg border border-card-border rounded-[16px] shadow-[0_2px_8px_rgba(0,0,0,0.06),0_0_1px_rgba(0,0,0,0.04)] p-5 mb-4">
          <h2 className="text-xl font-bold font-serif text-foreground tracking-tight">
            {title || "Blind Tasting"}
          </h2>
          {description && (
            <p className="text-[13px] text-muted mt-1.5 leading-relaxed">{description}</p>
          )}

          <div className="mt-5 space-y-4">
            {/* Difficulty */}
            <div className="flex items-center justify-between">
              <span className="text-[13px] text-muted">Difficulty</span>
              <div className="flex items-center gap-1.5">
                <span>{selectedDifficulty?.emoji}</span>
                <span className={`text-[13px] font-semibold ${selectedDifficulty?.textColor ?? "text-foreground"}`}>
                  {selectedDifficulty?.label ?? difficulty}
                </span>
              </div>
            </div>

            {/* Timer */}
            <div className="flex items-center justify-between">
              <span className="text-[13px] text-muted">Timer</span>
              <span className="text-[13px] font-semibold text-foreground nums">
                {timerEnabled
                  ? `${Math.floor(timePerWine / 60)}:${String(timePerWine % 60).padStart(2, "0")} per wine`
                  : "Off"}
              </span>
            </div>

            {/* Guess Fields */}
            <div>
              <span className="text-[13px] text-muted block mb-2">Guess Fields</span>
              <div className="flex gap-2 flex-wrap">
                {guessFields.map((f) => {
                  const field = ALL_GUESS_FIELDS.find((gf) => gf.key === f);
                  const Icon = field?.icon ?? Wine;
                  return (
                    <span
                      key={f}
                      className={`inline-flex items-center gap-1.5 rounded-[8px] ${field?.color ?? "bg-widget-wine"} px-3 py-1.5 text-[12px] font-semibold ${field?.iconColor ?? "text-cherry"}`}
                    >
                      <Icon className="h-3 w-3" />
                      {field?.label ?? f}
                    </span>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Wines card */}
        <div className="bg-card-bg border border-card-border rounded-[16px] shadow-[0_2px_8px_rgba(0,0,0,0.06),0_0_1px_rgba(0,0,0,0.04)] p-5 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[13px] font-bold text-foreground uppercase tracking-wide">
              Wines
            </h3>
            <span className="text-[13px] font-bold text-cherry nums">{selectedWines.length}</span>
          </div>
          <div className="space-y-3">
            {selectedWines.map((wine, idx) => (
              <div key={wine.id} className="flex items-center gap-3">
                <span className="flex h-8 w-8 items-center justify-center rounded-[12px] widget-wine text-[11px] font-bold text-cherry flex-shrink-0 nums">
                  {idx + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-semibold font-serif text-foreground line-clamp-1">
                    {wineName(wine.name)}
                  </p>
                  <p className="text-[11px] text-muted">{wineName(wine.producer)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Create button */}
        <button
          onClick={handleCreate}
          disabled={isPending}
          className="btn-primary touch-target"
        >
          {isPending ? (
            <>
              <div className="h-5 w-5 rounded-full border-2 border-white border-t-transparent animate-spin" />
              Creating...
            </>
          ) : (
            <>
              <Wine className="h-5 w-5" />
              Create Tasting
            </>
          )}
        </button>
      </div>
    );
  }

  // ============ MAIN RENDER ============

  return (
    <div
      className="min-h-screen pb-28 pt-6 safe-top bg-background"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <div className="px-4 md:px-8 lg:px-10 max-w-full">
        {/* Close / Cancel */}
        <div className="flex items-center justify-between mb-4">
          <Link
            href="/arena"
            className="inline-flex items-center gap-1 text-[13px] font-semibold text-muted active:text-foreground transition-colors touch-target"
          >
            <ChevronLeft className="h-4 w-4" />
            Cancel
          </Link>
          <span className="text-[12px] font-semibold text-muted nums">
            Step {step} of 4
          </span>
        </div>

        {renderProgress()}

        {step === 1 && renderStep1()}
        {step === 2 && renderStep2()}
        {step === 3 && renderStep3()}
        {step === 4 && renderStep4()}
      </div>

      {/* Back / Next sticky footer */}
      {step > 1 && (
        <div className="fixed bottom-0 left-0 right-0 z-50 glass-card border-t border-card-border/30 safe-bottom">
          <div className="px-4 md:px-8 lg:px-10 py-3 flex gap-3">
            <button
              onClick={goBack}
              className="btn-secondary flex-1 touch-target"
            >
              <ChevronLeft className="h-4 w-4" />
              Back
            </button>
            {step < 4 && (
              <button
                onClick={goNext}
                disabled={!canGoNext()}
                className="btn-primary flex-1 touch-target"
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </button>
            )}
          </div>
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
          <div className="h-8 w-8 rounded-full border-2 border-cherry border-t-transparent animate-spin" />
        </div>
      }
    >
      <CreateEventInner />
    </Suspense>
  );
}
