/** Shared API contracts (mobile + admin + api). Keep in sync with Nest DTOs. */

export type UserRole = "user" | "operator" | "admin";

export interface GymSummary {
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

export interface GymDetail extends GymSummary {
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

export interface BookingAvailabilityResponse {
  gymId: string;
  date: string;
  slots: BookingSlot[];
}

export type BookingStatus = "confirmed" | "cancelled";

export interface Booking {
  id: string;
  gymId: string;
  slotId: string;
  userId: string;
  status: BookingStatus;
  createdAt: string;
}

export interface CreateBookingRequest {
  gymId: string;
  slotId: string;
  userId: string;
  packageId: string;
}

export interface PackageDto {
  id: string;
  name: string;
  billing: "daily" | "weekly" | "monthly" | "annual";
  price: string;
  highlights: string[];
  bookingEntitlement: { maxSessionsPerWeek: number };
}

export interface PackagesResponse {
  packages: PackageDto[];
  activePackageId?: string;
}

export interface FirebaseLoginRequest {
  idToken: string;
}

export interface AuthProfile {
  id: string;
  role: UserRole;
  email?: string;
}

export interface FirebaseLoginResponse {
  accessToken: string;
  profile: AuthProfile;
}

export interface CheckoutSessionRequest {
  packageId: string;
  userId: string;
}

export interface CheckoutSessionResponse {
  checkoutUrl: string;
  provider: "stripe";
  liveCheckout: boolean;
}

export interface TrainerSummary {
  id: string;
  gymId: string;
  gymName: string;
  gymLocation: string;
  name: string;
  tagline: string;
  expertise: string[];
  availabilitySummary: string;
  photoUrl?: string;
}

export interface CreateTrainerBookingRequest {
  trainerId: string;
  slotId: string;
  packageId: string;
}
