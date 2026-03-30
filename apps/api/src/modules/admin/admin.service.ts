import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";

type MemoryGym = {
  id: string;
  name: string;
  address?: string;
  lat: number;
  lng: number;
  osmType?: string;
  osmId?: string;
};

type MemoryPackage = {
  id: string;
  name: string;
  billing: "daily" | "weekly" | "monthly" | "annual";
  priceCents: number;
  maxSessions: number;
};

const memoryGyms: MemoryGym[] = [];
const memoryPackages: MemoryPackage[] = [];

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  async overview() {
    try {
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
    } catch {
      return {
        bookingsToday: 0,
        activeSubscriptions: 0,
        gyms: memoryGyms.length,
        revenueCents: 0,
      };
    }
  }

  async listBookings() {
    try {
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
    } catch {
      return [];
    }
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
    address?: string;
    lat: number;
    lng: number;
    osmType?: string;
    osmId?: string;
  }) {
    try {
      return await this.prisma.gym.create({
        data: {
          name: body.name,
          address: body.address ?? null,
          lat: body.lat,
          lng: body.lng,
          osmType: body.osmType ?? null,
          osmId: body.osmId ?? null,
        },
      });
    } catch {
      const row: MemoryGym = { id: `gym_${Date.now()}`, ...body };
      memoryGyms.push(row);
      return row;
    }
  }

  async createPackage(body: {
    name: string;
    billing: "daily" | "weekly" | "monthly" | "annual";
    priceCents: number;
    maxSessions?: number;
  }) {
    try {
      return await this.prisma.package.create({
        data: {
          name: body.name,
          billing: body.billing,
          priceCents: body.priceCents,
          maxSessions: body.maxSessions ?? 999,
        },
      });
    } catch {
      const row: MemoryPackage = {
        id: `pkg_${Date.now()}`,
        name: body.name,
        billing: body.billing,
        priceCents: body.priceCents,
        maxSessions: body.maxSessions ?? 999,
      };
      memoryPackages.push(row);
      return row;
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
