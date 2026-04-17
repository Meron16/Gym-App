import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import type { TrainerDetailDto, TrainerSummaryDto } from "./dto";

function asStringArray(v: unknown): string[] {
  if (!Array.isArray(v)) return [];
  return v.filter((x): x is string => typeof x === "string");
}

function availabilitySummary(av: unknown): string {
  const raw = av as { day?: string; slots?: string[] }[] | null;
  if (!Array.isArray(raw) || raw.length === 0) return "Flexible · check slots";
  const parts = raw
    .filter((x) => x.day && x.slots?.length)
    .slice(0, 3)
    .map((x) => `${x.day} ${x.slots!.length} slots`);
  return parts.length ? parts.join(" · ") : "Flexible · check slots";
}

@Injectable()
export class TrainersService {
  constructor(private readonly prisma: PrismaService) {}

  async list(gymId?: string): Promise<TrainerSummaryDto[]> {
    const rows = await this.prisma.trainer.findMany({
      where: { active: true, ...(gymId ? { gymId } : {}) },
      include: { gym: { select: { id: true, name: true, location: true } } },
      orderBy: { name: "asc" },
    });
    return rows.map((r) => ({
      id: r.id,
      gymId: r.gymId,
      gymName: r.gym.name,
      gymLocation: r.gym.location,
      name: r.name,
      tagline: r.tagline,
      expertise: asStringArray(r.expertise),
      availabilitySummary: availabilitySummary(r.availability),
      photoUrl: r.photoUrl ?? undefined,
    }));
  }

  async getById(id: string): Promise<TrainerDetailDto> {
    const r = await this.prisma.trainer.findFirst({
      where: { id, active: true },
      include: { gym: { select: { id: true, name: true, location: true } } },
    });
    if (!r) {
      throw new NotFoundException("Trainer not found");
    }
    const av = r.availability as { day: string; slots: string[] }[] | null;
    return {
      id: r.id,
      gymId: r.gymId,
      gymName: r.gym.name,
      gymLocation: r.gym.location,
      name: r.name,
      tagline: r.tagline,
      expertise: asStringArray(r.expertise),
      availabilitySummary: availabilitySummary(r.availability),
      photoUrl: r.photoUrl ?? undefined,
      availability: Array.isArray(av) ? av : [],
    };
  }
}
