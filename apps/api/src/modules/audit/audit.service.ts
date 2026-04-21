import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}

  async log(input: {
    actorId?: string | null;
    action: string;
    resource: string;
    metadata?: Record<string, unknown>;
    ip?: string | null;
    userAgent?: string | null;
  }) {
    try {
      await this.prisma.auditLog.create({
        data: {
          actorId: input.actorId ?? null,
          action: input.action,
          resource: input.resource,
          metadata:
            input.metadata != null
              ? (input.metadata as Prisma.InputJsonValue)
              : undefined,
          ip: input.ip ?? null,
          userAgent: input.userAgent ?? null,
        },
      });
    } catch {
      /* never break main flow */
    }
  }
}
