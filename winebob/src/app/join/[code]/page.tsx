"use client";

import { use, useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { getEventByJoinCode, joinEvent } from "@/lib/actions";
import { Wine, MapPin, Users, ChevronLeft, Loader2, X } from "lucide-react";

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
          <div className="h-14 w-14 rounded-full bg-cherry/10 flex items-center justify-center mx-auto mb-4">
            <Wine className="h-7 w-7 text-cherry animate-pulse" />
          </div>
          <p className="text-[14px] text-muted font-medium">Finding your tasting...</p>
        </div>
      </div>
    );
  }

  // --- Not Found ---
  if (notFound || !event) {
    return (
      <div className="min-h-dvh bg-background flex items-center justify-center px-4">
        <div className="text-center animate-fade-in-up max-w-sm mx-auto">
          <div className="h-14 w-14 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
            <X className="h-7 w-7 text-red-400" />
          </div>
          <h1 className="text-[22px] font-serif font-bold text-foreground mb-2">
            Event not found
          </h1>
          <p className="text-[14px] text-muted mb-6">
            That join code doesn&apos;t match any active tasting.
          </p>
          <a href="/" className="btn-primary inline-block touch-target">
            <ChevronLeft className="h-4 w-4" /> Back to Home
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
        <div className="sticky top-0 z-50 bg-red-50 border-b border-red-200 text-red-700 px-4 py-3 text-center text-[13px] font-medium animate-fade-in-up">
          {serverError}
          <button onClick={() => setServerError("")} className="ml-3 underline text-red-800">
            Dismiss
          </button>
        </div>
      )}

      <div className="max-w-md mx-auto px-5 py-8">
        {/* Back link */}
        <a href="/" className="inline-flex items-center gap-1 text-[13px] font-semibold text-muted hover:text-foreground transition-colors touch-target mb-6">
          <ChevronLeft className="h-3.5 w-3.5" /> Back
        </a>

        {/* Header */}
        <div className="text-center mb-8 animate-fade-in-up">
          <div className="h-14 w-14 rounded-full bg-cherry/10 flex items-center justify-center mx-auto mb-4">
            <Wine className="h-7 w-7 text-cherry" />
          </div>
          <h1 className="text-[26px] font-serif font-bold text-foreground tracking-tight mb-1">
            {event.title}
          </h1>
          <p className="text-[14px] text-muted">
            Hosted by <span className="font-semibold text-foreground">{hostName}</span>
          </p>
          {event.guests.length > 0 && (
            <div className="inline-flex items-center gap-1.5 mt-2 text-[12px] text-muted">
              <Users className="h-3 w-3" />
              <span className="nums">{event.guests.length}</span> already joined
            </div>
          )}
        </div>

        {/* Form Card */}
        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-[14px] border border-card-border/60 overflow-hidden animate-fade-in-up"
        >
          <div className="p-6 space-y-5">
            {/* Display Name */}
            <div>
              <label htmlFor="displayName" className="block text-[12px] font-semibold text-foreground mb-1.5">
                Your Name *
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
                <p className="text-red-600 text-[12px] mt-1.5">{errors.displayName}</p>
              )}
            </div>

            {/* Birth Year */}
            <div>
              <label htmlFor="birthYear" className="block text-[12px] font-semibold text-foreground mb-1.5">
                Birth Year *
              </label>
              <select
                id="birthYear"
                value={birthYear}
                onChange={(e) => setBirthYear(e.target.value)}
                className="input-field w-full touch-target"
              >
                <option value="">Select year</option>
                {Array.from({ length: maxYear - minYear + 1 }, (_, i) => maxYear - i).map(
                  (year) => (
                    <option key={year} value={year}>{year}</option>
                  )
                )}
              </select>
              {errors.birthYear && (
                <p className="text-red-600 text-[12px] mt-1.5">{errors.birthYear}</p>
              )}
            </div>

            {/* Location */}
            <div>
              <label className="block text-[12px] font-semibold text-foreground mb-1.5">
                Location <span className="text-muted font-normal">(optional)</span>
              </label>

              <button
                type="button"
                onClick={handleDetectLocation}
                disabled={detectingLocation}
                className={`w-full mb-3 px-4 py-3 rounded-[10px] text-[13px] font-semibold touch-target transition-all flex items-center justify-center gap-2 ${
                  locationDetected
                    ? "bg-green-50 border border-green-200 text-green-700"
                    : "bg-cherry/[0.06] border border-cherry/15 text-cherry hover:bg-cherry/10"
                } disabled:opacity-50`}
              >
                {detectingLocation ? (
                  <><Loader2 className="h-4 w-4 animate-spin" /> Detecting...</>
                ) : locationDetected ? (
                  <><MapPin className="h-4 w-4" /> {locationCity}</>
                ) : (
                  <><MapPin className="h-4 w-4" /> Use my location</>
                )}
              </button>

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
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          </div>

          {/* Consent + Submit — footer section */}
          <div className="px-6 py-5 border-t border-card-border/40 bg-butter/30">
            <label className="flex items-start gap-3 cursor-pointer mb-5">
              <input
                type="checkbox"
                checked={consent}
                onChange={(e) => setConsent(e.target.checked)}
                className="mt-0.5 h-5 w-5 rounded border-black/10 accent-cherry shrink-0"
              />
              <span className="text-[12px] text-muted leading-relaxed">
                I agree that anonymized tasting data may be used for wine
                industry insights.{" "}
                <a href="/privacy" className="underline text-cherry hover:text-cherry/80">
                  Privacy Policy
                </a>
              </span>
            </label>
            {errors.consent && (
              <p className="text-red-600 text-[12px] mb-3">{errors.consent}</p>
            )}

            <button
              type="submit"
              disabled={isPending}
              className="btn-primary w-full touch-target"
            >
              {isPending ? (
                <><Loader2 className="h-5 w-5 animate-spin" /> Joining...</>
              ) : (
                <><Wine className="h-5 w-5" /> Join Tasting</>
              )}
            </button>
          </div>
        </form>

        <p className="text-center text-[11px] text-muted mt-5">
          No account needed. Join instantly.
        </p>
      </div>
    </div>
  );
}
