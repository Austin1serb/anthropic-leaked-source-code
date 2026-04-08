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
import { createEvent, getTemplates, searchWines, getBrowseWines, findOrCreateWine } from "@/lib/actions";
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
  { value: "beginner", label: "Beginner", emoji: "\u{1F331}", color: "bg-emerald-50", textColor: "text-emerald-700" },
  { value: "intermediate", label: "Intermediate", emoji: "\u{1F377}", color: "bg-amber-50", textColor: "text-amber-700" },
  { value: "advanced", label: "Advanced", emoji: "\u{1F525}", color: "bg-cherry/8", textColor: "text-cherry" },
  { value: "master", label: "Master", emoji: "\u{1F451}", color: "bg-purple-50", textColor: "text-purple-700" },
] as const;

const ALL_GUESS_FIELDS = [
  { key: "grape", label: "Grape", icon: Grape, color: "bg-cherry/8", iconColor: "text-cherry" },
  { key: "region", label: "Region", icon: MapPin, color: "bg-amber-50", iconColor: "text-amber-700" },
  { key: "country", label: "Country", icon: Globe, color: "bg-blue-50", iconColor: "text-blue-600" },
  { key: "vintage", label: "Vintage", icon: Clock, color: "bg-emerald-50", iconColor: "text-emerald-700" },
  { key: "producer", label: "Producer", icon: Tag, color: "bg-purple-50", iconColor: "text-purple-600" },
  { key: "type", label: "Type", icon: Wine, color: "bg-orange-50", iconColor: "text-orange-600" },
  { key: "price", label: "Price", icon: DollarSign, color: "bg-amber-50", iconColor: "text-amber-700" },
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
  // Custom wine form state
  const [showCustomForm, setShowCustomForm] = useState(false);
  const [customWine, setCustomWine] = useState({
    name: "", producer: "", vintage: "", region: "", country: "", type: "red", grapes: "",
  });
  const [customSaving, setCustomSaving] = useState(false);
  const [customMessage, setCustomMessage] = useState<string | null>(null);

  // Error state
  const [loadError, setLoadError] = useState<string | null>(null);

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
    }).catch(() => {
      setTemplatesLoading(false);
      setLoadError("Could not load templates. Please try again.");
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ============ LOAD BROWSE WINES (on step 3 entry) ============

  useEffect(() => {
    if (step === 3 && !browseLoaded) {
      setLoadError(null);
      getBrowseWines().then((data) => {
        setBrowseWines(data as WineResult[]);
        setBrowseLoaded(true);
      }).catch(() => {
        setBrowseLoaded(true);
        setLoadError("Could not load wines. Please try again.");
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

  async function handleAddCustomWine() {
    if (!customWine.name.trim() || !customWine.producer.trim() || !customWine.country.trim()) {
      setCustomMessage("Name, producer, and country are required.");
      return;
    }
    setCustomSaving(true);
    setCustomMessage(null);
    try {
      const { wine, created } = await findOrCreateWine({
        name: customWine.name.trim(),
        producer: customWine.producer.trim(),
        vintage: customWine.vintage ? parseInt(customWine.vintage) : null,
        grapes: customWine.grapes ? customWine.grapes.split(",").map((g: string) => g.trim()).filter(Boolean) : [],
        region: customWine.region.trim() || customWine.country.trim(),
        country: customWine.country.trim(),
        type: customWine.type,
      });
      // Add to selected wines
      const wineResult: WineResult = {
        id: wine.id,
        name: wine.name,
        producer: wine.producer,
        vintage: wine.vintage,
        grapes: wine.grapes,
        region: wine.region,
        country: wine.country,
        type: wine.type,
      };
      if (!selectedWines.some((w) => w.id === wine.id)) {
        setSelectedWines((prev) => [...prev, wineResult]);
      }
      setCustomMessage(created ? `✓ "${wine.name}" created and added!` : `✓ "${wine.name}" already exists — added!`);
      setCustomWine({ name: "", producer: "", vintage: "", region: "", country: "", type: "red", grapes: "" });
      // Auto-close after a moment
      setTimeout(() => setCustomMessage(null), 3000);
    } catch (err) {
      setCustomMessage(`Failed: ${err instanceof Error ? err.message : "Unknown error"}`);
    } finally {
      setCustomSaving(false);
    }
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

  const DIFFICULTY_BADGE: Record<string, { label: string; bg: string; text: string }> = {
    beginner: { label: "Beginner", bg: "bg-emerald-50", text: "text-emerald-700" },
    intermediate: { label: "Intermediate", bg: "bg-amber-50", text: "text-amber-700" },
    advanced: { label: "Advanced", bg: "bg-red-50", text: "text-red-700" },
    master: { label: "Master", bg: "bg-purple-50", text: "text-purple-700" },
  };

  function renderStep1() {
    return (
      <div className="animate-fade-in-up">
        <h1 className="text-[28px] font-bold font-serif text-foreground tracking-tight mb-1">
          New Blind Tasting
        </h1>
        <p className="text-muted text-[15px] mb-8">
          Start from scratch or pick a template.
        </p>

        {/* ── From scratch — hero card with cherry accent ── */}
        <button
          onClick={() => {
            setSelectedTemplateId(null);
            setStep(2);
          }}
          className="touch-target group w-full flex items-center gap-5 p-6 mb-8 active:scale-[0.98] transition-all bg-white border-2 border-cherry/15 rounded-[14px] hover:border-cherry/30 hover:shadow-[0_4px_16px_rgba(116,7,14,0.08)]"
        >
          <div className="h-14 w-14 rounded-[12px] bg-cherry flex items-center justify-center flex-shrink-0 shadow-sm">
            <Plus className="h-6 w-6 text-white" />
          </div>
          <div className="text-left flex-1">
            <p className="font-bold text-[17px] text-foreground tracking-tight">
              Start from scratch
            </p>
            <p className="text-[13px] text-muted mt-1 leading-relaxed">
              Full control — choose wines, set rules, and host your way.
            </p>
          </div>
          <ChevronRight className="h-5 w-5 text-cherry/40 group-hover:text-cherry transition-colors flex-shrink-0" />
        </button>

        {/* ── Templates section ── */}
        {templatesLoading ? (
          <div className="flex justify-center py-16">
            <div className="h-7 w-7 rounded-full border-2 border-cherry border-t-transparent animate-spin" />
          </div>
        ) : templates.length > 0 ? (
          <>
            <div className="flex items-center gap-3 mb-4">
              <div className="h-px flex-1 bg-card-border/60" />
              <h2 className="text-[11px] font-bold text-muted uppercase tracking-widest px-1">
                Or use a template
              </h2>
              <div className="h-px flex-1 bg-card-border/60" />
            </div>

            <div className="bg-white rounded-[14px] border border-card-border/60 overflow-hidden divide-y divide-card-border/40">
              {templates.map((tmpl, i) => {
                const iconBg = [
                  "bg-cherry/8", "bg-amber-500/8", "bg-emerald-600/8",
                  "bg-blue-500/8", "bg-purple-500/8", "bg-orange-500/8",
                ][i % 6];
                const iconColor = [
                  "text-cherry", "text-amber-600", "text-emerald-600",
                  "text-blue-600", "text-purple-600", "text-orange-600",
                ][i % 6];
                const diff = DIFFICULTY_BADGE[tmpl.difficulty] || DIFFICULTY_BADGE.intermediate;

                return (
                  <button
                    key={tmpl.id}
                    onClick={() => {
                      applyTemplate(tmpl);
                      setStep(2);
                    }}
                    className="touch-target group w-full text-left px-5 py-4 flex items-center gap-4 hover:bg-butter/60 active:bg-butter transition-colors"
                  >
                    <div className={`h-11 w-11 rounded-[10px] ${iconBg} flex items-center justify-center flex-shrink-0`}>
                      <Wine className={`h-5 w-5 ${iconColor}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-[15px] text-foreground leading-tight line-clamp-1">
                        {tmpl.name}
                      </h3>
                      {tmpl.description && (
                        <p className="mt-0.5 text-[12px] text-muted line-clamp-1 leading-relaxed">
                          {tmpl.description}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="text-[11px] font-semibold text-muted/70 nums">
                        {tmpl.wineCount} wines
                      </span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${diff.bg} ${diff.text}`}>
                        {diff.label}
                      </span>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted/30 group-hover:text-muted/60 transition-colors flex-shrink-0" />
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
        <p className="text-muted text-[15px] mb-8">
          Set up the details for your tasting.
        </p>

        {/* ── Event details card ── */}
        <div className="bg-white rounded-[14px] border border-card-border/60 p-6 mb-6">
          <h2 className="text-[11px] font-bold text-muted uppercase tracking-widest mb-5">Event Details</h2>

          <label className="block mb-5">
            <span className="text-[12px] font-semibold text-foreground">Title *</span>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Friday Night Flight"
              className="input-field touch-target mt-1.5 block w-full"
            />
          </label>

          <label className="block">
            <span className="text-[12px] font-semibold text-foreground">
              Description <span className="font-normal text-muted">(optional)</span>
            </span>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="A few words about this tasting..."
              rows={2}
              className="input-field mt-1.5 block w-full resize-none"
            />
          </label>
        </div>

        {/* ── Difficulty card ── */}
        <div className="bg-white rounded-[14px] border border-card-border/60 p-6 mb-6">
          <h2 className="text-[11px] font-bold text-muted uppercase tracking-widest mb-4">Difficulty</h2>
          <div className="grid grid-cols-4 gap-2">
            {DIFFICULTIES.map((d) => {
              const isActive = difficulty === d.value;
              return (
                <button
                  key={d.value}
                  onClick={() => setDifficulty(d.value)}
                  className={`touch-target rounded-[10px] py-3 px-2 text-center transition-all ${
                    isActive
                      ? "bg-cherry text-white shadow-sm"
                      : "bg-butter/80 text-foreground/70 hover:bg-butter"
                  }`}
                >
                  <span className="text-lg block">{d.emoji}</span>
                  <p className={`mt-1 font-semibold text-[11px] ${isActive ? "text-white" : "text-foreground/70"}`}>
                    {d.label}
                  </p>
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Guess Fields card ── */}
        <div className="bg-white rounded-[14px] border border-card-border/60 p-6 mb-6">
          <h2 className="text-[11px] font-bold text-muted uppercase tracking-widest mb-1">Guess Fields</h2>
          <p className="text-[12px] text-muted mb-4">What will your guests try to identify?</p>

          <div className="grid grid-cols-2 gap-2">
            {ALL_GUESS_FIELDS.map((field) => {
              const active = guessFields.includes(field.key);
              const Icon = field.icon;
              return (
                <button
                  key={field.key}
                  onClick={() => toggleGuessField(field.key)}
                  className={`touch-target rounded-[10px] px-3.5 py-3 flex items-center gap-3 transition-all border ${
                    active
                      ? "bg-cherry/[0.06] border-cherry/25 text-foreground"
                      : "bg-white border-card-border/60 text-muted hover:border-card-border"
                  }`}
                >
                  <Icon className={`h-4 w-4 flex-shrink-0 ${active ? "text-cherry" : "text-muted/50"}`} />
                  <span className={`font-medium text-[13px] flex-1 text-left ${active ? "text-foreground" : "text-muted"}`}>
                    {field.label}
                  </span>
                  <div className={`h-5 w-5 rounded-[5px] border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                    active ? "bg-cherry border-cherry" : "border-card-border/80 bg-white"
                  }`}>
                    {active && <Check className="h-3 w-3 text-white" strokeWidth={3} />}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Timer card ── */}
        <div className="bg-white rounded-[14px] border border-card-border/60 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-[8px] bg-blue-50 flex items-center justify-center flex-shrink-0">
                <Clock className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <span className="text-[13px] font-semibold text-foreground">Timer per wine</span>
                {timerEnabled && (
                  <p className="text-[11px] text-muted mt-0.5 nums">
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
            <div className="mt-4 pt-4 border-t border-card-border/40">
              <input
                type="range"
                min={30}
                max={600}
                step={30}
                value={timePerWine}
                onChange={(e) => setTimePerWine(Number(e.target.value))}
                className="w-full accent-cherry h-1.5"
              />
              <div className="flex justify-between mt-1.5">
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
    const TYPE_DOT: Record<string, string> = {
      red: "bg-[#74070E]", white: "bg-[#D4A843]", "rosé": "bg-[#E8A0B4]",
      sparkling: "bg-[#C9B037]", orange: "bg-[#D4782F]", dessert: "bg-[#B5651D]",
      fortified: "bg-[#5C1A1B]",
    };

    return (
      <div className="animate-fade-in-up">
        {/* Header */}
        <div className="flex items-start justify-between mb-1">
          <h1 className="text-[28px] font-bold font-serif text-foreground tracking-tight">
            Add Wines
          </h1>
          {selectedWines.length > 0 && (
            <span className="mt-1.5 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cherry text-white text-[12px] font-bold nums">
              <Wine className="h-3 w-3" />
              {selectedWines.length}
            </span>
          )}
        </div>
        <p className="text-muted text-[15px] mb-6">
          Search our database or add your own.
        </p>

        {/* ── Search + add custom — grouped in one card ── */}
        <div className="bg-white rounded-[14px] border border-card-border/60 p-5 mb-5">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted/40 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="Search by name, producer, region..."
              className="input-field touch-target block w-full pl-10 pr-4 text-[14px]"
            />
            {searching && (
              <div className="absolute right-3.5 top-1/2 -translate-y-1/2">
                <div className="h-4 w-4 rounded-full border-2 border-cherry border-t-transparent animate-spin" />
              </div>
            )}
          </div>

          {/* Divider with "or" */}
          <div className="flex items-center gap-3 my-4">
            <div className="h-px flex-1 bg-card-border/50" />
            <span className="text-[10px] font-semibold text-muted/60 uppercase tracking-wider">or</span>
            <div className="h-px flex-1 bg-card-border/50" />
          </div>

          {/* Add custom wine toggle */}
          <button
            onClick={() => setShowCustomForm(!showCustomForm)}
            className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-[10px] text-[13px] font-semibold transition-all border ${
              showCustomForm
                ? "bg-cherry/[0.06] text-cherry border-cherry/20"
                : "bg-butter/60 border-transparent text-foreground/60 hover:bg-butter"
            }`}
          >
            <Plus className="h-4 w-4" />
            {showCustomForm ? "Close form" : "Add a wine manually"}
          </button>

          {/* Custom wine form */}
          {showCustomForm && (
            <div className="mt-4 pt-4 border-t border-card-border/40 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[12px] font-semibold text-foreground">Wine name *</label>
                  <input type="text" value={customWine.name} onChange={(e) => setCustomWine({ ...customWine, name: e.target.value })} placeholder="e.g. Gaja Barbaresco" className="input-field mt-1.5 w-full" />
                </div>
                <div>
                  <label className="text-[12px] font-semibold text-foreground">Producer *</label>
                  <input type="text" value={customWine.producer} onChange={(e) => setCustomWine({ ...customWine, producer: e.target.value })} placeholder="e.g. Gaja" className="input-field mt-1.5 w-full" />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-[12px] font-semibold text-foreground">Vintage</label>
                  <input type="number" value={customWine.vintage} onChange={(e) => setCustomWine({ ...customWine, vintage: e.target.value })} placeholder="2020" min="1900" max="2030" className="input-field mt-1.5 w-full" />
                </div>
                <div>
                  <label className="text-[12px] font-semibold text-foreground">Country *</label>
                  <input type="text" value={customWine.country} onChange={(e) => setCustomWine({ ...customWine, country: e.target.value })} placeholder="France" className="input-field mt-1.5 w-full" />
                </div>
                <div>
                  <label className="text-[12px] font-semibold text-foreground">Region</label>
                  <input type="text" value={customWine.region} onChange={(e) => setCustomWine({ ...customWine, region: e.target.value })} placeholder="Bordeaux" className="input-field mt-1.5 w-full" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[12px] font-semibold text-foreground">Type</label>
                  <select value={customWine.type} onChange={(e) => setCustomWine({ ...customWine, type: e.target.value })} className="input-field mt-1.5 w-full">
                    <option value="red">Red</option>
                    <option value="white">White</option>
                    <option value="rosé">Rosé</option>
                    <option value="sparkling">Sparkling</option>
                    <option value="dessert">Dessert</option>
                    <option value="fortified">Fortified</option>
                    <option value="orange">Orange</option>
                  </select>
                </div>
                <div>
                  <label className="text-[12px] font-semibold text-foreground">Grapes</label>
                  <input type="text" value={customWine.grapes} onChange={(e) => setCustomWine({ ...customWine, grapes: e.target.value })} placeholder="Nebbiolo, Merlot" className="input-field mt-1.5 w-full" />
                </div>
              </div>
              {customMessage && (
                <p className={`text-[12px] font-medium ${customMessage.startsWith("\u2713") ? "text-green-700" : "text-red-600"}`}>
                  {customMessage}
                </p>
              )}
              <button
                onClick={handleAddCustomWine}
                disabled={customSaving}
                className="w-full flex items-center justify-center gap-2 h-10 rounded-[10px] bg-cherry text-white text-[13px] font-bold hover:bg-cherry/90 disabled:opacity-50 transition-colors"
              >
                {customSaving ? (
                  <div className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                ) : (
                  <><Plus className="h-4 w-4" /> Add to tasting</>
                )}
              </button>
            </div>
          )}
        </div>

        {/* ── Wine catalog card ── */}
        <div className="bg-white rounded-[14px] border border-card-border/60 overflow-hidden mb-5">
          {/* Type filter row */}
          {searchQuery.trim().length < 2 && (
            <div className="flex gap-1.5 p-3 border-b border-card-border/40 overflow-x-auto scrollbar-hide">
              {WINE_TYPE_FILTERS.map((f) => (
                <button
                  key={f.label}
                  onClick={() => setTypeFilter(f.value)}
                  className={`flex-shrink-0 inline-flex items-center gap-1 px-3 py-1.5 rounded-[8px] text-[12px] font-semibold transition-all ${
                    typeFilter === f.value
                      ? "bg-cherry text-white"
                      : "text-muted hover:bg-butter/80"
                  }`}
                >
                  <span className="text-[13px]">{f.emoji}</span>
                  {f.label}
                </button>
              ))}
            </div>
          )}

          {/* Wine list */}
          {loadError && searchQuery.trim().length < 2 ? (
            <div className="flex flex-col items-center justify-center py-10 px-6 text-center">
              <p className="text-[13px] text-muted mb-3">{loadError}</p>
              <button onClick={() => { setBrowseLoaded(false); setLoadError(null); }} className="text-[12px] font-semibold text-cherry">
                Try again
              </button>
            </div>
          ) : !browseLoaded && searchQuery.trim().length < 2 ? (
            <div className="flex justify-center py-12">
              <div className="h-5 w-5 rounded-full border-2 border-cherry border-t-transparent animate-spin" />
            </div>
          ) : displayWines.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 px-6 text-center">
              <Wine className="h-6 w-6 text-muted/20 mb-2" />
              <p className="text-[13px] text-muted">
                {searchQuery.trim().length >= 2 ? "No wines found" : "No wines in this category"}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-card-border/30 max-h-[360px] overflow-y-auto">
              {displayWines.map((wine) => {
                const alreadyAdded = selectedWines.some((w) => w.id === wine.id);
                return (
                  <button
                    key={wine.id}
                    onClick={() => alreadyAdded ? removeWine(wine.id) : addWine(wine)}
                    className={`touch-target w-full text-left px-5 py-3.5 flex items-center gap-3 transition-colors ${
                      alreadyAdded ? "bg-cherry/[0.04]" : "hover:bg-butter/60"
                    }`}
                  >
                    <div className={`h-2.5 w-2.5 rounded-full flex-shrink-0 ${TYPE_DOT[wine.type.toLowerCase()] || "bg-gray-300"}`} />
                    <div className="flex-1 min-w-0">
                      <p className={`font-medium text-[14px] leading-tight line-clamp-1 ${alreadyAdded ? "text-cherry" : "text-foreground"}`}>
                        {wineName(wine.name)}
                      </p>
                      <p className="text-[11px] text-muted mt-0.5 line-clamp-1">
                        {wineName(wine.producer)}{wine.region ? ` \u00B7 ${wine.region}` : ""}
                        {wine.vintage ? <span className="nums"> \u00B7 {wine.vintage}</span> : ""}
                      </p>
                    </div>
                    <div className={`h-6 w-6 rounded-[6px] border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                      alreadyAdded ? "bg-cherry border-cherry" : "border-card-border/60 bg-white"
                    }`}>
                      {alreadyAdded && <Check className="h-3 w-3 text-white" strokeWidth={3} />}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* ── Flight Order — selected wines ── */}
        {selectedWines.length > 0 && (
          <div className="bg-white rounded-[14px] border border-card-border/60 overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3 border-b border-card-border/40">
              <h2 className="text-[11px] font-bold text-muted uppercase tracking-widest">
                Flight Order
              </h2>
              <button
                onClick={() => setSelectedWines([])}
                className="text-[11px] font-semibold text-cherry hover:text-cherry/70 transition-colors"
              >
                Clear all
              </button>
            </div>
            <div className="divide-y divide-card-border/30">
              {selectedWines.map((wine, idx) => (
                <div
                  key={wine.id}
                  className="flex items-center gap-3 px-5 py-3 animate-scale-in"
                >
                  <span className="flex h-8 w-8 items-center justify-center rounded-[8px] bg-cherry/[0.07] text-[12px] font-bold text-cherry flex-shrink-0 nums">
                    {idx + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-[14px] text-foreground line-clamp-1">
                      {wineName(wine.name)}
                    </p>
                    <p className="text-[11px] text-muted mt-0.5 line-clamp-1">
                      {wineName(wine.producer)}{wine.region ? ` \u00B7 ${wine.region}` : ""}
                    </p>
                  </div>
                  <button
                    onClick={() => removeWine(wine.id)}
                    className="touch-target flex h-8 w-8 items-center justify-center rounded-[8px] text-muted/40 hover:bg-red-50 hover:text-red-500 transition-colors flex-shrink-0"
                    aria-label={`Remove ${wine.name}`}
                  >
                    <X className="h-3.5 w-3.5" />
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
    const diffBadge = DIFFICULTY_BADGE[difficulty] || DIFFICULTY_BADGE.intermediate;

    return (
      <div className="animate-fade-in-up">
        <h1 className="text-[28px] font-bold font-serif text-foreground tracking-tight mb-1">
          Review & Create
        </h1>
        <p className="text-muted text-[15px] mb-8">
          Everything look good?
        </p>

        {/* ── Event summary card ── */}
        <div className="bg-white rounded-[14px] border border-card-border/60 overflow-hidden mb-5">
          {/* Title section */}
          <div className="px-6 pt-6 pb-4">
            <h2 className="text-[20px] font-bold font-serif text-foreground tracking-tight">
              {title || "Blind Tasting"}
            </h2>
            {description && (
              <p className="text-[13px] text-muted mt-1.5 leading-relaxed">{description}</p>
            )}
          </div>

          {/* Settings rows */}
          <div className="border-t border-card-border/40 divide-y divide-card-border/30">
            <div className="flex items-center justify-between px-6 py-3.5">
              <span className="text-[13px] text-muted">Difficulty</span>
              <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${diffBadge.bg} ${diffBadge.text}`}>
                {selectedDifficulty?.emoji} {selectedDifficulty?.label ?? difficulty}
              </span>
            </div>

            <div className="flex items-center justify-between px-6 py-3.5">
              <span className="text-[13px] text-muted">Timer</span>
              <span className="text-[13px] font-semibold text-foreground nums">
                {timerEnabled
                  ? `${Math.floor(timePerWine / 60)}:${String(timePerWine % 60).padStart(2, "0")} per wine`
                  : "Off"}
              </span>
            </div>

            <div className="px-6 py-3.5">
              <span className="text-[13px] text-muted block mb-2">Guess Fields</span>
              <div className="flex gap-1.5 flex-wrap">
                {guessFields.map((f) => {
                  const field = ALL_GUESS_FIELDS.find((gf) => gf.key === f);
                  return (
                    <span
                      key={f}
                      className="inline-flex items-center gap-1 rounded-full bg-cherry/[0.07] px-2.5 py-1 text-[11px] font-semibold text-cherry"
                    >
                      {field?.label ?? f}
                    </span>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* ── Wines card ── */}
        <div className="bg-white rounded-[14px] border border-card-border/60 overflow-hidden mb-8">
          <div className="flex items-center justify-between px-6 py-3.5 border-b border-card-border/40">
            <h3 className="text-[11px] font-bold text-muted uppercase tracking-widest">
              Wine Flight
            </h3>
            <span className="text-[12px] font-bold text-cherry nums">{selectedWines.length} wines</span>
          </div>
          <div className="divide-y divide-card-border/30">
            {selectedWines.map((wine, idx) => (
              <div key={wine.id} className="flex items-center gap-3 px-6 py-3.5">
                <span className="flex h-7 w-7 items-center justify-center rounded-[6px] bg-cherry/[0.07] text-[11px] font-bold text-cherry flex-shrink-0 nums">
                  {idx + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-[14px] font-medium text-foreground line-clamp-1">
                    {wineName(wine.name)}
                  </p>
                  <p className="text-[11px] text-muted mt-0.5">{wineName(wine.producer)}{wine.region ? ` \u00B7 ${wine.region}` : ""}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Create button ── */}
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
