import { notFound } from "next/navigation";
import Link from "next/link";
import { getWinery } from "@/lib/wineryActions";
import { MapPin, Globe, Calendar, Grape, Wine, ArrowLeft, CheckCircle, ExternalLink } from "lucide-react";

const STYLE_COLORS: Record<string, string> = {
  red: "#74070E", white: "#C8A255", rosé: "#C47080",
  sparkling: "#B8A840", orange: "#C87840", fortified: "#8B4513",
};

export default async function ProducerPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  let winery: Awaited<ReturnType<typeof getWinery>> = null;
  try {
    winery = await getWinery(slug);
  } catch { /* DB unavailable */ }

  if (!winery) notFound();

  return (
    <div className="min-h-screen bg-butter">
      {/* Header */}
      <div className="bg-white border-b border-card-border/30">
        <div className="max-w-3xl mx-auto px-5 py-6">
          <Link href="/explore" className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-muted mb-4 hover:text-foreground transition-colors">
            <ArrowLeft className="h-3.5 w-3.5" /> Back to map
          </Link>

          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-[12px] bg-cherry/10 flex items-center justify-center flex-shrink-0">
              <Wine className="h-7 w-7 text-cherry" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="text-[24px] font-bold text-foreground tracking-tight" style={{ fontFamily: "Georgia, serif" }}>
                  {winery.name}
                </h1>
                {winery.verified && <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />}
                {winery.featured && <span className="text-[14px] text-[#C8A255]">★</span>}
              </div>
              <div className="flex items-center gap-3 mt-1 flex-wrap text-[12px] text-muted">
                <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {winery.region}, {winery.country}</span>
                {winery.founded && <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> Est. {winery.founded}</span>}
                {winery.owner && <span>Owner: {winery.owner}</span>}
              </div>
            </div>
          </div>

          {winery.description && (
            <p className="text-[14px] text-foreground/80 mt-4 leading-relaxed">{winery.description}</p>
          )}

          {/* Quick stats */}
          <div className="flex items-center gap-4 mt-4 flex-wrap">
            {winery.grapeVarieties.length > 0 && (
              <div className="flex items-center gap-1.5">
                <Grape className="h-3.5 w-3.5 text-cherry/60" />
                <div className="flex gap-1.5">
                  {winery.grapeVarieties.map((g) => (
                    <span key={g} className="px-2 py-0.5 rounded-[5px] bg-butter-dark text-[10px] font-semibold text-foreground/70">{g}</span>
                  ))}
                </div>
              </div>
            )}
            {winery.wineStyles.length > 0 && (
              <div className="flex items-center gap-1.5">
                {winery.wineStyles.map((s) => (
                  <span key={s} className="flex items-center gap-1 text-[11px] text-muted">
                    <span className="w-2 h-2 rounded-full" style={{ background: STYLE_COLORS[s] || "#8C7E6E" }} />
                    {s}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Links */}
          <div className="flex items-center gap-3 mt-4">
            {winery.website && (
              <a href={winery.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-[11px] font-semibold text-cherry hover:underline">
                <Globe className="h-3.5 w-3.5" /> Website
              </a>
            )}
            {winery.instagram && (
              <a href={`https://instagram.com/${winery.instagram}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-[11px] font-semibold text-cherry hover:underline">
                <ExternalLink className="h-3.5 w-3.5" /> Instagram
              </a>
            )}
            {winery.visitBooking && (
              <a href={winery.visitBooking} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-[11px] font-semibold text-white bg-cherry px-3 py-1.5 rounded-[7px] hover:bg-cherry/90 transition-colors">
                Book a visit
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Wines */}
      <div className="max-w-3xl mx-auto px-5 py-8">
        <h2 className="text-[17px] font-bold text-foreground mb-4" style={{ fontFamily: "Georgia, serif" }}>
          Wines <span className="text-muted font-normal text-[13px]">({winery._count.wines})</span>
        </h2>

        {winery.wines.length > 0 ? (
          <div className="grid gap-3">
            {winery.wines.map((wine) => (
              <Link
                key={wine.id}
                href={`/wines/${wine.id}`}
                className="flex items-center gap-3 bg-white rounded-[10px] border border-card-border/30 px-4 py-3 hover:border-cherry/20 transition-colors"
              >
                <div className="w-[3px] h-10 rounded-full flex-shrink-0" style={{ background: STYLE_COLORS[wine.type] || "#8C7E6E" }} />
                <div className="flex-1 min-w-0">
                  <p className="text-[14px] font-semibold text-foreground">{wine.name}</p>
                  <p className="text-[11px] text-muted mt-0.5">
                    {wine.appellation || wine.region}{wine.vintage ? ` · ${wine.vintage}` : ""}{wine.grapes.length > 0 ? ` · ${wine.grapes.join(", ")}` : ""}
                  </p>
                </div>
                {wine.priceRange && (
                  <span className="text-[10px] font-semibold text-cherry bg-cherry/[0.07] px-2 py-0.5 rounded-[5px] flex-shrink-0">
                    {wine.priceRange}
                  </span>
                )}
              </Link>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-[10px] border border-card-border/30 px-6 py-12 text-center">
            <Wine className="h-8 w-8 text-muted/20 mx-auto mb-3" />
            <p className="text-[14px] font-semibold text-foreground">No wines listed yet</p>
            <p className="text-[12px] text-muted mt-1">Wines will appear here as they are added to the database.</p>
          </div>
        )}
      </div>
    </div>
  );
}
