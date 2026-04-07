"use client";

import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Trophy, Library, Radio, User, X, Sparkles } from "lucide-react";

const UNIVERSES = [
  {
    id: "arena",
    label: "Arena",
    description: "Blind tastings & competitions",
    href: "/arena",
    icon: Trophy,
    gradient: "from-[#8A1E2A] to-[#5A0810]",
    glow: "rgba(138, 30, 42, 0.4)",
    accent: "#F4E4E6",
  },
  {
    id: "cellar",
    label: "Explore",
    description: "Browse wines & regions",
    href: "/wines",
    icon: Library,
    gradient: "from-[#2A2420] to-[#0C0A08]",
    glow: "rgba(200, 162, 85, 0.3)",
    accent: "#C8A255",
  },
  {
    id: "live",
    label: "Live",
    description: "Real-time sommelier events",
    href: "/live",
    icon: Radio,
    gradient: "from-[#1A0A0C] to-[#0F0D0B]",
    glow: "rgba(220, 40, 50, 0.35)",
    accent: "#FF4444",
  },
  {
    id: "profile",
    label: "Profile",
    description: "Your stats & settings",
    href: "/profile",
    icon: User,
    gradient: "from-[#E8E4E0] to-[#D8D0C8]",
    glow: "rgba(140, 130, 120, 0.2)",
    accent: "#8E8278",
  },
] as const;

function getCurrentUniverse(pathname: string): string {
  if (pathname.startsWith("/arena") || pathname.startsWith("/play") || pathname.startsWith("/join")) return "arena";
  if (pathname.startsWith("/wines")) return "cellar";
  if (pathname.startsWith("/live") || pathname.startsWith("/sommeliers")) return "live";
  if (pathname.startsWith("/profile")) return "profile";
  return "arena";
}

export function UniversePortal() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const current = getCurrentUniverse(pathname);

  // Don't show on landing page or auth pages
  if (pathname === "/" || pathname.startsWith("/login") || pathname.startsWith("/api")) return null;

  const currentUniverse = UNIVERSES.find((u) => u.id === current);
  const CurrentIcon = currentUniverse?.icon ?? Sparkles;

  function navigateTo(href: string) {
    setIsOpen(false);
    router.push(href);
  }

  return (
    <>
      {/* ══════════ FLOATING PORTAL BUTTON ══════════ */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[90] safe-bottom"
        style={{ filter: `drop-shadow(0 4px 20px ${currentUniverse?.glow ?? "rgba(0,0,0,0.2)"})` }}
      >
        <div
          className={`h-14 w-14 rounded-2xl bg-gradient-to-br ${currentUniverse?.gradient ?? "from-stone to-stone-light"} flex items-center justify-center transition-transform active:scale-90`}
        >
          <CurrentIcon className="h-6 w-6 text-white" strokeWidth={2} />
        </div>
      </button>

      {/* ══════════ UNIVERSE SWITCHER OVERLAY ══════════ */}
      {isOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-end justify-center"
          onClick={() => setIsOpen(false)}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

          {/* Panel */}
          <div
            className="relative w-full max-w-md mx-4 mb-8 animate-scale-in"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close hint */}
            <button
              onClick={() => setIsOpen(false)}
              className="absolute -top-12 left-1/2 -translate-x-1/2 h-8 w-8 rounded-full bg-white/10 flex items-center justify-center backdrop-blur-sm"
            >
              <X className="h-4 w-4 text-white/70" />
            </button>

            {/* Universe cards */}
            <div className="grid grid-cols-2 gap-3">
              {UNIVERSES.map((universe) => {
                const Icon = universe.icon;
                const isActive = universe.id === current;

                return (
                  <button
                    key={universe.id}
                    onClick={() => navigateTo(universe.href)}
                    className={`relative overflow-hidden rounded-3xl p-5 text-left transition-all active:scale-95 ${
                      isActive ? "ring-2 ring-white/40" : ""
                    }`}
                    style={{
                      background: `linear-gradient(145deg, ${universe.gradient.split(" ")[0].replace("from-[", "").replace("]", "")} 0%, ${universe.gradient.split(" ")[1].replace("to-[", "").replace("]", "")} 100%)`,
                    }}
                  >
                    {/* Glow effect */}
                    <div
                      className="absolute top-0 right-0 w-24 h-24 rounded-full blur-2xl opacity-30"
                      style={{ background: universe.accent }}
                    />

                    <div className="relative z-10">
                      <div className="h-11 w-11 rounded-2xl bg-white/10 backdrop-blur-sm flex items-center justify-center mb-3">
                        <Icon className="h-5 w-5" style={{ color: universe.accent }} />
                      </div>

                      <h3 className="text-[16px] font-bold text-white tracking-tight">
                        {universe.label}
                      </h3>
                      <p className="text-[11px] text-white/50 mt-0.5 leading-snug">
                        {universe.description}
                      </p>

                      {isActive && (
                        <span className="mt-2 inline-block text-[9px] font-bold uppercase tracking-widest text-white/40">
                          You are here
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
