"use client";

import { useState, useCallback, useEffect } from "react";
import type { MapLayer } from "@/components/shared/MapLayerDrawer";

const STORAGE_KEY = "winebob-map-layers";

/** Default layer definitions — all disabled initially. */
const DEFAULT_LAYERS: Omit<MapLayer, "icon">[] = [
  {
    id: "vintage-weather",
    name: "Vintage Weather",
    description: "Replay a vintage's growing season",
    group: "explore",
    exclusive: "heavy-overlay",
    enabled: false,
    available: true,
  },
  {
    id: "flavor-genome",
    name: "Flavor Genome",
    description: "Taste profiles by region",
    group: "explore",
    exclusive: "heavy-overlay",
    enabled: false,
    available: true,
  },
  {
    id: "live-heatmap",
    name: "Live Activity",
    description: "See what people are drinking",
    group: "social",
    enabled: false,
    available: true,
  },
  {
    id: "draw-flight",
    name: "Draw a Flight",
    description: "Trace a path, get a tasting flight",
    group: "tools",
    enabled: false,
    available: true,
  },
];

function loadPersistedState(): Record<string, boolean> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as Record<string, boolean>;
  } catch {
    // Ignore parse errors
  }
  return {};
}

function persistState(layers: Omit<MapLayer, "icon">[]) {
  if (typeof window === "undefined") return;
  const map: Record<string, boolean> = {};
  for (const l of layers) {
    map[l.id] = l.enabled;
  }
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
  } catch {
    // Ignore quota errors
  }
}

export function useMapLayers() {
  const [layers, setLayers] = useState<Omit<MapLayer, "icon">[]>(() => {
    const persisted = loadPersistedState();
    if (Object.keys(persisted).length === 0) return DEFAULT_LAYERS;
    return DEFAULT_LAYERS.map((l) => ({
      ...l,
      enabled: persisted[l.id] ?? l.enabled,
    }));
  });

  // Persist whenever layers change
  useEffect(() => {
    persistState(layers);
  }, [layers]);

  const toggle = useCallback((layerId: string) => {
    setLayers((prev) => {
      const target = prev.find((l) => l.id === layerId);
      if (!target || !target.available) return prev;

      const enabling = !target.enabled;

      return prev.map((l) => {
        if (l.id === layerId) {
          return { ...l, enabled: enabling };
        }
        // Handle mutual exclusion: if enabling and the target has an exclusive
        // group, disable other layers in the same exclusive group.
        if (
          enabling &&
          target.exclusive &&
          l.exclusive === target.exclusive &&
          l.id !== layerId
        ) {
          return { ...l, enabled: false };
        }
        return l;
      });
    });
  }, []);

  const isActive = useCallback(
    (layerId: string) => {
      return layers.find((l) => l.id === layerId)?.enabled ?? false;
    },
    [layers],
  );

  return { layers, toggle, isActive };
}
