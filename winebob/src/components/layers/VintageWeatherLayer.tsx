"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import mapboxgl from "mapbox-gl";

// ── Region center coordinates (mirrored from WineRegionMap) ──
const REGION_COORDS: Record<string, [number, number]> = {
  "Bordeaux": [-0.58, 44.84], "Burgundy": [4.84, 47.02], "Champagne": [3.96, 49.25],
  "Rhone Valley": [4.83, 44.93], "Loire Valley": [0.69, 47.38], "Alsace": [7.35, 48.08],
  "Provence": [5.93, 43.53], "Piedmont": [7.68, 44.69], "Tuscany": [11.25, 43.77],
  "Veneto": [11.87, 45.44], "Sicily": [13.36, 37.60], "Rioja": [-2.73, 42.47],
  "Ribera del Duero": [-3.69, 41.63], "Priorat": [0.75, 41.20], "Douro Valley": [-7.79, 41.16],
  "Alentejo": [-7.91, 38.57], "Mosel": [6.63, 49.73], "Rheingau": [8.06, 50.01],
  "Napa Valley": [-122.31, 38.50], "Sonoma": [-122.72, 38.44], "Willamette Valley": [-123.09, 45.07],
  "Mendoza": [-68.83, -32.89], "Maipo Valley": [-70.60, -33.73], "Colchagua Valley": [-71.22, -34.66],
  "Barossa Valley": [138.95, -34.56], "Margaret River": [115.04, -33.95],
  "Marlborough": [173.95, -41.51], "Stellenbosch": [18.86, -33.93],
};

// ── Types ──
type DailyData = {
  date: string;
  tempMax: number;
  tempMin: number;
  precipitation: number;
};

export type VintagePick = {
  wineName: string;
  producer: string;
  vintage: number;
};

type Props = {
  active: boolean;
  mapRef: React.RefObject<mapboxgl.Map | null>;
  region?: string | null;
  vintagePick?: VintagePick | null;
};

// ── Constants ──
const YEARS = Array.from({ length: 36 }, (_, i) => 1990 + i); // 1990–2025
const MONTHS = ["Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct"];
const PLAY_INTERVAL_MS = 500;
const BASE_TEMP = 10; // GDD base temperature

// Milestone GDD thresholds
const MILESTONES = [
  { label: "Bud Break", gdd: 100 },
  { label: "Flowering", gdd: 350 },
  { label: "Véraison", gdd: 1100 },
  { label: "Harvest", gdd: 1500 },
] as const;

// Temperature color stops: 5°C blue -> 35°C red
function tempToColor(temp: number): string {
  const t = Math.max(5, Math.min(35, temp));
  const ratio = (t - 5) / 30;
  // blue(0) -> green(0.25) -> yellow(0.5) -> orange(0.75) -> red(1)
  const stops: [number, number, number, number][] = [
    [0, 0.25, 0.55, 1],   // blue: rgb(64, 140, 255)
    [0.25, 0.35, 0.75, 0.3], // green: rgb(89, 191, 77)
    [0.5, 0.95, 0.85, 0.15], // yellow: rgb(243, 217, 38)
    [0.75, 1.0, 0.55, 0.1],  // orange: rgb(255, 140, 26)
    [1, 0.85, 0.15, 0.1],    // red: rgb(217, 38, 26)
  ];
  let r = 0, g = 0, b = 0;
  for (let i = 0; i < stops.length - 1; i++) {
    if (ratio >= stops[i][0] && ratio <= stops[i + 1][0]) {
      const localRatio = (ratio - stops[i][0]) / (stops[i + 1][0] - stops[i][0]);
      r = stops[i][1] + (stops[i + 1][1] - stops[i][1]) * localRatio;
      g = stops[i][2] + (stops[i + 1][2] - stops[i][2]) * localRatio;
      b = stops[i][3] + (stops[i + 1][3] - stops[i][3]) * localRatio;
      break;
    }
  }
  return `rgb(${Math.round(r * 255)}, ${Math.round(g * 255)}, ${Math.round(b * 255)})`;
}

