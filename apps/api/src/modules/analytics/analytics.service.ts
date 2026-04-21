import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';

/** Lowercase snake-ish names only, e.g. booking_confirmed */
const EVENT_NAME_RE = /^[a-z][a-z0-9_]{0,62}$/;
const MAX_PROPS_JSON_LEN = 8000;
const MAX_USER_ID_LEN = 128;

@Injectable()
export class AnalyticsService {
  private readonly log = new Logger(AnalyticsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  async track(input: {
    event: string;
    userId?: string;
    props?: Record<string, unknown>;
  }) {
    const name = input.event?.trim() ?? '';
    if (!EVENT_NAME_RE.test(name)) {
      throw new BadRequestException(
        'Invalid event: use lowercase letters, digits, underscore; max 63 chars, must start with a letter.',
      );
    }

    let propsStr: string | null = null;
    if (input.props != null && typeof input.props === 'object') {
      try {
        const s = JSON.stringify(input.props);
        propsStr =
          s.length > MAX_PROPS_JSON_LEN ? s.slice(0, MAX_PROPS_JSON_LEN) : s;
      } catch {
        propsStr = null;
      }
    }

    let userId: string | null = null;
    if (typeof input.userId === 'string') {
      const u = input.userId.trim();
      if (u.length > 0 && u.length <= MAX_USER_ID_LEN) {
        userId = u;
      }
    }

    await this.prisma.analyticsEvent.create({
      data: { name, userId, props: propsStr },
    });

    const mixToken = (this.config.get<string>('mixpanel.token') ?? '').trim();
    if (mixToken) {
      void this.forwardMixpanel(mixToken, name, userId, input.props).catch(
        () => {
          /* optional */
        },
      );
    }

    return { accepted: true as const };
  }

  private async forwardMixpanel(
    token: string,
    event: string,
    userId: string | null,
    props?: Record<string, unknown>,
  ) {
    const payload = {
      event,
      properties: {
        token,
        distinct_id: userId ?? 'anonymous',
        time: Math.floor(Date.now() / 1000),
        ...props,
      },
    };
    const body = `data=${encodeURIComponent(JSON.stringify(payload))}`;
    const res = await fetch('https://api.mixpanel.com/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
    });
    if (!res.ok) {
      this.log.debug(`Mixpanel track HTTP ${res.status}`);
    }
  }

  async summaryLastDays(days: number) {
    const safeDays = Math.min(90, Math.max(1, Math.floor(days)));
    const since = new Date();
    since.setDate(since.getDate() - safeDays);
    since.setHours(0, 0, 0, 0);

    const [byEvent, totalEvents] = await Promise.all([
      this.prisma.analyticsEvent.groupBy({
        by: ['name'],
        where: { createdAt: { gte: since } },
        _count: { id: true },
        orderBy: { _count: { id: 'desc' } },
      }),
      this.prisma.analyticsEvent.count({
        where: { createdAt: { gte: since } },
      }),
    ]);

    return {
      days: safeDays,
      since: since.toISOString(),
      totalEvents,
      byEvent: byEvent.map((r) => ({ name: r.name, count: r._count.id })),
    };
  }
}
