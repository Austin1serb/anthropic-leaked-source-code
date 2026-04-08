import Link from "next/link";
import { getWineries } from "@/lib/wineryActions";
import { Plus, MapPin, Wine, CheckCircle } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function ProducersPage() {
  let wineries: Awaited<ReturnType<typeof getWineries>> = [];
  try {
    wineries = await getWineries();
  } catch { /* DB unavailable */ }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-[22px] font-bold text-foreground" style={{ fontFamily: "Georgia, serif" }}>Producers</h1>
          <p className="text-[13px] text-muted mt-1">{wineries.length} producers in the database</p>
        </div>
        <Link
          href="/admin/producers/new"
          className="flex items-center gap-2 h-10 px-4 rounded-[10px] bg-cherry text-white text-[13px] font-semibold hover:bg-cherry/90 transition-colors"
        >
          <Plus className="h-4 w-4" /> Add Producer
        </Link>
      </div>

      <div className="bg-white rounded-[12px] border border-card-border/40 overflow-hidden">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-card-border/30 text-[11px] font-bold text-muted uppercase tracking-wider">
              <th className="px-4 py-3">Producer</th>
              <th className="px-4 py-3">Region</th>
              <th className="px-4 py-3">Wines</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {wineries.map((w) => (
              <tr key={w.id} className="border-b border-card-border/20 hover:bg-butter/50 transition-colors">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-cherry/10 flex items-center justify-center flex-shrink-0">
                      <Wine className="h-4 w-4 text-cherry" />
                    </div>
                    <div>
                      <p className="text-[14px] font-semibold text-foreground">{w.name}</p>
                      <p className="text-[11px] text-muted">{w.country}{w.founded ? ` · Est. ${w.founded}` : ""}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1.5 text-[12px] text-muted">
                    <MapPin className="h-3 w-3" /> {w.region}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className="text-[12px] font-semibold text-foreground">{w._count.wines}</span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1.5">
                    {w.verified && <span className="flex items-center gap-1 text-[10px] font-semibold text-green-700"><CheckCircle className="h-3 w-3" /> Verified</span>}
                    {w.featured && <span className="text-[10px] font-semibold text-[#C8A255]">★ Featured</span>}
                  </div>
                </td>
                <td className="px-4 py-3 text-right">
                  <Link href={`/producers/${w.slug}`} className="text-[11px] font-semibold text-cherry hover:underline">View</Link>
                </td>
              </tr>
            ))}
            {wineries.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-12 text-center text-[13px] text-muted">No producers yet. Add your first one.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
