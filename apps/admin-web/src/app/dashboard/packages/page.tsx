"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "../../../lib/api";
import { panelStyle } from "../../styles";

type Pkg = {
  id: string;
  name: string;
  billing: string;
  priceCents: number;
  maxSessionsPerWeek: number;
  stripePriceId: string | null;
};

export default function PackagesPage() {
  const [packages, setPackages] = useState<Pkg[]>([]);

  useEffect(() => {
    void (async () => {
      const res = await apiFetch("/admin/packages");
      if (res.ok) setPackages((await res.json()) as Pkg[]);
    })();
  }, []);

  return (
    <main>
      <h1 style={{ fontSize: 26, marginTop: 0 }}>Packages</h1>
      <p style={{ color: "#9aa0b4" }}>Catalog synced from the API. Create new packages via POST /admin/packages or seed.</p>
      <section style={panelStyle}>
        {packages.length === 0 ? (
          <p style={{ color: "#9aa0b4" }}>No packages.</p>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr>
                <th style={{ textAlign: "left", color: "#9aa0b4", padding: 8 }}>Name</th>
                <th style={{ textAlign: "left", color: "#9aa0b4", padding: 8 }}>Billing</th>
                <th style={{ textAlign: "left", color: "#9aa0b4", padding: 8 }}>Price</th>
                <th style={{ textAlign: "left", color: "#9aa0b4", padding: 8 }}>Sessions / week</th>
                <th style={{ textAlign: "left", color: "#9aa0b4", padding: 8 }}>Stripe price</th>
              </tr>
            </thead>
            <tbody>
              {packages.map((p) => (
                <tr key={p.id} style={{ borderTop: "1px solid #242b40" }}>
                  <td style={{ padding: 10 }}>{p.name}</td>
                  <td style={{ padding: 10 }}>{p.billing}</td>
                  <td style={{ padding: 10 }}>${(p.priceCents / 100).toFixed(2)}</td>
                  <td style={{ padding: 10 }}>{p.maxSessionsPerWeek}</td>
                  <td style={{ padding: 10, fontSize: 11 }}>{p.stripePriceId ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </main>
  );
}
