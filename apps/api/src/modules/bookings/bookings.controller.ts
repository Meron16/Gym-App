import { Body, Controller, Get, Post, Query, Req, UseGuards } from "@nestjs/common";
import { Throttle } from "@nestjs/throttler";
import { Request } from "express";
import { JwtAuthGuard, JwtUser } from "../auth/jwt-auth.guard";
import { BookingsService } from "./bookings.service";
import type {
  AvailabilityResponseDto,
  BookingAvailabilityQueryDto,
  BookingDto,
  CreateBookingDto,
} from "./dto";

@Controller("bookings")
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  @Get("availability")
  @Throttle({ default: { limit: 120, ttl: 60000 } })
  availability(@Query() query: BookingAvailabilityQueryDto): Promise<AvailabilityResponseDto> {
    return this.bookingsService.getAvailability(query);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @Throttle({ default: { limit: 40, ttl: 60000 } })
  create(
    @Body() dto: CreateBookingDto,
    @Req() req: Request & { user: JwtUser },
  ): Promise<BookingDto> {
    return this.bookingsService.createBooking(dto, req.user.sub);
  }
}
