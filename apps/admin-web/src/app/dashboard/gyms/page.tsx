"use client";

import { FormEvent, useEffect, useState } from "react";
import { apiFetch } from "../../../lib/api";
import { panelStyle, buttonStyle, inputStyle } from "../../styles";

type Gym = {
  id: string;
  name: string;
  location: string;
  address: string;
  capacityBase: number;
  lat: number;
  lng: number;
  updatedAt: string;
};

export default function GymsPage() {
  const [gyms, setGyms] = useState<Gym[]>([]);
  const [selected, setSelected] = useState<Gym | null>(null);
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [lat, setLat] = useState("9.03");
  const [lng, setLng] = useState("38.75");
  const [capacity, setCapacity] = useState("45");
  const [editName, setEditName] = useState("");
  const [editLocation, setEditLocation] = useState("");
  const [editAddress, setEditAddress] = useState("");
  const [editLat, setEditLat] = useState("");
  const [editLng, setEditLng] = useState("");
  const [hoursJson, setHoursJson] = useState(
    JSON.stringify(
      [
        { day: "Mon", open: "06:00", close: "22:00" },
        { day: "Tue", open: "06:00", close: "22:00" },
      ],
      null,
      2,
    ),
  );
  const [photosJson, setPhotosJson] = useState(
    JSON.stringify([{ url: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=1200" }], null, 2),
  );
  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const copyGymId = async (id: string) => {
    try {
      if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(id);
      } else {
        const el = document.createElement("textarea");
        el.value = id;
        el.setAttribute("readonly", "true");
        el.style.position = "absolute";
        el.style.left = "-9999px";
        document.body.appendChild(el);
        el.select();
        document.execCommand("copy");
        document.body.removeChild(el);
      }
      setStatus(`Copied gym id: ${id}`);
    } catch {
      setStatus("Could not copy gym id. Please select and copy manually.");
    }
  };

  const load = () => {
    void (async () => {
      const res = await apiFetch("/admin/gyms");
      if (res.ok) setGyms((await res.json()) as Gym[]);
    })();
  };

  useEffect(() => {
    load();
  }, []);

  const createGym = (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setStatus(null);
    void (async () => {
      try {
        const res = await apiFetch("/admin/gyms", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: name.trim(),
            address: address.trim() || undefined,
            lat: parseFloat(lat),
            lng: parseFloat(lng),
          }),
        });
        if (!res.ok) throw new Error("create failed");
        setStatus("Gym created — check Browse in the mobile app.");
        setName("");
        setAddress("");
        load();
      } catch {
        setStatus("Could not create gym.");
      } finally {
        setBusy(false);
      }
    })();
  };

  const saveEdit = () => {
    if (!selected) return;
    setBusy(true);
    setStatus(null);
    void (async () => {
      try {
        let operatingHours: unknown = undefined;
        let photos: unknown = undefined;
        try {
          operatingHours = JSON.parse(hoursJson);
        } catch {
          setStatus("Operating hours must be valid JSON.");
          setBusy(false);
          return;
        }
        try {
          photos = JSON.parse(photosJson);
        } catch {
          setStatus("Photos must be valid JSON.");
          setBusy(false);
          return;
        }
        const res = await apiFetch(`/admin/gyms/${encodeURIComponent(selected.id)}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: editName.trim(),
            location: editLocation.trim(),
            address: editAddress.trim(),
            lat: parseFloat(editLat),
            lng: parseFloat(editLng),
            capacityBase: parseInt(capacity, 10),
            operatingHours,
            photos,
          }),
        });
        if (!res.ok) throw new Error("save failed");
        setStatus("Gym updated.");
        load();
        const next = (await res.json()) as Gym;
        setSelected(next);
      } catch {
        setStatus("Could not save gym.");
      } finally {
        setBusy(false);
      }
    })();
  };

  return (
    <main>
      <h1 style={{ fontSize: 26, marginTop: 0 }}>Gyms</h1>
      <p style={{ color: "#9aa0b4" }}>
        Create venues that appear in consumer Browse. Edit capacity, hours, and media (JSON arrays).
      </p>

      <section style={panelStyle}>
        <h2 style={{ marginTop: 0 }}>Create gym</h2>
        <form onSubmit={createGym} style={{ display: "grid", gap: 10, maxWidth: 480 }}>
          <input style={inputStyle} placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} required />
          <input
            style={inputStyle}
            placeholder="Address (optional)"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
          />
          <div style={{ display: "flex", gap: 10 }}>
            <input style={{ ...inputStyle, flex: 1 }} placeholder="lat" value={lat} onChange={(e) => setLat(e.target.value)} />
            <input style={{ ...inputStyle, flex: 1 }} placeholder="lng" value={lng} onChange={(e) => setLng(e.target.value)} />
          </div>
          <button type="submit" disabled={busy} style={{ ...buttonStyle, alignSelf: "start" }}>
            {busy ? "Saving…" : "Create gym"}
          </button>
        </form>
      </section>

      <section style={panelStyle}>
        <h2 style={{ marginTop: 0 }}>Your gyms</h2>
        {gyms.length === 0 ? (
          <p style={{ color: "#9aa0b4" }}>No gyms yet.</p>
        ) : (
          <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
            {gyms.map((g) => (
              <li key={g.id} style={{ marginBottom: 8 }}>
                <div
                  style={{
                    ...buttonStyle,
                    background: selected?.id === g.id ? "#243054" : "#1a2033",
                    width: "100%",
                    textAlign: "left",
                    display: "grid",
                    gap: 8,
                    cursor: "default",
                  }}
                >
                  <div>
                    <strong>{g.name}</strong>
                    <span style={{ color: "#9aa0b4", marginLeft: 8, fontWeight: 400 }}>{g.location}</span>
                    <div style={{ fontSize: 11, color: "#6c7288", marginTop: 4, fontFamily: "ui-monospace, monospace" }}>
                      {g.id}
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button
                      type="button"
                      onClick={() => {
                        setSelected(g);
                        setEditName(g.name);
                        setEditLocation(g.location);
                        setEditAddress(g.address);
                        setEditLat(String(g.lat));
                        setEditLng(String(g.lng));
                        setCapacity(String(g.capacityBase));
                        setStatus(`Selected gym: ${g.name}`);
                      }}
                      style={buttonStyle}
                    >
                      Open profile
                    </button>
                    <button type="button" onClick={() => void copyGymId(g.id)} style={buttonStyle}>
                      Copy ID
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {selected ? (
        <section style={panelStyle}>
          <h2 style={{ marginTop: 0 }}>Edit: {selected.name}</h2>
          <label style={{ color: "#9aa0b4", fontSize: 12 }}>Gym ID (for trainer creation)</label>
          <div style={{ display: "flex", gap: 10, marginBottom: 12, alignItems: "center" }}>
            <input
              readOnly
              value={selected.id}
              style={{ ...inputStyle, flex: 1, fontFamily: "ui-monospace, monospace", color: "#c8cde0" }}
            />
            <button type="button" onClick={() => void copyGymId(selected.id)} style={buttonStyle}>
              Copy ID
            </button>
          </div>
          <label style={{ color: "#9aa0b4", fontSize: 12 }}>Name</label>
          <input
            style={{ ...inputStyle, marginBottom: 12 }}
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
          />
          <label style={{ color: "#9aa0b4", fontSize: 12 }}>Location label</label>
          <input
            style={{ ...inputStyle, marginBottom: 12 }}
            value={editLocation}
            onChange={(e) => setEditLocation(e.target.value)}
          />
          <label style={{ color: "#9aa0b4", fontSize: 12 }}>Address</label>
          <input
            style={{ ...inputStyle, marginBottom: 12 }}
            value={editAddress}
            onChange={(e) => setEditAddress(e.target.value)}
          />
          <label style={{ color: "#9aa0b4", fontSize: 12 }}>Coordinates</label>
          <div style={{ display: "flex", gap: 10, marginBottom: 12 }}>
            <input style={{ ...inputStyle, flex: 1 }} value={editLat} onChange={(e) => setEditLat(e.target.value)} />
            <input style={{ ...inputStyle, flex: 1 }} value={editLng} onChange={(e) => setEditLng(e.target.value)} />
          </div>
          <label style={{ color: "#9aa0b4", fontSize: 12 }}>Capacity base</label>
          <input style={{ ...inputStyle, marginBottom: 12 }} value={capacity} onChange={(e) => setCapacity(e.target.value)} />
          <label style={{ color: "#9aa0b4", fontSize: 12 }}>Operating hours (JSON)</label>
          <textarea
            value={hoursJson}
            onChange={(e) => setHoursJson(e.target.value)}
            rows={8}
            style={{ ...inputStyle, width: "100%", fontFamily: "ui-monospace, monospace", marginBottom: 12 }}
          />
          <label style={{ color: "#9aa0b4", fontSize: 12 }}>Photos (JSON array of {"{ url }"} )</label>
          <textarea
            value={photosJson}
            onChange={(e) => setPhotosJson(e.target.value)}
            rows={6}
            style={{ ...inputStyle, width: "100%", fontFamily: "ui-monospace, monospace", marginBottom: 12 }}
          />
          <button type="button" onClick={() => void saveEdit()} disabled={busy} style={buttonStyle}>
            {busy ? "Saving…" : "Save changes"}
          </button>
        </section>
      ) : null}

      {status ? <p style={{ color: "#a8e8c0" }}>{status}</p> : null}
    </main>
  );
}
