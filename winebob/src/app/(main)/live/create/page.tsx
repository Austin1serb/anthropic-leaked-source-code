"use client";

import { useState, useEffect, useCallback, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ChevronLeft, Plus, X, Search, Wine, Check, Clock,
  Globe, Lock, Users, Sparkles,
} from "lucide-react";
import { createLiveEvent, getMyProfile } from "@/lib/liveActions";
import { searchWines, getBrowseWines } from "@/lib/actions";

type WineResult = {
  id: string; name: string; producer: string; vintage: number | null;
  grapes: string[]; region: string; country: string; type: string;
};

type HintDraft = { content: string; hintType: string };
type WineWithHints = { wine: WineResult; hints: HintDraft[] };

const HINT_TYPES = ["color", "aroma", "taste", "texture", "origin", "other"];
const GUESS_FIELDS = [
  { key: "grape", label: "Grape" }, { key: "region", label: "Region" },
  { key: "country", label: "Country" }, { key: "vintage", label: "Vintage" },
  { key: "producer", label: "Producer" }, { key: "type", label: "Type" },
];

function typeColor(type: string): string {
  switch (type.toLowerCase()) {
    case "red": return "bg-[#8B1A2A]"; case "white": return "bg-[#D4B86A]";
    case "rosé": return "bg-[#D4828A]"; case "sparkling": return "bg-[#C8B868]";
    case "orange": return "bg-[#C8864A]"; default: return "bg-stone-light";
  }
}

