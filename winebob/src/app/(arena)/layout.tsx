"use client";

import { Swords } from "lucide-react";

export default function ArenaLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh bg-background">
      <main className="pb-24">{children}</main>
    </div>
  );
}
