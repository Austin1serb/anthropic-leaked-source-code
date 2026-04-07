"use client";

import { Library } from "lucide-react";

export default function CellarLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div
      className="flex flex-col min-h-screen"
      style={{
        background: "var(--cellar-bg, #FFFFFF)",
      }}
    >
      {/* Inject cellar-specific CSS custom properties */}
      <style>{`
        @media (prefers-color-scheme: dark) {
          :root {
            --cellar-bg: #0C0A08;
            --cellar-fg: #F0ECE6;
            --cellar-muted: #6B6560;
            --cellar-border: rgba(255, 255, 255, 0.06);
          }
        }
        @media (prefers-color-scheme: light) {
          :root {
            --cellar-bg: #FFFFFF;
            --cellar-fg: #1A1714;
            --cellar-muted: #9A9490;
            --cellar-border: rgba(0, 0, 0, 0.08);
          }
        }
      `}</style>

      {/* Top bar */}
      <header
        className="safe-top"
        style={{
          borderBottom: "1px solid var(--cellar-border, rgba(0,0,0,0.08))",
        }}
      >
        <div className="container-wide flex items-center justify-between py-4">
          <div className="flex items-center gap-3">
            <Library
              size={20}
              strokeWidth={1.5}
              style={{ color: "#C8A255" }}
            />
            <h1
              style={{
                fontFamily: "var(--font-serif, 'Playfair Display', Georgia, serif)",
                fontSize: "20px",
                fontWeight: 600,
                letterSpacing: "-0.01em",
                color: "var(--cellar-fg, #1A1714)",
              }}
            >
              Library
            </h1>
          </div>

          {/* Subtle gold decorative rule */}
          <div
            style={{
              width: "32px",
              height: "1px",
              background: "linear-gradient(90deg, transparent, #C8A255, transparent)",
            }}
          />
        </div>
      </header>

      {/* Main content — container-wide for wine grids, pb-24 for portal button */}
      <main className="flex-1 pb-24">
        <div className="container-wide">{children}</div>
      </main>
    </div>
  );
}
