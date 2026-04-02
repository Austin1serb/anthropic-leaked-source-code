"use client";

import { useState } from "react";
import { Wine, ArrowRight, Swords } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function HomePage() {
  const [joinCode, setJoinCode] = useState("");
  const router = useRouter();

  function handleJoin(e: React.FormEvent) {
    e.preventDefault();
    const code = joinCode.trim().toUpperCase();
    if (code.length >= 4) {
      router.push(`/join/${code}`);
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background px-6 safe-top safe-bottom">
      {/* Logo */}
      <div className="flex flex-col items-center mb-10 animate-fade-in-up">
        <div className="w-20 h-20 rounded-full bg-wine-burgundy flex items-center justify-center mb-4">
          <Wine size={40} className="text-white" />
        </div>
        <h1 className="text-3xl font-bold font-serif text-foreground">
          Winebob
        </h1>
        <p className="text-sm text-muted mt-2 text-center max-w-xs">
          Blind tasting made social. Join an event or host your own.
        </p>
      </div>

      {/* Join with code — the primary action */}
      <form onSubmit={handleJoin} className="w-full max-w-sm mb-6">
        <label className="text-sm font-medium text-foreground mb-2 block">
          Got a code? Join a tasting:
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            value={joinCode}
            onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
            placeholder="WINE42"
            maxLength={8}
            className="flex-1 h-14 px-4 rounded-xl bg-card-bg border border-card-border text-center text-xl font-mono font-bold tracking-widest placeholder:text-muted/40 placeholder:font-normal placeholder:text-base placeholder:tracking-normal focus:outline-none focus:ring-2 focus:ring-wine-burgundy/30 focus:border-wine-burgundy/50"
          />
          <button
            type="submit"
            disabled={joinCode.trim().length < 4}
            className="h-14 w-14 rounded-xl bg-wine-burgundy text-white flex items-center justify-center disabled:opacity-40 active:scale-95 transition-transform"
          >
            <ArrowRight size={22} />
          </button>
        </div>
      </form>

      {/* Divider */}
      <div className="flex items-center gap-3 w-full max-w-sm mb-6">
        <div className="flex-1 h-px bg-card-border" />
        <span className="text-xs text-muted">or</span>
        <div className="flex-1 h-px bg-card-border" />
      </div>

      {/* Host CTA */}
      <Link
        href="/arena"
        className="w-full max-w-sm py-4 bg-card-bg border border-card-border rounded-2xl font-semibold text-sm flex items-center justify-center gap-3 active:scale-[0.98] transition-transform"
      >
        <Swords size={20} className="text-wine-burgundy" />
        Host a Blind Tasting
      </Link>

      <p className="text-xs text-muted mt-3 text-center">
        Sign in required to host events
      </p>
    </div>
  );
}