function cacheKey(region: string, year: number) {
  return `wb-weather:${region}:${year}`;
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function VintageWeatherLayer({ active, mapRef, region, vintagePick }: Props) {
  const [selectedYear, setSelectedYear] = useState(2025);
  const [weatherData, setWeatherData] = useState<DailyData[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dayIndex, setDayIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const yearScrollRef = useRef<HTMLDivElement>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const scrubberRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef(false);

  // ── Auto-select vintage year when a wine is picked ──
  useEffect(() => {
    if (vintagePick && vintagePick.vintage >= 1990 && vintagePick.vintage <= 2025) {
      setSelectedYear(vintagePick.vintage);
    }
  }, [vintagePick]);

  // ── Fetch weather data ──
  useEffect(() => {
    if (!active || !region) {
      setWeatherData(null);
      setError(null);
      return;
    }

    const coords = REGION_COORDS[region];
    if (!coords) {
      setError("No coordinates available for this region");
      return;
    }

    const key = cacheKey(region, selectedYear);

    // Check localStorage cache
    try {
      const cached = localStorage.getItem(key);
      if (cached) {
        const parsed = JSON.parse(cached) as DailyData[];
        setWeatherData(parsed);
        setDayIndex(0);
        setPlaying(false);
        setError(null);
        return;
      }
    } catch { /* ignore */ }

    // Fetch from Open-Meteo
    const [lng, lat] = coords;
    const url = `https://archive-api.open-meteo.com/v1/archive?latitude=${lat}&longitude=${lng}&start_date=${selectedYear}-04-01&end_date=${selectedYear}-10-31&daily=temperature_2m_max,temperature_2m_min,precipitation_sum`;

    setLoading(true);
    setError(null);

    const abortCtrl = new AbortController();
    fetch(url, { signal: abortCtrl.signal })
      .then((res) => {
        if (!res.ok) throw new Error(`API error: ${res.status}`);
        return res.json();
      })
      .then((json: {
        daily: {
          time: string[];
          temperature_2m_max: (number | null)[];
          temperature_2m_min: (number | null)[];
          precipitation_sum: (number | null)[];
        };
      }) => {
        const days: DailyData[] = json.daily.time.map((date: string, i: number) => ({
          date,
          tempMax: json.daily.temperature_2m_max[i] ?? 0,
          tempMin: json.daily.temperature_2m_min[i] ?? 0,
          precipitation: json.daily.precipitation_sum[i] ?? 0,
        }));
        // Cache in localStorage
        try { localStorage.setItem(key, JSON.stringify(days)); } catch { /* quota */ }
        setWeatherData(days);
        setDayIndex(0);
        setPlaying(false);
        setError(null);
      })
      .catch((err) => {
        if (err.name !== "AbortError") {
          setError("Failed to load weather data");
        }
      })
      .finally(() => setLoading(false));

    return () => abortCtrl.abort();
  }, [active, region, selectedYear]);

  // ── Compute GDD array ──
  const gddArray = React.useMemo(() => {
    if (!weatherData) return [];
    let cumulative = 0;
    return weatherData.map((d) => {
      const avg = (d.tempMax + d.tempMin) / 2;
      cumulative += Math.max(0, avg - BASE_TEMP);
      return cumulative;
    });
  }, [weatherData]);

  // ── Milestone positions (day indices) ──
  const milestonePositions = React.useMemo(() => {
    if (gddArray.length === 0) return [];
    return MILESTONES.map((m) => {
      const idx = gddArray.findIndex((g) => g >= m.gdd);
      return { ...m, dayIndex: idx >= 0 ? idx : -1 };
    });
  }, [gddArray]);

  // ── Auto-play animation ──
  useEffect(() => {
    if (!playing || !weatherData) return;
    intervalRef.current = setInterval(() => {
      setDayIndex((prev) => {
        if (prev >= weatherData.length - 1) {
          setPlaying(false);
          return prev;
        }
        return prev + 1;
      });
    }, PLAY_INTERVAL_MS);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [playing, weatherData]);

  // ── Stop animation on deactivate or region change ──
  useEffect(() => {
    if (!active) {
      setPlaying(false);
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
  }, [active, region]);

  // ── Update map fill color based on current day's temperature ──
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !active || !weatherData || !weatherData[dayIndex]) return;

    const day = weatherData[dayIndex];
    const avgTemp = (day.tempMax + day.tempMin) / 2;
    const color = tempToColor(avgTemp);

    try {
      if (map.getLayer("wine-regions-fill")) {
        map.setPaintProperty("wine-regions-fill", "fill-color", color);
        map.setPaintProperty("wine-regions-fill", "fill-opacity", 0.65);
        map.setLayoutProperty("wine-regions-fill", "visibility", "visible");
      }
      // Also color the region outline to match temperature
      if (map.getLayer("wine-regions-outline")) {
        map.setPaintProperty("wine-regions-outline", "line-color", color);
        map.setPaintProperty("wine-regions-outline", "line-opacity", 0.9);
      }
    } catch { /* layer not ready */ }

    return () => {
      // Restore default styles on cleanup
      try {
        if (map.getLayer("wine-regions-fill")) {
          map.setPaintProperty("wine-regions-fill", "fill-color", ["get", "color"]);
          map.setPaintProperty("wine-regions-fill", "fill-opacity", [
            "case", ["boolean", ["feature-state", "hover"], false], 0.55, 0.35,
          ]);
        }
        if (map.getLayer("wine-regions-outline")) {
          map.setPaintProperty("wine-regions-outline", "line-color", ["get", "color"]);
          map.setPaintProperty("wine-regions-outline", "line-opacity", 0.6);
        }
      } catch { /* ignore */ }
    };
  }, [active, weatherData, dayIndex, mapRef]);

  // ── Scrubber drag handling ──
  const handleScrubberInteraction = useCallback(
    (clientX: number) => {
      if (!scrubberRef.current || !weatherData) return;
      const rect = scrubberRef.current.getBoundingClientRect();
      const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
      setDayIndex(Math.round(ratio * (weatherData.length - 1)));
    },
    [weatherData],
  );

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (isDraggingRef.current) handleScrubberInteraction(e.clientX);
    };
    const onUp = () => { isDraggingRef.current = false; };
    const onTouchMove = (e: TouchEvent) => {
      if (isDraggingRef.current && e.touches[0]) handleScrubberInteraction(e.touches[0].clientX);
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    window.addEventListener("touchmove", onTouchMove);
    window.addEventListener("touchend", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", onUp);
    };
  }, [handleScrubberInteraction]);

  // ── Scroll year picker to selected year on mount ──
  useEffect(() => {
    if (!active) return;
    // Small delay to ensure DOM is rendered before scrolling
    const timer = setTimeout(() => {
      if (!yearScrollRef.current) return;
      const el = yearScrollRef.current.querySelector(`[data-year="${selectedYear}"]`);
      if (el) el.scrollIntoView({ inline: "center", behavior: "smooth" });
    }, 100);
    return () => clearTimeout(timer);
  }, [active, selectedYear]);

  if (!active) return null;

  // No region selected
  if (!region) {
    return (
      <div className="absolute bottom-28 left-1/2 -translate-x-1/2 z-30">
        <div className="px-5 py-3 rounded-[14px] bg-[#1A1412]/85 backdrop-blur-xl border border-white/[0.08] shadow-[0_8px_32px_rgba(0,0,0,0.3)]">
          <p className="text-[13px] text-white/60 font-medium text-center whitespace-nowrap">
            Zoom into a wine region to explore its vintage weather
          </p>
        </div>
      </div>
    );
  }

  const currentDay = weatherData?.[dayIndex];
  const currentGDD = gddArray[dayIndex] ?? 0;
  const totalDays = weatherData?.length ?? 0;
  const isRainy = currentDay ? currentDay.precipitation > 2 : false;

  return (
    <>
      {/* ── Data Card (right side, below city pills) ── */}
      {weatherData && currentDay && (
        <div className="absolute top-28 right-3 z-20 w-[190px]">
          <div className="rounded-[12px] bg-[#1A1412]/85 backdrop-blur-xl border border-white/[0.08] shadow-[0_8px_32px_rgba(0,0,0,0.3)] p-3">
            {/* Wine context badge */}
            {vintagePick && vintagePick.vintage === selectedYear && (
              <div className="mb-2 px-2 py-1.5 rounded-[8px] bg-cherry/15 border border-cherry/20">
                <p className="text-[11px] font-bold text-white/90 truncate">{vintagePick.wineName}</p>
                <p className="text-[9px] text-white/50 truncate">{vintagePick.producer} · {vintagePick.vintage}</p>
              </div>
            )}

            {/* Date */}
            <p className="text-[9px] font-bold text-white/40 uppercase tracking-wider">
              {region} · {selectedYear}
            </p>
            <p className="text-[15px] font-bold text-white tracking-tight mb-2">
              {formatDate(currentDay.date)}
            </p>

            {/* Temperature with color indicator */}
            <div className="flex items-center gap-2 mb-1.5">
              <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: tempToColor((currentDay.tempMax + currentDay.tempMin) / 2) }} />
              <div className="flex items-baseline gap-1.5">
                <span className="text-[14px] font-bold text-white">{currentDay.tempMax.toFixed(0)}°</span>
                <span className="text-[12px] text-white/50">{currentDay.tempMin.toFixed(0)}°</span>
              </div>
            </div>

            {/* Precipitation */}
            <p className={`text-[11px] font-semibold mb-2 ${isRainy ? "text-blue-400" : "text-white/50"}`}>
              {currentDay.precipitation > 0 ? `${currentDay.precipitation.toFixed(1)} mm${isRainy ? " 🌧" : ""}` : "No rain"}
            </p>

            {/* GDD + milestone */}
            <div className="pt-2 border-t border-white/[0.06]">
              <div className="flex items-baseline justify-between">
                <span className="text-[9px] text-white/40">GDD</span>
                <span className="text-[14px] font-bold text-cherry">{Math.round(currentGDD)}</span>
              </div>
              {(() => {
                const reached = milestonePositions.filter(
                  (m) => m.dayIndex >= 0 && m.dayIndex <= dayIndex,
                );
                const current = reached[reached.length - 1];
                return current ? (
                  <p className="text-[9px] font-bold text-cherry mt-0.5">{current.label}</p>
                ) : null;
              })()}
            </div>
          </div>
        </div>
      )}

      {/* ── Rain overlay indicator ── */}
      {isRainy && weatherData && (
        <div className="absolute top-16 left-4 z-30 pointer-events-none">
          <div className="rounded-[10px] bg-blue-500/20 backdrop-blur-sm border border-blue-400/30 px-3 py-1.5">
            <p className="text-[11px] font-bold text-blue-300">
              🌧 Rain day — {currentDay!.precipitation.toFixed(1)} mm
            </p>
          </div>
        </div>
      )}

      {/* ── Temperature color legend ── */}
      {weatherData && (
        <div className="absolute top-28 left-3 z-20">
          <div className="rounded-[10px] bg-[#1A1412]/80 backdrop-blur-xl border border-white/[0.08] p-2">
            <p className="text-[8px] font-bold text-white/40 uppercase tracking-wider mb-1.5">Temp °C</p>
            <div className="flex flex-col gap-px">
              {[35, 30, 25, 20, 15, 10, 5].map((t) => (
                <div key={t} className="flex items-center gap-1.5">
                  <div className="w-3 h-2 rounded-sm flex-shrink-0" style={{ backgroundColor: tempToColor(t) }} />
                  <span className="text-[8px] text-white/50 tabular-nums">{t}°</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Bottom controls container ── */}
      {/* right-16 leaves a gap for the MapLayerDrawer FAB button */}
      <div className="absolute bottom-28 left-4 right-16 z-30 flex flex-col gap-2">
        {/* ── Timeline Scrubber ── */}
        {weatherData && (
          <div className="rounded-[10px] bg-[#1A1412]/85 backdrop-blur-xl border border-white/[0.08] shadow-[0_8px_32px_rgba(0,0,0,0.3)] px-3 py-2">
            {/* Month labels */}
            <div className="flex justify-between mb-1.5 px-0.5">
              {MONTHS.map((m) => (
                <span key={m} className="text-[9px] font-bold text-white/30 uppercase tracking-wider">
                  {m}
                </span>
              ))}
            </div>

            {/* Scrubber bar */}
            <div
              ref={scrubberRef}
              className="relative h-6 cursor-pointer select-none"
              onMouseDown={(e) => {
                isDraggingRef.current = true;
                setPlaying(false);
                handleScrubberInteraction(e.clientX);
              }}
              onTouchStart={(e) => {
                isDraggingRef.current = true;
                setPlaying(false);
                if (e.touches[0]) handleScrubberInteraction(e.touches[0].clientX);
              }}
            >
              {/* Track bg */}
              <div className="absolute top-1/2 -translate-y-1/2 left-0 right-0 h-1.5 rounded-full bg-white/[0.08]" />

              {/* Filled track */}
              <div
                className="absolute top-1/2 -translate-y-1/2 left-0 h-1.5 rounded-full bg-cherry/60"
                style={{ width: `${totalDays > 1 ? (dayIndex / (totalDays - 1)) * 100 : 0}%` }}
              />

              {/* Milestone ticks — abbreviated to prevent overlap */}
              {milestonePositions.map((m) => {
                if (m.dayIndex < 0) return null;
                const pct = (m.dayIndex / (totalDays - 1)) * 100;
                const abbrev: Record<string, string> = {
                  "Bud Break": "Bud",
                  "Flowering": "Bloom",
                  "Véraison": "Vér.",
                  "Harvest": "Harv.",
                };
                return (
                  <div
                    key={m.label}
                    className="absolute top-0 flex flex-col items-center pointer-events-none"
                    style={{ left: `${pct}%`, transform: "translateX(-50%)" }}
                  >
                    <span className="text-[7px] font-bold text-cherry/80 leading-none whitespace-nowrap">
                      {abbrev[m.label] ?? m.label}
                    </span>
                    <div className="w-px h-2 bg-cherry/40 mt-px" />
                  </div>
                );
              })}

              {/* Thumb */}
              <div
                className="absolute top-1/2 -translate-y-1/2 w-3.5 h-3.5 rounded-full bg-cherry border-2 border-white shadow-md"
                style={{
                  left: `${totalDays > 1 ? (dayIndex / (totalDays - 1)) * 100 : 0}%`,
                  transform: "translate(-50%, -50%)",
                }}
              />
            </div>

            {/* Play/Pause */}
            <div className="flex items-center justify-between mt-2">
              <button
                onClick={() => {
                  if (dayIndex >= totalDays - 1) setDayIndex(0);
                  setPlaying((p) => !p);
                }}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-[8px] bg-white/[0.08] hover:bg-white/[0.14] active:scale-95 transition-all text-white/70"
              >
                {playing ? (
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor">
                    <rect x="1" y="1" width="3" height="8" rx="0.5" />
                    <rect x="6" y="1" width="3" height="8" rx="0.5" />
                  </svg>
                ) : (
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor">
                    <polygon points="2,1 9,5 2,9" />
                  </svg>
                )}
                <span className="text-[10px] font-bold">{playing ? "Pause" : "Play"}</span>
              </button>
              <span className="text-[10px] text-white/40">
                Day {dayIndex + 1} / {totalDays}
              </span>
            </div>
          </div>
        )}

        {/* ── Loading / Error state ── */}
        {loading && (
          <div className="rounded-[14px] bg-[#1A1412]/85 backdrop-blur-xl border border-white/[0.08] px-4 py-3 text-center">
            <p className="text-[12px] text-white/50 font-medium animate-pulse">
              Loading {selectedYear} weather data...
            </p>
          </div>
        )}
        {error && (
          <div className="rounded-[14px] bg-[#1A1412]/85 backdrop-blur-xl border border-white/[0.08] px-4 py-3 text-center">
            <p className="text-[12px] text-red-400/80 font-medium">{error}</p>
          </div>
        )}

        {/* ── Year Picker ── */}
        <div className="rounded-[10px] bg-[#1A1412]/70 backdrop-blur-xl border border-white/[0.08] py-1.5 px-1">
          <div
            ref={yearScrollRef}
            className="flex gap-0.5 overflow-x-auto scrollbar-none px-0.5"
            style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
          >
            {YEARS.map((year) => (
              <button
                key={year}
                data-year={year}
                onClick={() => setSelectedYear(year)}
                className={`flex-shrink-0 px-2 py-0.5 rounded-full text-[10px] font-bold transition-all active:scale-95 ${
                  year === selectedYear
                    ? "bg-cherry text-white shadow-sm shadow-cherry/30"
                    : "bg-transparent text-white/50 hover:text-white/70 hover:bg-white/[0.06]"
                }`}
              >
                {year}
              </button>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
