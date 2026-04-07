"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ChevronLeft, Wine, Plus, Grape, MapPin, Globe,
  Calendar, Tag, DollarSign, Droplets, FileText, Utensils,
} from "lucide-react";
import { addWine } from "@/lib/actions";

const WINE_TYPES = [
  { value: "red", label: "Red", emoji: "🔴" },
  { value: "white", label: "White", emoji: "⚪" },
  { value: "rosé", label: "Rosé", emoji: "🩷" },
  { value: "sparkling", label: "Sparkling", emoji: "✨" },
  { value: "orange", label: "Orange", emoji: "🟠" },
  { value: "dessert", label: "Dessert", emoji: "🍯" },
  { value: "fortified", label: "Fortified", emoji: "🥃" },
];

const PRICE_RANGES = [
  { value: "budget", label: "Budget (under $15)" },
  { value: "mid", label: "Mid-range ($15-40)" },
  { value: "premium", label: "Premium ($40-100)" },
  { value: "luxury", label: "Luxury ($100+)" },
];

export default function AddWinePage() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");

  const [name, setName] = useState("");
  const [producer, setProducer] = useState("");
  const [vintage, setVintage] = useState("");
  const [grapes, setGrapes] = useState("");
  const [region, setRegion] = useState("");
  const [country, setCountry] = useState("");
  const [appellation, setAppellation] = useState("");
  const [type, setType] = useState("");
  const [description, setDescription] = useState("");
  const [priceRange, setPriceRange] = useState("");
  const [abv, setAbv] = useState("");
  const [tastingNotes, setTastingNotes] = useState("");
  const [foodPairing, setFoodPairing] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!name.trim() || !producer.trim() || !region.trim() || !country.trim() || !type) {
      setError("Name, producer, region, country and type are required.");
      return;
    }

    startTransition(async () => {
      try {
        const wine = await addWine({
          name: name.trim(),
          producer: producer.trim(),
          vintage: vintage ? parseInt(vintage, 10) : undefined,
          grapes: grapes.split(",").map((g) => g.trim()).filter(Boolean),
          region: region.trim(),
          country: country.trim(),
          appellation: appellation.trim() || undefined,
          type,
          description: description.trim() || undefined,
          priceRange: priceRange || undefined,
          abv: abv ? parseFloat(abv) : undefined,
          tastingNotes: tastingNotes.trim() || undefined,
          foodPairing: foodPairing.trim() || undefined,
        });
        router.push(`/wines/${wine.id}`);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to add wine");
      }
    });
  }

  return (
    <div className="min-h-screen pb-28 safe-top bg-background">
      <div className="max-w-lg mx-auto px-5 pt-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <Link
            href="/wines"
            className="inline-flex items-center gap-1 text-[13px] font-semibold text-muted active:text-foreground transition-colors touch-target"
          >
            <ChevronLeft className="h-4 w-4" />
            Cancel
          </Link>
          <span className="text-[13px] font-semibold text-muted">Add Wine</span>
        </div>

        <h1 className="text-[28px] font-bold text-foreground tracking-tight mb-1">
          Add a Wine
        </h1>
        <p className="text-muted text-[15px] mb-7">
          Contribute to the public wine library.
        </p>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Name */}
          <Field label="Wine Name" required icon={<Wine className="h-4 w-4" />}>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Barolo Riserva"
              className="input-field w-full touch-target"
            />
          </Field>

          {/* Producer */}
          <Field label="Producer" required icon={<Tag className="h-4 w-4" />}>
            <input
              type="text"
              value={producer}
              onChange={(e) => setProducer(e.target.value)}
              placeholder="e.g. Prunotto"
              className="input-field w-full touch-target"
            />
          </Field>

          {/* Type — grid selector */}
          <div>
            <span className="text-[13px] font-bold text-foreground uppercase tracking-wide block mb-3">
              Type <span className="text-cherry">*</span>
            </span>
            <div className="grid grid-cols-3 gap-2">
              {WINE_TYPES.map((t) => (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => setType(t.value)}
                  className={`touch-target rounded-2xl p-3 text-center transition-all ${
                    type === t.value
                      ? "bg-cherry text-white shadow-sm ring-2 ring-cherry/30"
                      : "bg-card-bg border border-card-border text-foreground"
                  }`}
                >
                  <span className="text-lg block">{t.emoji}</span>
                  <span className="text-[12px] font-semibold mt-1 block">{t.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Region + Country */}
          <div className="grid grid-cols-2 gap-3">
            <Field label="Region" required icon={<MapPin className="h-4 w-4" />}>
              <input
                type="text"
                value={region}
                onChange={(e) => setRegion(e.target.value)}
                placeholder="e.g. Barolo"
                className="input-field w-full touch-target"
              />
            </Field>
            <Field label="Country" required icon={<Globe className="h-4 w-4" />}>
              <input
                type="text"
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                placeholder="e.g. Italy"
                className="input-field w-full touch-target"
              />
            </Field>
          </div>

          {/* Vintage + ABV */}
          <div className="grid grid-cols-2 gap-3">
            <Field label="Vintage" icon={<Calendar className="h-4 w-4" />}>
              <input
                type="number"
                inputMode="numeric"
                value={vintage}
                onChange={(e) => setVintage(e.target.value)}
                placeholder="e.g. 2019"
                className="input-field w-full touch-target"
              />
            </Field>
            <Field label="ABV %" icon={<Droplets className="h-4 w-4" />}>
              <input
                type="number"
                inputMode="decimal"
                step="0.1"
                value={abv}
                onChange={(e) => setAbv(e.target.value)}
                placeholder="e.g. 14.5"
                className="input-field w-full touch-target"
              />
            </Field>
          </div>

          {/* Grapes */}
          <Field label="Grapes" icon={<Grape className="h-4 w-4" />}>
            <input
              type="text"
              value={grapes}
              onChange={(e) => setGrapes(e.target.value)}
              placeholder="e.g. Nebbiolo, Barbera (comma-separated)"
              className="input-field w-full touch-target"
            />
          </Field>

          {/* Price Range */}
          <Field label="Price Range" icon={<DollarSign className="h-4 w-4" />}>
            <div className="grid grid-cols-2 gap-2">
              {PRICE_RANGES.map((p) => (
                <button
                  key={p.value}
                  type="button"
                  onClick={() => setPriceRange(priceRange === p.value ? "" : p.value)}
                  className={`touch-target rounded-xl p-2.5 text-[12px] font-medium text-left transition-all ${
                    priceRange === p.value
                      ? "bg-cherry text-white"
                      : "bg-card-bg border border-card-border text-foreground"
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </Field>

          {/* Description */}
          <Field label="Description" icon={<FileText className="h-4 w-4" />}>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of the wine..."
              rows={2}
              className="input-field w-full resize-none"
            />
          </Field>

          {/* Tasting Notes */}
          <Field label="Tasting Notes" icon={<Wine className="h-4 w-4" />}>
            <textarea
              value={tastingNotes}
              onChange={(e) => setTastingNotes(e.target.value)}
              placeholder="Aromas, flavors, texture..."
              rows={2}
              className="input-field w-full resize-none"
            />
          </Field>

          {/* Food Pairing */}
          <Field label="Food Pairing" icon={<Utensils className="h-4 w-4" />}>
            <input
              type="text"
              value={foodPairing}
              onChange={(e) => setFoodPairing(e.target.value)}
              placeholder="e.g. Truffle risotto, grilled lamb"
              className="input-field w-full touch-target"
            />
          </Field>

          {error && (
            <div className="wine-card p-3 bg-red-50">
              <p className="text-red-600 text-[13px] font-medium">{error}</p>
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={isPending}
            className="btn-primary touch-target w-full"
          >
            {isPending ? (
              <>
                <div className="h-5 w-5 rounded-full border-2 border-white border-t-transparent animate-spin" />
                Adding...
              </>
            ) : (
              <>
                <Plus className="h-5 w-5" />
                Add to Library
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

function Field({
  label,
  required,
  icon,
  children,
}: {
  label: string;
  required?: boolean;
  icon?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div>
      <span className="text-[13px] font-bold text-foreground uppercase tracking-wide flex items-center gap-1.5 mb-2">
        {icon && <span className="text-muted">{icon}</span>}
        {label}
        {required && <span className="text-cherry">*</span>}
      </span>
      {children}
    </div>
  );
}
