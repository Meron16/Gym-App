export interface BookingSlotDto {
  slotId: string;
  startTime: string; // ISO-ish
  endTime: string;
  capacityRemaining: number;
  isAvailable: boolean;
}

export interface BookingAvailabilityQueryDto {
  gymId: string;
  date: string; // YYYY-MM-DD
}

export interface AvailabilityResponseDto {
  gymId: string;
  date: string;
  slots: BookingSlotDto[];
}

export interface CreateBookingDto {
  gymId: string;
  slotId: string;
  userId: string;
  packageId: string;
}

export type BookingStatus = "confirmed" | "cancelled";

export interface BookingDto {
  id: string;
  gymId: string;
  slotId: string;
  userId: string;
  status: BookingStatus;
  createdAt: string;
}

