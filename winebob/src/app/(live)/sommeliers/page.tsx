import { getAllSommeliers } from "@/lib/liveActions";
import Link from "next/link";
import { BadgeCheck, Star, Wine, Users, Sparkles, Radio } from "lucide-react";

export const dynamic = "force-dynamic";

const EXPERTISE_COLORS: Record<string, { bg: string; text: string }> = {
  italian: { bg: "widget-sage", text: "text-emerald-700" },
  french: { bg: "widget-sky", text: "text-blue-600" },
  spanish: { bg: "widget-peach", text: "text-orange-600" },
  natural: { bg: "widget-sage", text: "text-emerald-700" },
  sparkling: { bg: "widget-gold", text: "text-amber-700" },
  biodynamic: { bg: "widget-lavender", text: "text-purple-600" },
  champagne: { bg: "widget-gold", text: "text-amber-700" },
  burgundy: { bg: "widget-wine", text: "text-cherry" },
  bordeaux: { bg: "widget-wine", text: "text-cherry" },
  default: { bg: "widget-wine", text: "text-cherry" },
};

function getExpertiseColor(expertise: string) {
  return EXPERTISE_COLORS[expertise.toLowerCase()] ?? EXPERTISE_COLORS.default;
}

export default async function SommeliersPage() {
  const sommeliers = await getAllSommeliers();

  return (
    <div className="min-h-screen pb-28 safe-top bg-background">
      {/* Header */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none bg-hero-gradient" />
        <div className="container-app pt-8 pb-2 relative">
          <div className="flex items-end justify-between">
            <div>
              <h1 className="heading-xl text-foreground">Sommeliers</h1>
              <p className="body-sm mt-0.5">Our community of wine experts</p>
            </div>
            <Link href="/sommeliers/become" className="btn-primary px-4 py-2.5 text-[13px] w-auto">
              <Sparkles className="h-3.5 w-3.5" /> Become a Som
            </Link>
          </div>
        </div>
      </div>

      {/* Sommelier list */}
      <div className="container-app mt-5">
        {sommeliers.length === 0 ? (
          <div className="wine-card flex flex-col items-center justify-center py-16 px-6 text-center">
            <div className="h-16 w-16 rounded-3xl widget-wine flex items-center justify-center mb-4">
              <Wine className="h-7 w-7 text-cherry/40" />
            </div>
            <p className="text-[17px] font-bold text-foreground">No sommeliers yet</p>
            <p className="mt-2 text-[14px] text-muted max-w-[240px]">
              Be the first to create a sommelier profile and host live tastings.
            </p>
            <Link href="/sommeliers/become" className="btn-primary mt-5 px-8 w-auto touch-target">
              Get Started
            </Link>
          </div>
        ) : (
          <div className="space-y-3 stagger-children">
            {sommeliers.map((som) => (
              <div key={som.id} className="wine-card p-4">
                <div className="flex items-start gap-3.5">
                  {/* Avatar */}
                  <div className="relative flex-shrink-0">
                    {som.avatar ? (
                      <img src={som.avatar} alt="" className="h-14 w-14 rounded-2xl object-cover" />
                    ) : (
                      <div className="h-14 w-14 rounded-2xl widget-wine flex items-center justify-center text-xl font-bold text-cherry">
                        {som.displayName.charAt(0)}
                      </div>
                    )}
                    {som.verified && (
                      <div className="absolute -bottom-1 -right-1 h-5 w-5 rounded-full bg-cherry flex items-center justify-center">
                        <BadgeCheck className="h-3 w-3 text-white" />
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <h3 className="font-bold text-[15px] text-foreground truncate">
                        {som.displayName}
                      </h3>
                      {som.verified && (
                        <span className="text-[10px] font-bold text-cherry bg-widget-wine px-1.5 py-0.5 rounded-md flex-shrink-0">
                          Verified
                        </span>
                      )}
                    </div>

                    {som.bio && (
                      <p className="text-[12px] text-muted mt-0.5 line-clamp-2 leading-relaxed">{som.bio}</p>
                    )}

                    {/* Expertise badges */}
                    {som.expertise.length > 0 && (
                      <div className="flex gap-1.5 mt-2 flex-wrap">
                        {som.expertise.slice(0, 4).map((exp) => {
                          const color = getExpertiseColor(exp);
                          return (
                            <span
                              key={exp}
                              className={`${color.bg} ${color.text} text-[10px] font-semibold px-2 py-0.5 rounded-lg capitalize`}
                            >
                              {exp}
                            </span>
                          );
                        })}
                        {som.expertise.length > 4 && (
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-lg bg-card-border/30 text-muted">
                            +{som.expertise.length - 4}
                          </span>
                        )}
                      </div>
                    )}

                    {/* Stats */}
                    <div className="flex items-center gap-4 mt-2.5">
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-muted">
                        <Radio className="h-3 w-3" /> {som.totalEvents} events
                      </span>
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-muted">
                        <Users className="h-3 w-3" /> {som.totalViewers} viewers
                      </span>
                      {som.ratingCount > 0 && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-600">
                          <Star className="h-3 w-3 fill-amber-400" /> {som.rating.toFixed(1)}
                        </span>
                      )}
                    </div>

                    {/* Certifications */}
                    {som.certifications.length > 0 && (
                      <div className="flex gap-1.5 mt-2 flex-wrap">
                        {som.certifications.slice(0, 3).map((cert) => (
                          <span
                            key={cert}
                            className="text-[9px] font-semibold text-muted border border-card-border px-1.5 py-0.5 rounded-md flex items-center gap-1"
                          >
                            <BadgeCheck className="h-2.5 w-2.5" /> {cert}
                          </span>
                        ))}
                        {som.certifications.length > 3 && (
                          <span className="text-[9px] font-semibold text-muted px-1.5 py-0.5">
                            +{som.certifications.length - 3} more
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
