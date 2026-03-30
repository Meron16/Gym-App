import { Controller, Get, Query } from "@nestjs/common";
import { ActivityService } from "./activity.service";

@Controller("activity")
export class ActivityController {
  constructor(private readonly activityService: ActivityService) {}

  @Get("summary")
  summary(@Query("userId") userId?: string) {
    return this.activityService.summary(userId ?? "guest");
  }
}
