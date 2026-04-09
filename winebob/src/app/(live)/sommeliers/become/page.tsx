"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ChevronLeft, Wine, BadgeCheck, Radio, Users,
  ArrowRight, Check, Sparkles, Trophy, TrendingUp, Mic,
} from "lucide-react";
import { createSommelierProfile } from "@/lib/liveActions";

const EXPERTISE_OPTIONS = [
  "French", "Italian", "Spanish", "Portuguese", "German", "Austrian",
  "New World", "Natural", "Biodynamic", "Sparkling", "Champagne",
  "Burgundy", "Bordeaux", "Rh\u00f4ne", "Piedmont", "Tuscany", "Rioja",
];

const CERT_OPTIONS = [
  "WSET Level 1", "WSET Level 2", "WSET Level 3", "WSET Diploma",
  "Court of Master Sommeliers - Intro", "Court of Master Sommeliers - Certified",
  "Court of Master Sommeliers - Advanced", "Master Sommelier",
  "Wine & Spirit Education Trust", "Certified Wine Educator",
];

const BENEFITS = [
  { icon: Radio, title: "Go Live", desc: "Host blind tastings with real-time interaction" },
  { icon: Users, title: "Build Audience", desc: "Grow your following of wine enthusiasts" },
  { icon: Trophy, title: "Gamification", desc: "Viewers compete with hints and leaderboards" },
  { icon: TrendingUp, title: "Track Impact", desc: "See your events, viewers, and ratings grow" },
];

const STEPS = [
  { num: 1, title: "Create Your Profile", desc: "Add your name, bio, and expertise areas" },
  { num: 2, title: "Set Up a Tasting", desc: "Choose wines, prepare hints, and schedule your event" },
  { num: 3, title: "Go Live", desc: "Host your session while viewers guess along in real time" },
];

