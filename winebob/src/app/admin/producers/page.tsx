import Link from "next/link";
import { getWineries } from "@/lib/wineryActions";
import { Plus, Download, Upload, Filter, CheckCircle } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function ProducersPage() {
  let wineries: Awaited<ReturnType<typeof getWineries>> = [];
  try { wineries = await getWineries(); } catch {}

  const verified = wineries.filter(w => w.verified).length;
  const featured = wineries.filter(w => w.featured).length;

  return (
    <div className="-mx-6 -mt-8">
      {/* Top bar */}
      <div className="px-5 pt-4 pb-3 flex items-center justify-between border-b border-card-border/30">
        <div>
          <h1 className="text-[15px] font-bold text-foreground">Producers</h1>
          <p className="text-[11px] text-muted">{wineries.length} producers · {verified} verified · {featured} featured</p>
        </div>
        <div className="flex items-center gap-1.5">
          <button className="h-7 px-2.5 rounded-[5px] border border-card-border/50 text-[10px] font-medium text-muted flex items-center gap-1 hover:bg-butter"><Download className="h-3 w-3" /> Export</button>
          <button className="h-7 px-2.5 rounded-[5px] border border-card-border/50 text-[10px] font-medium text-muted flex items-center gap-1 hover:bg-butter"><Upload className="h-3 w-3" /> Import</button>
          <Link href="/admin/producers/new" className="h-7 px-3 rounded-[5px] bg-cherry text-white text-[10px] font-semibold flex items-center gap-1 hover:bg-cherry/90">
            <Plus className="h-3 w-3" /> Add producer
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div className="px-5 py-2 flex items-center gap-3 border-b border-card-border/20">
        <form className="flex items-center gap-2">
          <input name="search" placeholder="Search producers..." className="h-6 w-52 px-2 text-[11px] rounded-[4px] border border-card-border/40 outline-none focus:border-cherry/30" />
          <button className="h-6 px-2 rounded-[4px] text-[10px] text-muted border border-card-border/40 flex items-center gap-1 hover:bg-butter"><Filter className="h-2.5 w-2.5" /> Filter</button>
        </form>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-[11px]">
          <thead>
            <tr className="border-b border-card-border/30 bg-butter/50">
              <th className="w-8 px-2 py-1.5 text-center"><input type="checkbox" className="h-3 w-3 accent-cherry" /></th>
              <th className="text-left px-2 py-1.5 text-[9px] font-bold text-muted uppercase tracking-wider">Producer</th>
              <th className="text-left px-2 py-1.5 text-[9px] font-bold text-muted uppercase tracking-wider w-[100px]">Region</th>
              <th className="text-left px-2 py-1.5 text-[9px] font-bold text-muted uppercase tracking-wider w-[70px]">Country</th>
              <th className="text-center px-2 py-1.5 text-[9px] font-bold text-muted uppercase tracking-wider w-[50px]">Wines</th>
              <th className="text-left px-2 py-1.5 text-[9px] font-bold text-muted uppercase tracking-wider w-[65px]">Founded</th>
              <th className="text-left px-2 py-1.5 text-[9px] font-bold text-muted uppercase tracking-wider w-[120px]">Grapes</th>
              <th className="text-left px-2 py-1.5 text-[9px] font-bold text-muted uppercase tracking-wider w-[80px]">Styles</th>
              <th className="text-center px-2 py-1.5 text-[9px] font-bold text-muted uppercase tracking-wider w-[50px]">Status</th>
              <th className="text-right px-2 py-1.5 text-[9px] font-bold text-muted uppercase tracking-wider w-[70px]">Coords</th>
              <th className="w-8"></th>
            </tr>
          </thead>
          <tbody>
            {wineries.map((w) => (
              <tr key={w.id} className="border-b border-card-border/10 hover:bg-blue-50/30 group">
                <td className="px-2 py-[5px] text-center"><input type="checkbox" className="h-3 w-3 accent-cherry" /></td>
                <td className="px-2 py-[5px]">
                  <Link href={`/admin/producers/${w.id}/edit`} className="font-semibold text-foreground hover:text-cherry truncate block max-w-[200px]">{w.name}</Link>
                </td>
                <td className="px-2 py-[5px] text-muted truncate">{w.region}</td>
                <td className="px-2 py-[5px] text-muted">{w.country}</td>
                <td className="px-2 py-[5px] text-center font-semibold">{w._count.wines}</td>
                <td className="px-2 py-[5px] text-muted">{w.founded || "—"}</td>
                <td className="px-2 py-[5px] text-muted truncate max-w-[120px]">{w.grapeVarieties.slice(0, 2).join(", ") || "—"}</td>
                <td className="px-2 py-[5px] text-muted">{w.wineStyles.join(", ") || "—"}</td>
                <td className="px-2 py-[5px] text-center">
                  <div className="flex items-center justify-center gap-1">
                    {w.verified && <CheckCircle className="h-3 w-3 text-green-600" />}
                    {w.featured && <span className="text-[10px] text-[#C8A255]">★</span>}
                    {!w.verified && !w.featured && <span className="text-muted">—</span>}
                  </div>
                </td>
                <td className="px-2 py-[5px] text-right text-[9px] text-muted font-mono">{w.lat.toFixed(2)}, {w.lng.toFixed(2)}</td>
                <td className="px-2 py-[5px] text-right opacity-0 group-hover:opacity-100"><Link href={`/admin/producers/${w.id}/edit`} className="text-[9px] text-cherry hover:underline">Edit</Link></td>
              </tr>
            ))}
            {wineries.length === 0 && (
              <tr><td colSpan={11} className="px-3 py-6 text-center text-[11px] text-muted">No producers yet</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
