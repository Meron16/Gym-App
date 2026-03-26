import { ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import {
  AvailabilityResponseDto,
  BookingDto,
  BookingSlotDto,
  CreateBookingDto,
} from "./dto";

type BookingState = {
  id: string;
  gymId: string;
  slotId: string;
  userId: string;
  status: "confirmed" | "cancelled";
  createdAt: string;
};

const bookings: BookingState[] = [];

const gymSlots = ["06:30", "07:30", "09:00", "17:30", "19:00"];

function uid(prefix: string) {
  return `${prefix}_${Math.random().toString(16).slice(2)}_${Date.now()}`;
}

function slotStartEnd(start: string) {
  // simple ISO-ish representation
  const startTime = `${start}:00`;
  const endTime = start === "19:00" ? "20:00:00" : `${start.split(":")[0]}:${start.split(":")[1]}:00`;
  // keep endTime stable; UI only displays start slot
  return { startTime, endTime };
}

function availabilityRemaining(gymId: string, date: string, slotId: string) {
  const seed = `${gymId}|${date}|${slotId}`.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  const remaining = 1 + (seed % 8); // 1..8
  return remaining;
}

function filterBookingsForSlot(gymId: string, slotId: string) {
  return bookings.filter((b) => b.gymId === gymId && b.slotId === slotId && b.status === "confirmed");
}

@Injectable()
export class BookingsService {
  getAvailability(query: { gymId: string; date: string }): AvailabilityResponseDto {
    const gymId = query.gymId;
    const date = query.date;
    const slots: BookingSlotDto[] = gymSlots.map((start) => {
      const slotId = `${gymId}_${date}_${start}`;
      const totalCapacity = 10;
      const already = filterBookingsForSlot(gymId, slotId).length;
      const capacityRemaining = Math.max(0, totalCapacity - already);

      // Introduce deterministic variability by adjusting "already" count.
      const desiredRemaining = availabilityRemaining(gymId, date, slotId);
      const effectiveAlready = Math.max(0, totalCapacity - desiredRemaining);
      const effectiveRemaining = Math.max(0, totalCapacity - effectiveAlready);

      // Use the min of computed effective remaining and real bookings remaining.
      const remaining = Math.min(capacityRemaining, effectiveRemaining);
      return {
        slotId,
        startTime: `${date}T${slotStartEnd(start).startTime}Z`,
        endTime: `${date}T${slotStartEnd(start).endTime}Z`,
        capacityRemaining: remaining,
        isAvailable: remaining > 0,
      };
    });

    return { gymId, date, slots };
  }

  createBooking(dto: CreateBookingDto): BookingDto {
    const { gymId, slotId, userId } = dto;
    if (!gymId || !slotId || !userId) {
      throw new NotFoundException("Missing required fields");
    }

    const slotBookings = bookings.filter((b) => b.gymId === gymId && b.slotId === slotId && b.status === "confirmed");
    const totalCapacity = 10;
    const capacityRemaining = totalCapacity - slotBookings.length;

    if (capacityRemaining <= 0) {
      throw new ConflictException("Slot is full");
    }

    const newBooking: BookingState = {
      id: uid("booking"),
      gymId,
      slotId,
      userId,
      status: "confirmed",
      createdAt: new Date().toISOString(),
    };

    bookings.push(newBooking);
    return newBooking;
  }
}

