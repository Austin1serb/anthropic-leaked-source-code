"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ChevronLeft, Wine, BadgeCheck, Radio, Users, Star,
  ArrowRight, CheckCircle2, Sparkles, Trophy, TrendingUp, Mic,
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

  // ============ INTRO ============
  if (step === "intro") {
    return (
      <div className="min-h-screen pb-28 safe-top bg-background">
        <div className="container-app pt-4">
          <Link href="/sommeliers" className="inline-flex items-center gap-1 text-[11px] font-semibold text-muted touch-target">
            <ChevronLeft className="h-3.5 w-3.5" /> Back
          </Link>
        </div>

        <div className="container-app pt-4 text-center">
          <Mic className="h-7 w-7 text-cherry/50 mx-auto mb-2" />
          <h1 className="text-[18px] font-bold text-foreground tracking-tight">Become a Sommelier</h1>
          <p className="text-[12px] text-muted mt-1 max-w-[260px] mx-auto">
            Host live blind tasting events and build a community of wine lovers.
          </p>
        </div>

        <div className="container-app mt-5">
          {/* Benefits */}
          <div className="grid grid-cols-2 gap-2 mb-5">
            {BENEFITS.map((b) => (
              <div key={b.title} className="wine-card p-3">
                <b.icon className="h-4 w-4 text-cherry/40 mb-1.5" />
                <h3 className="text-[12px] font-bold text-foreground">{b.title}</h3>
                <p className="text-[10px] text-muted mt-0.5 leading-relaxed">{b.desc}</p>
              </div>
            ))}
          </div>

          {/* How it works */}
          <h2 className="label mb-2">How It Works</h2>
          <div className="wine-card divide-y divide-card-border/40 mb-5">
            {[
              ["1", "Create Profile", "Add name, bio, expertise"],
              ["2", "Set Up Tasting", "Choose wines, prepare hints"],
              ["3", "Go Live", "Host while viewers guess in real time"],
            ].map(([num, title, desc]) => (
              <div key={num} className="flex items-center gap-3 px-3.5 py-2.5">
                <div className={`h-6 w-6 rounded-lg flex items-center justify-center text-[11px] font-bold ${num === "1" ? "bg-cherry text-white" : "widget-wine text-cherry"}`}>
                  {num}
                </div>
                <div>
                  <p className="text-[12px] font-bold text-foreground">{title}</p>
                  <p className="text-[10px] text-muted">{desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Testimonial */}
          <div className="wine-card p-3.5 mb-5 text-center" style={{ background: "var(--widget-wine)" }}>
            <div className="flex items-center justify-center gap-0.5 mb-1">
              {[1,2,3,4,5].map((s) => <Star key={s} className="h-3 w-3 text-amber-500 fill-amber-500" />)}
            </div>
            <p className="text-[11px] italic text-foreground leading-relaxed">
              &ldquo;The live guessing makes it way more engaging than any tasting I&apos;ve done.&rdquo;
            </p>
            <p className="text-[10px] font-semibold text-muted mt-1">— Community Sommelier</p>
          </div>

          <button onClick={() => setStep("form")} className="btn-primary w-full py-3 text-[14px]">
            Get Started <ArrowRight className="h-4 w-4" />
          </button>
          <p className="text-center text-[10px] text-muted mt-2">Free to join — no commitments</p>
        </div>
      </div>
    );
  }

  // ============ FORM ============
  return (
    <div className="min-h-screen pb-28 safe-top bg-background">
      <div className="container-app pt-4">
        <button onClick={() => setStep("intro")} className="inline-flex items-center gap-1 text-[11px] font-semibold text-muted touch-target mb-4">
          <ChevronLeft className="h-3.5 w-3.5" /> Back
        </button>

        <div className="flex items-center gap-2.5 mb-4">
          <div className="h-9 w-9 rounded-xl bg-cherry flex items-center justify-center">
            <Wine className="h-4 w-4 text-white" />
          </div>
          <div>
            <h1 className="text-[16px] font-bold text-foreground tracking-tight">Your Profile</h1>
            <p className="text-[11px] text-muted">How viewers will see you</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <p className="label mb-1.5">Display Name *</p>
            <input type="text" value={displayName} onChange={(e) => setDisplayName(e.target.value)}
              placeholder="How you'll appear to viewers" className="input-field w-full text-[14px]" />
          </div>
          <div>
            <p className="label mb-1.5">Bio</p>
            <textarea value={bio} onChange={(e) => setBio(e.target.value)}
              placeholder="Your wine journey, favourite regions..." rows={2} className="input-field w-full resize-none text-[14px]" />
          </div>
          <div>
            <p className="label mb-1.5">Expertise</p>
            <div className="flex flex-wrap gap-1.5">
              {EXPERTISE_OPTIONS.map((item) => (
                <button key={item} type="button" onClick={() => toggle(expertise, setExpertise, item)}
                  className={`chip text-[11px] py-1.5 px-2.5 ${expertise.includes(item) ? "chip-active" : ""}`}>
                  {expertise.includes(item) && <CheckCircle2 className="h-2.5 w-2.5" />}{item}
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="label mb-1.5">Certifications <span className="font-normal text-muted">(optional)</span></p>
            <div className="flex flex-wrap gap-1.5">
              {CERT_OPTIONS.map((item) => (
                <button key={item} type="button" onClick={() => toggle(certifications, setCertifications, item)}
                  className={`chip text-[11px] py-1.5 px-2.5 ${certifications.includes(item) ? "chip-active" : ""}`}>
                  <BadgeCheck className="h-2.5 w-2.5" />{item}
                </button>
              ))}
            </div>
          </div>

          {error && <div className="wine-card p-2.5 bg-red-50"><p className="text-red-600 text-[12px] font-medium">{error}</p></div>}

          <button type="submit" disabled={isPending} className="btn-primary w-full py-3 text-[14px]">
            {isPending ? "Creating..." : <><Sparkles className="h-3.5 w-3.5" /> Create Sommelier Profile</>}
          </button>
        </form>
      </div>
    </div>
  );
}
