import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Mutex } from 'async-mutex';
import { PrismaService } from '../../prisma/prisma.service';
import { EntitlementsService } from '../packages/entitlements.service';
import {
  AvailabilityResponseDto,
  BookingDto,
  BookingSlotDto,
  CreateBookingDto,
} from './dto';
const slotMutexes = new Map<string, Mutex>();

const gymSlots = ['06:30', '07:30', '09:00', '17:30', '19:00'];

function slotStartEnd(start: string) {
  const startTime = `${start}:00`;
  const endTime =
    start === '19:00'
      ? '20:00:00'
      : `${start.split(':')[0]}:${start.split(':')[1]}:00`;
  return { startTime, endTime };
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
    return this.config.get<number>('booking.slotCapacity') ?? 10;
  }

  async getAvailability(query: {
    gymId: string;
    date: string;
  }): Promise<AvailabilityResponseDto> {
    const gymId = query.gymId;
    const date = query.date;
    const cap = this.capacity;
    const gym = await this.prisma.gym.findUnique({
      where: { id: gymId },
      select: { id: true },
    });
    if (!gym) {
      throw new NotFoundException('Gym not found');
    }

    const slots: BookingSlotDto[] = [];
    for (const start of gymSlots) {
      const slotId = `${gymId}_${date}_${start}`;
      const already = await this.prisma.booking.count({
        where: { gymId, slotId, status: 'confirmed' },
      });
      const remaining = Math.max(0, cap - already);

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

  async createBooking(
    dto: CreateBookingDto,
    authenticatedUserId: string,
  ): Promise<BookingDto> {
    const { gymId, slotId, packageId } = dto;
    if (!gymId || !slotId || !packageId) {
      throw new NotFoundException('Missing required fields');
    }

    await this.entitlements.assertUserMayBook(authenticatedUserId);
    return mutexFor(slotId).runExclusive(async () =>
      this.createBookingExclusive(dto, authenticatedUserId),
    );
  }

  async listMyBookings(userId: string): Promise<BookingDto[]> {
    const rows = await this.prisma.booking.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
    return rows.map((r) => ({
      id: r.id,
      gymId: r.gymId,
      slotId: r.slotId,
      userId: r.userId,
      status: r.status as BookingDto['status'],
      createdAt: r.createdAt.toISOString(),
    }));
  }

  async cancelBooking(bookingId: string, userId: string): Promise<BookingDto> {
    const row = await this.prisma.booking.findUnique({
      where: { id: bookingId },
    });
    if (!row) {
      throw new NotFoundException('Booking not found');
    }
    if (row.userId !== userId) {
      throw new ForbiddenException('Not allowed to cancel this booking');
    }
    const updated = await this.prisma.booking.update({
      where: { id: bookingId },
      data: { status: 'cancelled' },
    });
    return {
      id: updated.id,
      gymId: updated.gymId,
      slotId: updated.slotId,
      userId: updated.userId,
      status: updated.status as BookingDto['status'],
      createdAt: updated.createdAt.toISOString(),
    };
  }

  private async createBookingExclusive(
    dto: CreateBookingDto,
    userId: string,
  ): Promise<BookingDto> {
    const { gymId, slotId } = dto;
    const cap = this.capacity;

    const result = await this.prisma.$transaction(async (tx) => {
      const gym = await tx.gym.findUnique({
        where: { id: gymId },
        select: { id: true },
      });
      if (!gym) {
        throw new NotFoundException('Gym not found');
      }
      const already = await tx.booking.count({
        where: { gymId, slotId, status: 'confirmed' },
      });
      if (already >= cap) {
        throw new ConflictException('Slot is full');
      }
      const row = await tx.booking.create({
        data: {
          userId,
          gymId,
          slotId,
          status: 'confirmed',
        },
      });
      return row;
    });

    return {
      id: result.id,
      gymId: result.gymId,
      slotId: result.slotId,
      userId: result.userId,
      status: result.status as BookingDto['status'],
      createdAt: result.createdAt.toISOString(),
    };
  }
}
