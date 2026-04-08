"use client";

import Link from "next/link";
import { Sparkles, Wine, Users, Globe, ArrowRight, Lock, Play, Square, Satellite, Map, CloudRain, Target, Radio, PenTool, Grape, Search } from "lucide-react";
import { useSearch } from "@/components/shared/SearchContext";
import { WineRegionMap, getRegionCities } from "@/components/shared/WineRegionMap";
import type { TourStop } from "@/components/shared/WineRegionMap";
import { TourInfoCard } from "@/components/shared/TourInfoCard";
import { useMapLayers } from "@/hooks/useMapLayers";
import { MapLayerDrawer } from "@/components/shared/MapLayerDrawer";
import type { MapLayer } from "@/components/shared/MapLayerDrawer";
import { VintageWeatherLayer } from "@/components/layers/VintageWeatherLayer";
import { FlavorGenomeLayer } from "@/components/layers/FlavorGenomeLayer";
import { LiveHeatmapLayer } from "@/components/layers/LiveHeatmapLayer";
import DrawFlightLayer from "@/components/layers/DrawFlightLayer";
import { useState, useRef } from "react";
import mapboxgl from "mapbox-gl";

const LAYER_ICONS: Record<string, React.ReactNode> = {
  "vintage-weather": <CloudRain size={18} />,
  "flavor-genome": <Target size={18} />,
  "live-heatmap": <Radio size={18} />,
  "draw-flight": <PenTool size={18} />,
};

