import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Mutex } from "async-mutex";
import { PrismaService } from "../../prisma/prisma.service";
import { EntitlementsService } from "../packages/entitlements.service";
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
  status: "pending" | "confirmed" | "cancelled" | "completed";
  createdAt: string;
};

const memoryBookings: BookingState[] = [];
const slotMutexes = new Map<string, Mutex>();

const gymSlots = ["06:30", "07:30", "09:00", "17:30", "19:00"];

function uid(prefix: string) {
  return `${prefix}_${Math.random().toString(16).slice(2)}_${Date.now()}`;
}

function slotStartEnd(start: string) {
  const startTime = `${start}:00`;
  const endTime = start === "19:00" ? "20:00:00" : `${start.split(":")[0]}:${start.split(":")[1]}:00`;
  return { startTime, endTime };
}

function availabilityRemaining(gymId: string, date: string, slotId: string) {
  const seed = `${gymId}|${date}|${slotId}`.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  return 1 + (seed % 8);
}

function memoryCountForSlot(gymId: string, slotId: string) {
  return memoryBookings.filter((b) => b.gymId === gymId && b.slotId === slotId && b.status === "confirmed")
    .length;
}

function mutexFor(slotId: string) {
  if (!slotMutexes.has(slotId)) {
    slotMutexes.set(slotId, new Mutex());
  }
  return slotMutexes.get(slotId)!;
}

@Injectable()
export class BookingsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly entitlements: EntitlementsService,
    private readonly config: ConfigService,
  ) {}

  private get capacity(): number {
    return this.config.get<number>("booking.slotCapacity") ?? 10;
  }

  async getAvailability(query: { gymId: string; date: string }): Promise<AvailabilityResponseDto> {
    const gymId = query.gymId;
    const date = query.date;
    const cap = this.capacity;

    const slots: BookingSlotDto[] = [];
    for (const start of gymSlots) {
      const slotId = `${gymId}_${date}_${start}`;
      let already = memoryCountForSlot(gymId, slotId);
      try {
        already = await this.prisma.booking.count({
          where: { gymId, slotId, status: "confirmed" },
        });
      } catch {
        /* use memory fallback */
      }

      const capacityRemaining = Math.max(0, cap - already);
      const desiredRemaining = availabilityRemaining(gymId, date, slotId);
      const effectiveAlready = Math.max(0, cap - desiredRemaining);
      const effectiveRemaining = Math.max(0, cap - effectiveAlready);
      const remaining = Math.min(capacityRemaining, effectiveRemaining);

      slots.push({
        slotId,
        startTime: `${date}T${slotStartEnd(start).startTime}Z`,
        endTime: `${date}T${slotStartEnd(start).endTime}Z`,
        capacityRemaining: remaining,
        isAvailable: remaining > 0,
      });
    }

    return { gymId, date, slots };
  }

  async createBooking(dto: CreateBookingDto, authenticatedUserId: string): Promise<BookingDto> {
    const { gymId, slotId, packageId } = dto;
    if (!gymId || !slotId || !packageId) {
      throw new NotFoundException("Missing required fields");
    }

    await this.entitlements.assertUserMayBook(authenticatedUserId);
    return mutexFor(slotId).runExclusive(async () => this.createBookingExclusive(dto, authenticatedUserId));
  }

  async listMyBookings(userId: string): Promise<BookingDto[]> {
    try {
      const rows = await this.prisma.booking.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
      });
      return rows.map((r) => ({
        id: r.id,
        gymId: r.gymId,
        slotId: r.slotId,
        userId: r.userId,
        status: r.status as BookingDto["status"],
        createdAt: r.createdAt.toISOString(),
      }));
    } catch {
      return memoryBookings
        .filter((b) => b.userId === userId)
        .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
    }
  }

  async cancelBooking(bookingId: string, userId: string): Promise<BookingDto> {
    try {
      const row = await this.prisma.booking.findUnique({ where: { id: bookingId } });
      if (!row) {
        throw new NotFoundException("Booking not found");
      }
      if (row.userId !== userId) {
        throw new ForbiddenException("Not allowed to cancel this booking");
      }
      const updated = await this.prisma.booking.update({
        where: { id: bookingId },
        data: { status: "cancelled" },
      });
      return {
        id: updated.id,
        gymId: updated.gymId,
        slotId: updated.slotId,
        userId: updated.userId,
        status: updated.status as BookingDto["status"],
        createdAt: updated.createdAt.toISOString(),
      };
    } catch (e) {
      if (e instanceof NotFoundException || e instanceof ForbiddenException) {
        throw e;
      }
    }

    const hit = memoryBookings.find((b) => b.id === bookingId);
    if (!hit) {
      throw new NotFoundException("Booking not found");
    }
    if (hit.userId !== userId) {
      throw new ForbiddenException("Not allowed to cancel this booking");
    }
    hit.status = "cancelled";
    return hit;
  }

  private async createBookingExclusive(
    dto: CreateBookingDto,
    userId: string,
  ): Promise<BookingDto> {
    const { gymId, slotId } = dto;
    const cap = this.capacity;

    try {
      const result = await this.prisma.$transaction(async (tx) => {
        const already = await tx.booking.count({
          where: { gymId, slotId, status: "confirmed" },
        });
        if (already >= cap) {
          throw new ConflictException("Slot is full");
        }
        const row = await tx.booking.create({
          data: {
            userId,
            gymId,
            slotId,
            status: "confirmed",
          },
        });
        return row;
      });

      return {
        id: result.id,
        gymId: result.gymId,
        slotId: result.slotId,
        userId: result.userId,
        status: result.status as BookingDto["status"],
        createdAt: result.createdAt.toISOString(),
      };
    } catch (e) {
      if (e instanceof ConflictException) {
        throw e;
      }
    }

    const slotBookings = memoryCountForSlot(gymId, slotId);
    if (slotBookings >= cap) {
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
    memoryBookings.push(newBooking);
    return newBooking;
  }
}