export default function BecomeSommelierPage() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const [step, setStep] = useState<"intro" | "form">("intro");
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [expertise, setExpertise] = useState<string[]>([]);
  const [certifications, setCertifications] = useState<string[]>([]);

  function toggle(arr: string[], set: (v: string[]) => void, item: string) {
    set(arr.includes(item) ? arr.filter((e) => e !== item) : [...arr, item]);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!displayName.trim()) { setError("Display name is required"); return; }
    setError("");
    startTransition(async () => {
      try {
        await createSommelierProfile({ displayName: displayName.trim(), bio: bio.trim() || undefined, expertise, certifications });
        router.push("/sommeliers");
      } catch (err) { setError(err instanceof Error ? err.message : "Failed to create profile"); }
    });
  }

  // ── INTRO ──
  if (step === "intro") {
    return (
      <div className="px-5 pt-6 pb-28">
        <Link href="/sommeliers" className="inline-flex items-center gap-1 text-[13px] font-semibold text-muted hover:text-foreground transition-colors touch-target mb-6">
          <ChevronLeft className="h-3.5 w-3.5" /> Back
        </Link>

        {/* Hero */}
        <div className="text-center mb-8">
          <div className="h-16 w-16 rounded-full bg-cherry/10 flex items-center justify-center mx-auto mb-4">
            <Mic className="h-8 w-8 text-cherry/60" />
          </div>
          <h1 className="text-[26px] font-bold text-foreground tracking-tight font-serif mb-2">
            Become a Sommelier
          </h1>
          <p className="text-[14px] text-muted max-w-[300px] mx-auto leading-relaxed">
            Host live blind tasting events, share your knowledge, and build a community.
          </p>
        </div>

        {/* Benefits */}
        <div className="grid grid-cols-2 gap-3 mb-8">
          {BENEFITS.map((b) => (
            <div key={b.title} className="bg-white rounded-[14px] border border-card-border/60 p-4">
              <div className="h-9 w-9 rounded-[8px] bg-cherry/8 flex items-center justify-center mb-3">
                <b.icon className="h-4 w-4 text-cherry/60" />
              </div>
              <h3 className="text-[13px] font-semibold text-foreground mb-1">{b.title}</h3>
              <p className="text-[11px] leading-relaxed text-muted">{b.desc}</p>
            </div>
          ))}
        </div>

        {/* How It Works */}
        <h2 className="text-[11px] font-bold text-muted uppercase tracking-widest mb-3">How It Works</h2>
        <div className="bg-white rounded-[14px] border border-card-border/60 overflow-hidden divide-y divide-card-border/30 mb-8">
          {STEPS.map((s, i) => (
            <div key={s.num} className="flex items-start gap-4 px-5 py-4">
              <div className={`h-8 w-8 rounded-[8px] flex items-center justify-center text-[13px] font-bold flex-shrink-0 ${
                i === 0 ? "bg-cherry text-white" : "bg-cherry/8 text-cherry"
              }`}>
                {s.num}
              </div>
              <div>
                <h3 className="text-[13px] font-semibold text-foreground">{s.title}</h3>
                <p className="text-[12px] text-muted mt-0.5">{s.desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <button onClick={() => setStep("form")} className="btn-primary touch-target w-full">
          Get Started <ArrowRight className="h-5 w-5" />
        </button>
        <p className="text-center text-[11px] text-muted mt-3">Free to join — no commitments required</p>
      </div>
    );
  }

  // ── FORM ──
  return (
    <div className="px-5 pt-6 pb-28">
      <button onClick={() => setStep("intro")} className="inline-flex items-center gap-1 text-[13px] font-semibold text-muted hover:text-foreground transition-colors touch-target mb-6">
        <ChevronLeft className="h-3.5 w-3.5" /> Back
      </button>

      <div className="flex items-center gap-3 mb-6">
        <div className="h-11 w-11 rounded-[10px] bg-cherry flex items-center justify-center">
          <Wine className="h-5 w-5 text-white" />
        </div>
        <div>
          <h1 className="text-[20px] font-bold text-foreground tracking-tight font-serif">Your Profile</h1>
          <p className="text-[12px] text-muted">This is how viewers will see you</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Display Name */}
        <div className="bg-white rounded-[14px] border border-card-border/60 p-5">
          <h2 className="text-[11px] font-bold text-muted uppercase tracking-widest mb-4">Basic Info</h2>
          <div className="space-y-4">
            <div>
              <label className="text-[12px] font-semibold text-foreground">Display Name *</label>
              <input type="text" value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="How you'll appear to viewers" className="input-field w-full touch-target mt-1.5" />
            </div>
            <div>
              <label className="text-[12px] font-semibold text-foreground">Bio</label>
              <textarea value={bio} onChange={(e) => setBio(e.target.value)} placeholder="Tell viewers about your wine journey..." rows={3} className="input-field w-full resize-none mt-1.5" />
            </div>
          </div>
        </div>

        {/* Expertise */}
        <div className="bg-white rounded-[14px] border border-card-border/60 p-5">
          <h2 className="text-[11px] font-bold text-muted uppercase tracking-widest mb-1">Expertise</h2>
          <p className="text-[12px] text-muted mb-3">Select regions and styles you know best</p>
          <div className="flex flex-wrap gap-1.5">
            {EXPERTISE_OPTIONS.map((item) => {
              const active = expertise.includes(item);
              return (
                <button
                  key={item}
                  type="button"
                  onClick={() => toggle(expertise, setExpertise, item)}
                  className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-[12px] font-medium transition-all border ${
                    active ? "bg-cherry/[0.07] border-cherry/20 text-cherry" : "bg-white border-card-border/50 text-muted hover:border-card-border"
                  }`}
                >
                  {active && <Check className="h-3 w-3" />}
                  {item}
                </button>
              );
            })}
          </div>
        </div>

        {/* Certifications */}
        <div className="bg-white rounded-[14px] border border-card-border/60 p-5">
          <h2 className="text-[11px] font-bold text-muted uppercase tracking-widest mb-1">Certifications</h2>
          <p className="text-[12px] text-muted mb-3">Optional — builds trust with viewers</p>
          <div className="flex flex-wrap gap-1.5">
            {CERT_OPTIONS.map((item) => {
              const active = certifications.includes(item);
              return (
                <button
                  key={item}
                  type="button"
                  onClick={() => toggle(certifications, setCertifications, item)}
                  className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-[11px] font-medium transition-all border ${
                    active ? "bg-cherry/[0.07] border-cherry/20 text-cherry" : "bg-white border-card-border/50 text-muted hover:border-card-border"
                  }`}
                >
                  <BadgeCheck className="h-3 w-3" />
                  {item}
                </button>
              );
            })}
          </div>
        </div>

        {error && (
          <div className="rounded-[10px] bg-red-50 border border-red-200 p-3">
            <p className="text-red-600 text-[13px] font-medium">{error}</p>
          </div>
        )}

        <button type="submit" disabled={isPending} className="btn-primary touch-target w-full">
          {isPending ? "Creating..." : <><Sparkles className="h-4 w-4" /> Create Sommelier Profile</>}
        </button>
      </form>
    </div>
  );
}
