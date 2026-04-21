export interface TrainerSummaryDto {
  id: string;
  gymId: string;
  gymName: string;
  gymLocation: string;
  name: string;
  tagline: string;
  expertise: string[];
  /** Human-readable availability preview */
  availabilitySummary: string;
  photoUrl?: string;
}

export interface TrainerDetailDto extends TrainerSummaryDto {
  availability: { day: string; slots: string[] }[];
}

export interface TrainerBookingSlotDto {
  slotId: string;
  startTime: string;
  endTime: string;
  capacityRemaining: number;
  isAvailable: boolean;
}

export interface TrainerAvailabilityResponseDto {
  trainerId: string;
  date: string;
  slots: TrainerBookingSlotDto[];
}

export type TrainerBookingStatus = 'confirmed' | 'cancelled';

export interface TrainerBookingDto {
  id: string;
  trainerId: string;
  slotId: string;
  userId: string;
  status: TrainerBookingStatus;
  createdAt: string;
}

export interface CreateTrainerBookingDto {
  trainerId: string;
  slotId: string;
  packageId: string;
}
