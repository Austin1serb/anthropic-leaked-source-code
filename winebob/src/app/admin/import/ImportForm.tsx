"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { importFromApifyDataset } from "@/lib/importActions";
import { Upload, CheckCircle, AlertTriangle } from "lucide-react";

type ImportResult = {
  batchId: string;
  fetched: number;
  valid: number;
  created: number;
  updated: number;
  skipped: number;
  failed: number;
  errors: string[];
};

export function ImportForm() {
  const router = useRouter();
  const [datasetId, setDatasetId] = useState("");
  const [result, setResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setResult(null);

    if (!datasetId.trim()) {
      setError("Please enter a dataset ID or URL.");
      return;
    }

    startTransition(async () => {
      try {
        const res = await importFromApifyDataset(datasetId.trim());
        setResult(res);
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Import failed.");
      }
    });
  }

  return (
    <div>
      <form onSubmit={handleSubmit} className="flex gap-3">
        <input
          type="text"
          value={datasetId}
          onChange={(e) => setDatasetId(e.target.value)}
          placeholder="Dataset ID or URL (e.g. aBcDeFgHiJkLm or full Apify URL)"
          className="input-field flex-1"
          disabled={isPending}
        />
        <button
          type="submit"
          disabled={isPending || !datasetId.trim()}
          className="flex items-center gap-2 h-10 px-5 rounded-[10px] bg-cherry text-white text-[13px] font-semibold hover:bg-cherry/90 disabled:opacity-50 transition-colors whitespace-nowrap"
        >
          <Upload className="h-4 w-4" />
          {isPending ? "Importing..." : "Import"}
        </button>
      </form>

      {error && (
        <div className="mt-3 p-3 rounded-[8px] bg-red-50 border border-red-200 flex items-start gap-2">
          <AlertTriangle className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
          <p className="text-[12px] text-red-700">{error}</p>
        </div>
      )}

      {result && (
        <div className="mt-3 p-4 rounded-[8px] bg-green-50 border border-green-200">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <span className="text-[13px] font-bold text-green-800">Import complete</span>
          </div>
          <div className="grid grid-cols-4 gap-3 text-center">
            <div>
              <p className="text-[18px] font-bold text-foreground">{result.fetched}</p>
              <p className="text-[10px] text-muted">Fetched</p>
            </div>
            <div>
              <p className="text-[18px] font-bold text-green-700">{result.created}</p>
              <p className="text-[10px] text-muted">Created</p>
            </div>
            <div>
              <p className="text-[18px] font-bold text-blue-700">{result.updated}</p>
              <p className="text-[10px] text-muted">Updated</p>
            </div>
            <div>
              <p className="text-[18px] font-bold text-red-600">{result.failed}</p>
              <p className="text-[10px] text-muted">Failed</p>
            </div>
          </div>
          {result.skipped > 0 && (
            <p className="text-[11px] text-muted mt-2">{result.skipped} records skipped (not found or missing name)</p>
          )}
          {result.errors.length > 0 && (
            <details className="mt-2">
              <summary className="text-[11px] text-red-600 font-semibold cursor-pointer">
                {result.errors.length} error{result.errors.length !== 1 ? "s" : ""} (click to expand)
              </summary>
              <pre className="mt-1 text-[10px] text-red-700 bg-red-100 p-2 rounded overflow-x-auto max-h-40">
                {result.errors.join("\n")}
              </pre>
            </details>
          )}
        </div>
      )}
    </div>
  );
}
