"use client";

import { useEffect, useMemo, useState } from "react";
import { apiFetch } from "../../lib/api";
import { panelStyle } from "../styles";

type Overview = {
  bookingsToday: number;
  activeSubscriptions: number;
  gyms: number;
  revenueCents: number;
};

type AnalyticsSummary = {
  days: number;
  since: string;
  totalEvents: number;
  byEvent: { name: string; count: number }[];
};

export default function DashboardOverview() {
  const [overview, setOverview] = useState<Overview | null>(null);
  const [analytics, setAnalytics] = useState<AnalyticsSummary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    void (async () => {
      setLoading(true);
      setError(null);
      try {
        const [ovRes, anRes] = await Promise.all([
          apiFetch("/admin/overview"),
          apiFetch("/admin/analytics/summary"),
        ]);
        if (!ovRes.ok || !anRes.ok) throw new Error("Admin API failed");
        const ov = (await ovRes.json()) as Overview;
        const an = (await anRes.json()) as AnalyticsSummary;
        if (!mounted) return;
        setOverview(ov);
        setAnalytics(an);
      } catch {
        if (mounted) setError("Could not load dashboard. Check API and operator role.");
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const revenue = useMemo(() => {
    const cents = overview?.revenueCents ?? 0;
    return `$${(cents / 100).toFixed(2)}`;
  }, [overview]);

  return (
    <main>
      <h1 style={{ fontSize: 28, letterSpacing: 1, marginBottom: 8 }}>Overview</h1>
      <p style={{ color: "#9aa0b4", lineHeight: 1.6, marginTop: 0 }}>
        Role-gated admin APIs. Create a gym under <strong style={{ color: "#e8e9f0" }}>Gyms</strong> — it appears in
        consumer Browse immediately.
      </p>

      {error ? (
        <section style={panelStyle}>
          <strong style={{ color: "#ff9fb0" }}>{error}</strong>
        </section>
      ) : null}

      <section style={{ ...panelStyle, display: "grid", gridTemplateColumns: "repeat(4, minmax(0,1fr))", gap: 12 }}>
        <Stat title="Bookings today" value={loading ? "..." : String(overview?.bookingsToday ?? 0)} />
        <Stat title="Active subs" value={loading ? "..." : String(overview?.activeSubscriptions ?? 0)} />
        <Stat title="Gyms" value={loading ? "..." : String(overview?.gyms ?? 0)} />
        <Stat title="Revenue (all time)" value={loading ? "..." : revenue} />
      </section>

      <section style={panelStyle}>
        <h2 style={{ marginTop: 0 }}>Product analytics (7 days)</h2>
        {analytics ? (
          <>
            <p style={{ color: "#e8e9f0", marginBottom: 12 }}>
              <strong>{analytics.totalEvents}</strong> events since {new Date(analytics.since).toLocaleDateString()}
            </p>
            {analytics.byEvent.length === 0 ? (
              <p style={{ color: "#9aa0b4", marginBottom: 0 }}>No events yet.</p>
            ) : (
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                <thead>
                  <tr>
                    <Th>Event</Th>
                    <Th>Count</Th>
                  </tr>
                </thead>
                <tbody>
                  {analytics.byEvent.map((row) => (
                    <tr key={row.name} style={{ borderTop: "1px solid #242b40" }}>
                      <Td>{row.name}</Td>
                      <Td>{row.count}</Td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </>
        ) : (
          <p style={{ color: "#9aa0b4" }}>{loading ? "…" : "—"}</p>
        )}
      </section>
    </main>
  );
}

function Stat({ title, value }: { title: string; value: string }) {
  return (
    <div style={{ background: "#0f1320", border: "1px solid #242b40", borderRadius: 10, padding: 12 }}>
      <div style={{ color: "#9aa0b4", fontSize: 12 }}>{title}</div>
      <div style={{ fontSize: 22, fontWeight: 700, marginTop: 6 }}>{value}</div>
    </div>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return <th style={{ textAlign: "left", color: "#9aa0b4", padding: "8px 6px" }}>{children}</th>;
}

function Td({ children }: { children: React.ReactNode }) {
  return <td style={{ padding: "10px 6px" }}>{children}</td>;
}
