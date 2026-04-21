import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { Request } from 'express';
import { JwtAuthGuard, JwtUser } from '../auth/jwt-auth.guard';
import { BookingsService } from './bookings.service';
import type {
  AvailabilityResponseDto,
  BookingAvailabilityQueryDto,
  BookingDto,
  CreateBookingDto,
} from './dto';

@Controller('bookings')
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  @Get('availability')
  @Throttle({ default: { limit: 120, ttl: 60000 } })
  availability(
    @Query() query: BookingAvailabilityQueryDto,
  ): Promise<AvailabilityResponseDto> {
    return this.bookingsService.getAvailability(query);
  }

  @Get('my')
  @UseGuards(JwtAuthGuard)
  @Throttle({ default: { limit: 80, ttl: 60000 } })
  myBookings(@Req() req: Request & { user: JwtUser }): Promise<BookingDto[]> {
    return this.bookingsService.listMyBookings(req.user.sub);
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

  @Patch(':id/cancel')
  @UseGuards(JwtAuthGuard)
  @Throttle({ default: { limit: 40, ttl: 60000 } })
  cancel(
    @Param('id') bookingId: string,
    @Req() req: Request & { user: JwtUser },
  ): Promise<BookingDto> {
    return this.bookingsService.cancelBooking(bookingId, req.user.sub);
  }
}
