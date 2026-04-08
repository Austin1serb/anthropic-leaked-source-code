"use client";

import React, { useState, useRef, useEffect } from "react";
import { Layers, X } from "lucide-react";

export type MapLayer = {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  group: "explore" | "social" | "tools";
  exclusive?: string;
  enabled: boolean;
  available: boolean;
  availableHint?: string;
};

type Props = {
  layers: MapLayer[];
  onToggle: (layerId: string) => void;
  className?: string;
};

const GROUP_ORDER: MapLayer["group"][] = ["explore", "social", "tools"];
const GROUP_LABELS: Record<MapLayer["group"], string> = {
  explore: "EXPLORE",
  social: "SOCIAL",
  tools: "TOOLS",
};

function Toggle({
  on,
  disabled,
  onPress,
}: {
  on: boolean;
  disabled: boolean;
  onPress: () => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      disabled={disabled}
      onClick={onPress}
      className="relative flex-shrink-0 transition-colors duration-200 rounded-full"
      style={{ width: 36, height: 20 }}
    >
      {/* Track */}
      <span
        className="absolute inset-0 rounded-full transition-colors duration-200"
        style={{
          backgroundColor: on ? "#74070E" : "rgba(255,255,255,0.10)",
        }}
      />
      {/* Thumb */}
      <span
        className="absolute top-[2px] rounded-full bg-white shadow transition-transform duration-200"
        style={{
          width: 16,
          height: 16,
          transform: on ? "translateX(18px)" : "translateX(2px)",
        }}
      />
    </button>
  );
}

export function MapLayerDrawer({ layers, onToggle, className = "" }: Props) {
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  const activeCount = layers.filter((l) => l.enabled).length;

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  // Group layers
  const grouped = GROUP_ORDER.map((group) => ({
    group,
    label: GROUP_LABELS[group],
    items: layers.filter((l) => l.group === group),
  })).filter((g) => g.items.length > 0);

  return (
    <div
      ref={panelRef}
      className={`absolute bottom-24 right-3 md:bottom-auto md:top-1/2 md:right-5 md:-translate-y-1/2 z-30 pointer-events-none ${className}`}
    >
      {/* Panel */}
      <div
        className={`
          origin-bottom-right md:origin-right
          transition-all duration-300 ease-out
          ${open ? "opacity-100 scale-100 pointer-events-auto" : "opacity-0 scale-95 pointer-events-none"}
        `}
        style={{ width: 280 }}
      >
        <div className="rounded-[14px] bg-[#1A1412]/85 backdrop-blur-xl border border-white/[0.08] shadow-[0_8px_32px_rgba(0,0,0,0.3)] overflow-hidden pointer-events-auto">
          {/* Panel header */}
          <div className="flex items-center justify-between px-4 pt-3.5 pb-2 border-b border-white/[0.06]">
            <p
              className="text-[15px] font-bold text-white tracking-tight"
              style={{ fontFamily: "var(--font-serif, Georgia, serif)" }}
            >
              Map Layers
            </p>
            <button
              onClick={() => setOpen(false)}
              className="flex items-center justify-center w-[28px] h-[28px] rounded-full bg-white/[0.08] hover:bg-white/[0.14] transition-colors active:scale-95 transition-transform"
              aria-label="Close layers panel"
            >
              <X size={14} className="text-white/60" />
            </button>
          </div>

          {/* Layer groups */}
          <div className="px-4 py-3 max-h-[60vh] overflow-y-auto space-y-4">
            {grouped.map(({ group, label, items }) => (
              <div key={group}>
                {/* Group header */}
                <p className="text-[10px] font-bold text-white/30 uppercase tracking-wider mb-2">
                  {label}
                </p>

                <div className="space-y-2.5">
                  {items.map((layer) => (
                    <div
                      key={layer.id}
                      className={`flex items-center gap-3 ${!layer.available ? "opacity-40" : ""}`}
                    >
                      {/* Icon */}
                      <div className="flex-shrink-0 w-5 h-5 flex items-center justify-center text-white/60">
                        {layer.icon}
                      </div>

                      {/* Text */}
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-bold text-white leading-tight truncate">
                          {layer.name}
                        </p>
                        <p className="text-[10px] text-white/40 leading-snug line-clamp-2">
                          {layer.description}
                        </p>
                        {!layer.available && layer.availableHint && (
                          <p className="text-[9px] text-white/30 mt-0.5 leading-snug">
                            {layer.availableHint}
                          </p>
                        )}
                      </div>

                      {/* Toggle */}
                      <Toggle
                        on={layer.enabled}
                        disabled={!layer.available}
                        onPress={() => onToggle(layer.id)}
                      />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* FAB */}
      <button
        onClick={() => setOpen((v) => !v)}
        className={`
          mt-3 ml-auto flex items-center justify-center pointer-events-auto
          w-[44px] h-[44px] rounded-full
          bg-[#1A1412]/85 backdrop-blur-xl border border-white/[0.08]
          shadow-[0_4px_16px_rgba(0,0,0,0.3)]
          hover:bg-[#1A1412] active:scale-95 transition-transform
          relative
          ${open ? "ring-1 ring-white/[0.15]" : ""}
        `}
        aria-label={open ? "Close map layers" : "Open map layers"}
      >
        <Layers size={20} className="text-white/80" />

        {/* Active count badge */}
        {activeCount > 0 && !open && (
          <span className="absolute -top-1 -right-1 flex items-center justify-center min-w-[18px] h-[18px] rounded-full bg-cherry text-[10px] font-bold text-white px-1 shadow">
            {activeCount}
          </span>
        )}
      </button>
    </div>
  );
}
