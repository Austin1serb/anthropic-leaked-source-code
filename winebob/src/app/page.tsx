"use client";

import { useState } from "react";
import { ArrowRight, Wine, Sparkles, MapPin, Trophy, Radio, Grape, ChevronRight } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function HomePage() {
  const [joinCode, setJoinCode] = useState("");
  const router = useRouter();

  function handleJoin(e: React.FormEvent) {
    e.preventDefault();
    const code = joinCode.trim().toUpperCase();
    if (code.length >= 4) router.push(`/join/${code}`);
  }

  return (
    <div className="min-h-dvh flex flex-col md:flex-row">

      {/* ══════ LEFT — Join / Host (butter) ══════ */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-14 relative overflow-hidden" style={{ background: "#F2D98B" }}>
        {/* Subtle decorative grape */}
        <div className="absolute top-12 right-10 text-[100px] opacity-[0.03] pointer-events-none select-none">🍇</div>

        <div className="relative z-10 w-full max-w-sm">
          {/* Logo */}
          <div className="flex items-center gap-2.5 mb-10">
            <div className="h-10 w-10 rounded-[10px] bg-cherry flex items-center justify-center">
              <Wine className="h-5 w-5 text-white" />
            </div>
            <span className="text-[22px] font-bold text-[#1A1412] tracking-tight font-serif">Winebob</span>
          </div>

          {/* Headline */}
          <h1 className="text-[32px] font-bold text-[#1A1412] tracking-tight leading-[1.1] font-serif mb-2">
            Blind tasting,<br />made social.
          </h1>
          <p className="text-[14px] text-[#8C7E6E] leading-relaxed max-w-[280px]">
            Host tastings with friends. Guess the wine. See who has the best palate.
          </p>

          {/* Join with code */}
          <form onSubmit={handleJoin} className="mt-8">
            <p className="text-[11px] font-bold text-[#1A1412] uppercase tracking-widest mb-2">Got a code?</p>
            <div className="flex gap-2">
              <input
                type="text"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                placeholder="WINE42"
                maxLength={8}
                className="flex-1 h-[50px] rounded-[10px] bg-white/80 border border-[#1A1412]/[0.08] text-center text-[18px] font-mono font-bold tracking-[0.2em] text-[#1A1412] placeholder:text-[#8C7E6E]/30 placeholder:font-normal placeholder:text-[14px] placeholder:tracking-normal focus:outline-none focus:bg-white focus:border-cherry/30 focus:ring-2 focus:ring-cherry/10 transition-all"
              />
              <button
                type="submit"
                disabled={joinCode.trim().length < 4}
                className="h-[50px] w-[50px] rounded-[10px] bg-cherry text-white flex items-center justify-center disabled:opacity-20 hover:bg-cherry/90 transition-colors flex-shrink-0"
              >
                <ArrowRight size={20} />
              </button>
            </div>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-3 my-5">
            <div className="flex-1 h-px bg-[#1A1412]/10" />
            <span className="text-[10px] font-semibold text-[#8C7E6E]/70 uppercase tracking-wider">or</span>
            <div className="flex-1 h-px bg-[#1A1412]/10" />
          </div>

          {/* Host CTA */}
          <Link
            href="/arena"
            className="group w-full h-12 rounded-[10px] bg-white/70 border border-[#1A1412]/[0.06] flex items-center justify-center gap-2.5 hover:bg-white hover:border-cherry/20 transition-all"
          >
            <Trophy className="h-4 w-4 text-cherry" />
            <span className="font-bold text-[14px] text-[#1A1412]">Host a Blind Tasting</span>
          </Link>
          <p className="text-[11px] text-[#8C7E6E] text-center mt-2">
            Free account required to host
          </p>

          {/* How it works — compact */}
          <div className="mt-10 space-y-3">
            <p className="text-[10px] font-bold text-[#8C7E6E] uppercase tracking-widest">How it works</p>
            <div className="flex items-center gap-3">
              <span className="h-6 w-6 rounded-[6px] bg-cherry text-white text-[10px] font-bold flex items-center justify-center flex-shrink-0">1</span>
              <span className="text-[12px] text-[#1A1412]">Pick wines from our database or add your own</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="h-6 w-6 rounded-[6px] bg-cherry/10 text-cherry text-[10px] font-bold flex items-center justify-center flex-shrink-0">2</span>
              <span className="text-[12px] text-[#1A1412]">Share the code — friends join instantly, no signup</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="h-6 w-6 rounded-[6px] bg-cherry/10 text-cherry text-[10px] font-bold flex items-center justify-center flex-shrink-0">3</span>
              <span className="text-[12px] text-[#1A1412]">Taste, guess grape & region, see who wins</span>
            </div>
          </div>
        </div>
      </div>

      {/* ══════ RIGHT — Explore universe (cherry) ══════ */}
      <div
        className="flex-1 flex flex-col items-center justify-center px-6 py-14 relative overflow-hidden md:rounded-l-[32px]"
        style={{ background: "linear-gradient(155deg, #8B1A22 0%, #5A0509 100%)" }}
      >
        {/* Decorative wine glass */}
        <div className="absolute bottom-10 right-10 text-[90px] opacity-[0.04] pointer-events-none select-none">🍷</div>

        <div className="relative z-10 w-full max-w-sm text-center">
          {/* Map preview teaser */}
          <div className="h-12 w-12 rounded-full bg-white/10 flex items-center justify-center mx-auto mb-5">
            <MapPin className="h-6 w-6 text-white/70" />
          </div>

          <h2 className="text-[28px] font-bold text-white tracking-tight font-serif leading-tight mb-2">
            Explore the<br />world of wine
          </h2>
          <p className="text-[14px] text-white/45 mb-6 max-w-[260px] mx-auto leading-relaxed">
            An interactive map of producers, regions, and bookable experiences.
          </p>

          {/* CTA — before feature list */}
          <Link
            href="/explore"
            className="inline-flex items-center justify-center gap-2 w-full max-w-[260px] h-12 rounded-[10px] bg-white text-cherry font-bold text-[14px] hover:bg-white/90 transition-colors mb-8"
          >
            <Sparkles className="h-4 w-4" />
            Explore the Map
          </Link>

          {/* Feature list */}
          <div className="space-y-2.5 mb-6 text-left max-w-[260px] mx-auto">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-[8px] bg-white/10 flex items-center justify-center flex-shrink-0">
                <MapPin className="h-4 w-4 text-white/60" />
              </div>
              <span className="text-[13px] text-white/70">28 wine regions with producer pins</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-[8px] bg-white/10 flex items-center justify-center flex-shrink-0">
                <Grape className="h-4 w-4 text-white/60" />
              </div>
              <span className="text-[13px] text-white/70">Browse wines, grapes, and appellations</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-[8px] bg-white/10 flex items-center justify-center flex-shrink-0">
                <Sparkles className="h-4 w-4 text-white/60" />
              </div>
              <span className="text-[13px] text-white/70">Book tastings and tours at wineries</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-[8px] bg-white/10 flex items-center justify-center flex-shrink-0">
                <Radio className="h-4 w-4 text-white/60" />
              </div>
              <span className="text-[13px] text-white/70">Join live sommelier events</span>
            </div>
          </div>

          <p className="text-[11px] text-white/30">
            Free to browse — no account needed
          </p>
        </div>
      </div>
    </div>
  );
}
