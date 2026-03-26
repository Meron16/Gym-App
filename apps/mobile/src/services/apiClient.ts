import type { Booking, BookingSlot, GymItem } from "../types/app";

const API_BASE_URL = "http://localhost:3001";

async function jsonFetch<T>(input: RequestInfo | URL, init?: RequestInit): Promise<T> {
  const res = await fetch(input, init);
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`API ${res.status}: ${text || res.statusText}`);
  }
  return (await res.json()) as T;
}

export const api = {
  async getGyms(params: { q?: string; location?: string; facility?: string }): Promise<GymItem[]> {
    const url = new URL(`${API_BASE_URL}/gyms`);
    if (params.q) url.searchParams.set("q", params.q);
    if (params.location) url.searchParams.set("location", params.location);
    if (params.facility) url.searchParams.set("facility", params.facility);
    return jsonFetch<GymItem[]>(url);
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

  async createBooking(dto: {
    gymId: string;
    slotId: string;
    userId: string;
    packageId: string;
  }): Promise<Booking> {
    return jsonFetch(`${API_BASE_URL}/bookings`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(dto),
    });
  },
};