export default function ExplorePage() {
  const { layers, toggle: rawToggle, isActive } = useMapLayers();
  const fullLayers: MapLayer[] = layers.map((l) => ({ ...l, icon: LAYER_ICONS[l.id] ?? null }));

  function toggle(layerId: string) {
    const wasActive = isActive(layerId);
    rawToggle(layerId);
    // Track layer toggle
    fetch("/api/analytics/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        events: [{
          eventType: "layer_toggle",
          metadata: { layerName: layerId, enabled: !wasActive },
          sessionId: typeof window !== "undefined" ? sessionStorage.getItem("wb_session_id") : undefined,
        }],
      }),
      keepalive: true,
    }).catch(() => {});
  }
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null);
  const [flyToCoords, setFlyToCoords] = useState<[number, number] | null>(null);
  const [activeCity, setActiveCity] = useState<string | null>(null);
  const [tourRegion, setTourRegion] = useState<string | null>(null);
  const [satellite, setSatellite] = useState(false);
  const [activeTourStop, setActiveTourStop] = useState<TourStop | null>(null);

  function handleCityClick(city: { name: string; coords: [number, number] }) {
    setTourRegion(null); // stop any tour
    setFlyToCoords(city.coords);
    setActiveCity(city.name);
  }

  function handleRegionClick(region: string) {
    setSelectedRegion(region);
    setActiveCity(null);
    setFlyToCoords(null);
    setTourRegion(null);
    // Track region exploration
    fetch("/api/analytics/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        events: [{
          eventType: "region_explore",
          metadata: { region, country: "" },
          sessionId: typeof window !== "undefined" ? sessionStorage.getItem("wb_session_id") : undefined,
        }],
      }),
      keepalive: true,
    }).catch(() => {});
  }

  function handleWorldView() {
    setSelectedRegion(null);
    setActiveCity(null);
    setFlyToCoords(null);
    setTourRegion(null);
  }

  function handleTour() {
    if (tourRegion) {
      setTourRegion(null); // stop
    } else if (selectedRegion) {
      setTourRegion(selectedRegion);
    }
  }

  return (
    <div className="fixed inset-0">
      {/* Map — fullscreen preview */}
      <div className="absolute inset-0">
        <WineRegionMap
          onRegionClick={handleRegionClick}
          exploreRegion={selectedRegion}
          flyToCoords={flyToCoords}
          tourRegion={tourRegion}
          onTourEnd={() => { setTourRegion(null); setActiveTourStop(null); }}
          satellite={satellite}
          onTourStop={setActiveTourStop}
          height="100%"
          mapRef={mapRef}
        />
      </div>

      <MapLayerDrawer layers={fullLayers} onToggle={toggle} />

      {/* Vintage Weather Replay layer */}
      <VintageWeatherLayer
        active={isActive("vintage-weather")}
        mapRef={mapRef}
        region={selectedRegion}
      />

      {/* Flavor Genome Map layer */}
      <FlavorGenomeLayer
        active={isActive("flavor-genome")}
        mapRef={mapRef}
      />

      {/* Live Social Heatmap layer */}
      <LiveHeatmapLayer
        active={isActive("live-heatmap")}
        mapRef={mapRef}
      />

      {/* Draw Your Flight layer */}
      <DrawFlightLayer
        active={isActive("draw-flight")}
        mapRef={mapRef}
      />

      {/* Top — branding + search + back */}
      <div className="absolute top-0 left-0 right-0 z-20 safe-top">
        <div className="px-4 pt-3 flex items-center justify-between gap-2">
          <Link
            href="/"
            className="h-10 px-3 rounded-[12px] bg-[#1A1412]/70 backdrop-blur-xl border border-white/[0.08] flex items-center gap-1.5 text-white/70 text-[12px] font-semibold active:scale-95 transition-transform flex-shrink-0"
          >
            ← Back
          </Link>
          {/* Search bar trigger */}
          <button
            onClick={openSearch}
            className="flex-1 max-w-xs flex items-center h-10 rounded-[12px] bg-[#1A1412]/70 backdrop-blur-xl border border-white/[0.08] px-3 gap-2 active:scale-[0.98] transition-transform"
          >
            <Grape className="h-3.5 w-3.5 text-[#E8A08A] flex-shrink-0" />
            <span className="text-[12px] text-white/30 truncate">Search wines, regions...</span>
            <Search className="h-3 w-3 text-white/20 flex-shrink-0 ml-auto" />
          </button>
          <button
            onClick={() => setSatellite((s) => !s)}
            className="h-10 px-3 rounded-[12px] bg-[#1A1412]/70 backdrop-blur-xl border border-white/[0.08] flex items-center gap-1.5 text-white/70 text-[12px] font-semibold active:scale-95 transition-transform flex-shrink-0"
          >
            {satellite ? <Map className="h-4 w-4" /> : <Satellite className="h-4 w-4" />}
            {satellite ? "Map" : "Satellite"}
          </button>
        </div>
      </div>

      {/* City pills when exploring */}
      {selectedRegion && (
        <div className="absolute left-3 z-20" style={{ top: "30%" }}>
          <div className="px-3 py-2 rounded-[12px] bg-cherry/90 backdrop-blur-xl shadow-[0_2px_12px_rgba(116,7,14,0.3)] mb-2">
            <p className="text-[10px] font-bold text-white/50 uppercase tracking-wider">Exploring</p>
            <p className="text-[14px] font-bold text-white">{selectedRegion}</p>
          </div>
          {getRegionCities(selectedRegion).length > 0 && (
            <div className="flex flex-col gap-1 max-w-[140px]">
              {getRegionCities(selectedRegion).map((city) => (
                <button
                  key={city.name}
                  onClick={() => handleCityClick(city)}
                  className={`px-2.5 py-1.5 rounded-[8px] backdrop-blur-xl border text-[11px] font-semibold text-left transition-colors ${
                    activeCity === city.name
                      ? "bg-cherry border-cherry/60 text-white"
                      : "bg-[#1A1412]/70 border-white/[0.08] text-white/70 active:bg-cherry active:text-white"
                  }`}
                >
                  {city.name} →
                </button>
              ))}
            </div>
          )}
          {getRegionCities(selectedRegion).length > 1 && (
            <button
              onClick={handleTour}
              className={`mt-1.5 w-full flex items-center justify-center gap-1.5 px-2.5 py-2 rounded-[8px] backdrop-blur-xl border text-[11px] font-bold transition-all active:scale-95 ${
                tourRegion
                  ? "bg-white border-white/40 text-cherry"
                  : "bg-cherry/80 border-cherry/40 text-white"
              }`}
            >
              {tourRegion ? <Square className="h-3 w-3" /> : <Play className="h-3 w-3" />}
              {tourRegion ? "Stop tour" : "Cinematic tour"}
            </button>
          )}
          <button
            onClick={handleWorldView}
            className="mt-2 px-2.5 py-1.5 rounded-[8px] bg-[#1A1412]/60 backdrop-blur-xl border border-white/[0.06] text-[11px] font-semibold text-white/50 active:scale-95 transition-transform"
          >
            ← World view
          </button>
        </div>
      )}

      {/* Tour info card — floating overlay */}
      {activeTourStop && tourRegion && (
        <div className="absolute bottom-[260px] left-4 z-20">
          <TourInfoCard stop={activeTourStop} region={selectedRegion ?? undefined} />
        </div>
      )}

      {/* Bottom — signup CTA overlay */}
      <div className="absolute bottom-0 left-0 right-0 z-30">
        <div className="bg-gradient-to-t from-[#1A1412] via-[#1A1412]/95 to-transparent pt-20 pb-8 px-4">
          <div className="max-w-md mx-auto text-center">
            {/* Feature pills */}
            <div className="flex items-center justify-center gap-2 mb-4 flex-wrap">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[8px] bg-white/10 text-white/70 text-[10px] font-semibold">
                <Wine className="h-3 w-3" /> Browse wines
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[8px] bg-white/10 text-white/70 text-[10px] font-semibold">
                <Globe className="h-3 w-3" /> Explore regions
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[8px] bg-white/10 text-white/70 text-[10px] font-semibold">
                <Users className="h-3 w-3" /> Join live events
              </span>
            </div>

            <h2 className="text-[22px] font-bold text-white tracking-tight mb-2" style={{ fontFamily: "var(--font-serif, Georgia, serif)" }}>
              Discover the world of wine
            </h2>
            <p className="text-[13px] text-white/50 mb-5 max-w-[280px] mx-auto leading-relaxed">
              Create a free account to save favorites, join tastings, and build your cellar.
            </p>

            <div className="flex flex-col gap-2.5 max-w-[300px] mx-auto">
              <Link
                href="/login?callbackUrl=/wines"
                className="flex items-center justify-center gap-2 h-12 rounded-[12px] bg-white text-cherry font-bold text-[15px] active:scale-[0.98] transition-transform"
                style={{ boxShadow: "0 4px 20px rgba(0,0,0,0.2)" }}
              >
                <Sparkles className="h-4 w-4" />
                Sign up free
              </Link>
              <Link
                href="/login?callbackUrl=/wines"
                className="flex items-center justify-center gap-2 h-11 rounded-[12px] bg-white/10 border border-white/10 text-white/70 font-semibold text-[13px] active:scale-[0.98] transition-transform"
              >
                Already have an account? Log in
              </Link>
            </div>

            <div className="flex items-center justify-center gap-1.5 mt-4 text-white/25 text-[11px]">
              <Lock className="h-3 w-3" />
              <span>Full access requires a free account</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
