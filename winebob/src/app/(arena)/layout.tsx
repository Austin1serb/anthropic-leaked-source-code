"use client";

import { Swords } from "lucide-react";

export default function ArenaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-dvh bg-background">
      {/* Header */}
      <header className="safe-top">
        <div className="container-app flex items-center justify-between" style={{ height: 56 }}>
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-cherry flex items-center justify-center float-action">
              <Swords size={18} color="white" />
            </div>
            <h1 style={{ fontFamily: "var(--font-serif, Georgia, serif)", fontSize: 20, fontWeight: 700, letterSpacing: "-0.02em" }} className="text-foreground">
              Arena
            </h1>
          </div>
        </div>
        <div className="container-app"><div className="h-px bg-card-border" /></div>
      </header>

      <main className="pb-24">{children}</main>
    </div>
  );
}
