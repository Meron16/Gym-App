export type MainTab = "home" | "browse" | "booking" | "activity";

export interface GymItem {
  id: string;
  name: string;
  location: string;
  lat: number;
  lng: number;
  rating: number;
  priceFrom: string;
  capacityPercent: `${number}%`;
  tag: string;
}

export interface GymDetail extends GymItem {
  address: string;
  amenities: string[];
  operatingHours: { day: string; open: string; close: string }[];
  photos: { url: string }[];
}

export interface BookingSlot {
  slotId: string;
  startTime: string;
  endTime: string;
  capacityRemaining: number;
  isAvailable: boolean;
}

export interface Booking {
  id: string;
  gymId: string;
  slotId: string;
  userId: string;
  status: "confirmed" | "cancelled";
  createdAt: string;
}

export interface Package {
  id: string;
  name: string;
  billing: "daily" | "weekly" | "monthly" | "annual";
  price: string;
  highlights: string[];
  bookingEntitlement: { maxSessionsPerWeek: number };
}
