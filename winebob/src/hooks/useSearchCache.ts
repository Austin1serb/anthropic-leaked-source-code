"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import Fuse from "fuse.js";
import type { FuseResult, IFuseOptions } from "fuse.js";
import { getSearchIndex } from "@/lib/searchActions";
import type { SearchIndexData } from "@/lib/searchActions";

type WineIndex = SearchIndexData["wines"][number];
type GrapeIndex = SearchIndexData["grapes"][number];
type RegionIndex = SearchIndexData["regions"][number];

export type FuseResults = {
  wines: FuseResult<WineIndex>[];
  grapes: FuseResult<GrapeIndex>[];
  regions: FuseResult<RegionIndex>[];
};

const WINE_FUSE_OPTIONS: IFuseOptions<WineIndex> = {
  keys: [
    { name: "name", weight: 1.0 },
    { name: "producer", weight: 0.8 },
    { name: "region", weight: 0.6 },
    { name: "grapes", weight: 0.5 },
    { name: "country", weight: 0.4 },
  ],
  threshold: 0.3,
  includeScore: true,
  minMatchCharLength: 2,
};

const GRAPE_FUSE_OPTIONS: IFuseOptions<GrapeIndex> = {
  keys: [
    { name: "name", weight: 1.0 },
    { name: "aliases", weight: 0.8 },
  ],
  threshold: 0.3,
  includeScore: true,
  minMatchCharLength: 2,
};

const REGION_FUSE_OPTIONS: IFuseOptions<RegionIndex> = {
  keys: [
    { name: "region", weight: 1.0 },
    { name: "country", weight: 0.5 },
  ],
  threshold: 0.3,
  includeScore: true,
  minMatchCharLength: 2,
};

function readCache(): SearchIndexData | null {
  try {
    const cached = sessionStorage.getItem("winebob-search-index");
    if (cached) return JSON.parse(cached);
  } catch {
    // ignore
  }
  return null;
}

export function useSearchCache() {
  const [data, setData] = useState<SearchIndexData | null>(() => readCache());
  const [loading, setLoading] = useState(() => readCache() === null);

  useEffect(() => {
    // If we already have data from cache init, skip fetch
    if (data) return;

    let cancelled = false;
    getSearchIndex()
      .then((index) => {
        if (cancelled) return;
        setData(index);
        try {
          sessionStorage.setItem(
            "winebob-search-index",
            JSON.stringify(index)
          );
        } catch {
          // sessionStorage may be full or unavailable
        }
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [data]);

  const fuseWines = useMemo(
    () => (data ? new Fuse(data.wines, WINE_FUSE_OPTIONS) : null),
    [data]
  );

  const fuseGrapes = useMemo(
    () => (data ? new Fuse(data.grapes, GRAPE_FUSE_OPTIONS) : null),
    [data]
  );

  const fuseRegions = useMemo(
    () => (data ? new Fuse(data.regions, REGION_FUSE_OPTIONS) : null),
    [data]
  );

  const search = useCallback(
    (query: string): FuseResults => {
      if (!query || query.length < 2) {
        return { wines: [], grapes: [], regions: [] };
      }
      return {
        wines: fuseWines?.search(query, { limit: 5 }) ?? [],
        grapes: fuseGrapes?.search(query, { limit: 5 }) ?? [],
        regions: fuseRegions?.search(query, { limit: 5 }) ?? [],
      };
    },
    [fuseWines, fuseGrapes, fuseRegions]
  );

  return { search, loading, ready: !!data };
}
