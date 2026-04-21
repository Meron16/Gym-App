"use client";

import { useEffect, useMemo, useState } from "react";
import { apiFetch } from "../../../lib/api";
import { panelStyle, buttonStyle, inputStyle } from "../../styles";

type UserRow = {
  id: string;
  email: string | null;
  displayName: string | null;
  phone: string | null;
  firebaseUid: string | null;
  role: "user" | "operator" | "admin";
  createdAt: string;
  updatedAt: string;
};

export default function AccountsPage() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [selected, setSelected] = useState<UserRow | null>(null);
  const [q, setQ] = useState("");
  const [roleFilter, setRoleFilter] = useState<"all" | "user" | "operator" | "admin">("all");
  const [editDisplayName, setEditDisplayName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editRole, setEditRole] = useState<UserRow["role"]>("user");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setMsg(null);
    try {
      const params = new URLSearchParams();
      if (q.trim()) params.set("q", q.trim());
      if (roleFilter !== "all") params.set("role", roleFilter);
      params.set("limit", "300");
      const res = await apiFetch(`/admin/users?${params.toString()}`);
      if (!res.ok) throw new Error("load failed");
      const rows = (await res.json()) as UserRow[];
      setUsers(rows);
      if (selected) {
        const next = rows.find((u) => u.id === selected.id) ?? null;
        setSelected(next);
        if (next) {
          setEditDisplayName(next.displayName ?? "");
          setEditPhone(next.phone ?? "");
          setEditRole(next.role);
        }
      }
    } catch {
      setMsg("Could not load accounts.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const sorted = useMemo(
    () =>
      [...users].sort((a, b) => {
        const ar = a.role === "admin" ? 0 : a.role === "operator" ? 1 : 2;
        const br = b.role === "admin" ? 0 : b.role === "operator" ? 1 : 2;
        if (ar !== br) return ar - br;
        return (a.email ?? "").localeCompare(b.email ?? "");
      }),
    [users],
  );

  const save = async () => {
    if (!selected) return;
    setSaving(true);
    setMsg(null);
    try {
      const res = await apiFetch(`/admin/users/${encodeURIComponent(selected.id)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          displayName: editDisplayName.trim() || null,
          phone: editPhone.trim() || null,
          role: editRole,
        }),
      });
      if (!res.ok) {
        const txt = await res.text().catch(() => "");
        throw new Error(txt || "save failed");
      }
      const next = (await res.json()) as UserRow;
      setSelected(next);
      setUsers((prev) => prev.map((u) => (u.id === next.id ? next : u)));
      setMsg("Account updated.");
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Could not update account.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <main>
      <h1 style={{ fontSize: 26, marginTop: 0 }}>Accounts</h1>
      <p style={{ color: "#9aa0b4", lineHeight: 1.6 }}>
        Manage users deeply: role, display name, and phone. Role changes affect dashboard permissions.
      </p>

      <section style={panelStyle}>
        <h2 style={{ marginTop: 0 }}>Search</h2>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <input
            style={{ ...inputStyle, flex: "1 1 300px" }}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search by email, name, phone"
          />
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value as typeof roleFilter)}
            style={{ ...inputStyle, minWidth: 160 }}
          >
            <option value="all">All roles</option>
            <option value="admin">Admin</option>
            <option value="operator">Operator</option>
            <option value="user">User</option>
          </select>
          <button type="button" onClick={() => void load()} style={buttonStyle} disabled={loading}>
            {loading ? "Loading…" : "Refresh"}
          </button>
        </div>
      </section>

      <section style={{ ...panelStyle, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <div>
          <h2 style={{ marginTop: 0 }}>Users ({sorted.length})</h2>
          {sorted.length === 0 ? (
            <p style={{ color: "#9aa0b4" }}>{loading ? "Loading…" : "No users found."}</p>
          ) : (
            <ul style={{ listStyle: "none", padding: 0, margin: 0, maxHeight: 520, overflow: "auto" }}>
              {sorted.map((u) => (
                <li key={u.id} style={{ marginBottom: 8 }}>
                  <button
                    type="button"
                    onClick={() => {
                      setSelected(u);
                      setEditDisplayName(u.displayName ?? "");
                      setEditPhone(u.phone ?? "");
                      setEditRole(u.role);
                    }}
                    style={{
                      ...buttonStyle,
                      width: "100%",
                      textAlign: "left",
                      background: selected?.id === u.id ? "#243054" : "#1a2033",
                    }}
                  >
                    <div style={{ fontWeight: 700 }}>{u.displayName || "Unnamed"}</div>
                    <div style={{ color: "#9aa0b4", fontSize: 12 }}>{u.email ?? "(no email)"}</div>
                    <div style={{ color: "#6c7288", fontSize: 11, marginTop: 4 }}>
                      {u.role} · {u.id}
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div>
          <h2 style={{ marginTop: 0 }}>User profile</h2>
          {!selected ? (
            <p style={{ color: "#9aa0b4" }}>Select a user to view and edit details.</p>
          ) : (
            <>
              <label style={{ color: "#9aa0b4", fontSize: 12 }}>User ID</label>
              <input readOnly value={selected.id} style={{ ...inputStyle, marginBottom: 12, color: "#c8cde0" }} />
              <label style={{ color: "#9aa0b4", fontSize: 12 }}>Email</label>
              <input readOnly value={selected.email ?? ""} style={{ ...inputStyle, marginBottom: 12, color: "#c8cde0" }} />
              <label style={{ color: "#9aa0b4", fontSize: 12 }}>Display name</label>
              <input
                value={editDisplayName}
                onChange={(e) => setEditDisplayName(e.target.value)}
                style={{ ...inputStyle, marginBottom: 12 }}
              />
              <label style={{ color: "#9aa0b4", fontSize: 12 }}>Phone</label>
              <input
                value={editPhone}
                onChange={(e) => setEditPhone(e.target.value)}
                style={{ ...inputStyle, marginBottom: 12 }}
              />
              <label style={{ color: "#9aa0b4", fontSize: 12 }}>Role</label>
              <select
                value={editRole}
                onChange={(e) => setEditRole(e.target.value as UserRow["role"])}
                style={{ ...inputStyle, marginBottom: 12 }}
              >
                <option value="admin">admin</option>
                <option value="operator">operator</option>
                <option value="user">user</option>
              </select>
              <div style={{ display: "flex", gap: 10 }}>
                <button type="button" onClick={() => void save()} style={buttonStyle} disabled={saving}>
                  {saving ? "Saving…" : "Save profile"}
                </button>
                <button type="button" onClick={() => void load()} style={buttonStyle}>
                  Reload users
                </button>
              </div>
              <p style={{ color: "#9aa0b4", fontSize: 12, marginTop: 10 }}>
                Created {new Date(selected.createdAt).toLocaleString()} · Updated{" "}
                {new Date(selected.updatedAt).toLocaleString()}
              </p>
            </>
          )}
        </div>
      </section>

      {msg ? <p style={{ color: msg.toLowerCase().includes("could not") ? "#ff9fb0" : "#a8e8c0" }}>{msg}</p> : null}
    </main>
  );
}

