"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { createWine, getWineries } from "@/lib/wineryActions";

type WineryOption = { id: string; name: string; region: string };

export default function NewWinePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [wineries, setWineries] = useState<WineryOption[]>([]);

  useEffect(() => {
    getWineries().then(list => setWineries(list.map(w => ({ id: w.id, name: w.name, region: w.region })))).catch(() => {});
  }, []);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const fd = new FormData(e.currentTarget);
    const g = (k: string) => (fd.get(k) as string) || undefined;
    try {
      await createWine({
        name: fd.get("name") as string, wineryId: fd.get("wineryId") as string,
        type: fd.get("type") as string,
        vintage: fd.get("vintage") ? Number(fd.get("vintage")) : undefined,
        grapes: (g("grapes") ?? "").split(",").map(s => s.trim()).filter(Boolean),
        appellation: g("appellation"), description: g("description"),
        priceRange: g("priceRange"), abv: fd.get("abv") ? Number(fd.get("abv")) : undefined,
        tastingNotes: g("tastingNotes"), foodPairing: g("foodPairing"),
      });
      router.push("/admin/wines");
    } catch { alert("Failed to create wine."); }
    finally { setLoading(false); }
  }

  const i = "h-[26px] px-2 text-[11px] rounded-[4px] border border-card-border/50 bg-white outline-none focus:border-cherry/30 w-full";
  const s = "h-[26px] px-2 text-[11px] rounded-[4px] border border-card-border/50 bg-white outline-none focus:border-cherry/30 w-full";
  const l = "text-[9px] font-semibold text-muted/70 uppercase tracking-wide leading-none mb-0.5 block";

  return (
    <div className="-mx-6 -mt-8">
      <div className="px-5 pt-4 pb-3 flex items-center gap-3 border-b border-card-border/30">
        <Link href="/admin/wines" className="text-muted hover:text-foreground"><ArrowLeft className="h-3.5 w-3.5" /></Link>
        <h1 className="text-[14px] font-bold text-foreground">New Wine</h1>
      </div>

      <form onSubmit={handleSubmit} className="px-5 py-4">
        <div className="grid grid-cols-3 gap-4">
          {/* Col 1: Core */}
          <div className="space-y-1.5">
            <p className="text-[9px] font-bold text-muted uppercase tracking-wider mb-2">Core</p>
            <div><label className={l}>Producer *</label>
              <select name="wineryId" required className={s}>
                <option value="">Select...</option>
                {wineries.map(w => <option key={w.id} value={w.id}>{w.name} ({w.region})</option>)}
              </select>
            </div>
            <div><label className={l}>Wine Name *</label><input name="name" required className={i} placeholder="Chambertin Grand Cru" /></div>
            <div className="grid grid-cols-3 gap-1.5">
              <div><label className={l}>Type *</label>
                <select name="type" required className={s}>
                  <option value="red">Red</option><option value="white">White</option>
                  <option value="rosé">Rosé</option><option value="sparkling">Sparkling</option>
                  <option value="orange">Orange</option><option value="dessert">Dessert</option>
                  <option value="fortified">Fortified</option>
                </select>
              </div>
              <div><label className={l}>Vintage</label><input name="vintage" type="number" className={i} placeholder="NV" /></div>
              <div><label className={l}>ABV %</label><input name="abv" type="number" step="0.1" className={i} placeholder="13.5" /></div>
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              <div><label className={l}>Appellation</label><input name="appellation" className={i} /></div>
              <div><label className={l}>Price</label>
                <select name="priceRange" className={s}>
                  <option value="">—</option><option value="budget">&lt;$15</option>
                  <option value="mid">$15-40</option><option value="premium">$40-100</option>
                  <option value="luxury">$100+</option>
                </select>
              </div>
            </div>
            <div><label className={l}>Grapes</label><input name="grapes" className={i} placeholder="Pinot Noir, Chardonnay" /></div>
          </div>

          {/* Col 2: Tasting */}
          <div className="space-y-1.5">
            <p className="text-[9px] font-bold text-muted uppercase tracking-wider mb-2">Tasting</p>
            <div><label className={l}>Description</label><textarea name="description" rows={2} className="w-full px-2 py-1 text-[11px] rounded-[4px] border border-card-border/50 outline-none focus:border-cherry/30 resize-none" placeholder="Short description..." /></div>
            <div><label className={l}>Tasting Notes</label><textarea name="tastingNotes" rows={3} className="w-full px-2 py-1 text-[11px] rounded-[4px] border border-card-border/50 outline-none focus:border-cherry/30 resize-none" placeholder="Dark cherry, earth, silk tannins..." /></div>
            <div><label className={l}>Food Pairing</label><input name="foodPairing" className={i} placeholder="Aged Comté, roast duck" /></div>
          </div>

          {/* Col 3: Preview placeholder */}
          <div>
            <p className="text-[9px] font-bold text-muted uppercase tracking-wider mb-2">Preview</p>
            <div className="rounded-[6px] border border-dashed border-card-border/40 p-3 text-center text-[10px] text-muted">
              Wine card preview will appear here once label images are supported
            </div>
          </div>
        </div>

        <div className="flex justify-end mt-5 pt-3 border-t border-card-border/20">
          <Link href="/admin/wines" className="h-7 px-3 rounded-[5px] text-[10px] font-medium text-muted mr-2 flex items-center hover:bg-butter">Cancel</Link>
          <button type="submit" disabled={loading} className="h-7 px-4 rounded-[5px] bg-cherry text-white text-[10px] font-semibold disabled:opacity-50">
            {loading ? "Creating..." : "Create Wine"}
          </button>
        </div>
      </form>
    </div>
  );
}
