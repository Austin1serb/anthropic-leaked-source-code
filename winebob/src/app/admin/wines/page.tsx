import Link from "next/link";
import { getWines } from "@/lib/wineryActions";
import { Plus, Download, Upload, Filter } from "lucide-react";

export const dynamic = "force-dynamic";

const TC: Record<string, string> = { red: "#74070E", white: "#C8A255", rosé: "#C47080", sparkling: "#B8A840", orange: "#C87840", fortified: "#8B4513", dessert: "#8B6914" };
const PL: Record<string, string> = { budget: "$", mid: "$$", premium: "$$$", luxury: "$$$$" };

export default async function WinesAdminPage({ searchParams }: { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }) {
  const params = await searchParams;
  const search = typeof params.search === "string" ? params.search : undefined;
  const type = typeof params.type === "string" ? params.type : undefined;

  let wines: Awaited<ReturnType<typeof getWines>> = [];
  try { wines = await getWines({ search, type }); } catch {}

  return (
    <div className="-mx-6 -mt-8">
      {/* Top bar */}
      <div className="px-5 pt-4 pb-3 flex items-center justify-between border-b border-card-border/30">
        <div>
          <h1 className="text-[15px] font-bold text-foreground">Wines</h1>
          <p className="text-[11px] text-muted">{wines.length} wines · {wines.filter(w => w.winery).length} linked to producers</p>
        </div>
        <div className="flex items-center gap-1.5">
          <button className="h-7 px-2.5 rounded-[5px] border border-card-border/50 text-[10px] font-medium text-muted flex items-center gap-1 hover:bg-butter"><Download className="h-3 w-3" /> Export</button>
          <button className="h-7 px-2.5 rounded-[5px] border border-card-border/50 text-[10px] font-medium text-muted flex items-center gap-1 hover:bg-butter"><Upload className="h-3 w-3" /> Import</button>
          <Link href="/admin/wines/new" className="h-7 px-3 rounded-[5px] bg-cherry text-white text-[10px] font-semibold flex items-center gap-1 hover:bg-cherry/90">
            <Plus className="h-3 w-3" /> Add wine
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div className="px-5 py-2 flex items-center gap-3 border-b border-card-border/20">
        <form className="flex items-center gap-2">
          <input name="search" defaultValue={search} placeholder="Search wines, producers..." className="h-6 w-52 px-2 text-[11px] rounded-[4px] border border-card-border/40 outline-none focus:border-cherry/30" />
          <button className="h-6 px-2 rounded-[4px] text-[10px] text-muted border border-card-border/40 flex items-center gap-1 hover:bg-butter"><Filter className="h-2.5 w-2.5" /> Filter</button>
        </form>
        <div className="flex items-center gap-1 ml-auto">
          {["red", "white", "rosé", "sparkling"].map(t => (
            <Link key={t} href={`/admin/wines?type=${t}`} className={`h-5 px-2 rounded-[3px] text-[9px] font-semibold capitalize ${type === t ? "bg-cherry text-white" : "text-muted hover:bg-butter border border-card-border/30"}`}>{t}</Link>
          ))}
          {type && <Link href="/admin/wines" className="h-5 px-2 rounded-[3px] text-[9px] text-cherry font-semibold hover:bg-cherry/5">Clear</Link>}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-[11px]">
          <thead>
            <tr className="border-b border-card-border/30 bg-butter/50">
              <th className="w-8 px-2 py-1.5 text-center"><input type="checkbox" className="h-3 w-3 accent-cherry" /></th>
              <th className="text-left px-2 py-1.5 text-[9px] font-bold text-muted uppercase tracking-wider">Wine</th>
              <th className="text-left px-2 py-1.5 text-[9px] font-bold text-muted uppercase tracking-wider w-[130px]">Producer</th>
              <th className="text-left px-2 py-1.5 text-[9px] font-bold text-muted uppercase tracking-wider w-[45px]">Type</th>
              <th className="text-left px-2 py-1.5 text-[9px] font-bold text-muted uppercase tracking-wider w-[60px]">Vintage</th>
              <th className="text-left px-2 py-1.5 text-[9px] font-bold text-muted uppercase tracking-wider w-[130px]">Appellation</th>
              <th className="text-left px-2 py-1.5 text-[9px] font-bold text-muted uppercase tracking-wider w-[100px]">Grapes</th>
              <th className="text-center px-2 py-1.5 text-[9px] font-bold text-muted uppercase tracking-wider w-[45px]">Price</th>
              <th className="text-center px-2 py-1.5 text-[9px] font-bold text-muted uppercase tracking-wider w-[50px]">Source</th>
              <th className="w-8"></th>
            </tr>
          </thead>
          <tbody>
            {wines.map((w) => (
              <tr key={w.id} className="border-b border-card-border/10 hover:bg-blue-50/30 group">
                <td className="px-2 py-[5px] text-center"><input type="checkbox" className="h-3 w-3 accent-cherry" /></td>
                <td className="px-2 py-[5px]">
                  <div className="flex items-center gap-1.5">
                    <span className="w-[2px] h-3.5 rounded-full flex-shrink-0" style={{ background: TC[w.type] || "#8C7E6E" }} />
                    <span className="font-semibold text-foreground truncate max-w-[250px]">{w.name}</span>
                  </div>
                </td>
                <td className="px-2 py-[5px]">
                  {w.winery ? <Link href={`/producers/${w.winery.slug}`} className="text-cherry hover:underline truncate block max-w-[120px]">{w.winery.name}</Link> : <span className="text-muted truncate block max-w-[120px]">{w.producer}</span>}
                </td>
                <td className="px-2 py-[5px] capitalize font-medium" style={{ color: TC[w.type] || "#8C7E6E" }}>{w.type}</td>
                <td className="px-2 py-[5px] text-muted">{w.vintage || "NV"}</td>
                <td className="px-2 py-[5px] text-muted truncate max-w-[130px]">{w.appellation || "—"}</td>
                <td className="px-2 py-[5px] text-muted truncate max-w-[100px]">{w.grapes.slice(0, 2).join(", ") || "—"}</td>
                <td className="px-2 py-[5px] text-center font-semibold">{PL[w.priceRange ?? ""] || "—"}</td>
                <td className="px-2 py-[5px] text-center"><span className="text-[8px] text-muted bg-muted/[0.08] px-1 py-0.5 rounded">{w.source}</span></td>
                <td className="px-2 py-[5px] text-right opacity-0 group-hover:opacity-100"><span className="text-muted cursor-pointer hover:text-foreground">···</span></td>
              </tr>
            ))}
            {wines.length === 0 && (
              <tr><td colSpan={10} className="px-3 py-6 text-center text-[11px] text-muted">{search ? `No results for "${search}"` : "No wines yet"}</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
