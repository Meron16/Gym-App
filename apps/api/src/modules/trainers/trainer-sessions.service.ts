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
import type {
  CreateTrainerBookingDto,
  TrainerAvailabilityResponseDto,
  TrainerBookingDto,
  TrainerBookingSlotDto,
} from './dto';
import {
  defaultSlotTimes,
  slotStartEndFor,
  weekdayShort,
} from './trainer-slot-utils';

const trainerSlotMutexes = new Map<string, Mutex>();

function mutexFor(slotId: string) {
  if (!trainerSlotMutexes.has(slotId)) {
    trainerSlotMutexes.set(slotId, new Mutex());
  }
  return trainerSlotMutexes.get(slotId)!;
}

@Injectable()
export class TrainerSessionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly entitlements: EntitlementsService,
    private readonly config: ConfigService,
  ) {}

  private get capacity(): number {
    return this.config.get<number>('trainerBooking.slotCapacity') ?? 1;
  }

  private allowedStartsForTrainer(
    trainer: {
      availability: unknown;
    },
    dateIso: string,
  ): string[] {
    const d = new Date(`${dateIso}T12:00:00Z`);
    const day = weekdayShort(d);
    const raw = trainer.availability as
      | { day?: string; slots?: string[] }[]
      | null;
    if (!Array.isArray(raw) || raw.length === 0) {
      return defaultSlotTimes();
    }
    const entry = raw.find(
      (x) => (x.day ?? '').toLowerCase() === day.toLowerCase(),
    );
    if (!entry?.slots?.length) {
      const fallback = raw.flatMap((x) => x.slots ?? []);
      return fallback.length ? [...new Set(fallback)] : defaultSlotTimes();
    }
    return entry.slots;
  }

  async getAvailability(query: {
    trainerId: string;
    date: string;
  }): Promise<TrainerAvailabilityResponseDto> {
    const { trainerId, date } = query;
    const trainer = await this.prisma.trainer.findFirst({
      where: { id: trainerId, active: true },
    });
    if (!trainer) {
      throw new NotFoundException('Trainer not found');
    }
    const starts = this.allowedStartsForTrainer(trainer, date);
    const cap = this.capacity;
    const slots: TrainerBookingSlotDto[] = [];
    for (const start of starts) {
      const slotId = `${trainerId}_${date}_${start}`;
      const already = await this.prisma.trainerBooking.count({
        where: { trainerId, slotId, status: 'confirmed' },
      });
      const remaining = Math.max(0, cap - already);
      const { startTime, endTime } = slotStartEndFor(date, start);
      slots.push({
        slotId,
        startTime,
        endTime,
        capacityRemaining: remaining,
        isAvailable: remaining > 0,
      });
    }
    return { trainerId, date, slots };
  }

  async createBooking(
    dto: CreateTrainerBookingDto,
    authenticatedUserId: string,
  ): Promise<TrainerBookingDto> {
    const { trainerId, slotId, packageId } = dto;
    if (!trainerId || !slotId || !packageId) {
      throw new NotFoundException('Missing required fields');
    }
    const trainer = await this.prisma.trainer.findFirst({
      where: { id: trainerId, active: true },
    });
    if (!trainer) {
      throw new NotFoundException('Trainer not found');
    }
    await this.entitlements.assertUserMayBook(authenticatedUserId);
    return mutexFor(slotId).runExclusive(async () =>
      this.createBookingExclusive(dto, authenticatedUserId),
    );
  }

  private async createBookingExclusive(
    dto: CreateTrainerBookingDto,
    userId: string,
  ): Promise<TrainerBookingDto> {
    const { trainerId, slotId } = dto;
    const cap = this.capacity;
    const result = await this.prisma.$transaction(async (tx) => {
      const already = await tx.trainerBooking.count({
        where: { trainerId, slotId, status: 'confirmed' },
      });
      if (already >= cap) {
        throw new ConflictException('Slot is full');
      }
      const row = await tx.trainerBooking.create({
        data: {
          userId,
          trainerId,
          slotId,
          status: 'confirmed',
        },
      });
      return row;
    });
    return {
      id: result.id,
      trainerId: result.trainerId,
      slotId: result.slotId,
      userId: result.userId,
      status: result.status as TrainerBookingDto['status'],
      createdAt: result.createdAt.toISOString(),
    };
  }

  async listMyBookings(userId: string): Promise<TrainerBookingDto[]> {
    const rows = await this.prisma.trainerBooking.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
    return rows.map((r) => ({
      id: r.id,
      trainerId: r.trainerId,
      slotId: r.slotId,
      userId: r.userId,
      status: r.status as TrainerBookingDto['status'],
      createdAt: r.createdAt.toISOString(),
    }));
  }

  async cancelBooking(
    bookingId: string,
    userId: string,
  ): Promise<TrainerBookingDto> {
    const row = await this.prisma.trainerBooking.findUnique({
      where: { id: bookingId },
    });
    if (!row) {
      throw new NotFoundException('Booking not found');
    }
    if (row.userId !== userId) {
      throw new ForbiddenException('Not allowed to cancel this booking');
    }
    const updated = await this.prisma.trainerBooking.update({
      where: { id: bookingId },
      data: { status: 'cancelled' },
    });
    return {
      id: updated.id,
      trainerId: updated.trainerId,
      slotId: updated.slotId,
      userId: updated.userId,
      status: updated.status as TrainerBookingDto['status'],
      createdAt: updated.createdAt.toISOString(),
    };
  }
}
