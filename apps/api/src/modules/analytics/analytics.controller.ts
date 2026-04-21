import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Post,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { AnalyticsService } from './analytics.service';

@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('ping')
  ping() {
    return { ok: true, message: 'analytics service (Postgres store)' };
  }

  /** Public endpoint: mobile sends lightweight funnel events (rate-limited per IP). */
  @Post('track')
  @Throttle({ default: { limit: 120, ttl: 60000 } })
  track(
    @Body()
    body: {
      event?: string;
      userId?: string;
      props?: Record<string, unknown>;
    },
  ) {
    if (typeof body.event !== 'string') {
      throw new BadRequestException('event is required');
    }
    return this.analyticsService.track({
      event: body.event,
      userId: body.userId,
      props: body.props,
    });
  }
}
