"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Trash2 } from "lucide-react";
import { getWineryById, updateWinery, deleteWinery } from "@/lib/wineryActions";

type W = NonNullable<Awaited<ReturnType<typeof getWineryById>>>;

export default function EditProducerPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const [w, setW] = useState<W | null>(null);
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => { getWineryById(id).then(setW).catch(() => {}); }, [id]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const fd = new FormData(e.currentTarget);
    const g = (k: string) => (fd.get(k) as string) || null;
    try {
      await updateWinery(id, {
        name: fd.get("name") as string, slug: fd.get("slug") as string,
        description: g("description"), history: g("history"), philosophy: g("philosophy"),
        founded: fd.get("founded") ? Number(fd.get("founded")) : null,
        owner: g("owner"), winemaker: g("winemaker"), website: g("website"),
        email: g("email"), phone: g("phone"), instagram: g("instagram"),
        lat: Number(fd.get("lat")) || 0, lng: Number(fd.get("lng")) || 0,
        address: g("address"), region: fd.get("region") as string, country: fd.get("country") as string,
        featured: fd.get("featured") === "on", visitBooking: g("visitBooking"),
        annualBottles: fd.get("annualBottles") ? Number(fd.get("annualBottles")) : null,
        vineyardSize: g("vineyardSize"),
        grapeVarieties: (g("grapeVarieties") ?? "").split(",").map(s => s.trim()).filter(Boolean),
        wineStyles: (g("wineStyles") ?? "").split(",").map(s => s.trim()).filter(Boolean),
        certifications: (g("certifications") ?? "").split(",").map(s => s.trim()).filter(Boolean),
      });
      router.push("/admin/producers");
    } catch { alert("Failed to update."); }
    finally { setLoading(false); }
  }

  async function handleDelete() {
    if (!confirm(`Delete "${w?.name}"? This will unlink all their wines.`)) return;
    setDeleting(true);
    try { await deleteWinery(id); router.push("/admin/producers"); }
    catch { alert("Failed to delete."); setDeleting(false); }
  }

  if (!w) return <div className="p-5 text-[11px] text-muted">Loading...</div>;

  const i = "h-[26px] px-2 text-[11px] rounded-[4px] border border-card-border/50 bg-white outline-none focus:border-cherry/30 w-full";
  const l = "text-[9px] font-semibold text-muted/70 uppercase tracking-wide leading-none mb-0.5 block";

  return (
    <div className="-mx-6 -mt-8">
      <div className="px-5 pt-4 pb-3 flex items-center justify-between border-b border-card-border/30">
        <div className="flex items-center gap-3">
          <Link href="/admin/producers" className="text-muted hover:text-foreground"><ArrowLeft className="h-3.5 w-3.5" /></Link>
          <h1 className="text-[14px] font-bold text-foreground">Edit: {w.name}</h1>
          <span className="text-[9px] text-muted bg-muted/[0.08] px-1.5 py-0.5 rounded">{w._count.wines} wines</span>
        </div>
        <button onClick={handleDelete} disabled={deleting} className="h-7 px-2.5 rounded-[5px] border border-red-200 text-[10px] font-medium text-red-600 flex items-center gap-1 hover:bg-red-50 disabled:opacity-50">
          <Trash2 className="h-3 w-3" /> {deleting ? "Deleting..." : "Delete"}
        </button>
      </div>

      <form onSubmit={handleSubmit} className="px-5 py-4">
        <div className="grid grid-cols-3 gap-4">
          {/* Col 1 */}
          <div className="space-y-1.5">
            <p className="text-[9px] font-bold text-muted uppercase tracking-wider mb-2">Identity</p>
            <div><label className={l}>Name</label><input name="name" required defaultValue={w.name} className={i} /></div>
            <div className="grid grid-cols-2 gap-1.5">
              <div><label className={l}>Slug</label><input name="slug" required defaultValue={w.slug} className={i} /></div>
              <div><label className={l}>Founded</label><input name="founded" type="number" defaultValue={w.founded ?? ""} className={i} /></div>
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              <div><label className={l}>Owner</label><input name="owner" defaultValue={w.owner ?? ""} className={i} /></div>
              <div><label className={l}>Winemaker</label><input name="winemaker" defaultValue={w.winemaker ?? ""} className={i} /></div>
            </div>
            <div><label className={l}>Description</label><input name="description" defaultValue={w.description ?? ""} className={i} /></div>
            <div><label className={l}>Philosophy</label><input name="philosophy" defaultValue={w.philosophy ?? ""} className={i} /></div>
            <div><label className={l}>History</label><textarea name="history" rows={2} defaultValue={w.history ?? ""} className="w-full px-2 py-1 text-[11px] rounded-[4px] border border-card-border/50 outline-none focus:border-cherry/30 resize-none" /></div>
          </div>

          {/* Col 2 */}
          <div className="space-y-1.5">
            <p className="text-[9px] font-bold text-muted uppercase tracking-wider mb-2">Location</p>
            <div className="grid grid-cols-2 gap-1.5">
              <div><label className={l}>Region</label><input name="region" required defaultValue={w.region} className={i} /></div>
              <div><label className={l}>Country</label><input name="country" required defaultValue={w.country} className={i} /></div>
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              <div><label className={l}>Latitude</label><input name="lat" required type="number" step="any" defaultValue={w.lat} className={i} /></div>
              <div><label className={l}>Longitude</label><input name="lng" required type="number" step="any" defaultValue={w.lng} className={i} /></div>
            </div>
            <div><label className={l}>Address</label><input name="address" defaultValue={w.address ?? ""} className={i} /></div>

            <p className="text-[9px] font-bold text-muted uppercase tracking-wider pt-2 mb-2">Contact</p>
            <div className="grid grid-cols-2 gap-1.5">
              <div><label className={l}>Website</label><input name="website" defaultValue={w.website ?? ""} className={i} /></div>
              <div><label className={l}>Email</label><input name="email" defaultValue={w.email ?? ""} className={i} /></div>
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              <div><label className={l}>Phone</label><input name="phone" defaultValue={w.phone ?? ""} className={i} /></div>
              <div><label className={l}>Instagram</label><input name="instagram" defaultValue={w.instagram ?? ""} className={i} /></div>
            </div>
            <div><label className={l}>Booking URL</label><input name="visitBooking" defaultValue={w.visitBooking ?? ""} className={i} /></div>
          </div>

          {/* Col 3 */}
          <div className="space-y-1.5">
            <p className="text-[9px] font-bold text-muted uppercase tracking-wider mb-2">Production</p>
            <div className="grid grid-cols-2 gap-1.5">
              <div><label className={l}>Vineyard Size</label><input name="vineyardSize" defaultValue={w.vineyardSize ?? ""} className={i} /></div>
              <div><label className={l}>Annual Bottles</label><input name="annualBottles" type="number" defaultValue={w.annualBottles ?? ""} className={i} /></div>
            </div>
            <div><label className={l}>Grapes</label><input name="grapeVarieties" defaultValue={w.grapeVarieties.join(", ")} className={i} /></div>
            <div><label className={l}>Styles</label><input name="wineStyles" defaultValue={w.wineStyles.join(", ")} className={i} /></div>
            <div><label className={l}>Certifications</label><input name="certifications" defaultValue={(w as any).certifications?.join(", ") ?? ""} className={i} /></div>
            <div className="flex items-center gap-1.5 pt-1">
              <input name="featured" type="checkbox" id="featured" defaultChecked={w.featured} className="h-3 w-3 accent-cherry" />
              <label htmlFor="featured" className="text-[10px] font-medium text-muted">Featured</label>
            </div>

            {/* Wines quick list */}
            {w.wines.length > 0 && (
              <>
                <p className="text-[9px] font-bold text-muted uppercase tracking-wider pt-3 mb-1">Wines ({w._count.wines})</p>
                <div className="space-y-0.5 max-h-[180px] overflow-y-auto">
                  {w.wines.map(wine => (
                    <Link key={wine.id} href={`/admin/wines/${wine.id}/edit`} className="flex items-center gap-1.5 py-0.5 text-[10px] text-foreground/80 hover:text-cherry">
                      <span className="w-[2px] h-3 rounded-full flex-shrink-0" style={{ background: wine.type === "red" ? "#74070E" : wine.type === "white" ? "#C8A255" : "#8C7E6E" }} />
                      <span className="truncate">{wine.name}</span>
                    </Link>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        <div className="flex justify-end mt-5 pt-3 border-t border-card-border/20">
          <Link href="/admin/producers" className="h-7 px-3 rounded-[5px] text-[10px] font-medium text-muted mr-2 flex items-center hover:bg-butter">Cancel</Link>
          <button type="submit" disabled={loading} className="h-7 px-4 rounded-[5px] bg-cherry text-white text-[10px] font-semibold disabled:opacity-50">
            {loading ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </form>
    </div>
  );
}
