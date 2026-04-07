"use client";

import { useState, useEffect } from "react";
import { ArrowRight, Swords } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";

function LandingAnimation({ onComplete }: { onComplete: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onComplete, 4800);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <div className="sky-scene sky-scene-exit">
      {/* Clouds */}
      <div className="cloud cloud-1" />
      <div className="cloud cloud-2" />
      <div className="cloud cloud-3" />

      {/* Wine bottles falling */}
      <div className="bottle bottle-1">
        <svg width="48" height="120" viewBox="0 0 48 120" fill="none">
          <rect x="18" y="0" width="12" height="20" rx="2" fill="#4A2518" />
          <rect x="16" y="18" width="16" height="6" rx="1" fill="#6B3A2A" />
          <path d="M16 24 C16 24 12 40 12 50 L12 110 C12 115 16 120 24 120 C32 120 36 115 36 110 L36 50 C36 40 32 24 32 24 Z" fill="#74070E" />
          <path d="M16 24 C16 24 12 40 12 50 L12 110 C12 115 16 120 24 120 C24 120 20 115 20 110 L20 50 C20 40 22 24 22 24 Z" fill="#8B1A22" opacity="0.5" />
          <ellipse cx="24" cy="80" rx="6" ry="12" fill="#FFEEBC" opacity="0.15" />
        </svg>
      </div>
      <div className="bottle bottle-2">
        <svg width="48" height="120" viewBox="0 0 48 120" fill="none">
          <rect x="18" y="0" width="12" height="20" rx="2" fill="#4A2518" />
          <rect x="16" y="18" width="16" height="6" rx="1" fill="#6B3A2A" />
          <path d="M16 24 C16 24 12 40 12 50 L12 110 C12 115 16 120 24 120 C32 120 36 115 36 110 L36 50 C36 40 32 24 32 24 Z" fill="#74070E" />
          <path d="M16 24 C16 24 12 40 12 50 L12 110 C12 115 16 120 24 120 C24 120 20 115 20 110 L20 50 C20 40 22 24 22 24 Z" fill="#8B1A22" opacity="0.5" />
          <ellipse cx="24" cy="80" rx="6" ry="12" fill="#FFEEBC" opacity="0.15" />
        </svg>
      </div>
      <div className="bottle bottle-3">
        <svg width="48" height="120" viewBox="0 0 48 120" fill="none">
          <rect x="18" y="0" width="12" height="20" rx="2" fill="#4A2518" />
          <rect x="16" y="18" width="16" height="6" rx="1" fill="#6B3A2A" />
          <path d="M16 24 C16 24 12 40 12 50 L12 110 C12 115 16 120 24 120 C32 120 36 115 36 110 L36 50 C36 40 32 24 32 24 Z" fill="#5A3020" />
          <path d="M16 24 C16 24 12 40 12 50 L12 110 C12 115 16 120 24 120 C24 120 20 115 20 110 L20 50 C20 40 22 24 22 24 Z" fill="#6B3A2A" opacity="0.5" />
          <ellipse cx="24" cy="80" rx="6" ry="12" fill="#FFEEBC" opacity="0.15" />
        </svg>
      </div>

      {/* Antique table */}
      <div className="antique-table">
        <div className="table-runner" />
      </div>

      {/* Logo appears after bottles land */}
      <div className="absolute inset-0 flex flex-col items-center justify-center z-10 pointer-events-none">
        <div className="animate-logo-reveal">
          <h1 className="text-5xl font-bold font-serif text-cherry-dark drop-shadow-sm">
            Winebob
          </h1>
          <p className="text-sm text-leather mt-2 text-center">
            Blind tasting made social
          </p>
        </div>
      </div>
    </div>
  );
}

export default function HomePage() {
  const [showAnimation, setShowAnimation] = useState(true);
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
    <>
      {showAnimation && (
        <LandingAnimation onComplete={() => setShowAnimation(false)} />
      )}

      <div
        className={`min-h-screen flex flex-col items-center justify-center bg-background px-6 safe-top safe-bottom transition-opacity duration-500 ${
          showAnimation ? "opacity-0" : "opacity-100"
        }`}
      >
        {/* Logo */}
        <div className="flex flex-col items-center mb-10 animate-fade-in-up">
          <div className="w-20 h-20 rounded-full bg-cherry flex items-center justify-center mb-4 shadow-lg shadow-cherry/20">
            <svg width="40" height="40" viewBox="0 0 48 48" fill="none">
              <path d="M24 4 C24 4 20 16 20 22 L20 38 C20 42 22 44 24 44 C26 44 28 42 28 38 L28 22 C28 16 24 4 24 4 Z" fill="white" opacity="0.9" />
              <path d="M22 2 L26 2 L24 8 Z" fill="white" opacity="0.7" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold font-serif text-foreground">
            Winebob
          </h1>
          <p className="text-sm text-muted mt-2 text-center max-w-xs">
            Blind tasting made social. Join an event or host your own.
          </p>
        </div>

        {/* Join with code */}
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
              className="flex-1 h-14 px-4 rounded-xl bg-card-bg border border-card-border text-center text-xl font-mono font-bold tracking-widest placeholder:text-muted/40 placeholder:font-normal placeholder:text-base placeholder:tracking-normal focus:outline-none focus:ring-2 focus:ring-cherry/30 focus:border-cherry/50"
            />
            <button
              type="submit"
              disabled={joinCode.trim().length < 4}
              className="h-14 w-14 rounded-xl bg-cherry text-white flex items-center justify-center disabled:opacity-40 active:scale-95 transition-transform shadow-md shadow-cherry/20"
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
          className="w-full max-w-sm py-4 bg-card-bg border border-card-border rounded-2xl font-semibold text-sm flex items-center justify-center gap-3 active:scale-[0.98] transition-transform shadow-sm"
        >
          <Swords size={20} className="text-cherry" />
          Host a Blind Tasting
        </Link>

        <p className="text-xs text-muted mt-3 text-center">
          Sign in required to host events
        </p>
      </div>
    </>
  );
}
