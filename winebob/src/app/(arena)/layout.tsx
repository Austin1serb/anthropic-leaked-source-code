"use client";

import { Trophy } from "lucide-react";

export default function ArenaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div
      className="min-h-dvh safe-top"
      style={{
        background:
          "linear-gradient(180deg, #FEF9F0 0%, #F9EDE4 50%, #FEF9F0 100%)",
      }}
    >
      {/* Top bar */}
      <header className="container-app pt-6 pb-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-xl bg-cherry/10 flex items-center justify-center">
            <Trophy className="h-4 w-4 text-cherry" />
          </div>
          <h1
            className="text-lg font-bold text-cherry tracking-tight"
            style={{ fontFamily: "var(--font-serif)" }}
          >
            Arena
          </h1>
        </div>
      </header>

      {/* Content area */}
      <main className="pb-24">{children}</main>
    </div>
  );
}
