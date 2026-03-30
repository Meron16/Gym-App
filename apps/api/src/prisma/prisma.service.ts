import { Injectable, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import { PrismaClient } from "@prisma/client";

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  async onModuleInit() {
    try {
      await this.$connect();
    } catch {
      // OSM + in-memory flows still work without Postgres (local dev).
    }
  }

  async onModuleDestroy() {
    try {
      await this.$disconnect();
    } catch {
      /* noop */
    }
  }
}
