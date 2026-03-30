import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Gym Admin",
  description: "Operator dashboard (MVP scaffold)",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, fontFamily: "system-ui, sans-serif", background: "#0a0c14", color: "#e8e9f0" }}>
        {children}
      </body>
    </html>
  );
}
