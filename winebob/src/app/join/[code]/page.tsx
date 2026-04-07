"use client";

import { use, useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { getEventByJoinCode, joinEvent } from "@/lib/actions";

const COUNTRIES = [
  "Argentina", "Australia", "Austria", "Brazil", "Canada", "Chile", "China",
  "Croatia", "Czech Republic", "France", "Georgia", "Germany", "Greece",
  "Hungary", "India", "Israel", "Italy", "Japan", "Lebanon", "Mexico",
  "Moldova", "Morocco", "New Zealand", "Portugal", "Romania", "South Africa",
  "Spain", "Switzerland", "Turkey", "United Kingdom", "United States", "Uruguay",
];

const currentYear = new Date().getFullYear();
const minYear = currentYear - 100;
const maxYear = currentYear - 18;

type EventData = Awaited<ReturnType<typeof getEventByJoinCode>>;

export default function JoinPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = use(params);
  const router = useRouter();

  const [event, setEvent] = useState<EventData>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  // Form state
  const [displayName, setDisplayName] = useState("");
  const [birthYear, setBirthYear] = useState("");
  const [city, setCity] = useState("");
  const [country, setCountry] = useState("");
  const [locationDetected, setLocationDetected] = useState(false);
  const [locationCity, setLocationCity] = useState("");
  const [locationLat, setLocationLat] = useState<number | undefined>();
  const [locationLng, setLocationLng] = useState<number | undefined>();
  const [detectingLocation, setDetectingLocation] = useState(false);
  const [consent, setConsent] = useState(false);

  // Submission state
  const [isPending, startTransition] = useTransition();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState("");

  useEffect(() => {
    getEventByJoinCode(code)
      .then((data) => {
        if (!data) {
          setNotFound(true);
        } else {
          setEvent(data);
        }
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [code]);

  function handleDetectLocation() {
    if (!navigator.geolocation) return;
    setDetectingLocation(true);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        setLocationLat(latitude);
        setLocationLng(longitude);

        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&accept-language=en`
          );
          const data = await res.json();
          const detectedCity =
            data.address?.city ||
            data.address?.town ||
            data.address?.village ||
            "Unknown";
          const detectedCountry = data.address?.country || "";
          setLocationCity(detectedCity);
          setCity(detectedCity);
          setCountry(detectedCountry);
          setLocationDetected(true);
        } catch {
          setLocationCity("Location detected");
          setLocationDetected(true);
        }
        setDetectingLocation(false);
      },
      () => {
        setDetectingLocation(false);
      }
    );
  }

  function validate(): boolean {
    const newErrors: Record<string, string> = {};
    if (!displayName.trim()) newErrors.displayName = "Name is required";
    if (!birthYear) newErrors.birthYear = "Birth year is required";
    if (!consent) newErrors.consent = "You must agree to continue";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setServerError("");
    if (!validate()) return;

    startTransition(async () => {
      try {
        const result = await joinEvent({
          joinCode: code,
          displayName: displayName.trim(),
          birthYear: parseInt(birthYear, 10),
          city: city.trim() || undefined,
          country: country.trim() || undefined,
          locationLat,
          locationLng,
          consentGiven: consent,
        });

        localStorage.setItem("guestId", result.guestId);
        localStorage.setItem("eventId", result.eventId);

        router.push(`/play/${result.eventId}?guest=${result.guestId}`);
      } catch (err) {
        setServerError(
          err instanceof Error ? err.message : "Something went wrong"
        );
      }
    });
  }

  // --- Loading ---
  if (loading) {
    return (
      <div className="min-h-dvh bg-background flex items-center justify-center px-4">
        <div className="text-center animate-fade-in-up">
          <div className="text-5xl mb-4">🍷</div>
          <p className="text-lg text-muted font-serif">
            Finding your tasting...
          </p>
        </div>
      </div>
    );
  }

  // --- Not Found ---
  if (notFound || !event) {
    return (
      <div className="min-h-dvh bg-background flex items-center justify-center px-4">
        <div className="text-center animate-fade-in-up max-w-md mx-auto">
          <div className="text-5xl mb-4">😕</div>
          <h1 className="text-2xl font-serif font-bold text-foreground mb-2">
            Event not found
          </h1>
          <p className="text-muted mb-6">
            That join code doesn&apos;t match any active tasting event.
          </p>
          <a
            href="/"
            className="btn-primary inline-block touch-target"
          >
            ← Back to Home
          </a>
        </div>
      </div>
    );
  }

  const hostName = event.host.displayName || event.host.name || "Someone";

  // --- Main Join Form ---
  return (
    <div className="min-h-dvh bg-background safe-top safe-bottom">
      {/* Server error banner */}
      {serverError && (
        <div className="sticky top-0 z-50 bg-red-50 border-b border-red-200 text-red-700 px-4 py-3 text-center text-sm font-medium animate-fade-in-up">
          {serverError}
          <button
            onClick={() => setServerError("")}
            className="ml-3 underline text-red-800"
          >
            Dismiss
          </button>
        </div>
      )}

      <div className="max-w-md mx-auto px-4 py-8">
        {/* Back link */}
        <a
          href="/"
          className="inline-flex items-center gap-1 text-sm font-medium text-muted hover:text-foreground active:text-foreground transition-colors touch-target mb-6"
        >
          ← Back to Home
        </a>

        {/* Header */}
        <div className="text-center mb-8 animate-fade-in-up">
          <div className="text-4xl mb-3">🍷</div>
          <h1 className="text-3xl font-serif font-bold text-foreground mb-1">
            {event.title}
          </h1>
          <p className="text-muted text-base">
            Hosted by <span className="font-medium text-foreground">{hostName}</span>
          </p>
          {event.guests.length > 0 && (
            <p className="text-sm text-muted mt-1">
              {event.guests.length} guest{event.guests.length !== 1 ? "s" : ""}{" "}
              already joined
            </p>
          )}
        </div>

        {/* Form Card */}
        <form
          onSubmit={handleSubmit}
          className="bg-white border border-black/[0.06] rounded-[16px] shadow-[0_2px_8px_rgba(0,0,0,0.06),0_0_1px_rgba(0,0,0,0.04)] p-6 animate-fade-in-up"
        >
          {/* Display Name */}
          <div className="mb-5">
            <label
              htmlFor="displayName"
              className="block text-sm font-semibold text-foreground mb-1.5"
            >
              Your Name
            </label>
            <input
              id="displayName"
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="How you'll appear on the scoreboard"
              autoComplete="given-name"
              className="input-field w-full touch-target"
            />
            {errors.displayName && (
              <p className="text-red-600 text-sm mt-1.5">{errors.displayName}</p>
            )}
          </div>

          {/* Birth Year */}
          <div className="mb-5">
            <label
              htmlFor="birthYear"
              className="block text-sm font-semibold text-foreground mb-1.5"
            >
              Birth Year
            </label>
            <select
              id="birthYear"
              value={birthYear}
              onChange={(e) => setBirthYear(e.target.value)}
              className="input-field w-full touch-target text-lg appearance-none"
              style={{
                backgroundImage:
                  'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'12\' height=\'12\' fill=\'%23888\' viewBox=\'0 0 16 16\'%3E%3Cpath d=\'M8 11L3 6h10z\'/%3E%3C/svg%3E")',
                backgroundRepeat: "no-repeat",
                backgroundPosition: "right 14px center",
              }}
            >
              <option value="">Select year</option>
              {Array.from({ length: maxYear - minYear + 1 }, (_, i) => maxYear - i).map(
                (year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                )
              )}
            </select>
            {errors.birthYear && (
              <p className="text-red-600 text-sm mt-1.5">{errors.birthYear}</p>
            )}
          </div>

          {/* Location */}
          <div className="mb-5">
            <label className="block text-sm font-semibold text-foreground mb-1.5">
              Location{" "}
              <span className="text-muted font-normal">(optional)</span>
            </label>

            {/* Detect button */}
            <button
              type="button"
              onClick={handleDetectLocation}
              disabled={detectingLocation}
              className="w-full mb-3 px-4 py-3 rounded-[12px] border-2 border-dashed border-cherry/20 text-cherry font-medium text-base touch-target hover:bg-cherry/5 transition-colors disabled:opacity-50"
            >
              {detectingLocation
                ? "Detecting..."
                : locationDetected
                  ? `Location detected: ${locationCity}`
                  : "📍 Use my location"}
            </button>

            {/* Manual fallback */}
            {!locationDetected && (
              <div className="flex gap-3">
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="City"
                  className="input-field flex-1 touch-target"
                />
                <select
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  className="input-field flex-1 touch-target"
                >
                  <option value="">Country</option>
                  {COUNTRIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* GDPR Consent */}
          <div className="mb-6">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={consent}
                onChange={(e) => setConsent(e.target.checked)}
                className="mt-0.5 h-5 w-5 rounded border-black/10 accent-cherry shrink-0"
              />
              <span className="text-sm text-muted leading-relaxed">
                I agree that anonymized tasting data may be used for wine
                industry insights.{" "}
                <a
                  href="/privacy"
                  className="underline text-cherry hover:text-cherry/80"
                >
                  Privacy Policy
                </a>
              </span>
            </label>
            {errors.consent && (
              <p className="text-red-600 text-sm mt-1.5">{errors.consent}</p>
            )}
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={isPending}
            className="btn-primary w-full touch-target text-lg"
          >
            {isPending ? "Joining..." : "Join Tasting 🍷"}
          </button>
        </form>

        <p className="text-center text-xs text-muted mt-6">
          No account needed. Join instantly.
        </p>
      </div>
    </div>
  );
}
