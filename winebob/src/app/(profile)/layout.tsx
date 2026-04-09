"use client";

import { User } from "lucide-react";

export default function ProfileLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh bg-background">
      <header className="safe-top sticky top-0 z-40 bg-white/92 backdrop-blur-xl border-b border-card-border/40">
        <div className="px-5 flex items-center justify-between" style={{ height: 52 }}>
          <h1 className="text-[17px] font-bold text-foreground tracking-tight font-serif">
            Profile
          </h1>
          <div className="h-8 w-8 rounded-full bg-card-border/20 flex items-center justify-center">
            <User size={16} strokeWidth={1.8} className="text-muted" />
          </div>
        </div>
      </header>

      <main className="pb-24">{children}</main>
    </div>
  );
}
