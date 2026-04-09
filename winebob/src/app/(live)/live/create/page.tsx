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

const TYPE_DOT: Record<string, string> = {
  red: "bg-[#74070E]", white: "bg-[#D4A843]", "rosé": "bg-[#E8A0B4]",
  sparkling: "bg-[#C9B037]", orange: "bg-[#D4782F]", dessert: "bg-[#B5651D]",
};

export default function CreateLiveEventPage() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const [hasSomProfile, setHasSomProfile] = useState<boolean | null>(null);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [isPublic, setIsPublic] = useState(true);
  const [scheduledAt, setScheduledAt] = useState("");
  const [maxParticipants, setMaxParticipants] = useState("");
  const [showCrowdStats, setShowCrowdStats] = useState(true);
  const [guessFields, setGuessFields] = useState<string[]>(["grape", "region", "country", "vintage"]);
  const [difficulty, setDifficulty] = useState("intermediate");

  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<WineResult[]>([]);
  const [browseWineList, setBrowseWineList] = useState<WineResult[]>([]);
  const [browseLoaded, setBrowseLoaded] = useState(false);
  const [searching, setSearching] = useState(false);
  const [selectedWines, setSelectedWines] = useState<WineWithHints[]>([]);
  const [typeFilter, setTypeFilter] = useState<string | null>(null);

  const [editingWineIdx, setEditingWineIdx] = useState<number | null>(null);
  const [newHintContent, setNewHintContent] = useState("");
  const [newHintType, setNewHintType] = useState("aroma");

  useEffect(() => {
    getMyProfile().then((p) => setHasSomProfile(!!p)).catch(() => setHasSomProfile(false));
    getBrowseWines().then((data) => { setBrowseWineList(data as WineResult[]); setBrowseLoaded(true); }).catch(() => setBrowseLoaded(true));
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
    : browseWineList.filter((w) => !typeFilter || w.type.toLowerCase() === typeFilter);

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
          title: title.trim(), description: description.trim() || undefined, isPublic, scheduledAt,
          maxParticipants: maxParticipants ? parseInt(maxParticipants, 10) : undefined,
          guessFields, scoringConfig, difficulty, showCrowdStats,
          wines: selectedWines.map((w) => ({ wineId: w.wine.id, hints: w.hints })),
        });
        router.push(`/live/${event.id}/host`);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to create event");
      }
    });
  }

  if (hasSomProfile === null) {
    return <div className="min-h-screen flex items-center justify-center"><div className="h-6 w-6 rounded-full border-2 border-cherry border-t-transparent animate-spin" /></div>;
  }

  if (hasSomProfile === false) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center">
        <div className="h-14 w-14 rounded-full bg-cherry/10 flex items-center justify-center mb-4">
          <Wine className="h-7 w-7 text-cherry/40" />
        </div>
        <h1 className="text-[20px] font-bold text-foreground font-serif mb-2">Sommelier Profile Required</h1>
        <p className="text-[13px] text-muted mb-6">You need a sommelier profile to host live events.</p>
        <Link href="/sommeliers/become" className="btn-primary px-8 touch-target">Become a Sommelier</Link>
      </div>
    );
  }

  const TYPE_FILTERS = [
    { value: null, label: "All" },
    { value: "red", label: "Red" }, { value: "white", label: "White" },
    { value: "rosé", label: "Rosé" }, { value: "sparkling", label: "Sparkling" },
  ];

  return (
    <div className="px-5 pt-6 pb-28">
      <Link href="/live" className="inline-flex items-center gap-1 text-[13px] font-semibold text-muted hover:text-foreground transition-colors touch-target mb-5">
        <ChevronLeft className="h-3.5 w-3.5" /> Cancel
      </Link>

      <h1 className="text-[24px] font-bold text-foreground tracking-tight font-serif mb-1">Create Live Event</h1>
      <p className="text-[13px] text-muted mb-6">Set up a live tasting for your audience.</p>

      {/* ── Event Details ── */}
      <div className="bg-white rounded-[14px] border border-card-border/60 p-5 mb-5">
        <h2 className="text-[11px] font-bold text-muted uppercase tracking-widest mb-4">Event Details</h2>
        <div className="space-y-4">
          <div>
            <label className="text-[12px] font-semibold text-foreground">Title *</label>
            <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Event title" className="input-field w-full touch-target mt-1.5" />
          </div>
          <div>
            <label className="text-[12px] font-semibold text-foreground">Description</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Description (optional)" rows={2} className="input-field w-full resize-none mt-1.5" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[12px] font-semibold text-foreground">Date & Time *</label>
              <input type="datetime-local" value={scheduledAt} onChange={(e) => setScheduledAt(e.target.value)} className="input-field w-full mt-1.5" />
            </div>
            <div>
              <label className="text-[12px] font-semibold text-foreground">Max Participants</label>
              <input type="number" value={maxParticipants} onChange={(e) => setMaxParticipants(e.target.value)} placeholder="Unlimited" className="input-field w-full mt-1.5" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button type="button" onClick={() => setIsPublic(true)} className={`rounded-[10px] p-3 flex items-center gap-2.5 transition-all border ${isPublic ? "bg-cherry/[0.06] border-cherry/20" : "bg-white border-card-border/60"}`}>
              <Globe className={`h-4 w-4 ${isPublic ? "text-cherry" : "text-muted"}`} />
              <div className="text-left">
                <p className="text-[13px] font-semibold text-foreground">Public</p>
                <p className="text-[10px] text-muted">Anyone can join</p>
              </div>
            </button>
            <button type="button" onClick={() => setIsPublic(false)} className={`rounded-[10px] p-3 flex items-center gap-2.5 transition-all border ${!isPublic ? "bg-cherry/[0.06] border-cherry/20" : "bg-white border-card-border/60"}`}>
              <Lock className={`h-4 w-4 ${!isPublic ? "text-cherry" : "text-muted"}`} />
              <div className="text-left">
                <p className="text-[13px] font-semibold text-foreground">Private</p>
                <p className="text-[10px] text-muted">Code required</p>
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* ── Guess Fields ── */}
      <div className="bg-white rounded-[14px] border border-card-border/60 p-5 mb-5">
        <h2 className="text-[11px] font-bold text-muted uppercase tracking-widest mb-3">What Viewers Guess</h2>
        <div className="flex flex-wrap gap-1.5">
          {GUESS_FIELDS.map((f) => {
            const active = guessFields.includes(f.key);
            return (
              <button key={f.key} type="button" onClick={() => toggleGuessField(f.key)}
                className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-[12px] font-medium border transition-all ${
                  active ? "bg-cherry/[0.07] border-cherry/20 text-cherry" : "bg-white border-card-border/50 text-muted"
                }`}>
                {active && <Check className="h-3 w-3" />}
                {f.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Wine Selection ── */}
      <div className="bg-white rounded-[14px] border border-card-border/60 overflow-hidden mb-5">
        <div className="flex items-center justify-between px-5 py-3 border-b border-card-border/40">
          <h2 className="text-[11px] font-bold text-muted uppercase tracking-widest">Wines</h2>
          {selectedWines.length > 0 && <span className="text-[12px] font-bold text-cherry nums">{selectedWines.length}</span>}
        </div>

        <div className="p-4 border-b border-card-border/40">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted/40 pointer-events-none" />
            <input type="text" value={searchQuery} onChange={(e) => handleSearch(e.target.value)} placeholder="Search wines..." className="input-field w-full pl-9" />
          </div>
          {searchQuery.trim().length < 2 && (
            <div className="flex gap-1.5 mt-3 overflow-x-auto scrollbar-hide">
              {TYPE_FILTERS.map((f) => (
                <button key={f.label} onClick={() => setTypeFilter(f.value)}
                  className={`flex-shrink-0 px-3 py-1 rounded-[8px] text-[11px] font-semibold transition-colors ${
                    typeFilter === f.value ? "bg-cherry text-white" : "text-muted hover:bg-butter/80"
                  }`}>
                  {f.label}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="divide-y divide-card-border/30 max-h-[300px] overflow-y-auto">
          {!browseLoaded && searchQuery.trim().length < 2 ? (
            <div className="py-8 flex justify-center"><div className="h-5 w-5 rounded-full border-2 border-cherry border-t-transparent animate-spin" /></div>
          ) : displayWines.length === 0 ? (
            <div className="py-8 text-center"><p className="text-[13px] text-muted">No wines found</p></div>
          ) : displayWines.map((wine) => {
            const added = selectedWines.some((w) => w.wine.id === wine.id);
            return (
              <button key={wine.id} onClick={() => added ? removeWine(wine.id) : addWine(wine)}
                className={`w-full flex items-center gap-3 px-5 py-3 text-left transition-colors ${added ? "bg-cherry/[0.04]" : "hover:bg-butter/60"}`}>
                <div className={`h-2 w-2 rounded-full flex-shrink-0 ${TYPE_DOT[wine.type.toLowerCase()] || "bg-gray-300"}`} />
                <div className="flex-1 min-w-0">
                  <p className={`text-[13px] font-medium line-clamp-1 ${added ? "text-cherry" : "text-foreground"}`}>{wine.name}</p>
                  <p className="text-[11px] text-muted line-clamp-1">{wine.producer}{wine.region ? ` · ${wine.region}` : ""}</p>
                </div>
                <div className={`h-5 w-5 rounded-[5px] border-2 flex items-center justify-center flex-shrink-0 ${
                  added ? "bg-cherry border-cherry" : "border-card-border/60 bg-white"
                }`}>
                  {added && <Check className="h-3 w-3 text-white" strokeWidth={3} />}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Flight Order + Hints ── */}
      {selectedWines.length > 0 && (
        <div className="bg-white rounded-[14px] border border-card-border/60 overflow-hidden mb-5">
          <div className="px-5 py-3 border-b border-card-border/40">
            <h2 className="text-[11px] font-bold text-muted uppercase tracking-widest">Flight Order & Hints</h2>
          </div>
          <div className="divide-y divide-card-border/30">
            {selectedWines.map((sw, idx) => (
              <div key={sw.wine.id} className="px-5 py-4">
                <div className="flex items-center gap-3 mb-2">
                  <span className="h-7 w-7 rounded-[6px] bg-cherry/[0.07] flex items-center justify-center text-[11px] font-bold text-cherry nums flex-shrink-0">{idx + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-medium text-foreground line-clamp-1">{sw.wine.name}</p>
                    <p className="text-[11px] text-muted">{sw.wine.producer}</p>
                  </div>
                  <button onClick={() => removeWine(sw.wine.id)} className="h-7 w-7 rounded-[6px] flex items-center justify-center text-muted/40 hover:text-red-500 hover:bg-red-50 transition-colors">
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>

                {sw.hints.length > 0 && (
                  <div className="space-y-1 mb-2 pl-10">
                    {sw.hints.map((h, hi) => (
                      <div key={hi} className="flex items-center gap-2 px-3 py-1.5 rounded-[8px] bg-amber-50/60">
                        <Sparkles className="h-3 w-3 text-amber-500 flex-shrink-0" />
                        <span className="text-[11px] text-foreground flex-1">{h.content}</span>
                        <span className="text-[9px] text-muted capitalize">{h.hintType}</span>
                        <button onClick={() => removeHint(idx, hi)} className="text-muted/40 hover:text-red-500"><X className="h-3 w-3" /></button>
                      </div>
                    ))}
                  </div>
                )}

                {editingWineIdx === idx ? (
                  <div className="flex gap-2 pl-10">
                    <input type="text" value={newHintContent} onChange={(e) => setNewHintContent(e.target.value)} placeholder="e.g. Dark ruby color..." className="input-field flex-1 text-[12px]" />
                    <select value={newHintType} onChange={(e) => setNewHintType(e.target.value)} className="input-field text-[11px] w-20">
                      {HINT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                    </select>
                    <button onClick={() => addHint(idx)} className="h-9 w-9 rounded-[8px] bg-cherry text-white flex items-center justify-center flex-shrink-0">
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <button onClick={() => setEditingWineIdx(idx)} className="text-[11px] font-semibold text-cherry pl-10">
                    + Add hint
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {error && (
        <div className="rounded-[10px] bg-red-50 border border-red-200 p-3 mb-4">
          <p className="text-red-600 text-[13px] font-medium">{error}</p>
        </div>
      )}

      <button onClick={handleCreate} disabled={isPending} className="btn-primary touch-target w-full">
        {isPending ? "Creating..." : "Create Live Event"}
      </button>
    </div>
  );
}
