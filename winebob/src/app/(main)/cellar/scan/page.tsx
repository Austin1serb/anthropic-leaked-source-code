"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Camera,
  Loader2,
  Wine,
  ArrowLeft,
  RotateCcw,
  Check,
} from "lucide-react";
import { findOrCreateWineFromScan } from "@/lib/actions";

type ScanResult = {
  name: string;
  producer: string;
  vintage: number | null;
  grapes: string[];
  region: string;
  country: string;
  appellation: string | null;
  type: string;
};

type ScanState =
  | { step: "capture" }
  | { step: "analyzing"; previewUrl: string }
  | { step: "result"; previewUrl: string; wine: ScanResult }
  | { step: "saving" }
  | { step: "error"; message: string };

export default function ScanPage() {
  const [state, setState] = useState<ScanState>({ step: "capture" });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  function reset() {
    setState({ step: "capture" });
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  async function handleFileSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const previewUrl = URL.createObjectURL(file);
    setState({ step: "analyzing", previewUrl });

    try {
      // Upload the image
      const uploadForm = new FormData();
      uploadForm.append("file", file);

      const uploadRes = await fetch("/api/upload?folder=labels", {
        method: "POST",
        body: uploadForm,
      });

      if (!uploadRes.ok) {
        const err = await uploadRes.json();
        throw new Error(err.error ?? "Upload failed");
      }

      // Scan the label
      const scanForm = new FormData();
      scanForm.append("image", file);

      const scanRes = await fetch("/api/scan", {
        method: "POST",
        body: scanForm,
      });

      if (!scanRes.ok) {
        const err = await scanRes.json();
        throw new Error(err.error ?? "Failed to scan label");
      }

      const wine: ScanResult = await scanRes.json();
      setState({ step: "result", previewUrl, wine });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Something went wrong";
      setState({ step: "error", message });
    }
  }

  async function handleCheckIn(wine: ScanResult) {
    setState({ step: "saving" });
    try {
      const saved = await findOrCreateWineFromScan(wine);
      router.push(`/cellar/checkin?wineId=${saved.id}`);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to save wine";
      setState({ step: "error", message });
    }
  }

  return (
    <div className="min-h-screen bg-wine-burgundy-dark flex flex-col">
      {/* Top bar */}
      <header className="flex items-center gap-3 px-4 pt-4 pb-3 safe-top">
        <Link
          href="/cellar"
          className="touch-target flex items-center justify-center w-10 h-10 rounded-full bg-white/10 text-white"
        >
          <ArrowLeft size={20} />
        </Link>
        <h1 className="text-lg font-serif font-semibold text-white">
          Scan Label
        </h1>
      </header>

      {/* Main content */}
      <div className="flex-1 flex flex-col px-4 pb-8">
        {/* Capture state */}
        {state.step === "capture" && (
          <div className="flex-1 flex flex-col items-center justify-center">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-full max-w-sm aspect-[3/4] rounded-3xl border-2 border-dashed border-white/30 bg-white/5 flex flex-col items-center justify-center gap-4 active:bg-white/10 transition-colors cursor-pointer"
            >
              <div className="w-20 h-20 rounded-full bg-white/10 flex items-center justify-center">
                <Camera size={36} className="text-white" />
              </div>
              <div className="text-center">
                <p className="text-white font-serif text-lg font-semibold">
                  Tap to scan a wine label
                </p>
                <p className="text-white/60 text-sm mt-1">
                  Take a photo or choose from your library
                </p>
              </div>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleFileSelected}
              className="hidden"
            />
          </div>
        )}

        {/* Analyzing state */}
        {state.step === "analyzing" && (
          <div className="flex-1 flex flex-col items-center justify-center">
            <div className="relative w-full max-w-sm aspect-[3/4] rounded-3xl overflow-hidden">
              <img
                src={state.previewUrl}
                alt="Wine label"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-wine-burgundy-dark/70 flex flex-col items-center justify-center gap-4">
                <Loader2
                  size={48}
                  className="text-white animate-spin"
                />
                <p className="text-white font-serif text-lg font-semibold">
                  Analyzing label...
                </p>
                <p className="text-white/60 text-sm">
                  Identifying wine details
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Result state */}
        {state.step === "result" && (
          <div className="flex-1 flex flex-col animate-fade-in-up">
            {/* Small preview */}
            <div className="flex justify-center mb-4">
              <div className="w-24 h-32 rounded-xl overflow-hidden border-2 border-white/20">
                <img
                  src={state.previewUrl}
                  alt="Wine label"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>

            {/* Wine details card */}
            <div className="wine-card p-5 mb-6">
              <div className="flex items-start gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-wine-burgundy/10 flex items-center justify-center flex-shrink-0">
                  <Wine size={20} className="text-wine-burgundy" />
                </div>
                <div className="min-w-0">
                  <h2 className="font-serif text-xl font-bold leading-tight">
                    {state.wine.name}
                  </h2>
                  <p className="text-muted text-sm">{state.wine.producer}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm">
                {state.wine.vintage && (
                  <div>
                    <p className="text-muted text-xs uppercase tracking-wide">
                      Vintage
                    </p>
                    <p className="font-medium">{state.wine.vintage}</p>
                  </div>
                )}
                <div>
                  <p className="text-muted text-xs uppercase tracking-wide">
                    Type
                  </p>
                  <p className="font-medium capitalize">{state.wine.type}</p>
                </div>
                <div>
                  <p className="text-muted text-xs uppercase tracking-wide">
                    Region
                  </p>
                  <p className="font-medium">{state.wine.region}</p>
                </div>
                <div>
                  <p className="text-muted text-xs uppercase tracking-wide">
                    Country
                  </p>
                  <p className="font-medium">{state.wine.country}</p>
                </div>
                {state.wine.appellation && (
                  <div className="col-span-2">
                    <p className="text-muted text-xs uppercase tracking-wide">
                      Appellation
                    </p>
                    <p className="font-medium">{state.wine.appellation}</p>
                  </div>
                )}
                {state.wine.grapes.length > 0 && (
                  <div className="col-span-2">
                    <p className="text-muted text-xs uppercase tracking-wide">
                      Grapes
                    </p>
                    <p className="font-medium">
                      {state.wine.grapes.join(", ")}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex flex-col gap-3 mt-auto">
              <button
                type="button"
                onClick={() => handleCheckIn(state.wine)}
                className="touch-target w-full h-14 rounded-2xl bg-wine-burgundy text-white font-semibold text-base flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
              >
                <Check size={20} />
                Check In This Wine
              </button>
              <button
                type="button"
                onClick={reset}
                className="touch-target w-full h-14 rounded-2xl bg-white/10 text-white font-medium text-base flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
              >
                <RotateCcw size={18} />
                Try Again
              </button>
            </div>
          </div>
        )}

        {/* Saving state */}
        {state.step === "saving" && (
          <div className="flex-1 flex flex-col items-center justify-center gap-4">
            <Loader2 size={48} className="text-white animate-spin" />
            <p className="text-white font-serif text-lg font-semibold">
              Saving wine...
            </p>
          </div>
        )}

        {/* Error state */}
        {state.step === "error" && (
          <div className="flex-1 flex flex-col items-center justify-center gap-6">
            <div className="w-20 h-20 rounded-full bg-red-500/20 flex items-center justify-center">
              <Wine size={36} className="text-red-400" />
            </div>
            <div className="text-center">
              <p className="text-white font-serif text-lg font-semibold mb-2">
                Something went wrong
              </p>
              <p className="text-white/60 text-sm max-w-xs">
                {state.message}
              </p>
            </div>
            <button
              type="button"
              onClick={reset}
              className="touch-target h-14 px-8 rounded-2xl bg-white/10 text-white font-medium text-base flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
            >
              <RotateCcw size={18} />
              Try Again
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
