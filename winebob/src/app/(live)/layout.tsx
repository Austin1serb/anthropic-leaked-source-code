"use client";

import { Radio } from "lucide-react";

export default function LiveLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div
      className="flex flex-col min-h-screen"
      style={{
        background: "linear-gradient(180deg, #0F0D0B 0%, #1A1410 100%)",
        color: "#EDE4D4",
        // Override CSS variables for dark theme regardless of system preference
        ["--background" as string]: "#0F0D0B",
        ["--foreground" as string]: "#EDE4D4",
        ["--card-bg" as string]: "#1A1714",
        ["--card-border" as string]: "rgba(255, 255, 255, 0.07)",
        ["--muted" as string]: "#7A7068",
        ["--tint-wine" as string]: "#221618",
        ["--tint-gold" as string]: "#201C14",
        ["--tint-sage" as string]: "#141E12",
        ["--tint-sky" as string]: "#121A22",
        ["--tint-plum" as string]: "#1A1420",
        ["--tint-terracotta" as string]: "#201814",
      }}
    >
      {/* Top bar */}
      <header
        className="safe-top"
        style={{
          position: "sticky",
          top: 0,
          zIndex: 40,
          borderBottom: "1px solid rgba(255, 255, 255, 0.06)",
          background: "rgba(15, 13, 11, 0.85)",
          backdropFilter: "blur(20px) saturate(180%)",
          WebkitBackdropFilter: "blur(20px) saturate(180%)",
        }}
      >
        <div className="container-app" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", height: 56 }}>
          {/* Left: Live indicator */}
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Radio size={20} style={{ color: "#EDE4D4", opacity: 0.7 }} />
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span
                className="heading-sm"
                style={{ color: "#FAF6EF", letterSpacing: "-0.01em" }}
              >
                Live
              </span>
              {/* Pulsing red dot */}
              <span
                style={{
                  position: "relative",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: 10,
                  height: 10,
                }}
              >
                <span
                  style={{
                    position: "absolute",
                    width: 10,
                    height: 10,
                    borderRadius: "50%",
                    backgroundColor: "#DC2626",
                    opacity: 0.4,
                    animation: "livePulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
                  }}
                />
                <span
                  style={{
                    position: "relative",
                    width: 6,
                    height: 6,
                    borderRadius: "50%",
                    backgroundColor: "#EF4444",
                    boxShadow: "0 0 8px rgba(239, 68, 68, 0.6)",
                  }}
                />
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Main content — pb-24 for floating portal button space */}
      <main className="flex-1 pb-24">{children}</main>

      {/* Pulse animation keyframes */}
      <style>{`
        @keyframes livePulse {
          0%, 100% { transform: scale(1); opacity: 0.4; }
          50% { transform: scale(1.8); opacity: 0; }
        }
      `}</style>
    </div>
  );
}
