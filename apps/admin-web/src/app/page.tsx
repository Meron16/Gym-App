"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getStoredToken } from "../lib/api";

export default function Home() {
  const router = useRouter();
  useEffect(() => {
    const t = getStoredToken();
    router.replace(t ? "/dashboard" : "/login");
  }, [router]);
  return (
    <main style={{ padding: 32, color: "#9aa0b4" }}>
      <p>Loading…</p>
    </main>
  );
}
