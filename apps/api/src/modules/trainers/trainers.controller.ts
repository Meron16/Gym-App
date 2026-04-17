import { BadRequestException, Controller, Get, Param, Query } from "@nestjs/common";
import { Throttle } from "@nestjs/throttler";
import type { TrainerAvailabilityResponseDto, TrainerDetailDto, TrainerSummaryDto } from "./dto";
import { TrainerSessionsService } from "./trainer-sessions.service";
import { TrainersService } from "./trainers.service";

@Controller("trainers")
export class TrainersController {
  constructor(
    private readonly trainersService: TrainersService,
    private readonly trainerSessionsService: TrainerSessionsService,
  ) {}

  @Get()
  @Throttle({ default: { limit: 120, ttl: 60000 } })
  list(@Query("gymId") gymId?: string): Promise<TrainerSummaryDto[]> {
    return this.trainersService.list(gymId);
  }

  @Get(":id/availability")
  @Throttle({ default: { limit: 120, ttl: 60000 } })
  availabilityNested(
    @Param("id") trainerId: string,
    @Query("date") date: string,
  ): Promise<TrainerAvailabilityResponseDto> {
    if (!date?.trim()) {
      throw new BadRequestException("date query is required");
    }
    return this.trainerSessionsService.getAvailability({ trainerId, date: date.trim() });
  }

  @Get(":id")
  @Throttle({ default: { limit: 120, ttl: 60000 } })
  getOne(@Param("id") id: string): Promise<TrainerDetailDto> {
    return this.trainersService.getById(id);
  }
}
