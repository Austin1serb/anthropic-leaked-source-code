"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ChevronLeft, Wine, BadgeCheck, Radio, Users, Star,
  ArrowRight, CheckCircle2, Sparkles, Trophy,
  TrendingUp, Mic,
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
  { icon: Radio, title: "Go Live Anytime", desc: "Host blind tasting sessions with real-time audience interaction" },
  { icon: Users, title: "Build Your Audience", desc: "Grow a following of wine enthusiasts who love your style" },
  { icon: Trophy, title: "Gamified Engagement", desc: "Viewers compete with hints, scores, and leaderboards" },
  { icon: TrendingUp, title: "Track Your Impact", desc: "See your stats grow — events hosted, viewers, and ratings" },
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

  function toggleExpertise(item: string) {
    setExpertise((prev) => prev.includes(item) ? prev.filter((e) => e !== item) : [...prev, item]);
  }

  function toggleCert(item: string) {
    setCertifications((prev) => prev.includes(item) ? prev.filter((c) => c !== item) : [...prev, item]);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!displayName.trim()) { setError("Display name is required"); return; }
    setError("");

    startTransition(async () => {
      try {
        await createSommelierProfile({
          displayName: displayName.trim(),
          bio: bio.trim() || undefined,
          expertise,
          certifications,
        });
        router.push("/sommeliers");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to create profile");
      }
    });
  }

  // ============ INTRO / LANDING ============
  if (step === "intro") {
    return (
      <div className="min-h-screen pb-28 safe-top bg-background">
        {/* Back button */}
        <div className="container-app pt-6">
          <Link href="/sommeliers" className="inline-flex items-center gap-1 text-[12px] font-semibold text-muted touch-target">
            <ChevronLeft className="h-4 w-4" /> Back
          </Link>
        </div>

        {/* Hero */}
        <div className="relative overflow-hidden">
          <div className="absolute inset-0 pointer-events-none bg-hero-gradient" />
          <div className="container-app pt-6 pb-8 relative text-center">
            <div className="h-20 w-20 rounded-3xl widget-wine flex items-center justify-center mx-auto mb-5 animate-fade-in-up float-action">
              <Mic className="h-9 w-9 text-cherry/60" />
            </div>
            <h1 className="heading-xl text-foreground mb-3 animate-fade-in-up">
              Become a Sommelier
            </h1>
            <p className="text-[15px] leading-relaxed text-muted max-w-[300px] mx-auto animate-fade-in-up">
              Host live blind tasting events, share your knowledge, and build a community of wine lovers.
            </p>
          </div>
        </div>

        {/* Benefits Grid */}
        <div className="container-app">
          <div className="grid grid-cols-2 gap-3 mb-8">
            {BENEFITS.map((b, i) => (
              <div
                key={b.title}
                className="wine-card p-4 animate-fade-in-up"
                style={{ animationDelay: `${i * 80}ms` }}
              >
                <div className="h-10 w-10 rounded-xl widget-wine flex items-center justify-center mb-3">
                  <b.icon className="h-5 w-5 text-cherry/50" />
                </div>
                <h3 className="text-[13px] font-bold text-foreground mb-1">{b.title}</h3>
                <p className="text-[11px] leading-relaxed text-muted">{b.desc}</p>
              </div>
            ))}
          </div>

          {/* How It Works */}
          <div className="mb-8">
            <h2 className="label mb-4">How It Works</h2>
            <div className="space-y-3">
              {STEPS.map((s, i) => (
                <div
                  key={s.num}
                  className="wine-card flex items-start gap-4 p-4 animate-fade-in-up"
                  style={{ animationDelay: `${(i + 4) * 80}ms` }}
                >
                  <div
                    className={`h-9 w-9 rounded-xl flex items-center justify-center text-[14px] font-bold flex-shrink-0 ${
                      i === 0 ? "bg-cherry text-white float-action" : "widget-wine text-cherry"
                    }`}
                  >
                    {s.num}
                  </div>
                  <div>
                    <h3 className="text-[14px] font-bold text-foreground">{s.title}</h3>
                    <p className="text-[12px] text-muted mt-0.5">{s.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Social Proof */}
          <div className="wine-card p-5 mb-8 text-center" style={{ background: "var(--widget-wine)" }}>
            <div className="flex items-center justify-center gap-1 mb-2">
              {[1,2,3,4,5].map((s) => (
                <Star key={s} className="h-4 w-4 text-amber-500 fill-amber-500" />
              ))}
            </div>
            <p className="text-[13px] italic leading-relaxed text-foreground">
              &ldquo;Hosting on Winebob is amazing — the live guessing makes it way more
              engaging than any tasting I&apos;ve ever done.&rdquo;
            </p>
            <p className="text-[11px] font-semibold text-muted mt-2">— Community Sommelier</p>
          </div>

          {/* CTA */}
          <button
            onClick={() => setStep("form")}
            className="btn-primary touch-target w-full"
          >
            Get Started <ArrowRight className="h-5 w-5" />
          </button>
          <p className="text-center caption mt-3">Free to join — no commitments required</p>
        </div>
      </div>
    );
  }

  // ============ PROFILE FORM ============
  return (
    <div className="min-h-screen pb-28 safe-top bg-background">
      <div className="container-app pt-6">
        <button onClick={() => setStep("intro")} className="inline-flex items-center gap-1 text-[12px] font-semibold text-muted touch-target mb-6">
          <ChevronLeft className="h-4 w-4" /> Back
        </button>

        {/* Progress indicator */}
        <div className="flex items-center gap-3 mb-6">
          <div className="flex-1 h-1 rounded-full progress-track">
            <div className="progress-fill" style={{ width: "33%" }} />
          </div>
          <span className="caption">Step 1 of 1</span>
        </div>

        <div className="flex items-center gap-3 mb-2">
          <div className="h-12 w-12 rounded-2xl bg-cherry flex items-center justify-center float-action">
            <Wine className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="heading-lg text-foreground">Your Profile</h1>
            <p className="body-sm">This is how viewers will see you</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 space-y-5">
          {/* Display Name */}
          <div>
            <p className="label mb-2">Display Name *</p>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="How you'll appear to viewers"
              className="input-field w-full touch-target"
            />
          </div>

          {/* Bio */}
          <div>
            <p className="label mb-2">Bio</p>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Tell viewers about your wine journey, what regions excite you, how long you've been in the industry..."
              rows={3}
              className="input-field w-full resize-none"
            />
            <p className="caption mt-1.5">A good bio helps viewers know what to expect from your tastings</p>
          </div>

          {/* Expertise */}
          <div>
            <p className="label mb-2">Expertise Areas</p>
            <p className="caption mb-3">Select the regions and styles you know best</p>
            <div className="flex flex-wrap gap-2">
              {EXPERTISE_OPTIONS.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => toggleExpertise(item)}
                  className={`chip text-[12px] ${expertise.includes(item) ? "chip-active" : ""}`}
                >
                  {expertise.includes(item) && <CheckCircle2 className="h-3 w-3" />}
                  {item}
                </button>
              ))}
            </div>
          </div>

          {/* Certifications */}
          <div>
            <p className="label mb-2">Certifications</p>
            <p className="caption mb-3">Optional — verified certifications build trust with viewers</p>
            <div className="flex flex-wrap gap-2">
              {CERT_OPTIONS.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => toggleCert(item)}
                  className={`chip text-[12px] ${certifications.includes(item) ? "chip-active" : ""}`}
                >
                  <BadgeCheck className="h-3 w-3" />
                  {item}
                </button>
              ))}
            </div>
          </div>

          {error && (
            <div className="wine-card p-3 bg-red-50">
              <p className="text-red-600 text-[13px] font-medium">{error}</p>
            </div>
          )}

          <button type="submit" disabled={isPending} className="btn-primary touch-target w-full">
            {isPending ? "Creating your profile..." : (
              <>Create Sommelier Profile <Sparkles className="h-4 w-4" /></>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
