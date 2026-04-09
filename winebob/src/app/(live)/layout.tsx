"use client";

import Link from "next/link";
import { Radio, Wine, Users } from "lucide-react";

export default function LiveLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh bg-background">
      {/* Header */}
      <header className="safe-top sticky top-0 z-40 bg-white/92 backdrop-blur-xl border-b border-card-border/40">
        <div className="px-5 flex items-center justify-between" style={{ height: 52 }}>
          <div className="flex items-center gap-2.5">
            <div className="h-7 w-7 rounded-[8px] bg-cherry/10 flex items-center justify-center">
              <Radio size={14} className="text-cherry" />
            </div>
            <span className="text-[17px] font-bold text-foreground tracking-tight font-serif">
              Live
            </span>
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cherry opacity-60" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-cherry" />
            </span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/sommeliers" className="text-[12px] font-semibold text-muted hover:text-foreground transition-colors">
              Sommeliers
            </Link>
            <Link href="/live/create" className="h-8 w-8 rounded-[8px] bg-cherry flex items-center justify-center">
              <Wine className="h-3.5 w-3.5 text-white" />
            </Link>
          </div>
        </div>
      </header>

      <main className="relative pb-24">{children}</main>
    </div>
  );
}
