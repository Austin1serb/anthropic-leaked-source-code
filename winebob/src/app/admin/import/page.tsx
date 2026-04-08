import { getImportBatches } from "@/lib/importActions";
import { ImportForm } from "./ImportForm";
import { CheckCircle, XCircle, Clock, Database, Wine, AlertTriangle } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function ImportPage() {
  let batches: Awaited<ReturnType<typeof getImportBatches>> = [];
  try {
    batches = await getImportBatches();
  } catch { /* DB unavailable */ }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-[22px] font-bold text-foreground" style={{ fontFamily: "Georgia, serif" }}>
          Wine Data Import
        </h1>
        <p className="text-[13px] text-muted mt-1">
          Import wines from Apify Wine-Searcher Scraper datasets
        </p>
      </div>

      {/* Import form */}
      <div className="bg-white rounded-[12px] border border-card-border/40 p-6 mb-8 max-w-2xl">
        <h2 className="text-[16px] font-bold text-foreground mb-1" style={{ fontFamily: "Georgia, serif" }}>
          Import from Apify Dataset
        </h2>
        <p className="text-[12px] text-muted mb-4">
          Run the <strong>Wine Searcher Scraper</strong> on Apify, then paste the dataset ID or URL here.
        </p>

        <div className="bg-butter rounded-[8px] p-3 mb-4 text-[12px] text-foreground/70 space-y-1">
          <p className="font-semibold text-foreground">How it works:</p>
          <p>1. Go to Apify → Run the <code className="px-1 py-0.5 bg-white rounded text-cherry text-[11px]">mrbridge/wine-searcher-scraper-from-list</code> actor</p>
          <p>2. Input your wine names, URLs, or LWIN codes</p>
          <p>3. Once finished, copy the <strong>Dataset ID</strong> from the run output</p>
          <p>4. Paste it below and click Import</p>
        </div>

        <ImportForm />
      </div>

      {/* Import history */}
      <div>
        <h2 className="text-[16px] font-bold text-foreground mb-3" style={{ fontFamily: "Georgia, serif" }}>
          Import History
        </h2>

        {batches.length === 0 ? (
          <div className="bg-white rounded-[12px] border border-card-border/40 px-6 py-12 text-center">
            <Database className="h-8 w-8 text-muted/20 mx-auto mb-2" />
            <p className="text-[13px] text-muted">No imports yet</p>
          </div>
        ) : (
          <div className="bg-white rounded-[12px] border border-card-border/40 overflow-hidden">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-card-border/30 text-[11px] font-bold text-muted uppercase tracking-wider">
                  <th className="px-4 py-3">Source</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Records</th>
                  <th className="px-4 py-3">Created</th>
                  <th className="px-4 py-3">Updated</th>
                  <th className="px-4 py-3">Failed</th>
                  <th className="px-4 py-3">Date</th>
                </tr>
              </thead>
              <tbody>
                {batches.map((b) => (
                  <tr key={b.id} className="border-b border-card-border/20 hover:bg-butter/50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Wine className="h-3.5 w-3.5 text-cherry" />
                        <span className="text-[12px] font-medium text-foreground">{b.source}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {b.status === "completed" && (
                        <span className="flex items-center gap-1 text-[10px] font-semibold text-green-700">
                          <CheckCircle className="h-3 w-3" /> Completed
                        </span>
                      )}
                      {b.status === "failed" && (
                        <span className="flex items-center gap-1 text-[10px] font-semibold text-red-600">
                          <XCircle className="h-3 w-3" /> Failed
                        </span>
                      )}
                      {b.status === "running" && (
                        <span className="flex items-center gap-1 text-[10px] font-semibold text-amber-600">
                          <Clock className="h-3 w-3" /> Running
                        </span>
                      )}
                      {b.status === "queued" && (
                        <span className="flex items-center gap-1 text-[10px] font-semibold text-muted">
                          <Clock className="h-3 w-3" /> Queued
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-[12px] font-semibold text-foreground">{b.recordsFetched}</td>
                    <td className="px-4 py-3 text-[12px] text-green-700 font-semibold">{b.recordsCreated}</td>
                    <td className="px-4 py-3 text-[12px] text-blue-700 font-semibold">{b.recordsUpdated}</td>
                    <td className="px-4 py-3">
                      {b.recordsFailed > 0 ? (
                        <span className="text-[12px] text-red-600 font-semibold flex items-center gap-1">
                          <AlertTriangle className="h-3 w-3" /> {b.recordsFailed}
                        </span>
                      ) : (
                        <span className="text-[12px] text-muted">0</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-[11px] text-muted">
                      {new Date(b.startedAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
