"use client";

import { useState } from "react";
import Link from "next/link";
import { Wine, ArrowLeft, CheckCircle, Send } from "lucide-react";
import { submitApplication } from "@/lib/wineryActions";

export default function ApplyPage() {
  const [type, setType] = useState<"claim" | "create">("claim");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const fd = new FormData(e.currentTarget);
    try {
      await submitApplication({
        type,
        applicantName: fd.get("name") as string,
        applicantEmail: fd.get("email") as string,
        applicantRole: fd.get("role") as string || undefined,
        applicantPhone: fd.get("phone") as string || undefined,
        message: fd.get("message") as string || undefined,
        wineryName: type === "create" ? fd.get("wineryName") as string : undefined,
        wineryRegion: type === "create" ? fd.get("wineryRegion") as string : undefined,
        wineryCountry: type === "create" ? fd.get("wineryCountry") as string : undefined,
        wineryWebsite: fd.get("wineryWebsite") as string || undefined,
      });
      setSubmitted(true);
    } catch {
      alert("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-butter flex items-center justify-center px-5">
        <div className="max-w-md text-center">
          <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
          <h1 className="text-[22px] font-bold text-foreground mb-2" style={{ fontFamily: "Georgia, serif" }}>Application received</h1>
          <p className="text-[14px] text-muted leading-relaxed">
            Thank you for your interest in joining Winebob. We will review your application and get back to you within a few business days.
          </p>
          <Link href="/explore" className="inline-block mt-6 text-[13px] font-semibold text-cherry hover:underline">
            ← Back to the map
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-butter">
      <div className="max-w-lg mx-auto px-5 py-12">
        <Link href="/" className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-muted mb-6 hover:text-foreground transition-colors">
          <ArrowLeft className="h-3.5 w-3.5" /> Back
        </Link>

        <div className="flex items-center gap-3 mb-2">
          <Wine className="h-6 w-6 text-cherry" />
          <h1 className="text-[24px] font-bold text-foreground" style={{ fontFamily: "Georgia, serif" }}>
            Become a Winebob Partner
          </h1>
        </div>
        <p className="text-[14px] text-muted mb-8 leading-relaxed">
          Claim your producer profile or add your winery to the Winebob map. Manage your wines, connect with wine lovers, and showcase your story.
        </p>

        {/* Type toggle */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setType("claim")}
            className={`flex-1 py-2.5 rounded-[8px] text-[13px] font-semibold transition-colors ${
              type === "claim" ? "bg-cherry text-white" : "bg-white border border-card-border/40 text-muted"
            }`}
          >
            Claim existing profile
          </button>
          <button
            onClick={() => setType("create")}
            className={`flex-1 py-2.5 rounded-[8px] text-[13px] font-semibold transition-colors ${
              type === "create" ? "bg-cherry text-white" : "bg-white border border-card-border/40 text-muted"
            }`}
          >
            Add new winery
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Applicant info */}
          <div className="bg-white rounded-[10px] border border-card-border/30 p-4 space-y-3">
            <p className="text-[11px] font-bold text-muted uppercase tracking-wider">Your Details</p>
            <input name="name" required placeholder="Full name" className="input-field w-full" />
            <input name="email" type="email" required placeholder="Email address" className="input-field w-full" />
            <div className="grid grid-cols-2 gap-3">
              <input name="role" placeholder="Your role (e.g. Owner)" className="input-field w-full" />
              <input name="phone" placeholder="Phone (optional)" className="input-field w-full" />
            </div>
          </div>

          {/* Winery info (for "create" type) */}
          {type === "create" && (
            <div className="bg-white rounded-[10px] border border-card-border/30 p-4 space-y-3">
              <p className="text-[11px] font-bold text-muted uppercase tracking-wider">Winery Details</p>
              <input name="wineryName" required placeholder="Winery name" className="input-field w-full" />
              <div className="grid grid-cols-2 gap-3">
                <input name="wineryRegion" required placeholder="Region (e.g. Burgundy)" className="input-field w-full" />
                <input name="wineryCountry" required placeholder="Country" className="input-field w-full" />
              </div>
              <input name="wineryWebsite" placeholder="Website URL (optional)" className="input-field w-full" />
            </div>
          )}

          {/* Message */}
          <div className="bg-white rounded-[10px] border border-card-border/30 p-4 space-y-3">
            <p className="text-[11px] font-bold text-muted uppercase tracking-wider">Message</p>
            <textarea
              name="message"
              rows={3}
              placeholder={type === "claim" ? "Tell us which winery you'd like to claim and your connection to it..." : "Tell us about your winery..."}
              className="input-field w-full resize-none"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 h-12 rounded-[10px] bg-cherry text-white text-[14px] font-bold hover:bg-cherry/90 transition-colors disabled:opacity-50"
          >
            <Send className="h-4 w-4" />
            {loading ? "Submitting..." : "Submit Application"}
          </button>
        </form>
      </div>
    </div>
  );
}