export default function CreateLiveEventPage() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const [hasSomProfile, setHasSomProfile] = useState<boolean | null>(null);

  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [isPublic, setIsPublic] = useState(true);
  const [scheduledAt, setScheduledAt] = useState("");
  const [maxParticipants, setMaxParticipants] = useState("");
  const [showCrowdStats, setShowCrowdStats] = useState(true);
  const [guessFields, setGuessFields] = useState<string[]>(["grape", "region", "country", "vintage"]);
  const [difficulty, setDifficulty] = useState("intermediate");

  // Wine selection
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<WineResult[]>([]);
  const [browseWines, setBrowseWines] = useState<WineResult[]>([]);
  const [browseLoaded, setBrowseLoaded] = useState(false);
  const [searching, setSearching] = useState(false);
  const [selectedWines, setSelectedWines] = useState<WineWithHints[]>([]);
  const [typeFilter, setTypeFilter] = useState<string | null>(null);

  // Hint editing
  const [editingWineIdx, setEditingWineIdx] = useState<number | null>(null);
  const [newHintContent, setNewHintContent] = useState("");
  const [newHintType, setNewHintType] = useState("aroma");

  // Check sommelier profile
  useEffect(() => {
    getMyProfile().then((p) => setHasSomProfile(!!p)).catch(() => setHasSomProfile(false));
    getBrowseWines().then((data) => { setBrowseWines(data as WineResult[]); setBrowseLoaded(true); });
  }, []);

  const handleSearch = useCallback(async (query: string) => {
    setSearchQuery(query);
    if (query.trim().length < 2) { setSearchResults([]); return; }
    setSearching(true);
    try { setSearchResults(await searchWines(query) as WineResult[]); } finally { setSearching(false); }
  }, []);

  function addWine(wine: WineResult) {
    if (selectedWines.some((w) => w.wine.id === wine.id)) return;
    setSelectedWines((prev) => [...prev, { wine, hints: [] }]);
  }

  function removeWine(wineId: string) {
    setSelectedWines((prev) => prev.filter((w) => w.wine.id !== wineId));
    setEditingWineIdx(null);
  }

  function addHint(wineIdx: number) {
    if (!newHintContent.trim()) return;
    setSelectedWines((prev) => {
      const next = [...prev];
      next[wineIdx] = { ...next[wineIdx], hints: [...next[wineIdx].hints, { content: newHintContent.trim(), hintType: newHintType }] };
      return next;
    });
    setNewHintContent("");
  }

  function removeHint(wineIdx: number, hintIdx: number) {
    setSelectedWines((prev) => {
      const next = [...prev];
      next[wineIdx] = { ...next[wineIdx], hints: next[wineIdx].hints.filter((_, i) => i !== hintIdx) };
      return next;
    });
  }

  function toggleGuessField(field: string) {
    setGuessFields((prev) => prev.includes(field) ? prev.filter((f) => f !== field) : [...prev, field]);
  }

  const displayWines = searchQuery.trim().length >= 2
    ? searchResults
    : browseWines.filter((w) => !typeFilter || w.type.toLowerCase() === typeFilter);

  function handleCreate() {
    if (!title.trim()) { setError("Title is required"); return; }
    if (!scheduledAt) { setError("Schedule date is required"); return; }
    if (selectedWines.length === 0) { setError("Add at least one wine"); return; }
    setError("");

    const scoringConfig: Record<string, number> = {};
    const defaultWeights: Record<string, number> = { grape: 25, region: 20, country: 15, vintage: 15, producer: 15, type: 10 };
    for (const f of guessFields) scoringConfig[f] = defaultWeights[f] ?? 10;

    startTransition(async () => {
      try {
        const event = await createLiveEvent({
          title: title.trim(),
          description: description.trim() || undefined,
          isPublic,
          scheduledAt,
          maxParticipants: maxParticipants ? parseInt(maxParticipants, 10) : undefined,
          guessFields,
          scoringConfig,
          difficulty,
          showCrowdStats,
          wines: selectedWines.map((w) => ({
            wineId: w.wine.id,
            hints: w.hints,
          })),
        });
        router.push(`/live/${event.id}/host`);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to create event");
      }
    });
  }

  if (hasSomProfile === null) {
    return <div className="min-h-screen flex items-center justify-center"><div className="h-6 w-6 skeleton rounded-full" /></div>;
  }

  if (hasSomProfile === false) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center container-app text-center">
        <Wine className="h-10 w-10 text-stone-light mb-4" />
        <h1 className="heading-lg text-foreground mb-2">Sommelier Profile Required</h1>
        <p className="body-sm mb-6">You need a sommelier profile to host live events.</p>
        <Link href="/sommeliers/become" className="btn-primary px-8 touch-target">Become a Sommelier</Link>
      </div>
    );
  }

  const TYPE_FILTERS = [
    { value: null, label: "All", icon: Wine },
    { value: "red", label: "Red" }, { value: "white", label: "White" },
    { value: "rosé", label: "Rosé" }, { value: "sparkling", label: "Sparkling" },
    { value: "orange", label: "Orange" },
  ];

  return (
    <div className="min-h-screen pb-28 safe-top bg-background">
      <div className="container-app pt-6">
        <Link href="/live" className="inline-flex items-center gap-1 text-[12px] font-semibold text-stone touch-target mb-4">
          <ChevronLeft className="h-4 w-4" /> Cancel
        </Link>

        <h1 className="heading-xl text-foreground mb-1">Create Live Event</h1>
        <p className="body-sm mb-6">Set up a live tasting for your audience.</p>

        {/* ── Event Details ── */}
        <section className="space-y-4 mb-8">
          <p className="label">Event Details</p>

          <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Event title" className="input-field w-full touch-target" />
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Description (optional)" rows={2} className="input-field w-full resize-none" />

          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="caption mb-1.5">Date & Time</p>
              <input type="datetime-local" value={scheduledAt} onChange={(e) => setScheduledAt(e.target.value)} className="input-field w-full text-[13px] touch-target" />
            </div>
            <div>
              <p className="caption mb-1.5">Max Participants</p>
              <input type="number" value={maxParticipants} onChange={(e) => setMaxParticipants(e.target.value)} placeholder="Unlimited" className="input-field w-full text-[13px] touch-target" />
            </div>
          </div>

          <div className="flex gap-3">
            <button type="button" onClick={() => setIsPublic(true)} className={`flex-1 wine-card p-3.5 flex items-center gap-2.5 transition-all ${isPublic ? "ring-2 ring-cherry" : ""}`}>
              <Globe className={`h-4 w-4 ${isPublic ? "text-cherry" : "text-stone"}`} />
              <div className="text-left">
                <p className="heading-sm text-foreground text-[13px]">Public</p>
                <p className="caption">Anyone can join</p>
              </div>
            </button>
            <button type="button" onClick={() => setIsPublic(false)} className={`flex-1 wine-card p-3.5 flex items-center gap-2.5 transition-all ${!isPublic ? "ring-2 ring-cherry" : ""}`}>
              <Lock className={`h-4 w-4 ${!isPublic ? "text-cherry" : "text-stone"}`} />
              <div className="text-left">
                <p className="heading-sm text-foreground text-[13px]">Private</p>
                <p className="caption">Join code required</p>
              </div>
            </button>
          </div>
        </section>

        {/* ── Guess Fields ── */}
        <section className="mb-8">
          <p className="label mb-3">What Viewers Guess</p>
          <div className="flex flex-wrap gap-2">
            {GUESS_FIELDS.map((f) => (
              <button key={f.key} type="button" onClick={() => toggleGuessField(f.key)} className={`chip text-[12px] ${guessFields.includes(f.key) ? "chip-active" : ""}`}>
                {guessFields.includes(f.key) && <Check className="h-3 w-3" />}
                {f.label}
              </button>
            ))}
          </div>
        </section>

        {/* ── Wine Selection ── */}
        <section className="mb-8">
          <div className="flex items-center justify-between mb-3">
            <p className="label">Wines</p>
            {selectedWines.length > 0 && (
              <span className="text-[12px] font-semibold text-cherry">{selectedWines.length} selected</span>
            )}
          </div>

          {/* Search */}
          <div className="relative mb-3">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-light pointer-events-none" />
            <input
              type="text" value={searchQuery} onChange={(e) => handleSearch(e.target.value)}
              placeholder="Search by name, producer, region..."
              className="input-field w-full pl-10 text-[14px] touch-target"
            />
          </div>

          {/* Type chips */}
          {searchQuery.trim().length < 2 && (
            <div className="flex gap-1.5 overflow-x-auto pb-3 scrollbar-hide">
              {TYPE_FILTERS.map((f) => (
                <button key={f.label} onClick={() => setTypeFilter(f.value)}
                  className={`flex-shrink-0 chip text-[12px] ${typeFilter === f.value ? "chip-active" : ""}`}>
                  {f.value && <span className={`h-2.5 w-2.5 rounded-full ${typeColor(f.value)}`} />}
                  {f.label}
                </button>
              ))}
            </div>
          )}

          {/* Wine list */}
          <div className="wine-card divide-y divide-card-border max-h-[320px] overflow-y-auto">
            {!browseLoaded && searchQuery.trim().length < 2 ? (
              <div className="py-8 flex justify-center"><div className="h-5 w-5 skeleton rounded-full" /></div>
            ) : displayWines.length === 0 ? (
              <div className="py-8 text-center"><p className="body-sm">No wines found</p></div>
            ) : displayWines.map((wine) => {
              const added = selectedWines.some((w) => w.wine.id === wine.id);
              return (
                <button key={wine.id} onClick={() => added ? removeWine(wine.id) : addWine(wine)}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors touch-target ${added ? "bg-tint-wine" : "active:bg-tint-wine/50"}`}>
                  <span className={`h-3 w-3 rounded-full flex-shrink-0 ${typeColor(wine.type)}`} />
                  <div className="flex-1 min-w-0">
                    <p className="heading-sm text-foreground text-[14px] line-clamp-1">{wine.name}</p>
                    <p className="caption line-clamp-1">{wine.producer} · {wine.region}{wine.vintage ? ` · ${wine.vintage}` : ""}</p>
                  </div>
                  {added ? (
                    <div className="h-6 w-6 rounded-full bg-cherry flex items-center justify-center flex-shrink-0">
                      <Check className="h-3 w-3 text-white" strokeWidth={3} />
                    </div>
                  ) : (
                    <Plus className="h-4 w-4 text-stone-light flex-shrink-0" />
                  )}
                </button>
              );
            })}
          </div>
        </section>

        {/* ── Selected Wines + Hints ── */}
        {selectedWines.length > 0 && (
          <section className="mb-8">
            <p className="label mb-3">Flight Order & Hints</p>
            <div className="space-y-3">
              {selectedWines.map((sw, idx) => (
                <div key={sw.wine.id} className="wine-card p-4">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="h-7 w-7 rounded-lg bg-tint-wine flex items-center justify-center text-[12px] font-bold text-cherry flex-shrink-0">{idx + 1}</span>
                    <div className="flex-1 min-w-0">
                      <p className="heading-sm text-foreground text-[14px] line-clamp-1">{sw.wine.name}</p>
                      <p className="caption">{sw.wine.producer}</p>
                    </div>
                    <button onClick={() => removeWine(sw.wine.id)} className="h-7 w-7 rounded-lg flex items-center justify-center text-stone active:text-red-500 touch-target">
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  {/* Hints */}
                  {sw.hints.length > 0 && (
                    <div className="space-y-1.5 mb-2">
                      {sw.hints.map((h, hi) => (
                        <div key={hi} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-tint-gold">
                          <Sparkles className="h-3 w-3 text-gold flex-shrink-0" />
                          <span className="text-[12px] text-foreground flex-1">{h.content}</span>
                          <span className="caption capitalize">{h.hintType}</span>
                          <button onClick={() => removeHint(idx, hi)} className="text-stone"><X className="h-3 w-3" /></button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Add hint */}
                  {editingWineIdx === idx ? (
                    <div className="flex gap-2 mt-2">
                      <input type="text" value={newHintContent} onChange={(e) => setNewHintContent(e.target.value)} placeholder="e.g. Dark ruby color..." className="input-field flex-1 text-[13px] py-2" />
                      <select value={newHintType} onChange={(e) => setNewHintType(e.target.value)} className="input-field text-[12px] py-2 w-24">
                        {HINT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                      </select>
                      <button onClick={() => addHint(idx)} className="h-[38px] w-[38px] rounded-lg bg-cherry text-white flex items-center justify-center flex-shrink-0">
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    <button onClick={() => setEditingWineIdx(idx)} className="text-[12px] font-semibold text-cherry mt-1 touch-target">
                      + Add hints for this wine
                    </button>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Error */}
        {error && (
          <div className="wine-card p-3 bg-red-50 mb-4">
            <p className="text-red-600 text-[13px] font-medium">{error}</p>
          </div>
        )}

        {/* Create button */}
        <button onClick={handleCreate} disabled={isPending} className="btn-primary touch-target w-full">
          {isPending ? "Creating..." : "Create Live Event"}
        </button>
      </div>
    </div>
  );
}
