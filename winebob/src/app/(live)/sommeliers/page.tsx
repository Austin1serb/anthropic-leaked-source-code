import { getAllSommeliers } from "@/lib/liveActions";
import Link from "next/link";
import { BadgeCheck, Star, Wine, Users, Sparkles, Radio, ChevronRight } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function SommeliersPage() {
  const sommeliers = await getAllSommeliers();

  return (
    <div className="px-5 pt-6 pb-28">
      {/* Header */}
      <div className="flex items-end justify-between mb-6">
        <div>
          <h1 className="text-[24px] font-bold text-foreground tracking-tight font-serif">Sommeliers</h1>
          <p className="text-[13px] text-muted mt-0.5">Our community of wine experts</p>
        </div>
        <Link href="/sommeliers/become" className="flex items-center gap-1.5 h-9 px-4 rounded-[10px] bg-cherry text-white text-[12px] font-bold hover:bg-cherry/90 transition-colors">
          <Sparkles className="h-3.5 w-3.5" /> Become a Som
        </Link>
      </div>

      {/* List */}
      {sommeliers.length === 0 ? (
        <div className="bg-white rounded-[14px] border border-card-border/60 py-16 px-6 text-center">
          <Wine className="h-8 w-8 text-muted/20 mx-auto mb-3" />
          <p className="text-[15px] font-bold text-foreground">No sommeliers yet</p>
          <p className="text-[13px] text-muted mt-1 max-w-[240px] mx-auto">
            Be the first to create a profile and host live tastings.
          </p>
          <Link href="/sommeliers/become" className="inline-flex items-center gap-2 mt-5 h-10 px-6 rounded-[10px] bg-cherry text-white text-[13px] font-bold">
            Get Started
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-[14px] border border-card-border/60 overflow-hidden divide-y divide-card-border/30">
          {sommeliers.map((som) => (
            <div key={som.id} className="px-5 py-4">
              <div className="flex items-start gap-3.5">
                {/* Avatar */}
                <div className="relative flex-shrink-0">
                  {som.avatar ? (
                    <img src={som.avatar} alt="" className="h-12 w-12 rounded-full object-cover" />
                  ) : (
                    <div className="h-12 w-12 rounded-full bg-cherry/8 flex items-center justify-center text-[18px] font-bold text-cherry">
                      {som.displayName.charAt(0)}
                    </div>
                  )}
                  {som.verified && (
                    <div className="absolute -bottom-0.5 -right-0.5 h-5 w-5 rounded-full bg-cherry flex items-center justify-center">
                      <BadgeCheck className="h-3 w-3 text-white" />
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <h3 className="font-semibold text-[14px] text-foreground truncate">{som.displayName}</h3>
                    {som.verified && (
                      <span className="text-[9px] font-bold text-cherry bg-cherry/[0.07] px-1.5 py-0.5 rounded-full flex-shrink-0">Verified</span>
                    )}
                  </div>

                  {som.bio && (
                    <p className="text-[12px] text-muted mt-0.5 line-clamp-2 leading-relaxed">{som.bio}</p>
                  )}

                  {/* Expertise */}
                  {som.expertise.length > 0 && (
                    <div className="flex gap-1 mt-2 flex-wrap">
                      {som.expertise.slice(0, 4).map((exp) => (
                        <span key={exp} className="text-[10px] font-semibold text-cherry/70 bg-cherry/[0.06] px-2 py-0.5 rounded-full capitalize">
                          {exp}
                        </span>
                      ))}
                      {som.expertise.length > 4 && (
                        <span className="text-[10px] font-semibold text-muted px-1.5 py-0.5">+{som.expertise.length - 4}</span>
                      )}
                    </div>
                  )}

                  {/* Stats */}
                  <div className="flex items-center gap-4 mt-2">
                    <span className="inline-flex items-center gap-1 text-[11px] text-muted">
                      <Radio className="h-3 w-3" /> {som.totalEvents}
                    </span>
                    <span className="inline-flex items-center gap-1 text-[11px] text-muted">
                      <Users className="h-3 w-3" /> {som.totalViewers}
                    </span>
                    {som.ratingCount > 0 && (
                      <span className="inline-flex items-center gap-1 text-[11px] text-amber-600 font-semibold">
                        <Star className="h-3 w-3 fill-amber-400" /> {som.rating.toFixed(1)}
                      </span>
                    )}
                  </div>

                  {/* Certifications */}
                  {som.certifications.length > 0 && (
                    <div className="flex gap-1 mt-2 flex-wrap">
                      {som.certifications.slice(0, 3).map((cert) => (
                        <span key={cert} className="text-[9px] font-medium text-muted/70 border border-card-border/50 px-1.5 py-0.5 rounded-full flex items-center gap-1">
                          <BadgeCheck className="h-2.5 w-2.5" /> {cert}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
