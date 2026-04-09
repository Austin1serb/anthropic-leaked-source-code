"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Trash2 } from "lucide-react";
import { getWineById, getWineries, updateWine, deleteWine } from "@/lib/wineryActions";

type Wine = NonNullable<Awaited<ReturnType<typeof getWineById>>>;
type WineryOption = { id: string; name: string; region: string };

export default function EditWinePage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const [wine, setWine] = useState<Wine | null>(null);
  const [wineries, setWineries] = useState<WineryOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    getWineById(id).then(setWine).catch(() => {});
    getWineries().then(list => setWineries(list.map(w => ({ id: w.id, name: w.name, region: w.region })))).catch(() => {});
  }, [id]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const fd = new FormData(e.currentTarget);
    const g = (k: string) => (fd.get(k) as string) || null;
    try {
      await updateWine(id, {
        name: fd.get("name") as string, wineryId: g("wineryId"),
        type: fd.get("type") as string,
        vintage: fd.get("vintage") ? Number(fd.get("vintage")) : null,
        grapes: (g("grapes") ?? "").split(",").map(s => s.trim()).filter(Boolean),
        appellation: g("appellation"), description: g("description"),
        priceRange: g("priceRange"),
        abv: fd.get("abv") ? Number(fd.get("abv")) : null,
        tastingNotes: g("tastingNotes"), foodPairing: g("foodPairing"),
      });
      router.push("/admin/wines");
    } catch { alert("Failed to update."); }
    finally { setLoading(false); }
  }

  async function handleDelete() {
    if (!confirm(`Delete "${wine?.name}"?`)) return;
    setDeleting(true);
    try { await deleteWine(id); router.push("/admin/wines"); }
    catch { alert("Failed to delete."); setDeleting(false); }
  }

  if (!wine) return <div className="p-5 text-[11px] text-muted">Loading...</div>;

  const i = "h-[26px] px-2 text-[11px] rounded-[4px] border border-card-border/50 bg-white outline-none focus:border-cherry/30 w-full";
  const s = "h-[26px] px-2 text-[11px] rounded-[4px] border border-card-border/50 bg-white outline-none focus:border-cherry/30 w-full";
  const l = "text-[9px] font-semibold text-muted/70 uppercase tracking-wide leading-none mb-0.5 block";

  return (
    <div className="-mx-6 -mt-8">
      <div className="px-5 pt-4 pb-3 flex items-center justify-between border-b border-card-border/30">
        <div className="flex items-center gap-3">
          <Link href="/admin/wines" className="text-muted hover:text-foreground"><ArrowLeft className="h-3.5 w-3.5" /></Link>
          <h1 className="text-[14px] font-bold text-foreground">Edit: {wine.name}</h1>
          {wine.winery && <span className="text-[9px] text-muted">by {wine.winery.name}</span>}
        </div>
        <button onClick={handleDelete} disabled={deleting} className="h-7 px-2.5 rounded-[5px] border border-red-200 text-[10px] font-medium text-red-600 flex items-center gap-1 hover:bg-red-50 disabled:opacity-50">
          <Trash2 className="h-3 w-3" /> {deleting ? "Deleting..." : "Delete"}
        </button>
      </div>

      <form onSubmit={handleSubmit} className="px-5 py-4">
        <div className="grid grid-cols-3 gap-4">
          {/* Col 1: Core */}
          <div className="space-y-1.5">
            <p className="text-[9px] font-bold text-muted uppercase tracking-wider mb-2">Core</p>
            <div><label className={l}>Producer</label>
              <select name="wineryId" className={s} defaultValue={wine.wineryId ?? ""}>
                <option value="">Unlinked</option>
                {wineries.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
              </select>
            </div>
            <div><label className={l}>Wine Name</label><input name="name" required defaultValue={wine.name} className={i} /></div>
            <div className="grid grid-cols-3 gap-1.5">
              <div><label className={l}>Type</label>
                <select name="type" required defaultValue={wine.type} className={s}>
                  <option value="red">Red</option><option value="white">White</option>
                  <option value="rosé">Rosé</option><option value="sparkling">Sparkling</option>
                  <option value="orange">Orange</option><option value="dessert">Dessert</option>
                  <option value="fortified">Fortified</option>
                </select>
              </div>
              <div><label className={l}>Vintage</label><input name="vintage" type="number" defaultValue={wine.vintage ?? ""} className={i} /></div>
              <div><label className={l}>ABV</label><input name="abv" type="number" step="0.1" defaultValue={wine.abv ?? ""} className={i} /></div>
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              <div><label className={l}>Appellation</label><input name="appellation" defaultValue={wine.appellation ?? ""} className={i} /></div>
              <div><label className={l}>Price</label>
                <select name="priceRange" defaultValue={wine.priceRange ?? ""} className={s}>
                  <option value="">—</option><option value="budget">&lt;$15</option>
                  <option value="mid">$15-40</option><option value="premium">$40-100</option>
                  <option value="luxury">$100+</option>
                </select>
              </div>
            </div>
            <div><label className={l}>Grapes</label><input name="grapes" defaultValue={wine.grapes.join(", ")} className={i} /></div>
          </div>

          {/* Col 2: Tasting */}
          <div className="space-y-1.5">
            <p className="text-[9px] font-bold text-muted uppercase tracking-wider mb-2">Tasting</p>
            <div><label className={l}>Description</label><textarea name="description" rows={2} defaultValue={wine.description ?? ""} className="w-full px-2 py-1 text-[11px] rounded-[4px] border border-card-border/50 outline-none focus:border-cherry/30 resize-none" /></div>
            <div><label className={l}>Tasting Notes</label><textarea name="tastingNotes" rows={3} defaultValue={wine.tastingNotes ?? ""} className="w-full px-2 py-1 text-[11px] rounded-[4px] border border-card-border/50 outline-none focus:border-cherry/30 resize-none" /></div>
            <div><label className={l}>Food Pairing</label><input name="foodPairing" defaultValue={wine.foodPairing ?? ""} className={i} /></div>
          </div>

          {/* Col 3: Metadata */}
          <div className="space-y-1.5">
            <p className="text-[9px] font-bold text-muted uppercase tracking-wider mb-2">Metadata</p>
            <div className="space-y-1 text-[10px]">
              <div className="flex justify-between"><span className="text-muted">ID</span><span className="text-foreground font-mono text-[9px]">{wine.id}</span></div>
              <div className="flex justify-between"><span className="text-muted">Source</span><span className="text-foreground">{wine.source}</span></div>
              <div className="flex justify-between"><span className="text-muted">Confidence</span><span className="text-foreground">{(wine.confidence * 100).toFixed(0)}%</span></div>
              <div className="flex justify-between"><span className="text-muted">Region</span><span className="text-foreground">{wine.region}</span></div>
              <div className="flex justify-between"><span className="text-muted">Country</span><span className="text-foreground">{wine.country}</span></div>
              <div className="flex justify-between"><span className="text-muted">Created</span><span className="text-foreground">{wine.createdAt.toLocaleDateString()}</span></div>
              <div className="flex justify-between"><span className="text-muted">Updated</span><span className="text-foreground">{wine.updatedAt.toLocaleDateString()}</span></div>
              {wine.barcode && <div className="flex justify-between"><span className="text-muted">Barcode</span><span className="text-foreground font-mono text-[9px]">{wine.barcode}</span></div>}
              {wine.lwin && <div className="flex justify-between"><span className="text-muted">LWIN</span><span className="text-foreground font-mono text-[9px]">{wine.lwin}</span></div>}
            </div>
          </div>
        </div>

        <div className="flex justify-end mt-5 pt-3 border-t border-card-border/20">
          <Link href="/admin/wines" className="h-7 px-3 rounded-[5px] text-[10px] font-medium text-muted mr-2 flex items-center hover:bg-butter">Cancel</Link>
          <button type="submit" disabled={loading} className="h-7 px-4 rounded-[5px] bg-cherry text-white text-[10px] font-semibold disabled:opacity-50">
            {loading ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </form>
    </div>
  );
}
