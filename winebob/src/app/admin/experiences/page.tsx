import Link from "next/link";
import { getAllExperiences } from "@/lib/experienceActions";
import { Plus, MapPin, Clock, Users, Calendar, CheckCircle, XCircle } from "lucide-react";

export const dynamic = "force-dynamic";

const TYPE_LABELS: Record<string, string> = {
  tasting: "Tasting",
  tour: "Tour",
  harvest: "Harvest",
  dinner: "Dinner",
  workshop: "Workshop",
  stay: "Stay",
};

function formatPrice(cents: number, currency: string) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency, minimumFractionDigits: 0 }).format(cents / 100);
}

export default async function AdminExperiencesPage() {
  let experiences: Awaited<ReturnType<typeof getAllExperiences>> = [];
  try {
    experiences = await getAllExperiences();
  } catch { /* DB unavailable */ }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-[22px] font-bold text-foreground" style={{ fontFamily: "Georgia, serif" }}>
            Experiences
          </h1>
          <p className="text-[13px] text-muted mt-1">
            {experiences.length} experience{experiences.length !== 1 ? "s" : ""} — tastings, tours, dinners, and more
          </p>
        </div>
        <Link
          href="/admin/experiences/new"
          className="flex items-center gap-2 h-10 px-4 rounded-[10px] bg-cherry text-white text-[13px] font-semibold hover:bg-cherry/90 transition-colors"
        >
          <Plus className="h-4 w-4" /> New Experience
        </Link>
      </div>

      <div className="bg-white rounded-[12px] border border-card-border/40 overflow-hidden">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-card-border/30 text-[11px] font-bold text-muted uppercase tracking-wider">
              <th className="px-4 py-3">Experience</th>
              <th className="px-4 py-3">Producer</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Price</th>
              <th className="px-4 py-3">Bookings</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {experiences.map((exp) => (
              <tr key={exp.id} className="border-b border-card-border/20 hover:bg-butter/50 transition-colors">
                <td className="px-4 py-3">
                  <p className="text-[14px] font-semibold text-foreground">{exp.title}</p>
                  <p className="text-[11px] text-muted flex items-center gap-1 mt-0.5">
                    <Clock className="h-3 w-3" /> {exp.duration}min · <Users className="h-3 w-3" /> max {exp.maxGuests}
                  </p>
                </td>
                <td className="px-4 py-3">
                  <p className="text-[12px] font-medium text-foreground">{exp.winery.name}</p>
                  <p className="text-[11px] text-muted flex items-center gap-1">
                    <MapPin className="h-3 w-3" /> {exp.winery.region}
                  </p>
                </td>
                <td className="px-4 py-3">
                  <span className="px-2 py-0.5 rounded-[5px] bg-butter-dark text-[11px] font-semibold text-foreground/70">
                    {TYPE_LABELS[exp.type] ?? exp.type}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className="text-[13px] font-semibold text-foreground">
                    {formatPrice(exp.pricePerPerson, exp.currency)}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className="text-[13px] font-semibold text-foreground">{exp._count.bookings}</span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1.5">
                    {exp.active ? (
                      <span className="flex items-center gap-1 text-[10px] font-semibold text-green-700">
                        <CheckCircle className="h-3 w-3" /> Active
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-[10px] font-semibold text-muted">
                        <XCircle className="h-3 w-3" /> Inactive
                      </span>
                    )}
                    {exp.featured && <span className="text-[10px] font-semibold text-[#C8A255]">★</span>}
                  </div>
                </td>
                <td className="px-4 py-3 text-right">
                  <Link href={`/admin/experiences/${exp.id}/edit`} className="text-[11px] font-semibold text-cherry hover:underline">
                    Edit
                  </Link>
                </td>
              </tr>
            ))}
            {experiences.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center text-[13px] text-muted">
                  No experiences yet. Create your first one.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
