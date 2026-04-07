"use client";

import { Library } from "lucide-react";

export default function CellarLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-dvh" style={{ background: "#FFFFFF" }}>
      {/* Dark mode override */}
      <style>{`
        @media (prefers-color-scheme: dark) {
          .cellar-root { background: #0C0A08 !important; }
          .cellar-header { border-color: rgba(255,255,255,0.06) !important; }
          .cellar-title { color: #F0ECE6 !important; }
          .cellar-gold-line { opacity: 0.3 !important; }
        }
      `}</style>

      <div className="cellar-root min-h-dvh">
        {/* Header — minimal, magazine-style */}
        <header className="safe-top cellar-header" style={{ borderBottom: "1px solid rgba(0,0,0,0.06)" }}>
          <div className="container-wide flex items-center justify-between" style={{ height: 60 }}>
            <div className="flex items-center gap-3">
              {/* Gold library icon */}
              <div
                className="h-9 w-9 rounded-xl flex items-center justify-center"
                style={{ background: "linear-gradient(145deg, #D4B86A 0%, #A88840 100%)" }}
              >
                <Library size={18} strokeWidth={1.8} style={{ color: "#FFFFFF" }} />
              </div>
              <h1
                className="cellar-title"
                style={{
                  fontFamily: "var(--font-serif, Georgia, serif)",
                  fontSize: 20,
                  fontWeight: 700,
                  letterSpacing: "-0.02em",
                  color: "#1A1412",
                }}
              >
                Wine Library
              </h1>
            </div>

            {/* Decorative gold accent */}
            <div className="cellar-gold-line" style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <div style={{ width: 24, height: 1, background: "#C8A255" }} />
              <div style={{ width: 4, height: 4, borderRadius: 2, background: "#C8A255" }} />
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="pb-24">{children}</main>
      </div>
    </div>
  );
}
