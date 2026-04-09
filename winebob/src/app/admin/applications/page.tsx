import { getApplications } from "@/lib/wineryActions";
import { CheckCircle, XCircle, Clock } from "lucide-react";

export const dynamic = "force-dynamic";

const STATUS_STYLE: Record<string, { icon: React.ReactNode; cls: string }> = {
  pending: { icon: <Clock className="h-3 w-3" />, cls: "text-amber-600 bg-amber-50" },
  approved: { icon: <CheckCircle className="h-3 w-3" />, cls: "text-green-700 bg-green-50" },
  rejected: { icon: <XCircle className="h-3 w-3" />, cls: "text-red-600 bg-red-50" },
};

export default async function ApplicationsPage() {
  let apps: Awaited<ReturnType<typeof getApplications>> = [];
  try { apps = await getApplications(); } catch {}

  const pending = apps.filter(a => a.status === "pending").length;

  return (
    <div className="-mx-6 -mt-8">
      <div className="px-5 pt-4 pb-3 flex items-center justify-between border-b border-card-border/30">
        <div>
          <h1 className="text-[15px] font-bold text-foreground">Applications</h1>
          <p className="text-[11px] text-muted">{apps.length} total · {pending} pending review</p>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-[11px]">
          <thead>
            <tr className="border-b border-card-border/30 bg-butter/50">
              <th className="text-left px-3 py-1.5 text-[9px] font-bold text-muted uppercase tracking-wider">Applicant</th>
              <th className="text-left px-3 py-1.5 text-[9px] font-bold text-muted uppercase tracking-wider w-[70px]">Type</th>
              <th className="text-left px-3 py-1.5 text-[9px] font-bold text-muted uppercase tracking-wider">Winery</th>
              <th className="text-left px-3 py-1.5 text-[9px] font-bold text-muted uppercase tracking-wider w-[80px]">Role</th>
              <th className="text-left px-3 py-1.5 text-[9px] font-bold text-muted uppercase tracking-wider">Message</th>
              <th className="text-center px-3 py-1.5 text-[9px] font-bold text-muted uppercase tracking-wider w-[70px]">Status</th>
              <th className="text-left px-3 py-1.5 text-[9px] font-bold text-muted uppercase tracking-wider w-[80px]">Date</th>
              <th className="w-8"></th>
            </tr>
          </thead>
          <tbody>
            {apps.map((a) => {
              const st = STATUS_STYLE[a.status] ?? STATUS_STYLE.pending;
              return (
                <tr key={a.id} className="border-b border-card-border/10 hover:bg-blue-50/30 group">
                  <td className="px-3 py-[5px]">
                    <div>
                      <span className="font-semibold text-foreground">{a.applicantName}</span>
                      <span className="text-[9px] text-muted ml-1.5">{a.applicantEmail}</span>
                    </div>
                  </td>
                  <td className="px-3 py-[5px]">
                    <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded capitalize ${a.type === "claim" ? "bg-blue-50 text-blue-700" : "bg-purple-50 text-purple-700"}`}>{a.type}</span>
                  </td>
                  <td className="px-3 py-[5px] text-muted">
                    {a.winery ? a.winery.name : a.wineryName || "—"}
                  </td>
                  <td className="px-3 py-[5px] text-muted">{a.applicantRole || "—"}</td>
                  <td className="px-3 py-[5px] text-muted truncate max-w-[200px]">{a.message || "—"}</td>
                  <td className="px-3 py-[5px] text-center">
                    <span className={`inline-flex items-center gap-1 text-[9px] font-semibold px-1.5 py-0.5 rounded ${st.cls}`}>{st.icon} {a.status}</span>
                  </td>
                  <td className="px-3 py-[5px] text-[9px] text-muted">{a.createdAt.toLocaleDateString()}</td>
                  <td className="px-3 py-[5px] text-right opacity-0 group-hover:opacity-100"><span className="text-muted cursor-pointer hover:text-foreground">···</span></td>
                </tr>
              );
            })}
            {apps.length === 0 && (
              <tr><td colSpan={8} className="px-3 py-6 text-center text-[11px] text-muted">No applications yet. Producers can apply at /apply</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
