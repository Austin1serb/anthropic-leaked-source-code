import { getAllSommeliers } from "@/lib/liveActions";
import Link from "next/link";
import { BadgeCheck, Star, Wine, Users, Sparkles, Radio } from "lucide-react";

export const dynamic = "force-dynamic";

const EXP_COLORS: Record<string, [string, string]> = {
  italian: ["widget-sage", "text-emerald-700"], french: ["widget-sky", "text-blue-600"],
  spanish: ["widget-peach", "text-orange-600"], natural: ["widget-sage", "text-emerald-700"],
  sparkling: ["widget-gold", "text-amber-700"], biodynamic: ["widget-lavender", "text-purple-600"],
  champagne: ["widget-gold", "text-amber-700"], burgundy: ["widget-wine", "text-cherry"],
  bordeaux: ["widget-wine", "text-cherry"],
};
function expClass(e: string) { const [bg, text] = EXP_COLORS[e.toLowerCase()] ?? ["widget-wine", "text-cherry"]; return `${bg} ${text}`; }

export default async function SommeliersPage() {
  const sommeliers = await getAllSommeliers();

  return (
    <div className="min-h-screen pb-28 safe-top bg-background">
      <div className="container-app pt-5 pb-2">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="heading-lg text-foreground">Sommeliers</h1>
            <p className="text-[12px] text-muted mt-0.5">Our community of wine experts</p>
          </div>
          <Link href="/sommeliers/become" className="inline-flex items-center gap-1 text-[12px] font-bold text-cherry active:opacity-70">
            <Sparkles className="h-3 w-3" /> Become a Som
          </Link>
        </div>
      </div>

      <div className="container-app mt-3">
        {sommeliers.length === 0 ? (
          <div className="wine-card px-6 py-10 text-center">
            <Wine className="h-6 w-6 text-muted/30 mx-auto mb-3" />
            <p className="text-[14px] font-bold text-foreground">No sommeliers yet</p>
            <p className="text-[12px] text-muted mt-1">Be the first to host live tastings.</p>
            <Link href="/sommeliers/become" className="text-[12px] font-bold text-cherry mt-3 inline-block">Get Started</Link>
          </div>
        ) : (
          <div className="wine-card divide-y divide-card-border/40">
            {sommeliers.map((som) => (
              <div key={som.id} className="px-3.5 py-3 flex items-start gap-3">
                {/* Avatar */}
                <div className="relative flex-shrink-0">
                  {som.avatar ? (
                    <img src={som.avatar} alt="" className="h-10 w-10 rounded-xl object-cover" />
                  ) : (
                    <div className="h-10 w-10 rounded-xl widget-wine flex items-center justify-center text-[14px] font-bold text-cherry">
                      {som.displayName.charAt(0)}
                    </div>
                  )}
                  {som.verified && (
                    <div className="absolute -bottom-0.5 -right-0.5 h-4 w-4 rounded-full bg-cherry flex items-center justify-center">
                      <BadgeCheck className="h-2.5 w-2.5 text-white" />
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <h3 className="text-[13px] font-bold text-foreground truncate">{som.displayName}</h3>
                    {som.verified && (
                      <span className="text-[9px] font-bold text-cherry bg-widget-wine px-1 py-0.5 rounded flex-shrink-0">Verified</span>
                    )}
                  </div>

                  {som.bio && <p className="text-[11px] text-muted mt-0.5 line-clamp-1">{som.bio}</p>}

                  {som.expertise.length > 0 && (
                    <div className="flex gap-1 mt-1.5 flex-wrap">
                      {som.expertise.slice(0, 4).map((exp) => (
                        <span key={exp} className={`${expClass(exp)} text-[9px] font-semibold px-1.5 py-0.5 rounded capitalize`}>{exp}</span>
                      ))}
                      {som.expertise.length > 4 && <span className="text-[9px] text-muted">+{som.expertise.length - 4}</span>}
                    </div>
                  )}

                  <div className="flex items-center gap-3 mt-1.5">
                    <span className="text-[10px] font-semibold text-muted"><Radio className="h-2.5 w-2.5 inline -mt-px" /> {som.totalEvents}</span>
                    <span className="text-[10px] font-semibold text-muted"><Users className="h-2.5 w-2.5 inline -mt-px" /> {som.totalViewers}</span>
                    {som.ratingCount > 0 && (
                      <span className="text-[10px] font-semibold text-amber-600"><Star className="h-2.5 w-2.5 inline fill-amber-400 -mt-px" /> {som.rating.toFixed(1)}</span>
                    )}
                  </div>

                  {som.certifications.length > 0 && (
                    <div className="flex gap-1 mt-1.5 flex-wrap">
                      {som.certifications.slice(0, 2).map((c) => (
                        <span key={c} className="text-[8px] font-semibold text-muted border border-card-border px-1 py-0.5 rounded">{c}</span>
                      ))}
                      {som.certifications.length > 2 && <span className="text-[8px] text-muted">+{som.certifications.length - 2}</span>}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
