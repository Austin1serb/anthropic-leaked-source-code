"use client";

import { Radio } from "lucide-react";

export default function LiveLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-dvh bg-background" style={{ color: "var(--foreground)" }}>
      <style>{`
        @keyframes livePulse {
          0%, 100% { transform: scale(1); opacity: 0.5; }
          50% { transform: scale(2); opacity: 0; }
        }
      `}</style>

      {/* Sticky header — frosted warm glass */}
      <header
        className="safe-top sticky top-0 z-40"
        style={{
          borderBottom: "1px solid var(--card-border)",
          background: "rgba(254, 249, 240, 0.92)",
          backdropFilter: "blur(24px) saturate(180%)",
          WebkitBackdropFilter: "blur(24px) saturate(180%)",
        }}
      >
        <div className="container-app flex items-center justify-between" style={{ height: 56 }}>
          <div className="flex items-center gap-2.5">
            <div
              className="h-7 w-7 rounded-lg flex items-center justify-center"
              style={{ background: "var(--widget-wine)" }}
            >
              <Radio size={14} style={{ color: "var(--cherry)", opacity: 0.8 }} />
            </div>
            <span
              style={{
                fontFamily: "var(--font-serif, Georgia, serif)",
                fontSize: 18,
                fontWeight: 700,
                letterSpacing: "-0.01em",
                color: "var(--foreground)",
              }}
            >
              Live
            </span>
            {/* Pulsing red dot */}
            <span className="relative inline-flex items-center justify-center" style={{ width: 10, height: 10 }}>
              <span
                className="absolute rounded-full"
                style={{
                  width: 10, height: 10,
                  backgroundColor: "var(--cherry)",
                  opacity: 0.5,
                  animation: "livePulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
                }}
              />
              <span
                className="relative rounded-full"
                style={{
                  width: 6, height: 6,
                  backgroundColor: "var(--cherry-light)",
                  boxShadow: "0 0 8px rgba(116, 7, 14, 0.4)",
                }}
              />
            </span>
          </div>
        </div>
      </header>

      {/* Subtle ambient glow at top */}
      <div
        className="pointer-events-none"
        style={{
          position: "fixed", top: 0, left: "50%", transform: "translateX(-50%)",
          width: 500, height: 250,
          background: "radial-gradient(ellipse, rgba(116, 7, 14, 0.04) 0%, transparent 70%)",
          zIndex: 0,
        }}
      />

      <main className="relative z-10 pb-24">{children}</main>
    </div>
  );
}
