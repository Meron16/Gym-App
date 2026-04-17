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

type AnalyticsSummary = {
  days: number;
  since: string;
  totalEvents: number;
  byEvent: { name: string; count: number }[];
};

type AdminTrainer = {
  id: string;
  gymId: string;
  gymName: string;
  name: string;
  tagline: string;
  expertise: string[];
  active: boolean;
  photoUrl: string | null;
};

export default function AdminHome() {
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [overview, setOverview] = useState<Overview | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [analytics, setAnalytics] = useState<AnalyticsSummary | null>(null);
  const [trainers, setTrainers] = useState<AdminTrainer[]>([]);
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

        const [ovRes, bkRes, anRes, trRes] = await Promise.all([
          fetch(`${api}/admin/overview`, {
            headers: { Authorization: `Bearer ${authJson.accessToken}` },
            cache: "no-store",
          }),
          fetch(`${api}/admin/bookings`, {
            headers: { Authorization: `Bearer ${authJson.accessToken}` },
            cache: "no-store",
          }),
          fetch(`${api}/admin/analytics/summary`, {
            headers: { Authorization: `Bearer ${authJson.accessToken}` },
            cache: "no-store",
          }),
          fetch(`${api}/admin/trainers`, {
            headers: { Authorization: `Bearer ${authJson.accessToken}` },
            cache: "no-store",
          }),
        ]);

        if (!ovRes.ok || !bkRes.ok || !anRes.ok || !trRes.ok) throw new Error("Admin API failed");
        const ov = (await ovRes.json()) as Overview;
        const bk = (await bkRes.json()) as Booking[];
        const an = (await anRes.json()) as AnalyticsSummary;
        const tr = (await trRes.json()) as AdminTrainer[];

        if (!mounted) return;
        setOverview(ov);
        setBookings(bk);
        setAnalytics(an);
        setTrainers(tr);
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

  const [osmLocation, setOsmLocation] = useState("Addis Ababa, Ethiopia");
  const [osmStatus, setOsmStatus] = useState<string | null>(null);
  const [osmLoading, setOsmLoading] = useState(false);

  const [newTrainerGymId, setNewTrainerGymId] = useState("");
  const [newTrainerName, setNewTrainerName] = useState("");
  const [newTrainerTagline, setNewTrainerTagline] = useState("");
  const [newTrainerExpertise, setNewTrainerExpertise] = useState("HIIT, Strength");
  const [trainerStatus, setTrainerStatus] = useState<string | null>(null);
  const [trainerBusy, setTrainerBusy] = useState(false);

  const createTrainer = async () => {
    if (!accessToken) return;
    setTrainerBusy(true);
    setTrainerStatus(null);
    try {
      const expertise = newTrainerExpertise
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      const res = await fetch(`${api}/admin/trainers`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          gymId: newTrainerGymId.trim(),
          name: newTrainerName.trim(),
          tagline: newTrainerTagline.trim() || undefined,
          expertise,
        }),
      });
      if (!res.ok) throw new Error("create failed");
      const list = await fetch(`${api}/admin/trainers`, {
        headers: { Authorization: `Bearer ${accessToken}` },
        cache: "no-store",
      });
      if (list.ok) {
        setTrainers((await list.json()) as AdminTrainer[]);
      }
      setTrainerStatus("Trainer created.");
      setNewTrainerName("");
      setNewTrainerTagline("");
    } catch {
      setTrainerStatus("Could not create trainer. Check gymId and API logs.");
    } finally {
      setTrainerBusy(false);
    }
  };

  const deactivateTrainer = async (id: string) => {
    if (!accessToken) return;
    const res = await fetch(`${api}/admin/trainers/${encodeURIComponent(id)}`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ active: false }),
    });
    if (!res.ok) return;
    setTrainers((prev) => prev.map((t) => (t.id === id ? { ...t, active: false } : t)));
  };

  const syncOsm = async () => {
    if (!accessToken) return;
    setOsmLoading(true);
    setOsmStatus(null);
    try {
      const res = await fetch(`${api}/admin/gyms/sync-osm`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ location: osmLocation }),
      });
      const json = (await res.json().catch(() => ({}))) as { upserted?: number; message?: string };
      if (!res.ok) throw new Error("Sync failed");
      setOsmStatus(`Imported / updated ${json.upserted ?? 0} venues.`);
      const ovRes = await fetch(`${api}/admin/overview`, {
        headers: { Authorization: `Bearer ${accessToken}` },
        cache: "no-store",
      });
      if (ovRes.ok) {
        const ov = (await ovRes.json()) as Overview;
        setOverview(ov);
      }
    } catch {
      setOsmStatus("Sync failed. Check API logs and admin role.");
    } finally {
      setOsmLoading(false);
    }
  };

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
        Phase 6 product analytics in Postgres; Phase 8 baseline with role-gated admin APIs.
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
        <h2 style={{ marginTop: 0 }}>Product analytics (7 days)</h2>
        <p style={{ color: "#9aa0b4", marginTop: 0, lineHeight: 1.5 }}>
          Events ingested from the mobile app via <code style={{ color: "#c8cde0" }}>POST /analytics/track</code>.
          Mixpanel or warehouse export can be layered in Phase 9.
        </p>
        {analytics ? (
          <>
            <p style={{ color: "#e8e9f0", marginBottom: 12 }}>
              <strong>{analytics.totalEvents}</strong> events since{" "}
              {new Date(analytics.since).toLocaleDateString()}
            </p>
            {analytics.byEvent.length === 0 ? (
              <p style={{ color: "#9aa0b4", marginBottom: 0 }}>
                No events yet. Open the mobile Plans tab or complete a booking.
              </p>
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
          <p style={{ color: "#9aa0b4", marginBottom: 0 }}>{loading ? "…" : "—"}</p>
        )}
      </section>

      <section style={panelStyle}>
        <h2 style={{ marginTop: 0 }}>Venues (OpenStreetMap)</h2>
        <p style={{ color: "#9aa0b4", marginTop: 0, lineHeight: 1.5 }}>
          Pull fitness venues into Postgres (throttled). Consumer app reads only from the database.
        </p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 10, alignItems: "center" }}>
          <input
            value={osmLocation}
            onChange={(e) => setOsmLocation(e.target.value)}
            placeholder="Location query"
            style={{
              flex: "1 1 240px",
              padding: "10px 12px",
              borderRadius: 8,
              border: "1px solid #374167",
              background: "#0f1320",
              color: "#e8e9f0",
            }}
          />
          <button
            type="button"
            onClick={() => void syncOsm()}
            disabled={!accessToken || osmLoading}
            style={{ ...buttonStyle, opacity: !accessToken || osmLoading ? 0.5 : 1 }}
          >
            {osmLoading ? "Syncing…" : "Sync from OSM"}
          </button>
        </div>
        {osmStatus ? <p style={{ color: "#a8e8c0", marginBottom: 0 }}>{osmStatus}</p> : null}
      </section>

      <section style={panelStyle}>
        <h2 style={{ marginTop: 0 }}>Trainers</h2>
        <p style={{ color: "#9aa0b4", marginTop: 0, lineHeight: 1.5 }}>
          Coaches appear in the mobile <strong style={{ color: "#e8e9f0" }}>Coaches</strong> tab. Use a real{" "}
          <code style={{ color: "#c8cde0" }}>gymId</code> from your database.
        </p>
        <div style={{ display: "grid", gap: 10, marginBottom: 12 }}>
          <input
            value={newTrainerGymId}
            onChange={(e) => setNewTrainerGymId(e.target.value)}
            placeholder="gymId (cuid from Gym table)"
            style={{
              padding: "10px 12px",
              borderRadius: 8,
              border: "1px solid #374167",
              background: "#0f1320",
              color: "#e8e9f0",
            }}
          />
          <input
            value={newTrainerName}
            onChange={(e) => setNewTrainerName(e.target.value)}
            placeholder="Trainer name"
            style={{
              padding: "10px 12px",
              borderRadius: 8,
              border: "1px solid #374167",
              background: "#0f1320",
              color: "#e8e9f0",
            }}
          />
          <input
            value={newTrainerTagline}
            onChange={(e) => setNewTrainerTagline(e.target.value)}
            placeholder="Tagline (optional)"
            style={{
              padding: "10px 12px",
              borderRadius: 8,
              border: "1px solid #374167",
              background: "#0f1320",
              color: "#e8e9f0",
            }}
          />
          <input
            value={newTrainerExpertise}
            onChange={(e) => setNewTrainerExpertise(e.target.value)}
            placeholder="Expertise (comma-separated)"
            style={{
              padding: "10px 12px",
              borderRadius: 8,
              border: "1px solid #374167",
              background: "#0f1320",
              color: "#e8e9f0",
            }}
          />
          <button
            type="button"
            onClick={() => void createTrainer()}
            disabled={!accessToken || trainerBusy || !newTrainerGymId.trim() || !newTrainerName.trim()}
            style={{ ...buttonStyle, opacity: trainerBusy ? 0.6 : 1 }}
          >
            {trainerBusy ? "Saving…" : "Add trainer"}
          </button>
        </div>
        {trainerStatus ? <p style={{ color: "#a8e8c0" }}>{trainerStatus}</p> : null}
        {trainers.length === 0 ? (
          <p style={{ color: "#9aa0b4" }}>No trainers yet. Seed the API or create one above.</p>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr>
                <Th>Name</Th>
                <Th>Gym</Th>
                <Th>Expertise</Th>
                <Th>Active</Th>
                <Th>Action</Th>
              </tr>
            </thead>
            <tbody>
              {trainers.map((t) => (
                <tr key={t.id} style={{ borderTop: "1px solid #242b40" }}>
                  <Td>{t.name}</Td>
                  <Td>{t.gymName}</Td>
                  <Td>{t.expertise.join(", ")}</Td>
                  <Td>{t.active ? "yes" : "no"}</Td>
                  <Td>
                    <button
                      type="button"
                      onClick={() => void deactivateTrainer(t.id)}
                      disabled={!t.active}
                      style={buttonStyle}
                    >
                      Deactivate
                    </button>
                  </Td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
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
