"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "../../../lib/api";
import { panelStyle } from "../../styles";

type RevenueSummary = {
  days: number;
  since: string;
  daily: { date: string; bookings: number; revenueCents: number }[];
  totals: { bookings: number; revenueCents: number };
  occupancyIndexPercent: number;
};

export default function RevenuePage() {
  const [data, setData] = useState<RevenueSummary | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      setError(null);
      try {
        const res = await apiFetch("/admin/revenue/summary?days=14");
        if (!res.ok) throw new Error("failed");
        setData((await res.json()) as RevenueSummary);
      } catch {
        setError("Could not load revenue summary.");
      }
    })();
  }, []);

  return (
    <main>
      <h1 style={{ fontSize: 26, marginTop: 0 }}>Revenue & occupancy</h1>
      <p style={{ color: "#9aa0b4" }}>
        Daily bookings and Stripe payment totals (MVP). Occupancy index is a heuristic from bookings vs gym count.
      </p>
      {error ? (
        <section style={panelStyle}>
          <strong style={{ color: "#ff9fb0" }}>{error}</strong>
        </section>
      ) : null}
      {data ? (
        <section style={panelStyle}>
          <p style={{ color: "#e8e9f0" }}>
            Last <strong>{data.days}</strong> days · Total bookings <strong>{data.totals.bookings}</strong> · Revenue{" "}
            <strong>${(data.totals.revenueCents / 100).toFixed(2)}</strong> · Occupancy index ~{" "}
            <strong>{data.occupancyIndexPercent}%</strong>
          </p>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, marginTop: 16 }}>
            <thead>
              <tr>
                <th style={{ textAlign: "left", color: "#9aa0b4", padding: 8 }}>Date</th>
                <th style={{ textAlign: "left", color: "#9aa0b4", padding: 8 }}>Bookings</th>
                <th style={{ textAlign: "left", color: "#9aa0b4", padding: 8 }}>Revenue</th>
              </tr>
            </thead>
            <tbody>
              {data.daily.map((d) => (
                <tr key={d.date} style={{ borderTop: "1px solid #242b40" }}>
                  <td style={{ padding: 10 }}>{d.date}</td>
                  <td style={{ padding: 10 }}>{d.bookings}</td>
                  <td style={{ padding: 10 }}>${(d.revenueCents / 100).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      ) : (
        !error && <p style={{ color: "#9aa0b4" }}>Loading…</p>
      )}
    </main>
  );
}
