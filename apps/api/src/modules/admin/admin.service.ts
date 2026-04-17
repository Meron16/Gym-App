import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";

const defaultTrainerAvailability = [
  { day: "Mon", slots: ["06:30", "09:00", "17:30"] },
  { day: "Tue", slots: ["07:30", "17:30", "19:00"] },
  { day: "Wed", slots: ["06:30", "09:00", "19:00"] },
  { day: "Thu", slots: ["07:30", "17:30"] },
  { day: "Fri", slots: ["06:30", "09:00", "17:30", "19:00"] },
  { day: "Sat", slots: ["09:00", "11:00"] },
  { day: "Sun", slots: ["10:00", "12:00"] },
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
      orderBy: { createdAt: "desc" },
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
        data: { status: "cancelled" },
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
      throw new NotFoundException("Booking not found");
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
        location: body.location ?? body.address ?? "Unknown",
        address: body.address ?? body.location ?? "Unknown",
        rating: 4.2,
        priceFrom: "$—",
        tag: "Fitness",
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

  async listTrainers() {
    const rows = await this.prisma.trainer.findMany({
      include: { gym: { select: { name: true, location: true } } },
      orderBy: { updatedAt: "desc" },
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
      throw new NotFoundException("Gym not found");
    }
    return await this.prisma.trainer.create({
      data: {
        gymId: body.gymId,
        name: body.name.trim(),
        tagline: body.tagline?.trim() ?? "",
        expertise: body.expertise ?? [],
        availability: body.availability?.length ? body.availability : defaultTrainerAvailability,
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
          ...(body.tagline !== undefined ? { tagline: body.tagline.trim() } : {}),
          ...(body.expertise !== undefined ? { expertise: body.expertise } : {}),
          ...(body.availability !== undefined ? { availability: body.availability } : {}),
          ...(body.photoUrl !== undefined ? { photoUrl: body.photoUrl } : {}),
          ...(body.active !== undefined ? { active: body.active } : {}),
          ...(body.gymId !== undefined ? { gymId: body.gymId } : {}),
        },
      });
    } catch {
      throw new NotFoundException("Trainer not found");
    }
  }

  async deleteTrainer(id: string) {
    try {
      await this.prisma.trainer.delete({ where: { id } });
      return { ok: true };
    } catch {
      throw new NotFoundException("Trainer not found");
    }
  }

  async createPackage(body: {
    name: string;
    billing: "daily" | "weekly" | "monthly" | "annual";
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
