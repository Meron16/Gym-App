import { Body, Controller, Get, Post } from '@nestjs/common';

@Controller('notifications')
export class NotificationsController {
  @Get('ping')
  ping() {
    return { ok: true, message: 'notifications stub' };
  }

  @Post('schedule-reminder')
  scheduleReminder(@Body() body: { bookingId?: string; runAtIso?: string }) {
    return {
      accepted: true,
      provider: 'placeholder',
      bookingId: body.bookingId ?? null,
      runAtIso: body.runAtIso ?? null,
      message: 'Queue worker integration is pending (Phase 9/10)',
    };
  }
}
