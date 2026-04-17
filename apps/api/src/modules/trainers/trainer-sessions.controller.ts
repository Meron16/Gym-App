import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Patch,
  Param,
  Post,
  Query,
  Req,
  UseGuards,
} from "@nestjs/common";
import { Throttle } from "@nestjs/throttler";
import type { Request } from "express";
import { JwtAuthGuard, JwtUser } from "../auth/jwt-auth.guard";
import type {
  CreateTrainerBookingDto,
  TrainerAvailabilityResponseDto,
  TrainerBookingDto,
} from "./dto";
import { TrainerSessionsService } from "./trainer-sessions.service";

@Controller("trainer-sessions")
export class TrainerSessionsController {
  constructor(private readonly trainerSessionsService: TrainerSessionsService) {}

  @Get("availability")
  @Throttle({ default: { limit: 120, ttl: 60000 } })
  availability(
    @Query("trainerId") trainerId: string,
    @Query("date") date: string,
  ): Promise<TrainerAvailabilityResponseDto> {
    if (!trainerId?.trim() || !date?.trim()) {
      throw new BadRequestException("trainerId and date are required");
    }
    return this.trainerSessionsService.getAvailability({ trainerId, date });
  }

  @Get("my")
  @UseGuards(JwtAuthGuard)
  @Throttle({ default: { limit: 80, ttl: 60000 } })
  my(@Req() req: Request & { user: JwtUser }): Promise<TrainerBookingDto[]> {
    return this.trainerSessionsService.listMyBookings(req.user.sub);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @Throttle({ default: { limit: 40, ttl: 60000 } })
  create(
    @Body() dto: CreateTrainerBookingDto,
    @Req() req: Request & { user: JwtUser },
  ): Promise<TrainerBookingDto> {
    return this.trainerSessionsService.createBooking(dto, req.user.sub);
  }

  @Patch(":id/cancel")
  @UseGuards(JwtAuthGuard)
  @Throttle({ default: { limit: 40, ttl: 60000 } })
  cancel(
    @Param("id") bookingId: string,
    @Req() req: Request & { user: JwtUser },
  ): Promise<TrainerBookingDto> {
    return this.trainerSessionsService.cancelBooking(bookingId, req.user.sub);
  }
}
