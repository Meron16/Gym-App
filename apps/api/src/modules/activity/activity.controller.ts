import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { JwtAuthGuard, JwtUser } from '../auth/jwt-auth.guard';
import { ActivityService } from './activity.service';

@Controller('activity')
export class ActivityController {
  constructor(private readonly activityService: ActivityService) {}

  @Get('summary')
  @UseGuards(JwtAuthGuard)
  summary(@Req() req: Request & { user: JwtUser }) {
    return this.activityService.summary(req.user.sub);
  }

  @Post('workouts')
  @UseGuards(JwtAuthGuard)
  logWorkout(
    @Req() req: Request & { user: JwtUser },
    @Body()
    body: {
      kind?: string;
      durationMinutes?: number;
      caloriesEstimate?: number;
    },
  ) {
    return this.activityService.logWorkout(req.user.sub, body);
  }

  @Get('wearable')
  wearableStub() {
    return {
      connected: false,
      message: 'Wearable linking ships in a later release.',
    };
  }
}
