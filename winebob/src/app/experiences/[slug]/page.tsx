import { getExperience } from "@/lib/experienceActions";
import { notFound } from "next/navigation";
import Link from "next/link";
import { MapPin, Clock, Users, Globe, CheckCircle, ArrowLeft, Calendar, Wine, Grape } from "lucide-react";
import { BookingForm } from "./BookingForm";

export const dynamic = "force-dynamic";

const TYPE_LABELS: Record<string, string> = {
  tasting: "Wine Tasting",
  tour: "Vineyard Tour",
  harvest: "Harvest Experience",
  dinner: "Wine Dinner",
  workshop: "Workshop",
  stay: "Winery Stay",
};

function formatPrice(cents: number, currency: string) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
  }).format(cents / 100);
}

function formatDuration(minutes: number) {
  if (minutes < 60) return `${minutes} minutes`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}min` : `${h} hour${h > 1 ? "s" : ""}`;
}

export default async function ExperienceDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  let experience: Awaited<ReturnType<typeof getExperience>> = null;
  try {
    experience = await getExperience(slug);
  } catch { /* DB unavailable */ }

  if (!experience) notFound();

  return (
    <div className="min-h-screen bg-butter">
      {/* Header image */}
      <div className="h-56 bg-gradient-to-br from-cherry/10 to-cherry/5 relative">
        {experience.image ? (
          <img src={experience.image} alt="" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Wine className="h-16 w-16 text-cherry/15" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
        <Link
          href="/experiences"
          className="absolute top-4 left-4 h-9 px-3 rounded-[10px] bg-black/40 backdrop-blur-sm text-white text-[12px] font-semibold flex items-center gap-1.5"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> All experiences
        </Link>
        <span className="absolute top-4 right-4 px-2.5 py-1 rounded-[8px] bg-black/40 backdrop-blur-sm text-white text-[11px] font-semibold">
          {TYPE_LABELS[experience.type] ?? experience.type}
        </span>
      </div>

      <div className="max-w-3xl mx-auto px-5 -mt-6 relative z-10">
        {/* Main card */}
        <div className="bg-white rounded-[14px] border border-card-border/30 shadow-sm overflow-hidden">
          <div className="p-5">
            <h1
              className="text-[22px] font-bold text-foreground tracking-tight"
              style={{ fontFamily: "Georgia, serif" }}
            >
              {experience.title}
            </h1>

            {/* Winery link */}
            <Link
              href={`/producers/${experience.winery.slug}`}
              className="inline-flex items-center gap-2 mt-2 text-[13px] text-muted hover:text-cherry transition-colors"
            >
              <div className="h-6 w-6 rounded-[6px] bg-cherry/10 flex items-center justify-center">
                <Wine className="h-3 w-3 text-cherry" />
              </div>
              <span className="font-semibold">{experience.winery.name}</span>
              {experience.winery.verified && <CheckCircle className="h-3.5 w-3.5 text-green-600" />}
              <span className="text-muted">· {experience.winery.region}, {experience.winery.country}</span>
            </Link>

            {/* Quick stats */}
            <div className="flex flex-wrap gap-4 mt-4 pt-4 border-t border-card-border/30">
              <span className="flex items-center gap-1.5 text-[13px] text-foreground/70">
                <Clock className="h-4 w-4 text-muted" /> {formatDuration(experience.duration)}
              </span>
              <span className="flex items-center gap-1.5 text-[13px] text-foreground/70">
                <Users className="h-4 w-4 text-muted" /> Up to {experience.maxGuests} guests
              </span>
              {experience.languages.length > 0 && (
                <span className="flex items-center gap-1.5 text-[13px] text-foreground/70">
                  <Globe className="h-4 w-4 text-muted" /> {experience.languages.join(", ")}
                </span>
              )}
              {experience.seasonStart && experience.seasonEnd && (
                <span className="flex items-center gap-1.5 text-[13px] text-foreground/70">
                  <Calendar className="h-4 w-4 text-muted" />
                  {monthName(experience.seasonStart)}–{monthName(experience.seasonEnd)}
                </span>
              )}
            </div>

            {/* Description */}
            <div className="mt-5">
              <p className="text-[14px] text-foreground/80 leading-relaxed whitespace-pre-line">
                {experience.description}
              </p>
            </div>

            {/* Highlights */}
            {experience.highlights && (
              <div className="mt-4 p-3 rounded-[10px] bg-cherry/[0.04] border border-cherry/10">
                <p className="text-[13px] text-cherry font-medium">{experience.highlights}</p>
              </div>
            )}

            {/* What's included */}
            {experience.includes.length > 0 && (
              <div className="mt-5">
                <h3 className="text-[14px] font-bold text-foreground mb-2">What&apos;s included</h3>
                <div className="grid gap-1.5">
                  {experience.includes.map((item) => (
                    <div key={item} className="flex items-center gap-2">
                      <CheckCircle className="h-3.5 w-3.5 text-green-600 flex-shrink-0" />
                      <span className="text-[13px] text-foreground/70">{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Meeting point */}
            {experience.meetingPoint && (
              <div className="mt-4 flex items-start gap-2">
                <MapPin className="h-4 w-4 text-muted mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-[12px] font-semibold text-muted uppercase tracking-wider">Meeting point</p>
                  <p className="text-[13px] text-foreground/70">{experience.meetingPoint}</p>
                </div>
              </div>
            )}

            {/* Grapes at the winery */}
            {experience.winery.grapeVarieties.length > 0 && (
              <div className="mt-5 pt-4 border-t border-card-border/30">
                <div className="flex items-center gap-1.5 mb-2">
                  <Grape className="h-3.5 w-3.5 text-cherry/50" />
                  <span className="text-[12px] font-semibold text-muted uppercase tracking-wider">Grape varieties</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {experience.winery.grapeVarieties.map((g) => (
                    <span key={g} className="px-2 py-0.5 rounded-[5px] bg-butter-dark text-[11px] font-semibold text-foreground/70">
                      {g}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Price + booking */}
          <div className="border-t border-card-border/30 p-5 bg-butter/50">
            <div className="flex items-center justify-between mb-4">
              <div>
                <span className="text-[24px] font-bold text-cherry">
                  {formatPrice(experience.pricePerPerson, experience.currency)}
                </span>
                <span className="text-[13px] text-muted"> per person</span>
              </div>
              {experience._count.bookings > 0 && (
                <span className="text-[11px] text-muted">
                  {experience._count.bookings} booking{experience._count.bookings !== 1 ? "s" : ""}
                </span>
              )}
            </div>

            <BookingForm
              experienceId={experience.id}
              maxGuests={experience.maxGuests}
              pricePerPerson={experience.pricePerPerson}
              currency={experience.currency}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function monthName(month: number) {
  return new Date(2024, month - 1).toLocaleDateString("en-US", { month: "short" });
}
