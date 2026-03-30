import type { Booking, BookingSlot, GymDetail, GymItem } from "../types/app";
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
    return jsonFetch(`${API_BASE_URL}/auth/firebase-login`, {
      method: "POST",
      body: JSON.stringify({ idToken }),
    });
  },

  async getGyms(params: { q?: string; location?: string; facility?: string }): Promise<GymItem[]> {
    const url = new URL(`${API_BASE_URL}/gyms`);
    if (params.q) url.searchParams.set("q", params.q);
    if (params.location) url.searchParams.set("location", params.location);
    if (params.facility) url.searchParams.set("facility", params.facility);
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
