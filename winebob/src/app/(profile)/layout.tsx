"use client";

import { User } from "lucide-react";

export default function ProfileLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col min-h-screen bg-[#FAF8F5] dark:bg-[#121110]">
      {/* Top bar */}
      <header className="safe-top">
        <div className="container-app flex items-center justify-between py-4">
          <h1 className="heading-md text-ink dark:text-foreground">Profile</h1>
          <div className="flex items-center justify-center w-10 h-10 rounded-full bg-stone-light/20 dark:bg-stone/20">
            <User className="w-5 h-5 text-stone dark:text-stone-light" />
          </div>
        </div>
        {/* Subtle separator */}
        <div className="h-px bg-card-border" />
      </header>

      {/* Content area with bottom padding for floating portal button */}
      <main className="flex-1 pb-24">{children}</main>
    </div>
  );
}
