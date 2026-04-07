"use client";

import { Radio } from "lucide-react";

export default function LiveLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div
      className="min-h-dvh"
      style={{
        background: "linear-gradient(180deg, #0F0D0B 0%, #141210 50%, #0F0D0B 100%)",
        color: "#EDE4D4",
      }}
    >
      {/* Force dark theme variables for all child components */}
      <style>{`
        .live-root {
          --background: #0F0D0B;
          --foreground: #EDE4D4;
          --card-bg: #1C1916;
          --card-border: rgba(255, 255, 255, 0.07);
          --muted: #7A7068;
          --widget-wine: #221618;
          --widget-gold: #201C14;
          --widget-sage: #141E12;
          --widget-sky: #121A22;
          --widget-lavender: #1A1420;
          --widget-peach: #201814;
        }
        @keyframes livePulse {
          0%, 100% { transform: scale(1); opacity: 0.5; }
          50% { transform: scale(2); opacity: 0; }
        }
      `}</style>

      <div className="live-root min-h-dvh">
        {/* Sticky header — frosted dark glass */}
        <header
          className="safe-top sticky top-0 z-40"
          style={{
            borderBottom: "1px solid rgba(255, 255, 255, 0.05)",
            background: "rgba(15, 13, 11, 0.88)",
            backdropFilter: "blur(20px) saturate(180%)",
            WebkitBackdropFilter: "blur(20px) saturate(180%)",
          }}
        >
          <div className="container-app flex items-center justify-between" style={{ height: 56 }}>
            <div className="flex items-center gap-2.5">
              <Radio size={18} style={{ color: "#EDE4D4", opacity: 0.6 }} />
              <span
                style={{
                  fontFamily: "var(--font-serif, Georgia, serif)",
                  fontSize: 18,
                  fontWeight: 700,
                  letterSpacing: "-0.01em",
                  color: "#FAF6EF",
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
                    backgroundColor: "#DC2626",
                    opacity: 0.5,
                    animation: "livePulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
                  }}
                />
                <span
                  className="relative rounded-full"
                  style={{
                    width: 6, height: 6,
                    backgroundColor: "#EF4444",
                    boxShadow: "0 0 8px rgba(239, 68, 68, 0.6)",
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
            width: 400, height: 200,
            background: "radial-gradient(ellipse, rgba(220, 40, 50, 0.04) 0%, transparent 70%)",
            zIndex: 0,
          }}
        />

        <main className="relative z-10 pb-24">{children}</main>
      </div>
    </div>
  );
}
