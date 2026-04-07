"use client";

import { User } from "lucide-react";

export default function ProfileLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-dvh bg-[#FAF8F5] dark:bg-[#121110]">
      {/* Header — calm and minimal */}
      <header className="safe-top">
        <div className="container-app flex items-center justify-between" style={{ height: 60 }}>
          <h1
            style={{
              fontFamily: "var(--font-serif, Georgia, serif)",
              fontSize: 20,
              fontWeight: 700,
              letterSpacing: "-0.02em",
            }}
            className="text-foreground"
          >
            Profile
          </h1>
          <div className="h-9 w-9 rounded-full bg-stone-light/15 dark:bg-stone/15 flex items-center justify-center">
            <User size={18} strokeWidth={1.8} className="text-stone" />
          </div>
        </div>
        <div className="container-app">
          <div className="h-px bg-card-border" />
        </div>
      </header>

      <main className="pb-24">{children}</main>
    </div>
  );
}
