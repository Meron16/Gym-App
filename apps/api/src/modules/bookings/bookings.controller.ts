import { Body, Controller, Get, Query, Post } from "@nestjs/common";
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
  availability(@Query() query: BookingAvailabilityQueryDto): AvailabilityResponseDto {
    return this.bookingsService.getAvailability(query);
  }

  @Post()
  create(@Body() dto: CreateBookingDto): BookingDto {
    return this.bookingsService.createBooking(dto);
  }
}

