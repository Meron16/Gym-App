const api = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

export default async function AdminHome() {
  let health: { status?: string; database?: boolean } = {};
  try {
    const res = await fetch(`${api}/health`, { cache: "no-store" });
    health = await res.json();
  } catch {
    health = { status: "unreachable" };
  }

  return (
    <main style={{ padding: 32, maxWidth: 720 }}>
      <h1 style={{ fontSize: 28, letterSpacing: 1 }}>Gym operator (MVP)</h1>
      <p style={{ color: "#9aa0b4", lineHeight: 1.6 }}>
        This Next.js app is a scaffold for Phase 8. Set <code>NEXT_PUBLIC_API_URL</code> in{" "}
        <code>.env.local</code> (see <code>.env.example</code>). Wire Firebase / role gates next.
      </p>
      <section
        style={{
          marginTop: 24,
          padding: 20,
          borderRadius: 12,
          border: "1px solid #2a3148",
          background: "#121624",
        }}
      >
        <h2 style={{ fontSize: 16, marginTop: 0 }}>API health</h2>
        <pre style={{ color: "#b8d73b", fontSize: 13 }}>{JSON.stringify(health, null, 2)}</pre>
      </section>
    </main>
  );
}
