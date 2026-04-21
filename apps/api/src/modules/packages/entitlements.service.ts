import { ForbiddenException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class EntitlementsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  async assertUserMayBook(userId: string): Promise<void> {
    const strict = this.config.get<boolean>('booking.requireEntitlement');
    if (!strict) {
      return;
    }
    const n = await this.prisma.subscription.count({
      where: { userId, active: true },
    });
    if (n < 1) {
      throw new ForbiddenException('Active membership required to book');
    }
  }
}
