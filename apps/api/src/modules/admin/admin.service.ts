import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

const defaultTrainerAvailability = [
  { day: 'Mon', slots: ['06:30', '09:00', '17:30'] },
  { day: 'Tue', slots: ['07:30', '17:30', '19:00'] },
  { day: 'Wed', slots: ['06:30', '09:00', '19:00'] },
  { day: 'Thu', slots: ['07:30', '17:30'] },
  { day: 'Fri', slots: ['06:30', '09:00', '17:30', '19:00'] },
  { day: 'Sat', slots: ['09:00', '11:00'] },
  { day: 'Sun', slots: ['10:00', '12:00'] },
];

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  async overview() {
    const [bookingsToday, activeSubs, gyms, revenue] = await Promise.all([
      this.prisma.booking.count({
        where: { createdAt: { gte: startOfToday(), lte: endOfToday() } },
      }),
      this.prisma.subscription.count({ where: { active: true } }),
      this.prisma.gym.count(),
      this.prisma.paymentRecord.aggregate({ _sum: { amountCents: true } }),
    ]);

    return {
      bookingsToday,
      activeSubscriptions: activeSubs,
      gyms,
      revenueCents: revenue._sum.amountCents ?? 0,
    };
  }

  async listBookings() {
    const rows = await this.prisma.booking.findMany({
      orderBy: { createdAt: 'desc' },
      take: 200,
    });
    return rows.map((r) => ({
      id: r.id,
      userId: r.userId,
      gymId: r.gymId,
      slotId: r.slotId,
      status: r.status,
      createdAt: r.createdAt.toISOString(),
    }));
  }

  async cancelBooking(id: string) {
    try {
      const updated = await this.prisma.booking.update({
        where: { id },
        data: { status: 'cancelled' },
      });
      return {
        id: updated.id,
        userId: updated.userId,
        gymId: updated.gymId,
        slotId: updated.slotId,
        status: updated.status,
        createdAt: updated.createdAt.toISOString(),
      };
    } catch {
      throw new NotFoundException('Booking not found');
    }
  }

  async createGym(body: {
    name: string;
    location?: string;
    address?: string;
    lat: number;
    lng: number;
    osmType?: string;
    osmId?: string;
  }) {
    return await this.prisma.gym.create({
      data: {
        name: body.name,
        location: body.location ?? body.address ?? 'Unknown',
        address: body.address ?? body.location ?? 'Unknown',
        rating: 4.2,
        priceFrom: '$—',
        tag: 'Fitness',
        capacityBase: 45,
        amenities: [],
        operatingHours: [],
        photos: [],
        lat: body.lat,
        lng: body.lng,
        osmType: body.osmType ?? null,
        osmId: body.osmId ?? null,
      },
    });
  }

  async listGymsAdmin() {
    const rows = await this.prisma.gym.findMany({
      orderBy: { updatedAt: 'desc' },
      take: 500,
    });
    return rows.map((g) => this.toGymAdminDto(g));
  }

  async getGymAdmin(id: string) {
    const g = await this.prisma.gym.findUnique({ where: { id } });
    if (!g) {
      throw new NotFoundException('Gym not found');
    }
    return this.toGymAdminDto(g);
  }

  async updateGymAdmin(
    id: string,
    body: Partial<{
      name: string;
      location: string;
      address: string;
      capacityBase: number;
      rating: number;
      priceFrom: string;
      tag: string;
      operatingHours: unknown;
      amenities: unknown;
      photos: unknown;
      lat: number;
      lng: number;
    }>,
  ) {
    try {
      const g = await this.prisma.gym.update({
        where: { id },
        data: {
          ...(body.name !== undefined ? { name: body.name.trim() } : {}),
          ...(body.location !== undefined
            ? { location: body.location.trim() }
            : {}),
          ...(body.address !== undefined
            ? { address: body.address.trim() }
            : {}),
          ...(body.capacityBase !== undefined
            ? { capacityBase: Math.max(1, Math.round(body.capacityBase)) }
            : {}),
          ...(body.rating !== undefined ? { rating: body.rating } : {}),
          ...(body.priceFrom !== undefined
            ? { priceFrom: body.priceFrom }
            : {}),
          ...(body.tag !== undefined ? { tag: body.tag } : {}),
          ...(body.operatingHours !== undefined
            ? { operatingHours: body.operatingHours as Prisma.InputJsonValue }
            : {}),
          ...(body.amenities !== undefined
            ? { amenities: body.amenities as Prisma.InputJsonValue }
            : {}),
          ...(body.photos !== undefined
            ? { photos: body.photos as Prisma.InputJsonValue }
            : {}),
          ...(body.lat !== undefined ? { lat: body.lat } : {}),
          ...(body.lng !== undefined ? { lng: body.lng } : {}),
        },
      });
      return this.toGymAdminDto(g);
    } catch {
      throw new NotFoundException('Gym not found');
    }
  }

  private toGymAdminDto(g: {
    id: string;
    name: string;
    location: string;
    address: string;
    rating: number;
    priceFrom: string;
    tag: string;
    capacityBase: number;
    lat: number;
    lng: number;
    amenities: Prisma.JsonValue;
    operatingHours: Prisma.JsonValue;
    photos: Prisma.JsonValue;
    updatedAt: Date;
  }) {
    return {
      id: g.id,
      name: g.name,
      location: g.location,
      address: g.address,
      rating: g.rating,
      priceFrom: g.priceFrom,
      tag: g.tag,
      capacityBase: g.capacityBase,
      lat: g.lat,
      lng: g.lng,
      amenities: g.amenities,
      operatingHours: g.operatingHours,
      photos: g.photos,
      updatedAt: g.updatedAt.toISOString(),
    };
  }

  /** Daily bookings + revenue for dashboard charts */
  async revenueSummary(days: number) {
    const safeDays = Math.min(90, Math.max(1, Math.floor(days)));
    const start = new Date();
    start.setDate(start.getDate() - safeDays);
    start.setHours(0, 0, 0, 0);

    const [bookings, payments, gymCount] = await Promise.all([
      this.prisma.booking.findMany({
        where: { createdAt: { gte: start } },
        select: { createdAt: true },
      }),
      this.prisma.paymentRecord.findMany({
        where: { createdAt: { gte: start } },
        select: { createdAt: true, amountCents: true },
      }),
      this.prisma.gym.count(),
    ]);

    const dayKey = (d: Date) => d.toISOString().slice(0, 10);
    const bookingByDay = new Map<string, number>();
    const revenueByDay = new Map<string, number>();

    const daily: { date: string; bookings: number; revenueCents: number }[] =
      [];
    for (let i = 0; i < safeDays; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      const k = dayKey(d);
      bookingByDay.set(k, 0);
      revenueByDay.set(k, 0);
      daily.push({ date: k, bookings: 0, revenueCents: 0 });
    }

    for (const b of bookings) {
      const k = dayKey(b.createdAt);
      if (bookingByDay.has(k)) {
        bookingByDay.set(k, (bookingByDay.get(k) ?? 0) + 1);
      }
    }
    for (const p of payments) {
      const k = dayKey(p.createdAt);
      if (revenueByDay.has(k)) {
        revenueByDay.set(k, (revenueByDay.get(k) ?? 0) + p.amountCents);
      }
    }

    for (let i = 0; i < daily.length; i++) {
      const row = daily[i];
      row.bookings = bookingByDay.get(row.date) ?? 0;
      row.revenueCents = revenueByDay.get(row.date) ?? 0;
    }

    const totalBookings = bookings.length;
    const occupancyHint =
      gymCount > 0 && totalBookings > 0
        ? Math.min(
            100,
            Math.round((totalBookings / (gymCount * safeDays)) * 100),
          )
        : 0;

    return {
      days: safeDays,
      since: start.toISOString(),
      daily,
      totals: {
        bookings: totalBookings,
        revenueCents: payments.reduce((s, p) => s + p.amountCents, 0),
      },
      occupancyIndexPercent: occupancyHint,
    };
  }

  async listTrainers() {
    const rows = await this.prisma.trainer.findMany({
      include: { gym: { select: { name: true, location: true } } },
      orderBy: { updatedAt: 'desc' },
      take: 200,
    });
    return rows.map((r) => ({
      id: r.id,
      gymId: r.gymId,
      gymName: r.gym.name,
      name: r.name,
      tagline: r.tagline,
      expertise: Array.isArray(r.expertise) ? r.expertise : [],
      active: r.active,
      photoUrl: r.photoUrl,
    }));
  }

  async createTrainer(body: {
    gymId: string;
    name: string;
    tagline?: string;
    expertise: string[];
    availability?: { day: string; slots: string[] }[];
    photoUrl?: string;
  }) {
    const gym = await this.prisma.gym.findUnique({ where: { id: body.gymId } });
    if (!gym) {
      throw new NotFoundException('Gym not found');
    }
    return await this.prisma.trainer.create({
      data: {
        gymId: body.gymId,
        name: body.name.trim(),
        tagline: body.tagline?.trim() ?? '',
        expertise: body.expertise ?? [],
        availability: body.availability?.length
          ? body.availability
          : defaultTrainerAvailability,
        photoUrl: body.photoUrl?.trim() || null,
        active: true,
      },
    });
  }

  async updateTrainer(
    id: string,
    body: Partial<{
      name: string;
      tagline: string;
      expertise: string[];
      availability: { day: string; slots: string[] }[];
      photoUrl: string | null;
      active: boolean;
      gymId: string;
    }>,
  ) {
    try {
      return await this.prisma.trainer.update({
        where: { id },
        data: {
          ...(body.name !== undefined ? { name: body.name.trim() } : {}),
          ...(body.tagline !== undefined
            ? { tagline: body.tagline.trim() }
            : {}),
          ...(body.expertise !== undefined
            ? { expertise: body.expertise }
            : {}),
          ...(body.availability !== undefined
            ? { availability: body.availability }
            : {}),
          ...(body.photoUrl !== undefined ? { photoUrl: body.photoUrl } : {}),
          ...(body.active !== undefined ? { active: body.active } : {}),
          ...(body.gymId !== undefined ? { gymId: body.gymId } : {}),
        },
      });
    } catch {
      throw new NotFoundException('Trainer not found');
    }
  }

  async deleteTrainer(id: string) {
    try {
      await this.prisma.trainer.delete({ where: { id } });
      return { ok: true };
    } catch {
      throw new NotFoundException('Trainer not found');
    }
  }

  async listPackages() {
    const rows = await this.prisma.package.findMany({
      orderBy: { name: 'asc' },
      take: 200,
    });
    return rows.map((p) => ({
      id: p.id,
      name: p.name,
      billing: p.billing,
      priceCents: p.priceCents,
      maxSessions: p.maxSessions,
      maxSessionsPerWeek: p.maxSessionsPerWeek,
      highlights: p.highlights,
      stripePriceId: p.stripePriceId,
    }));
  }

  async createPackage(body: {
    name: string;
    billing: 'daily' | 'weekly' | 'monthly' | 'annual';
    priceCents: number;
    maxSessions?: number;
    highlights?: string[];
    maxSessionsPerWeek?: number;
    stripePriceId?: string;
  }) {
    return await this.prisma.package.create({
      data: {
        name: body.name,
        billing: body.billing,
        priceCents: body.priceCents,
        maxSessions: body.maxSessions ?? 999,
        highlights: body.highlights ?? [],
        maxSessionsPerWeek: body.maxSessionsPerWeek ?? 3,
        stripePriceId: body.stripePriceId?.trim() || null,
      },
    });
  }

  async listUsersAdmin(query?: {
    q?: string;
    role?: 'user' | 'operator' | 'admin';
    limit?: number;
  }) {
    const q = (query?.q ?? '').trim().toLowerCase();
    const limit = Math.min(500, Math.max(1, query?.limit ?? 100));
    const rows = await this.prisma.user.findMany({
      where: {
        ...(query?.role ? { role: query.role } : {}),
        ...(q
          ? {
              OR: [
                { email: { contains: q, mode: 'insensitive' } },
                { displayName: { contains: q, mode: 'insensitive' } },
                { phone: { contains: q } },
              ],
            }
          : {}),
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      select: {
        id: true,
        email: true,
        displayName: true,
        phone: true,
        firebaseUid: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    return rows.map((r) => ({
      ...r,
      createdAt: r.createdAt.toISOString(),
      updatedAt: r.updatedAt.toISOString(),
    }));
  }

  async getUserAdmin(id: string) {
    const row = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        displayName: true,
        phone: true,
        firebaseUid: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    if (!row) {
      throw new NotFoundException('User not found');
    }
    return {
      ...row,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  }

  async updateUserAdmin(
    id: string,
    body: Partial<{
      displayName: string | null;
      phone: string | null;
      role: 'user' | 'operator' | 'admin';
    }>,
  ) {
    if (!Object.keys(body).length) {
      throw new BadRequestException('No fields provided');
    }
    if (body.role && body.role !== 'admin') {
      const target = await this.prisma.user.findUnique({
        where: { id },
        select: { role: true },
      });
      if (!target) throw new NotFoundException('User not found');
      if (target.role === 'admin') {
        const adminCount = await this.prisma.user.count({
          where: { role: 'admin' },
        });
        if (adminCount <= 1) {
          throw new BadRequestException('Cannot demote the last admin');
        }
      }
    }

    try {
      const row = await this.prisma.user.update({
        where: { id },
        data: {
          ...(body.displayName !== undefined
            ? { displayName: body.displayName?.trim() || null }
            : {}),
          ...(body.phone !== undefined
            ? { phone: body.phone?.trim() || null }
            : {}),
          ...(body.role !== undefined ? { role: body.role } : {}),
        },
        select: {
          id: true,
          email: true,
          displayName: true,
          phone: true,
          firebaseUid: true,
          role: true,
          createdAt: true,
          updatedAt: true,
        },
      });
      return {
        ...row,
        createdAt: row.createdAt.toISOString(),
        updatedAt: row.updatedAt.toISOString(),
      };
    } catch {
      throw new NotFoundException('User not found');
    }
  }
}

function startOfToday() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

function endOfToday() {
  const d = new Date();
  d.setHours(23, 59, 59, 999);
  return d;
}
