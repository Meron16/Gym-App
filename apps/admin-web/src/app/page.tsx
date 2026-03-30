"use client";

import { useEffect, useMemo, useState } from "react";

const api = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";
const devToken = process.env.NEXT_PUBLIC_ADMIN_DEV_TOKEN ?? "admin";

type Overview = {
  bookingsToday: number;
  activeSubscriptions: number;
  gyms: number;
  revenueCents: number;
};

type Booking = {
  id: string;
  userId: string;
  gymId: string;
  slotId: string;
  status: string;
  createdAt: string;
};

export default function AdminHome() {
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [overview, setOverview] = useState<Overview | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let mounted = true;
    void (async () => {
      setLoading(true);
      setError(null);
      try {
        const login = await fetch(`${api}/auth/firebase-login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ idToken: devToken }),
        });
        if (!login.ok) throw new Error("Auth failed");
        const authJson = (await login.json()) as { accessToken: string };
        if (!mounted) return;
        setAccessToken(authJson.accessToken);

        const [ovRes, bkRes] = await Promise.all([
          fetch(`${api}/admin/overview`, {
            headers: { Authorization: `Bearer ${authJson.accessToken}` },
            cache: "no-store",
          }),
          fetch(`${api}/admin/bookings`, {
            headers: { Authorization: `Bearer ${authJson.accessToken}` },
            cache: "no-store",
          }),
        ]);

        if (!ovRes.ok || !bkRes.ok) throw new Error("Admin API failed");
        const ov = (await ovRes.json()) as Overview;
        const bk = (await bkRes.json()) as Booking[];

        if (!mounted) return;
        setOverview(ov);
        setBookings(bk);
      } catch {
        if (!mounted) return;
        setError("Could not load admin data. Ensure API is running and dev token is admin.");
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

  const cancelBooking = async (id: string) => {
    if (!accessToken) return;
    const res = await fetch(`${api}/admin/bookings/${encodeURIComponent(id)}/cancel`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!res.ok) return;
    setBookings((prev) => prev.map((b) => (b.id === id ? { ...b, status: "cancelled" } : b)));
  };

  return (
    <main style={{ padding: 32, maxWidth: 980, margin: "0 auto" }}>
      <h1 style={{ fontSize: 28, letterSpacing: 1, marginBottom: 8 }}>Gym operator dashboard (MVP)</h1>
      <p style={{ color: "#9aa0b4", lineHeight: 1.6, marginTop: 0 }}>
        Phase 8 baseline with role-gated admin APIs.
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
        <Stat title="Revenue" value={loading ? "..." : revenue} />
      </section>

      <section style={panelStyle}>
        <h2 style={{ marginTop: 0 }}>Recent bookings</h2>
        {bookings.length === 0 ? (
          <p style={{ color: "#9aa0b4" }}>No bookings found.</p>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr>
                <Th>ID</Th>
                <Th>User</Th>
                <Th>Gym</Th>
                <Th>Slot</Th>
                <Th>Status</Th>
                <Th>Action</Th>
              </tr>
            </thead>
            <tbody>
              {bookings.slice(0, 30).map((b) => (
                <tr key={b.id} style={{ borderTop: "1px solid #242b40" }}>
                  <Td>{b.id}</Td>
                  <Td>{b.userId}</Td>
                  <Td>{b.gymId}</Td>
                  <Td>{b.slotId}</Td>
                  <Td>{b.status}</Td>
                  <Td>
                    <button
                      onClick={() => void cancelBooking(b.id)}
                      disabled={b.status === "cancelled"}
                      style={buttonStyle}
                    >
                      Cancel
                    </button>
                  </Td>
                </tr>
              ))}
            </tbody>
          </table>
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

const panelStyle: React.CSSProperties = {
  marginTop: 20,
  padding: 20,
  borderRadius: 12,
  border: "1px solid #2a3148",
  background: "#121624",
};

const buttonStyle: React.CSSProperties = {
  padding: "6px 10px",
  borderRadius: 8,
  border: "1px solid #374167",
  background: "#1a2033",
  color: "#e8e9f0",
  cursor: "pointer",
};
