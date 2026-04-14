import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { PackageDto, PackagesResponseDto } from "./dto";

@Injectable()
export class PackagesService {
  constructor(private readonly prisma: PrismaService) {}

  async list(): Promise<PackagesResponseDto> {
    const rows = await this.prisma.package.findMany({
      orderBy: { priceCents: "asc" },
    });
    const packages: PackageDto[] = rows.map((row) => ({
      id: row.id,
      name: row.name,
      billing: row.billing as PackageDto["billing"],
      price: `$${(row.priceCents / 100).toFixed(0)}`,
      highlights: (Array.isArray(row.highlights) ? row.highlights : []).map((x) => String(x)),
      bookingEntitlement: { maxSessionsPerWeek: row.maxSessionsPerWeek },
    }));
    return { packages, activePackageId: undefined };
  }

  async listForUser(userId: string): Promise<PackagesResponseDto> {
    const base = await this.list();
    const sub = await this.prisma.subscription.findFirst({
      where: { userId, active: true },
      orderBy: { createdAt: "desc" },
    });
    const activePackageId = sub?.packageId ?? base.packages[0]?.id;
    return { ...base, activePackageId };
  }
}

