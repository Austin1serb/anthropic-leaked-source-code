"use client";

import { useState } from "react";
import { ArrowRight, Swords, Wine, Sparkles, Globe, Users } from "lucide-react";
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
    <div className="min-h-dvh flex flex-col md:flex-row">
      {/* ══════════ TOP / LEFT — Butter zone (Join / Host) ══════════ */}
      <div
        className="flex-1 flex flex-col items-center justify-center px-6 py-12 relative overflow-hidden"
        style={{ background: "var(--butter)" }}
      >
        {/* Force light text colors regardless of system dark mode */}
        <style>{`
          .landing-butter { --foreground: #1A1412; --muted: #8C7E6E; --card-bg: #FFFFFF; --card-border: rgba(0,0,0,0.06); }
          .landing-cherry { color: white; }
        `}</style>

        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[280px] h-[280px] rounded-full blur-[80px] pointer-events-none" style={{ background: "rgba(116,7,14,0.08)" }} />

        <div className="relative z-10 w-full max-w-sm landing-butter">
          {/* Logo */}
          <div className="flex flex-col items-center mb-7">
            <div className="w-[72px] h-[72px] rounded-[22px] bg-cherry flex items-center justify-center mb-3.5" style={{ boxShadow: "0 4px 20px rgba(116,7,14,0.3)" }}>
              <svg width="32" height="32" viewBox="0 0 48 48" fill="none">
                <path d="M24 4 C24 4 20 16 20 22 L20 38 C20 42 22 44 24 44 C26 44 28 42 28 38 L28 22 C28 16 24 4 24 4 Z" fill="white" opacity="0.9" />
                <path d="M22 2 L26 2 L24 8 Z" fill="white" opacity="0.7" />
              </svg>
            </div>
            <h1 className="text-[28px] font-bold tracking-tight" style={{ color: "#1A1412" }}>
              Winebob
            </h1>
            <p className="text-[14px] mt-1.5 text-center max-w-[240px]" style={{ color: "#8C7E6E" }}>
              Blind tasting made social. Join an event or host your own.
            </p>
          </div>

          {/* Join with code */}
          <form onSubmit={handleJoin} className="mb-4">
            <label className="text-[12px] font-bold uppercase tracking-wider mb-2 block" style={{ color: "#1A1412" }}>
              Got a code? Join a tasting
            </label>
            <div className="flex gap-2.5">
              <input
                type="text"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                placeholder="WINE42"
                maxLength={8}
                style={{ background: "#FFFFFF", borderColor: "rgba(0,0,0,0.08)", color: "#1A1412" }}
                className="flex-1 h-[52px] rounded-2xl border-[1.5px] text-center text-xl font-mono font-bold tracking-[0.2em] placeholder:text-[#8C7E6E]/30 placeholder:font-normal placeholder:text-base placeholder:tracking-normal focus:outline-none focus:ring-2 focus:ring-cherry/20 focus:border-cherry/40"
              />
              <button
                type="submit"
                disabled={joinCode.trim().length < 4}
                className="h-[52px] w-[52px] rounded-2xl bg-cherry text-white flex items-center justify-center disabled:opacity-30 active:scale-90 transition-transform flex-shrink-0"
                style={{ boxShadow: "0 4px 14px rgba(116,7,14,0.25)" }}
              >
                <ArrowRight size={22} />
              </button>
            </div>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-3 mb-4">
            <div className="flex-1 h-px" style={{ background: "rgba(0,0,0,0.08)" }} />
            <span className="text-[11px] font-medium" style={{ color: "#8C7E6E" }}>or</span>
            <div className="flex-1 h-px" style={{ background: "rgba(0,0,0,0.08)" }} />
          </div>

          {/* Host CTA */}
          <Link
            href="/arena"
            className="w-full py-3.5 rounded-2xl flex items-center justify-center gap-3 active:scale-[0.98] transition-transform"
            style={{ background: "#FFFFFF", border: "1.5px solid rgba(0,0,0,0.06)", boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}
          >
            <Swords size={18} className="text-cherry" />
            <span className="font-bold text-[15px]" style={{ color: "#1A1412" }}>Host a Blind Tasting</span>
          </Link>
          <p className="text-[11px] mt-2 text-center" style={{ color: "#8C7E6E" }}>
            Sign in required to host events
          </p>
        </div>
      </div>

      {/* ══════════ BOTTOM / RIGHT — Cherry zone (Explore universe) ══════════ */}
      <div
        className="flex-1 flex flex-col items-center justify-center px-6 py-12 relative overflow-hidden md:rounded-l-[40px]"
        style={{ background: "linear-gradient(145deg, #8B1A22 0%, #5A0509 100%)" }}
      >
        <div className="absolute bottom-1/4 left-1/2 -translate-x-1/2 w-[280px] h-[280px] bg-white/5 rounded-full blur-[80px] pointer-events-none" />

        <div className="relative z-10 w-full max-w-sm text-center">
          {/* Feature pills */}
          <div className="flex items-center justify-center gap-2 mb-5 flex-wrap">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 text-white/80 text-[11px] font-semibold backdrop-blur-sm">
              <Wine className="h-3 w-3" /> 200+ wines
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 text-white/80 text-[11px] font-semibold backdrop-blur-sm">
              <Globe className="h-3 w-3" /> 16 countries
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 text-white/80 text-[11px] font-semibold backdrop-blur-sm">
              <Users className="h-3 w-3" /> Live events
            </span>
          </div>

          <h2 className="text-[24px] font-bold text-white tracking-tight mb-2">
            Explore the Universe
          </h2>
          <p className="text-[14px] text-white/55 mb-7 max-w-[260px] mx-auto leading-relaxed">
            Browse wines, build your cellar, join live global tastings, and discover new favorites.
          </p>

          <Link
            href="/explore"
            className="inline-flex items-center justify-center gap-2.5 w-full max-w-[280px] py-4 rounded-2xl bg-white font-bold text-[16px] active:scale-[0.98] transition-transform"
            style={{ color: "#74070E", boxShadow: "0 4px 20px rgba(0,0,0,0.2)" }}
          >
            <Sparkles className="h-5 w-5" />
            Explore the Map
          </Link>
          <p className="text-[11px] text-white/35 mt-3">
            Free account — takes 10 seconds
          </p>
        </div>
      </div>
    </div>
  );
}
