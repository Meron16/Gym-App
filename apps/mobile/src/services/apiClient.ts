import type { Booking, BookingSlot, GymDetail, GymItem, Package } from "../types/app";
import { getAccessToken } from "./sessionStore";

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:3001";

async function jsonFetch<T>(input: RequestInfo | URL, init?: RequestInit): Promise<T> {
  const token = await getAccessToken();
  const headers = new Headers(init?.headers);
  if (init?.body != null && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }
  const res = await fetch(input, { ...init, headers });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`API ${res.status}: ${text || res.statusText}`);
  }
  return (await res.json()) as T;
}

export const api = {
  async authFirebaseLogin(idToken: string): Promise<{
    accessToken: string;
    profile: { id: string; role: string; email?: string };
  }> {
    const res = await fetch(`${API_BASE_URL}/auth/firebase-login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ idToken }),
    });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`API ${res.status}: ${text || res.statusText}`);
    }
    return (await res.json()) as {
      accessToken: string;
      profile: { id: string; role: string; email?: string };
    };
  },

  /** Email/password sign-up — creates a User in the API database (no Firebase). */
  async register(body: {
    email: string;
    password: string;
    fullName?: string;
    phone?: string;
  }): Promise<{ accessToken: string; profile: { id: string; role: string; email?: string } }> {
    const res = await fetch(`${API_BASE_URL}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const text = await res.text().catch(() => "");
    if (!res.ok) {
      let msg = text;
      try {
        const j = JSON.parse(text) as { message?: string | string[] };
        if (Array.isArray(j.message)) msg = j.message.join(". ");
        else if (typeof j.message === "string") msg = j.message;
      } catch {
        /* keep msg */
      }
      throw new Error(msg || `API ${res.status}`);
    }
    return JSON.parse(text) as {
      accessToken: string;
      profile: { id: string; role: string; email?: string };
    };
  },

  /** Email/password sign-in for accounts created via register(). */
  async login(body: { email: string; password: string }): Promise<{
    accessToken: string;
    profile: { id: string; role: string; email?: string };
  }> {
    const res = await fetch(`${API_BASE_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const text = await res.text().catch(() => "");
    if (!res.ok) {
      let msg = text;
      try {
        const j = JSON.parse(text) as { message?: string | string[] };
        if (Array.isArray(j.message)) msg = j.message.join(". ");
        else if (typeof j.message === "string") msg = j.message;
      } catch {
        /* keep msg */
      }
      throw new Error(msg || `API ${res.status}`);
    }
    return JSON.parse(text) as {
      accessToken: string;
      profile: { id: string; role: string; email?: string };
    };
  },

  async getGyms(params: {
    q?: string;
    location?: string;
    facility?: string;
    lat?: number;
    lng?: number;
    radiusKm?: number;
  }): Promise<GymItem[]> {
    const url = new URL(`${API_BASE_URL}/gyms`);
    if (params.q) url.searchParams.set("q", params.q);
    if (params.location) url.searchParams.set("location", params.location);
    if (params.facility) url.searchParams.set("facility", params.facility);
    if (typeof params.lat === "number") url.searchParams.set("lat", String(params.lat));
    if (typeof params.lng === "number") url.searchParams.set("lng", String(params.lng));
    if (typeof params.radiusKm === "number") url.searchParams.set("radiusKm", String(params.radiusKm));
    return jsonFetch<GymItem[]>(url);
  },

  async getGym(id: string): Promise<GymDetail> {
    return jsonFetch<GymDetail>(`${API_BASE_URL}/gyms/${encodeURIComponent(id)}`);
  },

  async getBookingAvailability(params: { gymId: string; date: string }): Promise<{
    gymId: string;
    date: string;
    slots: BookingSlot[];
  }> {
    const url = new URL(`${API_BASE_URL}/bookings/availability`);
    url.searchParams.set("gymId", params.gymId);
    url.searchParams.set("date", params.date);
    return jsonFetch(url);
  },

  async getPackages(): Promise<{ packages: Package[]; activePackageId?: string }> {
    return jsonFetch(`${API_BASE_URL}/packages`);
  },

  async getMyPackages(): Promise<{ packages: Package[]; activePackageId?: string }> {
    return jsonFetch(`${API_BASE_URL}/packages/me`);
  },

  async createCheckoutSession(packageId: string): Promise<{ checkoutUrl: string; provider: string }> {
    return jsonFetch(`${API_BASE_URL}/payments/checkout-session`, {
      method: "POST",
      body: JSON.stringify({ packageId }),
    });
  },

  async getPaymentHistory(): Promise<
    { id: string; provider: string; amountCents: number; externalId?: string; createdAt: string }[]
  > {
    return jsonFetch(`${API_BASE_URL}/payments/history`);
  },

  async trackAnalytics(body: {
    event: string;
    userId?: string;
    props?: Record<string, unknown>;
  }): Promise<{ accepted: boolean }> {
    return jsonFetch(`${API_BASE_URL}/analytics/track`, {
      method: "POST",
      body: JSON.stringify(body),
    });
  },

  async createBooking(dto: { gymId: string; slotId: string; packageId: string }): Promise<Booking> {
    return jsonFetch(`${API_BASE_URL}/bookings`, {
      method: "POST",
      body: JSON.stringify(dto),
    });
  },

  async getActivitySummary(userId: string): Promise<{
    userId: string;
    streakDays: number;
    sessionsThisWeek: number;
    badges: string[];
    leaderboardPreview: { rank: number; name: string; points: number }[];
  }> {
    const url = new URL(`${API_BASE_URL}/activity/summary`);
    url.searchParams.set("userId", userId);
    return jsonFetch(url);
  },
};
