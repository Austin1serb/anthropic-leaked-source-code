"use client";

import { Trophy, Swords, Flame } from "lucide-react";

export default function ArenaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-dvh relative overflow-hidden">
      {/* ── Background: dark sandy arena floor ── */}
      <div
        className="fixed inset-0 -z-10"
        style={{
          background: `
            radial-gradient(ellipse 120% 80% at 50% 40%, #2A1E14 0%, #1A1410 60%, #0F0C08 100%)
          `,
        }}
      />

      {/* Vignette overlay */}
      <div
        className="fixed inset-0 -z-10 pointer-events-none"
        style={{
          background: "radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.5) 100%)",
        }}
      />

      {/* Dust/grain texture */}
      <div
        className="fixed inset-0 -z-10 pointer-events-none opacity-[0.03]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
        }}
      />

      {/* Warm torch glow — left and right */}
      <div
        className="fixed top-0 left-0 w-48 h-96 -z-10 pointer-events-none"
        style={{
          background: "radial-gradient(ellipse at top left, rgba(200, 120, 40, 0.08) 0%, transparent 70%)",
        }}
      />
      <div
        className="fixed top-0 right-0 w-48 h-96 -z-10 pointer-events-none"
        style={{
          background: "radial-gradient(ellipse at top right, rgba(200, 120, 40, 0.08) 0%, transparent 70%)",
        }}
      />

      {/* ── Header bar ── */}
      <header className="safe-top relative z-10">
        <div className="container-app pt-5 pb-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Arena emblem */}
            <div
              className="h-10 w-10 rounded-2xl flex items-center justify-center"
              style={{
                background: "linear-gradient(145deg, #8A1E2A 0%, #5A0810 100%)",
                boxShadow: "0 2px 12px rgba(138, 30, 42, 0.4), inset 0 1px 0 rgba(255,255,255,0.1)",
              }}
            >
              <Swords className="h-5 w-5 text-white/90" />
            </div>
            <div>
              <h1
                className="text-[20px] font-bold tracking-tight"
                style={{
                  fontFamily: "var(--font-serif)",
                  color: "#F0DCC0",
                  textShadow: "0 1px 8px rgba(200, 160, 80, 0.15)",
                }}
              >
                Arena
              </h1>
            </div>
          </div>

          {/* Decorative flame accents */}
          <div className="flex items-center gap-1.5">
            <Flame className="h-4 w-4 text-orange-400/40 animate-pulse" />
            <Trophy className="h-4 w-4 text-amber-500/50" />
            <Flame className="h-4 w-4 text-orange-400/40 animate-pulse" style={{ animationDelay: "0.5s" }} />
          </div>
        </div>

        {/* Divider — aged stone line */}
        <div className="container-app">
          <div
            className="h-px"
            style={{
              background: "linear-gradient(90deg, transparent 0%, rgba(200, 160, 80, 0.15) 20%, rgba(200, 160, 80, 0.2) 50%, rgba(200, 160, 80, 0.15) 80%, transparent 100%)",
            }}
          />
        </div>
      </header>

      {/* ── Content ── */}
      <main className="relative z-10 pb-24">
        {/* Override text colors for dark arena background */}
        <style>{`
          .min-h-screen { min-height: auto !important; }
          [class*="bg-hero-gradient"] { background: none !important; }
          [class*="bg-background"] { background: none !important; }
        `}</style>
        {children}
      </main>
    </div>
  );
}
