"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createExperience, updateExperience } from "@/lib/experienceActions";
import { Save, Trash2 } from "lucide-react";

const EXPERIENCE_TYPES = [
  { value: "tasting", label: "Wine Tasting" },
  { value: "tour", label: "Vineyard Tour" },
  { value: "harvest", label: "Harvest Experience" },
  { value: "dinner", label: "Wine Dinner" },
  { value: "workshop", label: "Workshop" },
  { value: "stay", label: "Winery Stay" },
];

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

type Winery = { id: string; name: string; slug: string; region: string; country: string };

type ExperienceData = {
  id?: string;
  wineryId: string;
  title: string;
  slug: string;
  description: string;
  type: string;
  duration: number;
  maxGuests: number;
  pricePerPerson: number;
  currency: string;
  recurring: boolean;
  daysOfWeek: number[];
  startTime: string;
  seasonStart: number | null;
  seasonEnd: number | null;
  includes: string[];
  languages: string[];
  highlights: string;
  meetingPoint: string;
  featured: boolean;
  active?: boolean;
};

type Props = {
  wineries: Winery[];
  initial?: ExperienceData;
};

function slugify(str: string) {
  return str.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60);
}

export function ExperienceForm({ wineries, initial }: Props) {
  const router = useRouter();
  const isEditing = !!initial?.id;

  const [form, setForm] = useState<ExperienceData>({
    wineryId: initial?.wineryId ?? "",
    title: initial?.title ?? "",
    slug: initial?.slug ?? "",
    description: initial?.description ?? "",
    type: initial?.type ?? "tasting",
    duration: initial?.duration ?? 90,
    maxGuests: initial?.maxGuests ?? 10,
    pricePerPerson: initial?.pricePerPerson ?? 5000,
    currency: initial?.currency ?? "EUR",
    recurring: initial?.recurring ?? false,
    daysOfWeek: initial?.daysOfWeek ?? [],
    startTime: initial?.startTime ?? "14:00",
    seasonStart: initial?.seasonStart ?? null,
    seasonEnd: initial?.seasonEnd ?? null,
    includes: initial?.includes ?? [],
    languages: initial?.languages ?? ["English"],
    highlights: initial?.highlights ?? "",
    meetingPoint: initial?.meetingPoint ?? "",
    featured: initial?.featured ?? false,
    active: initial?.active ?? true,
  });

  const [includeInput, setIncludeInput] = useState("");
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  function update<K extends keyof ExperienceData>(key: K, value: ExperienceData[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function handleTitleChange(title: string) {
    update("title", title);
    if (!isEditing) update("slug", slugify(title));
  }

  function toggleDay(day: number) {
    const current = form.daysOfWeek;
    update("daysOfWeek", current.includes(day) ? current.filter((d) => d !== day) : [...current, day].sort());
  }

  function addInclude() {
    const trimmed = includeInput.trim();
    if (trimmed && !form.includes.includes(trimmed)) {
      update("includes", [...form.includes, trimmed]);
      setIncludeInput("");
    }
  }

  function removeInclude(item: string) {
    update("includes", form.includes.filter((i) => i !== item));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!form.wineryId || !form.title || !form.description || !form.slug) {
      setError("Please fill in all required fields.");
      return;
    }

    startTransition(async () => {
      try {
        if (isEditing && initial?.id) {
          await updateExperience(initial.id, {
            title: form.title,
            description: form.description,
            type: form.type,
            duration: form.duration,
            maxGuests: form.maxGuests,
            pricePerPerson: form.pricePerPerson,
            currency: form.currency,
            recurring: form.recurring,
            daysOfWeek: form.daysOfWeek,
            startTime: form.startTime || null,
            seasonStart: form.seasonStart,
            seasonEnd: form.seasonEnd,
            includes: form.includes,
            languages: form.languages,
            highlights: form.highlights || null,
            meetingPoint: form.meetingPoint || null,
            featured: form.featured,
            active: form.active,
          });
        } else {
          await createExperience({
            wineryId: form.wineryId,
            title: form.title,
            slug: form.slug,
            description: form.description,
            type: form.type,
            duration: form.duration,
            maxGuests: form.maxGuests,
            pricePerPerson: form.pricePerPerson,
            currency: form.currency,
            recurring: form.recurring,
            daysOfWeek: form.daysOfWeek,
            startTime: form.startTime || undefined,
            seasonStart: form.seasonStart ?? undefined,
            seasonEnd: form.seasonEnd ?? undefined,
            includes: form.includes,
            languages: form.languages,
            highlights: form.highlights || undefined,
            meetingPoint: form.meetingPoint || undefined,
            featured: form.featured,
          });
        }
        router.push("/admin/experiences");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to save.");
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
      {/* Winery selector */}
      <Field label="Producer *">
        <select
          value={form.wineryId}
          onChange={(e) => update("wineryId", e.target.value)}
          disabled={isEditing}
          className="input-field"
        >
          <option value="">Select a producer...</option>
          {wineries.map((w) => (
            <option key={w.id} value={w.id}>
              {w.name} — {w.region}, {w.country}
            </option>
          ))}
        </select>
      </Field>

      {/* Title + slug */}
      <div className="grid grid-cols-2 gap-4">
        <Field label="Title *">
          <input
            type="text"
            value={form.title}
            onChange={(e) => handleTitleChange(e.target.value)}
            placeholder="Sunset Tasting & Vineyard Walk"
            className="input-field"
          />
        </Field>
        <Field label="URL slug">
          <input
            type="text"
            value={form.slug}
            onChange={(e) => update("slug", e.target.value)}
            disabled={isEditing}
            className="input-field disabled:opacity-50"
          />
        </Field>
      </div>

      {/* Type + duration + guests */}
      <div className="grid grid-cols-3 gap-4">
        <Field label="Type *">
          <select value={form.type} onChange={(e) => update("type", e.target.value)} className="input-field">
            {EXPERIENCE_TYPES.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
        </Field>
        <Field label="Duration (minutes) *">
          <input
            type="number"
            value={form.duration}
            onChange={(e) => update("duration", parseInt(e.target.value) || 0)}
            min={15}
            className="input-field"
          />
        </Field>
        <Field label="Max guests *">
          <input
            type="number"
            value={form.maxGuests}
            onChange={(e) => update("maxGuests", parseInt(e.target.value) || 1)}
            min={1}
            className="input-field"
          />
        </Field>
      </div>

      {/* Price */}
      <div className="grid grid-cols-2 gap-4">
        <Field label="Price per person (cents) *">
          <input
            type="number"
            value={form.pricePerPerson}
            onChange={(e) => update("pricePerPerson", parseInt(e.target.value) || 0)}
            min={0}
            className="input-field"
          />
          <p className="text-[10px] text-muted mt-1">
            e.g. 5000 = {new Intl.NumberFormat("en-US", { style: "currency", currency: form.currency, minimumFractionDigits: 0 }).format(form.pricePerPerson / 100)}
          </p>
        </Field>
        <Field label="Currency">
          <select value={form.currency} onChange={(e) => update("currency", e.target.value)} className="input-field">
            <option value="EUR">EUR</option>
            <option value="USD">USD</option>
            <option value="GBP">GBP</option>
            <option value="AUD">AUD</option>
            <option value="NZD">NZD</option>
            <option value="ZAR">ZAR</option>
            <option value="CLP">CLP</option>
            <option value="ARS">ARS</option>
          </select>
        </Field>
      </div>

      {/* Description */}
      <Field label="Description *">
        <textarea
          value={form.description}
          onChange={(e) => update("description", e.target.value)}
          rows={5}
          placeholder="Describe the experience — what guests will see, do, taste, and take away..."
          className="input-field resize-none"
        />
      </Field>

      {/* Highlights */}
      <Field label="Highlights (short marketing text)">
        <input
          type="text"
          value={form.highlights}
          onChange={(e) => update("highlights", e.target.value)}
          placeholder="An unforgettable Bordeaux experience..."
          className="input-field"
        />
      </Field>

      {/* What's included */}
      <Field label="What's included">
        <div className="flex gap-2">
          <input
            type="text"
            value={includeInput}
            onChange={(e) => setIncludeInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addInclude())}
            placeholder="e.g. Wine tasting, Cheese pairing..."
            className="input-field flex-1"
          />
          <button
            type="button"
            onClick={addInclude}
            className="px-3 rounded-[8px] bg-cherry/10 text-cherry text-[12px] font-semibold hover:bg-cherry/20 transition-colors"
          >
            Add
          </button>
        </div>
        {form.includes.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-2">
            {form.includes.map((item) => (
              <span
                key={item}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[6px] bg-butter-dark text-[11px] font-medium text-foreground/80"
              >
                {item}
                <button type="button" onClick={() => removeInclude(item)} className="text-muted hover:text-red-500 ml-0.5">×</button>
              </span>
            ))}
          </div>
        )}
      </Field>

      {/* Schedule */}
      <div className="border border-card-border/40 rounded-[10px] p-4">
        <label className="flex items-center gap-2 mb-3">
          <input
            type="checkbox"
            checked={form.recurring}
            onChange={(e) => update("recurring", e.target.checked)}
            className="rounded"
          />
          <span className="text-[13px] font-semibold text-foreground">Recurring schedule</span>
        </label>
        {form.recurring && (
          <div className="space-y-3">
            <div>
              <p className="text-[11px] font-semibold text-muted uppercase tracking-wider mb-2">Days of week</p>
              <div className="flex gap-1.5">
                {DAYS.map((day, i) => (
                  <button
                    key={day}
                    type="button"
                    onClick={() => toggleDay(i)}
                    className={`w-10 h-8 rounded-[6px] text-[11px] font-semibold transition-colors ${
                      form.daysOfWeek.includes(i) ? "bg-cherry text-white" : "bg-card-border/30 text-muted hover:bg-card-border/50"
                    }`}
                  >
                    {day}
                  </button>
                ))}
              </div>
            </div>
            <Field label="Start time">
              <input
                type="time"
                value={form.startTime}
                onChange={(e) => update("startTime", e.target.value)}
                className="input-field w-40"
              />
            </Field>
          </div>
        )}
        <div className="grid grid-cols-2 gap-4 mt-3">
          <Field label="Season start (month, 1-12)">
            <input
              type="number"
              value={form.seasonStart ?? ""}
              onChange={(e) => update("seasonStart", e.target.value ? parseInt(e.target.value) : null)}
              min={1}
              max={12}
              placeholder="Year-round if empty"
              className="input-field"
            />
          </Field>
          <Field label="Season end (month, 1-12)">
            <input
              type="number"
              value={form.seasonEnd ?? ""}
              onChange={(e) => update("seasonEnd", e.target.value ? parseInt(e.target.value) : null)}
              min={1}
              max={12}
              placeholder="Year-round if empty"
              className="input-field"
            />
          </Field>
        </div>
      </div>

      {/* Meeting point + languages */}
      <Field label="Meeting point">
        <input
          type="text"
          value={form.meetingPoint}
          onChange={(e) => update("meetingPoint", e.target.value)}
          placeholder="Main gate, Château Margaux, 33460 Margaux"
          className="input-field"
        />
      </Field>

      {/* Flags */}
      <div className="flex gap-6">
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={form.featured} onChange={(e) => update("featured", e.target.checked)} className="rounded" />
          <span className="text-[13px] font-medium text-foreground">Featured</span>
        </label>
        {isEditing && (
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={form.active ?? true} onChange={(e) => update("active", e.target.checked)} className="rounded" />
            <span className="text-[13px] font-medium text-foreground">Active</span>
          </label>
        )}
      </div>

      {error && <p className="text-[13px] text-red-600 font-medium">{error}</p>}

      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={isPending}
          className="flex items-center gap-2 h-11 px-5 rounded-[10px] bg-cherry text-white font-semibold text-[14px] hover:bg-cherry/90 disabled:opacity-50 transition-colors"
        >
          <Save className="h-4 w-4" />
          {isPending ? "Saving..." : isEditing ? "Save Changes" : "Create Experience"}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="h-11 px-5 rounded-[10px] bg-card-border/30 text-foreground/70 font-semibold text-[14px] hover:bg-card-border/50 transition-colors"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-[11px] font-semibold text-muted uppercase tracking-wider">{label}</label>
      <div className="mt-1">{children}</div>
    </div>
  );
}
