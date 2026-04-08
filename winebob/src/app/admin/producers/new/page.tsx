"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { createWinery } from "@/lib/wineryActions";

function slugify(s: string) { return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""); }

export default function NewProducerPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const fd = new FormData(e.currentTarget);
    const g = (k: string) => (fd.get(k) as string) || undefined;
    try {
      await createWinery({
        name: fd.get("name") as string, slug: fd.get("slug") as string,
        description: g("description"), history: g("history"), philosophy: g("philosophy"),
        founded: fd.get("founded") ? Number(fd.get("founded")) : undefined,
        owner: g("owner"), winemaker: g("winemaker"), website: g("website"),
        email: g("email"), phone: g("phone"), instagram: g("instagram"),
        lat: Number(fd.get("lat")) || 0, lng: Number(fd.get("lng")) || 0,
        address: g("address"), region: fd.get("region") as string, country: fd.get("country") as string,
        featured: fd.get("featured") === "on", visitBooking: g("visitBooking"),
        annualBottles: fd.get("annualBottles") ? Number(fd.get("annualBottles")) : undefined,
        vineyardSize: g("vineyardSize"),
        grapeVarieties: (g("grapeVarieties") ?? "").split(",").map(s => s.trim()).filter(Boolean),
        wineStyles: (g("wineStyles") ?? "").split(",").map(s => s.trim()).filter(Boolean),
        certifications: (g("certifications") ?? "").split(",").map(s => s.trim()).filter(Boolean),
      });
      router.push("/admin/producers");
    } catch { alert("Failed to create producer."); }
    finally { setLoading(false); }
  }

  const i = "h-[26px] px-2 text-[11px] rounded-[4px] border border-card-border/50 bg-white outline-none focus:border-cherry/30 w-full";
  const l = "text-[9px] font-semibold text-muted/70 uppercase tracking-wide leading-none mb-0.5 block";

  return (
    <div className="-mx-6 -mt-8">
      <div className="px-5 pt-4 pb-3 flex items-center gap-3 border-b border-card-border/30">
        <Link href="/admin/producers" className="text-muted hover:text-foreground"><ArrowLeft className="h-3.5 w-3.5" /></Link>
        <h1 className="text-[14px] font-bold text-foreground">New Producer</h1>
      </div>

      <form onSubmit={handleSubmit} className="px-5 py-4">
        <div className="grid grid-cols-3 gap-4">
          {/* Col 1: Identity */}
          <div className="space-y-3">
            <p className="text-[9px] font-bold text-muted uppercase tracking-wider">Identity</p>
            <div className="space-y-1.5">
              <div><label className={l}>Name *</label><input name="name" required value={name} onChange={e => setName(e.target.value)} className={i} /></div>
              <div className="grid grid-cols-2 gap-1.5">
                <div><label className={l}>Slug *</label><input name="slug" required defaultValue={slugify(name)} key={name} className={i} /></div>
                <div><label className={l}>Founded</label><input name="founded" type="number" className={i} placeholder="1232" /></div>
              </div>
              <div className="grid grid-cols-2 gap-1.5">
                <div><label className={l}>Owner</label><input name="owner" className={i} /></div>
                <div><label className={l}>Winemaker</label><input name="winemaker" className={i} /></div>
              </div>
              <div><label className={l}>Description</label><input name="description" className={i} placeholder="Short description..." /></div>
              <div><label className={l}>Philosophy</label><input name="philosophy" className={i} placeholder="Biodynamic, organic..." /></div>
              <div><label className={l}>History</label><textarea name="history" rows={2} className="w-full px-2 py-1 text-[11px] rounded-[4px] border border-card-border/50 outline-none focus:border-cherry/30 resize-none" /></div>
            </div>
          </div>

          {/* Col 2: Location + Contact */}
          <div className="space-y-3">
            <p className="text-[9px] font-bold text-muted uppercase tracking-wider">Location</p>
            <div className="space-y-1.5">
              <div className="grid grid-cols-2 gap-1.5">
                <div><label className={l}>Region *</label><input name="region" required className={i} placeholder="Burgundy" /></div>
                <div><label className={l}>Country *</label><input name="country" required className={i} placeholder="France" /></div>
              </div>
              <div className="grid grid-cols-2 gap-1.5">
                <div><label className={l}>Latitude *</label><input name="lat" required type="number" step="any" className={i} /></div>
                <div><label className={l}>Longitude *</label><input name="lng" required type="number" step="any" className={i} /></div>
              </div>
              <div><label className={l}>Address</label><input name="address" className={i} /></div>
            </div>

            <p className="text-[9px] font-bold text-muted uppercase tracking-wider pt-1">Contact</p>
            <div className="space-y-1.5">
              <div className="grid grid-cols-2 gap-1.5">
                <div><label className={l}>Website</label><input name="website" className={i} /></div>
                <div><label className={l}>Email</label><input name="email" className={i} /></div>
              </div>
              <div className="grid grid-cols-2 gap-1.5">
                <div><label className={l}>Phone</label><input name="phone" className={i} /></div>
                <div><label className={l}>Instagram</label><input name="instagram" className={i} placeholder="@handle" /></div>
              </div>
              <div><label className={l}>Booking URL</label><input name="visitBooking" className={i} /></div>
            </div>
          </div>

          {/* Col 3: Production */}
          <div className="space-y-3">
            <p className="text-[9px] font-bold text-muted uppercase tracking-wider">Production</p>
            <div className="space-y-1.5">
              <div className="grid grid-cols-2 gap-1.5">
                <div><label className={l}>Vineyard Size</label><input name="vineyardSize" className={i} placeholder="28 ha" /></div>
                <div><label className={l}>Annual Bottles</label><input name="annualBottles" type="number" className={i} /></div>
              </div>
              <div><label className={l}>Grape Varieties</label><input name="grapeVarieties" className={i} placeholder="Pinot Noir, Chardonnay" /></div>
              <div><label className={l}>Wine Styles</label><input name="wineStyles" className={i} placeholder="red, white" /></div>
              <div><label className={l}>Certifications</label><input name="certifications" className={i} placeholder="organic, biodynamic" /></div>
              <div className="flex items-center gap-1.5 pt-1">
                <input name="featured" type="checkbox" id="featured" className="h-3 w-3 accent-cherry" />
                <label htmlFor="featured" className="text-[10px] font-medium text-muted">Featured producer</label>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end mt-5 pt-3 border-t border-card-border/20">
          <Link href="/admin/producers" className="h-7 px-3 rounded-[5px] text-[10px] font-medium text-muted mr-2 flex items-center hover:bg-butter">Cancel</Link>
          <button type="submit" disabled={loading} className="h-7 px-4 rounded-[5px] bg-cherry text-white text-[10px] font-semibold disabled:opacity-50">
            {loading ? "Creating..." : "Create Producer"}
          </button>
        </div>
      </form>
    </div>
  );
}
