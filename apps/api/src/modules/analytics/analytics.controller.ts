import { Body, Controller, Get, Post } from "@nestjs/common";

@Controller("analytics")
export class AnalyticsController {
  @Get("ping")
  ping() {
    return { ok: true, message: "analytics stub" };
  }

  @Post("track")
  track(
    @Body()
    body: {
      event?: string;
      userId?: string;
      props?: Record<string, unknown>;
    },
  ) {
    return {
      accepted: true,
      provider: process.env.MIXPANEL_TOKEN ? "mixpanel-placeholder" : "none",
      event: body.event ?? null,
      userId: body.userId ?? null,
      message: "Event pipeline placeholder (wire Mixpanel worker in Phase 9)",
    };
  }
}
