export interface BookingSlotDto {
  slotId: string;
  startTime: string;
  endTime: string;
  capacityRemaining: number;
  isAvailable: boolean;
}

export interface BookingAvailabilityQueryDto {
  gymId: string;
  date: string;
}

export interface AvailabilityResponseDto {
  gymId: string;
  date: string;
  slots: BookingSlotDto[];
}

export interface CreateBookingDto {
  gymId: string;
  slotId: string;
  /** Ignored when using JWT — server uses authenticated user id */
  userId?: string;
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
