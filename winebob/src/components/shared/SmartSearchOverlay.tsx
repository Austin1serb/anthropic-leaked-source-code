"use client";

import { useRouter } from "next/navigation";
import {
  X,
  Grape,
  Wine,
  MapPin,
  Factory,
  Sparkles,
  Clock,
  TrendingUp,
  ChevronRight,
  Loader2,
} from "lucide-react";
import {
  useState,
  useEffect,
  useRef,
  useCallback,
  useTransition,
} from "react";
import { useSearch } from "@/components/shared/SearchContext";
import { useSearchCache } from "@/hooks/useSearchCache";
import {
  smartSearch,
  getPopularSearches,
  aiParseQuery,
} from "@/lib/searchActions";
import type { SmartSearchResults, AIParsedQuery } from "@/lib/searchActions";

// ── Constants ──

const TYPES_COLORS: Record<string, string> = {
  red: "#74070E",
  white: "#C8A255",
  rosé: "#C47080",
  sparkling: "#B8A840",
  orange: "#C87840",
  dessert: "#8B6914",
  fortified: "#5A3020",
};

const RECENT_SEARCHES_KEY = "winebob-recent-searches";
const MAX_RECENT = 10;

// ── Helpers ──

function getRecentSearches(): string[] {
  try {
    const raw = localStorage.getItem(RECENT_SEARCHES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveRecentSearch(query: string) {
  try {
    const recent = getRecentSearches().filter((s) => s !== query);
    recent.unshift(query);
    localStorage.setItem(
      RECENT_SEARCHES_KEY,
      JSON.stringify(recent.slice(0, MAX_RECENT))
    );
  } catch {
    // localStorage may be unavailable
  }
}

// ── Component ──

export function SmartSearchOverlay() {
  const router = useRouter();
  const { isSearchOpen, closeSearch } = useSearch();
  const { search: fuseSearch, ready: fuseReady } = useSearchCache();
  const inputRef = useRef<HTMLInputElement>(null);

  const [query, setQuery] = useState("");
  const [fuseResults, setFuseResults] = useState<ReturnType<typeof fuseSearch>>(
    { wines: [], grapes: [], regions: [] }
  );
  const [serverResults, setServerResults] =
    useState<SmartSearchResults | null>(null);
  const [popular, setPopular] = useState<string[]>([]);
  const [recent, setRecent] = useState<string[]>([]);
  const [aiResult, setAiResult] = useState<AIParsedQuery | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [, startTransition] = useTransition();
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  // Load recent + popular on open
  useEffect(() => {
    if (isSearchOpen) {
      setRecent(getRecentSearches());
      getPopularSearches()
        .then(setPopular)
        .catch(() => {});
      // Focus input
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      // Reset state on close
      setQuery("");
      setFuseResults({ wines: [], grapes: [], regions: [] });
      setServerResults(null);
      setAiResult(null);
      setSelectedIndex(-1);
    }
  }, [isSearchOpen]);

  // Fuse.js instant search + debounced server search
  useEffect(() => {
    if (!query || query.length < 2) {
      setFuseResults({ wines: [], grapes: [], regions: [] });
      setServerResults(null);
      setSelectedIndex(-1);
      return;
    }

    // Instant Fuse.js results
    if (fuseReady) {
      setFuseResults(fuseSearch(query));
    }

    // Debounced server search
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      startTransition(() => {
        smartSearch(query)
          .then(setServerResults)
          .catch(() => {});
      });
    }, 200);

    setSelectedIndex(-1);

    return () => clearTimeout(debounceRef.current);
  }, [query, fuseReady, fuseSearch, startTransition]);

  // Keyboard shortcut: Cmd+K / Ctrl+K
  const { openSearch } = useSearch();
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        if (isSearchOpen) closeSearch();
        else openSearch();
      }
      if (e.key === "Escape" && isSearchOpen) {
        closeSearch();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isSearchOpen, openSearch, closeSearch]);

  // Navigate to result
  const navigateTo = useCallback(
    (path: string, searchTerm?: string) => {
      if (searchTerm) saveRecentSearch(searchTerm);
      closeSearch();
      router.push(path);
    },
    [closeSearch, router]
  );

  // AI search handler
  async function handleAiSearch() {
    if (!query || query.length < 3) return;
    setAiLoading(true);
    try {
      const parsed = await aiParseQuery(query);
      setAiResult(parsed);

      // Build URL from parsed filters
      const params = new URLSearchParams();
      if (parsed.type) params.set("type", parsed.type);
      if (parsed.country) params.set("country", parsed.country);
      if (parsed.grape) params.set("search", parsed.grape);
      else if (parsed.region) params.set("search", parsed.region);
      else if (parsed.search) params.set("search", parsed.search);
      if (parsed.priceRange) params.set("priceRange", parsed.priceRange);

      const qs = params.toString();
      saveRecentSearch(query);
      closeSearch();
      router.push(`/wines${qs ? `?${qs}` : ""}`);
    } catch {
      // fallback
    } finally {
      setAiLoading(false);
    }
  }

  // Build flat result list for keyboard navigation
  const allResults: { type: string; label: string; sub: string; path: string }[] = [];
  const results = serverResults ?? null;
  const fuse = fuseResults;

  // Use server results if available, otherwise fuse
  if (results) {
    results.wines.forEach((w) =>
      allResults.push({
        type: "wine",
        label: w.name,
        sub: `${w.producer} · ${w.region}`,
        path: `/wines/${w.id}`,
      })
    );
    results.grapes.forEach((g) =>
      allResults.push({
        type: "grape",
        label: g.name,
        sub: `${g.color}${g.originCountry ? ` · ${g.originCountry}` : ""}`,
        path: `/wines?search=${encodeURIComponent(g.name)}`,
      })
    );
    results.regions.forEach((r) =>
      allResults.push({
        type: "region",
        label: r.region,
        sub: `${r.country} · ${r.wineCount} wines`,
        path: `/wines?search=${encodeURIComponent(r.region)}`,
      })
    );
    results.producers.forEach((p) =>
      allResults.push({
        type: "producer",
        label: p.name,
        sub: `${p.country} · ${p.wineCount} wines`,
        path: `/wines?search=${encodeURIComponent(p.name)}`,
      })
    );
  } else if (query.length >= 2) {
    fuse.wines.forEach((r) =>
      allResults.push({
        type: "wine",
        label: r.item.name,
        sub: `${r.item.producer} · ${r.item.region}`,
        path: `/wines/${r.item.id}`,
      })
    );
    fuse.grapes.forEach((r) =>
      allResults.push({
        type: "grape",
        label: r.item.name,
        sub: r.item.color,
        path: `/wines?search=${encodeURIComponent(r.item.name)}`,
      })
    );
    fuse.regions.forEach((r) =>
      allResults.push({
        type: "region",
        label: r.item.region,
        sub: r.item.country,
        path: `/wines?search=${encodeURIComponent(r.item.region)}`,
      })
    );
  }

  // Keyboard navigation
  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((i) => Math.min(i + 1, allResults.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((i) => Math.max(i - 1, -1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (selectedIndex >= 0 && allResults[selectedIndex]) {
        navigateTo(allResults[selectedIndex].path, query);
      } else if (query.length >= 2) {
        // Navigate to wines page with search
        saveRecentSearch(query);
        closeSearch();
        router.push(`/wines?search=${encodeURIComponent(query)}`);
      }
    }
  }

  if (!isSearchOpen) return null;

  const hasQuery = query.length >= 2;
  const hasResults = allResults.length > 0;
  const showEmpty = hasQuery && !hasResults && serverResults !== null;

  return (
    <div
      className="fixed inset-0 z-[100] flex flex-col"
      role="dialog"
      aria-modal="true"
      aria-label="Search"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-[#1A1412]/80 backdrop-blur-2xl"
        onClick={closeSearch}
      />

      {/* Content */}
      <div className="relative z-10 flex flex-col w-full max-w-xl mx-auto pt-[env(safe-area-inset-top,0px)]">
        {/* Search input */}
        <div className="px-4 pt-4 pb-2">
          <div className="flex items-center h-14 rounded-2xl bg-[#1A1412]/90 backdrop-blur-xl border border-white/[0.1] shadow-[0_8px_32px_rgba(0,0,0,0.3)] px-4 gap-3">
            <Grape className="h-5 w-5 text-[#E8A08A] flex-shrink-0" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={onKeyDown}
              placeholder="Search wines, grapes, regions..."
              className="flex-1 bg-transparent text-[16px] text-white/90 placeholder:text-white/30 focus:outline-none"
              autoComplete="off"
              autoCorrect="off"
              spellCheck={false}
            />
            {query && (
              <button
                onClick={() => setQuery("")}
                className="p-1 rounded-lg hover:bg-white/10 transition-colors"
              >
                <X className="h-4 w-4 text-white/40" />
              </button>
            )}
            <button
              onClick={handleAiSearch}
              disabled={query.length < 3 || aiLoading}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cherry/80 text-white text-[11px] font-bold disabled:opacity-30 active:scale-95 transition-all flex-shrink-0"
              title="AI-powered search"
            >
              {aiLoading ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Sparkles className="h-3.5 w-3.5" />
              )}
              AI
            </button>
          </div>
          {/* Keyboard hint (desktop) */}
          <div className="hidden sm:flex items-center justify-between px-1 mt-1.5">
            <span className="text-[10px] text-white/20">
              <kbd className="px-1 py-0.5 rounded bg-white/10 text-white/30 font-mono text-[9px]">
                ESC
              </kbd>{" "}
              to close
            </span>
            <span className="text-[10px] text-white/20">
              <kbd className="px-1 py-0.5 rounded bg-white/10 text-white/30 font-mono text-[9px]">
                ↑↓
              </kbd>{" "}
              navigate{" "}
              <kbd className="px-1 py-0.5 rounded bg-white/10 text-white/30 font-mono text-[9px]">
                ↵
              </kbd>{" "}
              select
            </span>
          </div>
        </div>

        {/* Results area */}
        <div className="flex-1 overflow-y-auto px-4 pb-8 max-h-[70vh]">
          {/* AI result banner */}
          {aiResult && aiResult.description && (
            <div className="mb-3 px-3 py-2.5 rounded-xl bg-cherry/20 border border-cherry/30 animate-fade-in-up">
              <div className="flex items-center gap-2 mb-1">
                <Sparkles className="h-3.5 w-3.5 text-cherry" />
                <span className="text-[11px] font-bold text-cherry">
                  AI understood
                </span>
              </div>
              <p className="text-[12px] text-white/60">
                {aiResult.description}
              </p>
            </div>
          )}

          {/* No query: show recent + popular */}
          {!hasQuery && (
            <div className="stagger-children">
              {recent.length > 0 && (
                <div className="mb-5">
                  <div className="flex items-center gap-2 px-1 mb-2">
                    <Clock className="h-3.5 w-3.5 text-white/25" />
                    <span className="text-[11px] font-bold text-white/30 uppercase tracking-wider">
                      Recent
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {recent.map((term) => (
                      <button
                        key={term}
                        onClick={() => {
                          setQuery(term);
                        }}
                        className="px-3 py-1.5 rounded-xl bg-white/[0.06] border border-white/[0.06] text-[12px] text-white/60 font-medium hover:bg-white/10 active:scale-95 transition-all"
                      >
                        {term}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {popular.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 px-1 mb-2">
                    <TrendingUp className="h-3.5 w-3.5 text-white/25" />
                    <span className="text-[11px] font-bold text-white/30 uppercase tracking-wider">
                      Popular
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {popular.map((term) => (
                      <button
                        key={term}
                        onClick={() => {
                          setQuery(term);
                        }}
                        className="px-3 py-1.5 rounded-xl bg-white/[0.06] border border-white/[0.06] text-[12px] text-white/60 font-medium hover:bg-white/10 active:scale-95 transition-all"
                      >
                        {term}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {recent.length === 0 && popular.length === 0 && (
                <div className="text-center py-12">
                  <Grape className="h-8 w-8 text-white/10 mx-auto mb-3" />
                  <p className="text-[14px] font-semibold text-white/30">
                    Start typing to search
                  </p>
                  <p className="text-[12px] text-white/15 mt-1">
                    Wines, grapes, regions, producers
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Results grouped by category */}
          {hasQuery && hasResults && (
            <div className="stagger-children">
              {/* Wine results */}
              {(results?.wines ?? fuse.wines).length > 0 && (
                <ResultSection
                  title="Wines"
                  icon={<Wine className="h-3.5 w-3.5" />}
                  count={results?.totalWines}
                >
                  {(results
                    ? results.wines.map((w) => ({
                        id: w.id,
                        name: w.name,
                        sub: `${w.producer} · ${w.region}`,
                        type: w.type,
                      }))
                    : fuse.wines.map((r) => ({
                        id: r.item.id,
                        name: r.item.name,
                        sub: `${r.item.producer} · ${r.item.region}`,
                        type: r.item.type,
                      }))
                  ).map((w, i) => (
                    <button
                      key={w.id}
                      onClick={() => navigateTo(`/wines/${w.id}`, query)}
                      className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-left transition-colors ${
                        selectedIndex === i
                          ? "bg-cherry/30"
                          : "hover:bg-white/[0.06] active:bg-white/10"
                      }`}
                    >
                      <div
                        className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                        style={{
                          background:
                            TYPES_COLORS[w.type.toLowerCase()] ?? "#8C7E6E",
                        }}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-semibold text-white/90 truncate">
                          {w.name}
                        </p>
                        <p className="text-[11px] text-white/40 truncate">
                          {w.sub}
                        </p>
                      </div>
                      <ChevronRight className="h-3.5 w-3.5 text-white/15 flex-shrink-0" />
                    </button>
                  ))}
                  {results && results.totalWines > 5 && (
                    <button
                      onClick={() =>
                        navigateTo(
                          `/wines?search=${encodeURIComponent(query)}`,
                          query
                        )
                      }
                      className="w-full text-center py-2 text-[11px] font-semibold text-cherry hover:text-cherry-light transition-colors"
                    >
                      View all {results.totalWines} wines
                    </button>
                  )}
                </ResultSection>
              )}

              {/* Grape results */}
              {(results?.grapes ?? fuse.grapes).length > 0 && (
                <ResultSection
                  title="Grapes"
                  icon={<Grape className="h-3.5 w-3.5" />}
                >
                  {(results
                    ? results.grapes.map((g) => ({
                        id: g.id,
                        name: g.name,
                        sub: `${g.color}${g.originCountry ? ` · ${g.originCountry}` : ""}`,
                      }))
                    : fuse.grapes.map((r) => ({
                        id: r.item.id,
                        name: r.item.name,
                        sub: r.item.color,
                      }))
                  ).map((g) => {
                    const idx = allResults.findIndex(
                      (r) => r.type === "grape" && r.label === g.name
                    );
                    return (
                      <button
                        key={g.id}
                        onClick={() =>
                          navigateTo(
                            `/wines?search=${encodeURIComponent(g.name)}`,
                            query
                          )
                        }
                        className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-left transition-colors ${
                          selectedIndex === idx
                            ? "bg-cherry/30"
                            : "hover:bg-white/[0.06] active:bg-white/10"
                        }`}
                      >
                        <Grape className="h-4 w-4 text-[#C8A255] flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-[13px] font-semibold text-white/90 truncate">
                            {g.name}
                          </p>
                          <p className="text-[11px] text-white/40 truncate">
                            {g.sub}
                          </p>
                        </div>
                        <ChevronRight className="h-3.5 w-3.5 text-white/15 flex-shrink-0" />
                      </button>
                    );
                  })}
                </ResultSection>
              )}

              {/* Region results */}
              {(results?.regions ?? fuse.regions).length > 0 && (
                <ResultSection
                  title="Regions"
                  icon={<MapPin className="h-3.5 w-3.5" />}
                >
                  {(results
                    ? results.regions.map((r) => ({
                        key: `${r.region}-${r.country}`,
                        name: r.region,
                        sub: `${r.country} · ${r.wineCount} wines`,
                      }))
                    : fuse.regions.map((r) => ({
                        key: `${r.item.region}-${r.item.country}`,
                        name: r.item.region,
                        sub: r.item.country,
                      }))
                  ).map((r) => {
                    const idx = allResults.findIndex(
                      (res) => res.type === "region" && res.label === r.name
                    );
                    return (
                      <button
                        key={r.key}
                        onClick={() =>
                          navigateTo(
                            `/wines?search=${encodeURIComponent(r.name)}`,
                            query
                          )
                        }
                        className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-left transition-colors ${
                          selectedIndex === idx
                            ? "bg-cherry/30"
                            : "hover:bg-white/[0.06] active:bg-white/10"
                        }`}
                      >
                        <MapPin className="h-4 w-4 text-[#8B9E82] flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-[13px] font-semibold text-white/90 truncate">
                            {r.name}
                          </p>
                          <p className="text-[11px] text-white/40 truncate">
                            {r.sub}
                          </p>
                        </div>
                        <ChevronRight className="h-3.5 w-3.5 text-white/15 flex-shrink-0" />
                      </button>
                    );
                  })}
                </ResultSection>
              )}

              {/* Producer results (server only) */}
              {results && results.producers.length > 0 && (
                <ResultSection
                  title="Producers"
                  icon={<Factory className="h-3.5 w-3.5" />}
                >
                  {results.producers.map((p) => {
                    const idx = allResults.findIndex(
                      (res) => res.type === "producer" && res.label === p.name
                    );
                    return (
                      <button
                        key={`${p.name}-${p.country}`}
                        onClick={() =>
                          navigateTo(
                            `/wines?search=${encodeURIComponent(p.name)}`,
                            query
                          )
                        }
                        className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-left transition-colors ${
                          selectedIndex === idx
                            ? "bg-cherry/30"
                            : "hover:bg-white/[0.06] active:bg-white/10"
                        }`}
                      >
                        <Factory className="h-4 w-4 text-leather flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-[13px] font-semibold text-white/90 truncate">
                            {p.name}
                          </p>
                          <p className="text-[11px] text-white/40 truncate">
                            {p.country} · {p.wineCount} wines
                          </p>
                        </div>
                        <ChevronRight className="h-3.5 w-3.5 text-white/15 flex-shrink-0" />
                      </button>
                    );
                  })}
                </ResultSection>
              )}
            </div>
          )}

          {/* No results */}
          {showEmpty && (
            <div className="text-center py-12 animate-fade-in-up">
              <Wine className="h-8 w-8 text-white/10 mx-auto mb-3" />
              <p className="text-[14px] font-semibold text-white/30">
                No results found
              </p>
              <p className="text-[12px] text-white/15 mt-1">
                Try a different search or use AI search
              </p>
              <button
                onClick={handleAiSearch}
                disabled={aiLoading}
                className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-cherry/60 text-white text-[13px] font-semibold active:scale-95 transition-all disabled:opacity-50"
              >
                <Sparkles className="h-4 w-4" />
                Try AI search
              </button>
            </div>
          )}
        </div>

        {/* Mobile close button */}
        <div className="sm:hidden px-4 pb-4">
          <button
            onClick={closeSearch}
            className="w-full h-11 rounded-[10px] bg-white/10 border border-white/10 text-white/60 text-[14px] font-semibold hover:bg-white/15 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Result Section ──

function ResultSection({
  title,
  icon,
  count,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  count?: number;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-4">
      <div className="flex items-center gap-2 px-1 mb-1.5">
        <span className="text-white/25">{icon}</span>
        <span className="text-[11px] font-bold text-white/30 uppercase tracking-wider">
          {title}
        </span>
        {count !== undefined && (
          <span className="text-[10px] font-bold text-white/20 bg-white/[0.06] px-1.5 py-0.5 rounded-md">
            {count}
          </span>
        )}
      </div>
      <div className="flex flex-col">{children}</div>
    </div>
  );
}
