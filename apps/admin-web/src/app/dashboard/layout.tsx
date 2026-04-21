"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ReactNode, useEffect, useState } from "react";
import { apiFetch, getStoredToken, setStoredToken } from "../../lib/api";
import { navLink, buttonStyle } from "../styles";

const links = [
  { href: "/dashboard", label: "Overview" },
  { href: "/dashboard/accounts", label: "Accounts" },
  { href: "/dashboard/revenue", label: "Revenue" },
  { href: "/dashboard/gyms", label: "Gyms" },
  { href: "/dashboard/bookings", label: "Bookings" },
  { href: "/dashboard/trainers", label: "Trainers" },
  { href: "/dashboard/packages", label: "Packages" },
] as const;

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [me, setMe] = useState<{ sub: string; role: string } | null>(null);

  useEffect(() => {
    const t = getStoredToken();
    if (!t) {
      router.replace("/login");
      return;
    }
    void (async () => {
      const res = await apiFetch("/admin/me", { token: t });
      if (!res.ok) {
        setStoredToken(null);
        router.replace("/login");
        return;
      }
      const j = (await res.json()) as { sub: string; role: string } | null;
      setMe(j);
    })();
  }, [router]);

  const logout = () => {
    setStoredToken(null);
    router.replace("/login");
  };

  return (
    <div style={{ minHeight: "100vh" }}>
      <header
        style={{
          borderBottom: "1px solid #242b40",
          padding: "14px 24px",
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          gap: 16,
          background: "#0f1320",
        }}
      >
        <strong style={{ fontSize: 16, letterSpacing: 0.5 }}>Gym Admin</strong>
        <nav style={{ display: "flex", flexWrap: "wrap", gap: 14 }}>
          {links.map((l) => (
            <Link key={l.href} href={l.href} style={navLink(pathname === l.href)}>
              {l.label}
            </Link>
          ))}
        </nav>
        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 12 }}>
          {me ? (
            <span style={{ color: "#9aa0b4", fontSize: 12 }}>
              {me.role} · {me.sub.slice(0, 8)}…
            </span>
          ) : null}
          <button type="button" onClick={logout} style={{ ...buttonStyle, padding: "6px 10px" }}>
            Log out
          </button>
        </div>
      </header>
      <div style={{ padding: 24, maxWidth: 1100, margin: "0 auto" }}>{children}</div>
    </div>
  );
}
