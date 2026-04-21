"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { authLogin, setStoredToken } from "../../lib/api";
import { panelStyle, buttonStyle, inputStyle } from "../styles";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    void (async () => {
      try {
        const res = await authLogin(email.trim(), password);
        if (res.profile.role !== "operator" && res.profile.role !== "admin") {
          setError("This account does not have operator or admin access.");
          return;
        }
        setStoredToken(res.accessToken);
        router.replace("/dashboard");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Login failed");
      } finally {
        setBusy(false);
      }
    })();
  };

  return (
    <main style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: 24 }}>
      <div style={{ ...panelStyle, width: "min(420px, 100%)" }}>
        <h1 style={{ marginTop: 0, fontSize: 22, letterSpacing: 0.5 }}>Gym operator sign-in</h1>
        <p style={{ color: "#9aa0b4", lineHeight: 1.5, marginTop: 0 }}>
          Use an email/password account with role <strong style={{ color: "#e8e9f0" }}>operator</strong> or{" "}
          <strong style={{ color: "#e8e9f0" }}>admin</strong>. Dev: set{" "}
          <code style={{ color: "#c8cde0" }}>AUTH_DEV_ALLOW_PLACEHOLDER_TOKEN=true</code> on the API and use the
          dashboard &quot;Dev token&quot; link after login fails.
        </p>
        <form onSubmit={onSubmit} style={{ display: "grid", gap: 12 }}>
          <input
            type="email"
            autoComplete="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={inputStyle}
            required
          />
          <input
            type="password"
            autoComplete="current-password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={inputStyle}
            required
          />
          {error ? (
            <p style={{ color: "#ff9fb0", margin: 0, fontSize: 14 }}>{error}</p>
          ) : null}
          <button type="submit" disabled={busy} style={{ ...buttonStyle, opacity: busy ? 0.6 : 1 }}>
            {busy ? "Signing in…" : "Sign in"}
          </button>
        </form>
      </div>
    </main>
  );
}
