"use client";

import { BASE_URL, apiFetch } from "@/lib/api";
import { useEffect, useMemo, useState } from "react";

type WeeklyPoint = {
  weekStart: string;
  bookings: number;
};

type SourcePoint = {
  source: string;
  count: number;
};

type InsightsResponse = {
  bookingsPerWeek: WeeklyPoint[];
  sourceBreakdown: SourcePoint[];
  totals: {
    total: number;
    confirmed: number;
    conversionRate: number;
  };
};

function downloadJsonFile(fileName: string, payload: unknown) {
  const blob = new Blob([`${JSON.stringify(payload, null, 2)}\n`], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
}

export function AdminInsights() {
  const [insights, setInsights] = useState<InsightsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [exporting, setExporting] = useState<"appointments" | "content" | null>(null);

  useEffect(() => {
    const loadInsights = async () => {
      setLoading(true);
      setErrorMessage("");

      try {
        const response = await apiFetch(`${BASE_URL}/api/admin/analytics/overview`, { method: "GET" });
        const data = (await response.json().catch(() => null)) as InsightsResponse | { message?: string } | null;

        if (!response.ok || !data || !("totals" in data)) {
          const message = data && "message" in data && typeof data.message === "string"
            ? data.message
            : "Failed to load analytics.";
          throw new Error(message);
        }

        setInsights(data);
      } catch (error) {
        setErrorMessage(error instanceof Error ? error.message : "Failed to load analytics.");
      } finally {
        setLoading(false);
      }
    };

    void loadInsights();
  }, []);

  const maxBookings = useMemo(() => {
    if (!insights?.bookingsPerWeek?.length) {
      return 1;
    }

    return Math.max(...insights.bookingsPerWeek.map((point) => point.bookings), 1);
  }, [insights]);

  const handleExport = async (type: "appointments" | "content") => {
    setExporting(type);

    try {
      const endpoint = type === "appointments"
        ? `${BASE_URL}/api/admin/export/appointments`
        : `${BASE_URL}/api/admin/export/site-content-revisions`;

      const response = await apiFetch(endpoint, { method: "GET" });
      const data = (await response.json().catch(() => null)) as unknown;

      if (!response.ok) {
        throw new Error("Export failed");
      }

      const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-");
      const fileName = type === "appointments"
        ? `appointments-backup-${stamp}.json`
        : `site-content-revisions-${stamp}.json`;

      downloadJsonFile(fileName, data);
    } catch {
      setErrorMessage("Failed to export backup data.");
    } finally {
      setExporting(null);
    }
  };

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">Insights & Operations</h2>
          <p className="mt-1 text-sm text-slate-600">Track bookings performance and export backups.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled={exporting !== null}
            onClick={() => {
              void handleExport("appointments");
            }}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-70"
          >
            {exporting === "appointments" ? "Exporting..." : "Export Appointments"}
          </button>
          <button
            type="button"
            disabled={exporting !== null}
            onClick={() => {
              void handleExport("content");
            }}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-70"
          >
            {exporting === "content" ? "Exporting..." : "Export Content Revisions"}
          </button>
        </div>
      </div>

      {loading ? <p className="text-sm text-slate-600">Loading analytics...</p> : null}
      {errorMessage ? <p className="mb-4 text-sm text-red-600">{errorMessage}</p> : null}

      {!loading && insights ? (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Total Bookings</p>
              <p className="mt-2 text-2xl font-bold text-slate-900">{insights.totals.total}</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Confirmed</p>
              <p className="mt-2 text-2xl font-bold text-slate-900">{insights.totals.confirmed}</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Conversion Rate</p>
              <p className="mt-2 text-2xl font-bold text-slate-900">{insights.totals.conversionRate}%</p>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-xl border border-slate-200 p-4">
              <p className="mb-3 text-sm font-semibold text-slate-700">Bookings per week</p>
              <div className="space-y-2">
                {insights.bookingsPerWeek.map((point) => (
                  <div key={point.weekStart}>
                    <div className="mb-1 flex items-center justify-between text-xs text-slate-500">
                      <span>{point.weekStart}</span>
                      <span>{point.bookings}</span>
                    </div>
                    <div className="h-2 rounded-full bg-slate-100" />
                    <p className="mt-1 text-xs text-slate-400">
                      {Math.round((point.bookings / maxBookings) * 100)}% of peak week
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 p-4">
              <p className="mb-3 text-sm font-semibold text-slate-700">Lead source breakdown</p>
              <ul className="space-y-2">
                {insights.sourceBreakdown.map((point) => (
                  <li
                    key={`${point.source}-${point.count}`}
                    className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-700"
                  >
                    <span className="font-medium">{point.source}</span>
                    <span>{point.count}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
