import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import { PrismaClient } from "@prisma/client";

/**
 * Neon pooler + Prisma: add pooling hints so we don't exhaust connections (P2024)
 * or confuse the query engine (PgBouncer transaction mode). See https://neon.tech/docs/guides/prisma
 */
function augmentDatabaseUrlForNeon(raw: string): string {
  try {
    const u = new URL(raw);
    if (!u.hostname.includes("neon.tech")) return raw;
    if (!u.searchParams.has("pgbouncer")) u.searchParams.set("pgbouncer", "true");
    if (!u.searchParams.has("connect_timeout")) u.searchParams.set("connect_timeout", "30");
    if (!u.searchParams.has("pool_timeout")) u.searchParams.set("pool_timeout", "30");
    if (!u.searchParams.has("connection_limit")) u.searchParams.set("connection_limit", "5");
    if (!u.searchParams.has("sslmode")) u.searchParams.set("sslmode", "require");
    return u.toString();
  } catch {
    return raw;
  }
}

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly log = new Logger(PrismaService.name);

  constructor() {
    const raw = process.env.DATABASE_URL;
    super(
      raw
        ? { datasources: { db: { url: augmentDatabaseUrlForNeon(raw) } } }
        : {},
    );
  }

  async onModuleInit() {
    const backoffMs = [0, 2000, 5000];
    let last: unknown;
    for (const wait of backoffMs) {
      if (wait > 0) await new Promise((r) => setTimeout(r, wait));
      try {
        await this.$connect();
        return;
      } catch (e) {
        last = e;
        this.log.warn(`Database connect failed (will retry): ${(e as Error).message}`);
      }
    }
    throw last;
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
