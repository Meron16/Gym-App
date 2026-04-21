"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "../../../lib/api";
import { panelStyle, buttonStyle } from "../../styles";

type Booking = {
  id: string;
  userId: string;
  gymId: string;
  slotId: string;
  status: string;
  createdAt: string;
};

export default function BookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [error, setError] = useState<string | null>(null);

  const load = () => {
    void (async () => {
      setError(null);
      try {
        const res = await apiFetch("/admin/bookings");
        if (!res.ok) throw new Error("failed");
        setBookings((await res.json()) as Booking[]);
      } catch {
        setError("Could not load bookings.");
      }
    })();
  };

  useEffect(() => {
    load();
  }, []);

  const cancel = (id: string) => {
    void (async () => {
      const res = await apiFetch(`/admin/bookings/${encodeURIComponent(id)}/cancel`, { method: "PATCH" });
      if (!res.ok) return;
      setBookings((prev) => prev.map((b) => (b.id === id ? { ...b, status: "cancelled" } : b)));
    })();
  };

  return (
    <main>
      <h1 style={{ fontSize: 26, marginTop: 0 }}>Bookings</h1>
      {error ? (
        <section style={panelStyle}>
          <strong style={{ color: "#ff9fb0" }}>{error}</strong>
        </section>
      ) : null}
      <section style={panelStyle}>
        {bookings.length === 0 ? (
          <p style={{ color: "#9aa0b4" }}>No bookings found.</p>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr>
                <th style={{ textAlign: "left", color: "#9aa0b4", padding: 8 }}>ID</th>
                <th style={{ textAlign: "left", color: "#9aa0b4", padding: 8 }}>User</th>
                <th style={{ textAlign: "left", color: "#9aa0b4", padding: 8 }}>Gym</th>
                <th style={{ textAlign: "left", color: "#9aa0b4", padding: 8 }}>Slot</th>
                <th style={{ textAlign: "left", color: "#9aa0b4", padding: 8 }}>Status</th>
                <th style={{ textAlign: "left", color: "#9aa0b4", padding: 8 }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {bookings.slice(0, 80).map((b) => (
                <tr key={b.id} style={{ borderTop: "1px solid #242b40" }}>
                  <td style={{ padding: 10 }}>{b.id}</td>
                  <td style={{ padding: 10 }}>{b.userId}</td>
                  <td style={{ padding: 10 }}>{b.gymId}</td>
                  <td style={{ padding: 10 }}>{b.slotId}</td>
                  <td style={{ padding: 10 }}>{b.status}</td>
                  <td style={{ padding: 10 }}>
                    <button
                      type="button"
                      onClick={() => void cancel(b.id)}
                      disabled={b.status === "cancelled"}
                      style={buttonStyle}
                    >
                      Cancel
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </main>
  );
}
