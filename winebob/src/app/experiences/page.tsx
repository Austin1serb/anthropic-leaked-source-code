import { getExperiences, getExperienceTypes, getExperienceRegions } from "@/lib/experienceActions";
import Link from "next/link";
import { MapPin, Clock, Users, Star, Wine, Compass, ArrowLeft } from "lucide-react";

export const dynamic = "force-dynamic";

const TYPE_LABELS: Record<string, { label: string; emoji: string }> = {
  tasting: { label: "Tasting", emoji: "🍷" },
  tour: { label: "Vineyard Tour", emoji: "🚶" },
  harvest: { label: "Harvest", emoji: "🍇" },
  dinner: { label: "Wine Dinner", emoji: "🍽" },
  workshop: { label: "Workshop", emoji: "📚" },
  stay: { label: "Stay", emoji: "🏡" },
};

function formatPrice(cents: number, currency: string) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
  }).format(cents / 100);
}

function formatDuration(minutes: number) {
  if (minutes < 60) return `${minutes}min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

export default async function ExperiencesPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string; region?: string }>;
}) {
  const params = await searchParams;

  let experiences: Awaited<ReturnType<typeof getExperiences>> = [];
  let types: string[] = [];
  let regions: string[] = [];

  try {
    [experiences, types, regions] = await Promise.all([
      getExperiences({
        type: params.type || undefined,
        region: params.region || undefined,
      }),
      getExperienceTypes(),
      getExperienceRegions(),
    ]);
  } catch {
    // DB unavailable
  }

  return (
    <div className="min-h-screen bg-butter">
      {/* Header */}
      <div className="bg-white border-b border-card-border/30">
        <div className="max-w-3xl mx-auto px-5 py-5">
          <Link href="/explore" className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-muted mb-3 hover:text-foreground transition-colors">
            <ArrowLeft className="h-3.5 w-3.5" /> Back to map
          </Link>
          <h1
            className="text-[26px] font-bold text-foreground tracking-tight"
            style={{ fontFamily: "Georgia, serif" }}
          >
            Wine Experiences
          </h1>
          <p className="text-[14px] text-muted mt-1">
            Book tastings, tours, and unique wine experiences directly with producers.
          </p>

          {/* Filters */}
          <div className="flex gap-2 mt-4 overflow-x-auto scrollbar-hide pb-1">
            <FilterLink href="/experiences" active={!params.type && !params.region} label="All" />
            {types.map((t) => (
              <FilterLink
                key={t}
                href={`/experiences?type=${t}`}
                active={params.type === t}
                label={TYPE_LABELS[t]?.label ?? t}
              />
            ))}
          </div>

          {regions.length > 0 && (
            <div className="flex gap-2 mt-2 overflow-x-auto scrollbar-hide pb-1">
              {regions.map((r) => (
                <FilterLink
                  key={r}
                  href={`/experiences?region=${encodeURIComponent(r)}${params.type ? `&type=${params.type}` : ""}`}
                  active={params.region === r}
                  label={r}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Listings */}
      <div className="max-w-3xl mx-auto px-5 py-6">
        {experiences.length === 0 ? (
          <div className="text-center py-16">
            <Compass className="h-10 w-10 text-muted/20 mx-auto mb-3" />
            <p className="text-[16px] font-semibold text-foreground">No experiences yet</p>
            <p className="text-[13px] text-muted mt-1 max-w-[280px] mx-auto">
              Experiences will appear here as producers add tastings, tours, and events.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {experiences.map((exp) => (
              <Link
                key={exp.id}
                href={`/experiences/${exp.slug}`}
                className="group bg-white rounded-[12px] border border-card-border/30 overflow-hidden hover:border-cherry/20 hover:shadow-lg hover:shadow-cherry/5 transition-all"
              >
                {/* Image */}
                <div className="h-40 bg-gradient-to-br from-cherry/10 to-cherry/5 flex items-center justify-center relative">
                  {exp.image ? (
                    <img src={exp.image} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <Wine className="h-10 w-10 text-cherry/20" />
                  )}
                  {exp.featured && (
                    <span className="absolute top-2 right-2 px-2 py-0.5 rounded-[6px] bg-[#C8A255] text-white text-[9px] font-bold uppercase tracking-wider">
                      Featured
                    </span>
                  )}
                  <span className="absolute top-2 left-2 px-2 py-0.5 rounded-[6px] bg-black/50 text-white text-[10px] font-semibold backdrop-blur-sm">
                    {TYPE_LABELS[exp.type]?.emoji} {TYPE_LABELS[exp.type]?.label ?? exp.type}
                  </span>
                </div>

                {/* Content */}
                <div className="p-4">
                  <h3 className="text-[15px] font-bold text-foreground group-hover:text-cherry transition-colors">
                    {exp.title}
                  </h3>
                  <p className="text-[12px] text-muted mt-1 flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {exp.winery.name} · {exp.winery.region}, {exp.winery.country}
                  </p>

                  <p className="text-[12px] text-foreground/70 mt-2 line-clamp-2">
                    {exp.description}
                  </p>

                  {/* Meta */}
                  <div className="flex items-center gap-3 mt-3 pt-3 border-t border-card-border/30">
                    <span className="text-[11px] text-muted flex items-center gap-1">
                      <Clock className="h-3 w-3" /> {formatDuration(exp.duration)}
                    </span>
                    <span className="text-[11px] text-muted flex items-center gap-1">
                      <Users className="h-3 w-3" /> Max {exp.maxGuests}
                    </span>
                    <span className="ml-auto text-[15px] font-bold text-cherry">
                      {formatPrice(exp.pricePerPerson, exp.currency)}
                      <span className="text-[10px] font-normal text-muted"> /person</span>
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function FilterLink({ href, active, label }: { href: string; active: boolean; label: string }) {
  return (
    <Link
      href={href}
      className={`px-3 py-1.5 rounded-[8px] text-[12px] font-semibold whitespace-nowrap transition-colors ${
        active
          ? "bg-cherry text-white"
          : "bg-card-border/30 text-foreground/70 hover:bg-card-border/50"
      }`}
    >
      {label}
    </Link>
  );
}
