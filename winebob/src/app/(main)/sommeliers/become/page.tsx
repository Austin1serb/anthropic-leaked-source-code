"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, Wine, Plus, X, BadgeCheck } from "lucide-react";
import { createSommelierProfile } from "@/lib/liveActions";

const EXPERTISE_OPTIONS = [
  "French", "Italian", "Spanish", "Portuguese", "German", "Austrian",
  "New World", "Natural", "Biodynamic", "Sparkling", "Champagne",
  "Burgundy", "Bordeaux", "Rhône", "Piedmont", "Tuscany", "Rioja",
];

const CERT_OPTIONS = [
  "WSET Level 1", "WSET Level 2", "WSET Level 3", "WSET Diploma",
  "Court of Master Sommeliers - Intro", "Court of Master Sommeliers - Certified",
  "Court of Master Sommeliers - Advanced", "Master Sommelier",
  "Wine & Spirit Education Trust", "Certified Wine Educator",
];

export default function BecomeSommelierPage() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");

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

  return (
    <div className="min-h-screen pb-28 safe-top bg-background">
      <div className="container-app pt-6">
        <Link href="/sommeliers" className="inline-flex items-center gap-1 text-[12px] font-semibold text-stone touch-target mb-4">
          <ChevronLeft className="h-4 w-4" /> Back
        </Link>

        <div className="flex items-center gap-3 mb-2">
          <div className="h-12 w-12 rounded-2xl bg-cherry flex items-center justify-center float-action">
            <Wine className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="heading-lg text-foreground">Become a Sommelier</h1>
            <p className="body-sm">Host live tastings for the community</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 space-y-5">
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

          <div>
            <p className="label mb-2">Bio</p>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Tell us about your wine journey..."
              rows={3}
              className="input-field w-full resize-none"
            />
          </div>

          <div>
            <p className="label mb-2">Expertise</p>
            <p className="caption mb-3">Select your areas of knowledge</p>
            <div className="flex flex-wrap gap-2">
              {EXPERTISE_OPTIONS.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => toggleExpertise(item)}
                  className={`chip text-[12px] ${expertise.includes(item) ? "chip-active" : ""}`}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="label mb-2">Certifications</p>
            <p className="caption mb-3">Optional — add any wine certifications</p>
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
            {isPending ? "Creating profile..." : "Create Sommelier Profile"}
          </button>
        </form>
      </div>
    </div>
  );
}
