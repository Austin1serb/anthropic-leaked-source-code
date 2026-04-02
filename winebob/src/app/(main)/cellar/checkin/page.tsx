"use client";

import { useState, useTransition, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Star, Search, ArrowLeft, Loader2, Check } from "lucide-react";
import { searchWines, createReview, getWineById } from "@/lib/actions";

const TAGS = ["smooth", "tannic", "fruity", "complex", "value"] as const;

type Wine = {
  id: string;
  name: string;
  producer: string;
  region: string | null;
  country: string | null;
  type: string;
  vintage: number | null;
};

function CheckInContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const wineIdParam = searchParams.get("wineId");

  const [isPending, startTransition] = useTransition();

  // Search state
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Wine[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Selected wine
  const [selectedWine, setSelectedWine] = useState<Wine | null>(null);
  const [loadingWine, setLoadingWine] = useState(!!wineIdParam);

  // Review form state
  const [rating, setRating] = useState(0);
  const [notes, setNotes] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [submitted, setSubmitted] = useState(false);

  // Load pre-selected wine from query param
  useEffect(() => {
    if (wineIdParam) {
      setLoadingWine(true);
      getWineById(wineIdParam).then((wine) => {
        if (wine) {
          setSelectedWine({
            id: wine.id,
            name: wine.name,
            producer: wine.producer,
            region: wine.region,
            country: wine.country,
            type: wine.type,
            vintage: wine.vintage,
          });
        }
        setLoadingWine(false);
      });
    }
  }, [wineIdParam]);

  // Search handler with debounce-like behavior
  useEffect(() => {
    if (!searchQuery.trim() || selectedWine) {
      setSearchResults([]);
      return;
    }

    const timeout = setTimeout(() => {
      setIsSearching(true);
      searchWines(searchQuery).then((results) => {
        setSearchResults(results as Wine[]);
        setIsSearching(false);
      });
    }, 300);

    return () => clearTimeout(timeout);
  }, [searchQuery, selectedWine]);

  function toggleTag(tag: string) {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  }

  function handleSubmit() {
    if (!selectedWine || rating === 0) return;

    startTransition(async () => {
      await createReview({
        wineId: selectedWine.id,
        rating,
        notes,
        tags: selectedTags,
      });
      setSubmitted(true);
      setTimeout(() => {
        router.push("/cellar");
      }, 600);
    });
  }

  function handleBack() {
    if (selectedWine && !wineIdParam) {
      setSelectedWine(null);
      setRating(0);
      setNotes("");
      setSelectedTags([]);
    } else {
      router.back();
    }
  }

  // Loading pre-selected wine
  if (loadingWine) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 size={32} className="animate-spin text-wine-burgundy" />
      </div>
    );
  }

  // Success state
  if (submitted) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background px-6">
        <div className="animate-cheers mb-4">
          <Check size={48} className="text-wine-burgundy" />
        </div>
        <h2 className="text-2xl font-bold font-serif text-center">
          Cheers!
        </h2>
        <p className="text-muted text-sm mt-2">Your check-in has been saved.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background safe-top">
      {/* Header */}
      <div className="px-4 pt-4 pb-2 flex items-center gap-3">
        <button
          onClick={handleBack}
          className="touch-target flex items-center justify-center"
        >
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-xl font-bold font-serif">
          {selectedWine ? "Check In" : "Find a Wine"}
        </h1>
      </div>

      {/* Step 1: Wine search */}
      {!selectedWine && (
        <div className="flex-1 flex flex-col px-6 pt-4">
          {/* Search input */}
          <div className="wine-card flex items-center gap-3 px-4 py-3 mb-4">
            <Search size={20} className="text-muted flex-shrink-0" />
            <input
              type="text"
              placeholder="Search wines, producers, regions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 bg-transparent outline-none text-base placeholder:text-muted"
              autoFocus
            />
            {isSearching && (
              <Loader2 size={18} className="animate-spin text-muted flex-shrink-0" />
            )}
          </div>

          {/* Search results */}
          <div className="flex-1 overflow-y-auto scroll-smooth -mx-6 px-6 pb-8">
            {searchResults.length > 0 && (
              <div className="flex flex-col gap-2.5">
                {searchResults.map((wine) => (
                  <button
                    key={wine.id}
                    onClick={() => setSelectedWine(wine)}
                    className="wine-card p-4 text-left active:scale-[0.98] transition-transform"
                  >
                    <p className="font-semibold font-serif text-base leading-tight">
                      {wine.name}
                    </p>
                    <p className="text-sm text-muted mt-1">
                      {wine.producer}
                      {wine.vintage ? ` \u00B7 ${wine.vintage}` : ""}
                    </p>
                    {(wine.region || wine.country) && (
                      <p className="text-xs text-muted mt-0.5">
                        {[wine.region, wine.country].filter(Boolean).join(", ")}
                      </p>
                    )}
                  </button>
                ))}
              </div>
            )}

            {searchQuery.trim() && !isSearching && searchResults.length === 0 && (
              <p className="text-center text-muted text-sm pt-12">
                No wines found. Try a different search.
              </p>
            )}

            {!searchQuery.trim() && (
              <p className="text-center text-muted text-sm pt-12">
                Start typing to search for a wine.
              </p>
            )}
          </div>
        </div>
      )}

      {/* Step 2: Review form */}
      {selectedWine && (
        <div className="flex-1 flex flex-col px-6 pt-4">
          {/* Wine info header */}
          <div className="wine-card p-4 mb-6">
            <h2 className="text-lg font-bold font-serif leading-tight">
              {selectedWine.name}
            </h2>
            <p className="text-sm text-muted mt-1">
              {selectedWine.producer}
              {selectedWine.vintage ? ` \u00B7 ${selectedWine.vintage}` : ""}
            </p>
            {(selectedWine.region || selectedWine.country) && (
              <p className="text-xs text-muted mt-0.5">
                {[selectedWine.region, selectedWine.country]
                  .filter(Boolean)
                  .join(", ")}
              </p>
            )}
          </div>

          {/* Star rating */}
          <div className="mb-6">
            <label className="text-sm font-semibold mb-3 block">Rating</label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => setRating(star)}
                  className="touch-target flex items-center justify-center"
                >
                  <Star
                    size={36}
                    className={
                      star <= rating
                        ? "fill-wine-gold text-wine-gold"
                        : "text-card-border"
                    }
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Tasting notes */}
          <div className="mb-6">
            <label className="text-sm font-semibold mb-3 block">
              Tasting Notes
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="How was it? Aromas, flavors, texture..."
              rows={4}
              className="w-full wine-card p-4 bg-card-bg text-base placeholder:text-muted outline-none resize-none"
            />
          </div>

          {/* Tags */}
          <div className="mb-8">
            <label className="text-sm font-semibold mb-3 block">Tags</label>
            <div className="flex flex-wrap gap-2.5">
              {TAGS.map((tag) => {
                const isActive = selectedTags.includes(tag);
                return (
                  <button
                    key={tag}
                    onClick={() => toggleTag(tag)}
                    className={`px-4 py-2.5 rounded-full text-sm font-medium capitalize transition-all active:scale-95 touch-target ${
                      isActive
                        ? "bg-wine-burgundy text-white"
                        : "wine-card"
                    }`}
                  >
                    {tag}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Spacer to push button down */}
          <div className="flex-1" />

          {/* Submit button */}
          <div className="pb-8 safe-bottom">
            <button
              onClick={handleSubmit}
              disabled={isPending || rating === 0}
              className="w-full py-4 bg-wine-burgundy text-white rounded-2xl font-semibold text-base flex items-center justify-center gap-2 active:bg-wine-burgundy-dark transition-colors disabled:opacity-60"
            >
              {isPending ? (
                <>
                  <Loader2 size={20} className="animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Check size={20} />
                  Check In
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function CheckInPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-background">
          <Loader2 size={32} className="animate-spin text-wine-burgundy" />
        </div>
      }
    >
      <CheckInContent />
    </Suspense>
  );
}
