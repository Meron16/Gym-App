"use client";

import { FormEvent, useEffect, useState } from "react";
import { apiFetch } from "../../../lib/api";
import { panelStyle, buttonStyle, inputStyle } from "../../styles";

type Trainer = {
  id: string;
  gymId: string;
  gymName: string;
  name: string;
  tagline: string;
  expertise: string[];
  active: boolean;
};

export default function TrainersPage() {
  const [trainers, setTrainers] = useState<Trainer[]>([]);
  const [gymId, setGymId] = useState("");
  const [name, setName] = useState("");
  const [tagline, setTagline] = useState("");
  const [expertise, setExpertise] = useState("HIIT, Strength");
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = () => {
    void (async () => {
      const res = await apiFetch("/admin/trainers");
      if (res.ok) setTrainers((await res.json()) as Trainer[]);
    })();
  };

  useEffect(() => {
    load();
  }, []);

  const create = (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    void (async () => {
      try {
        const exp = expertise
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean);
        const res = await apiFetch("/admin/trainers", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            gymId: gymId.trim(),
            name: name.trim(),
            tagline: tagline.trim() || undefined,
            expertise: exp,
          }),
        });
        if (!res.ok) throw new Error("fail");
        setMsg("Trainer created.");
        setName("");
        setTagline("");
        load();
      } catch {
        setMsg("Could not create trainer — check gymId.");
      } finally {
        setBusy(false);
      }
    })();
  };

  const deactivate = (id: string) => {
    void (async () => {
      const res = await apiFetch(`/admin/trainers/${encodeURIComponent(id)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: false }),
      });
      if (!res.ok) return;
      setTrainers((prev) => prev.map((t) => (t.id === id ? { ...t, active: false } : t)));
    })();
  };

  return (
    <main>
      <h1 style={{ fontSize: 26, marginTop: 0 }}>Trainers</h1>
      <section style={panelStyle}>
        <h2 style={{ marginTop: 0 }}>Add trainer</h2>
        <form onSubmit={create} style={{ display: "grid", gap: 10, maxWidth: 480 }}>
          <input style={inputStyle} placeholder="gymId" value={gymId} onChange={(e) => setGymId(e.target.value)} required />
          <input style={inputStyle} placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} required />
          <input style={inputStyle} placeholder="Tagline" value={tagline} onChange={(e) => setTagline(e.target.value)} />
          <input
            style={inputStyle}
            placeholder="Expertise (comma-separated)"
            value={expertise}
            onChange={(e) => setExpertise(e.target.value)}
          />
          <button type="submit" disabled={busy} style={{ ...buttonStyle, alignSelf: "start" }}>
            {busy ? "Saving…" : "Add trainer"}
          </button>
        </form>
        {msg ? <p style={{ color: "#a8e8c0" }}>{msg}</p> : null}
      </section>

      <section style={panelStyle}>
        <h2 style={{ marginTop: 0 }}>All trainers</h2>
        {trainers.length === 0 ? (
          <p style={{ color: "#9aa0b4" }}>No trainers.</p>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr>
                <th style={{ textAlign: "left", color: "#9aa0b4", padding: 8 }}>Name</th>
                <th style={{ textAlign: "left", color: "#9aa0b4", padding: 8 }}>Gym</th>
                <th style={{ textAlign: "left", color: "#9aa0b4", padding: 8 }}>Active</th>
                <th style={{ textAlign: "left", color: "#9aa0b4", padding: 8 }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {trainers.map((t) => (
                <tr key={t.id} style={{ borderTop: "1px solid #242b40" }}>
                  <td style={{ padding: 10 }}>{t.name}</td>
                  <td style={{ padding: 10 }}>{t.gymName}</td>
                  <td style={{ padding: 10 }}>{t.active ? "yes" : "no"}</td>
                  <td style={{ padding: 10 }}>
                    <button type="button" style={buttonStyle} disabled={!t.active} onClick={() => void deactivate(t.id)}>
                      Deactivate
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
