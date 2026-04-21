import type { CSSProperties } from "react";

export const panelStyle: CSSProperties = {
  marginTop: 20,
  padding: 20,
  borderRadius: 12,
  border: "1px solid #2a3148",
  background: "#121624",
};

export const buttonStyle: CSSProperties = {
  padding: "10px 14px",
  borderRadius: 8,
  border: "1px solid #374167",
  background: "#1a2033",
  color: "#e8e9f0",
  cursor: "pointer",
  fontWeight: 600,
};

export const inputStyle: CSSProperties = {
  padding: "10px 12px",
  borderRadius: 8,
  border: "1px solid #374167",
  background: "#0f1320",
  color: "#e8e9f0",
  fontSize: 15,
};

export const navLink = (active: boolean): CSSProperties => ({
  color: active ? "#b4ff50" : "#9aa0b4",
  textDecoration: "none",
  fontWeight: 700,
  fontSize: 13,
  letterSpacing: 0.4,
});
