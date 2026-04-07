"use client";

import { Swords } from "lucide-react";

export default function ArenaLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh bg-background">
      <header className="safe-top">
        <div className="px-4 md:px-8 lg:px-12 flex items-center justify-between" style={{ height: 56 }}>
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-cherry flex items-center justify-center float-action">
              <Swords size={18} color="white" />
            </div>
            <h1 style={{ fontFamily: "var(--font-serif, Georgia, serif)", fontSize: 20, fontWeight: 700, letterSpacing: "-0.02em" }} className="text-foreground">
              Arena
            </h1>
          </div>
        </div>
      </header>
      <main className="pb-24">{children}</main>
    </div>
  );
}
