import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from "@nestjs/common";
import { Throttle } from "@nestjs/throttler";
import { Request } from "express";
import { AnalyticsService } from "../analytics/analytics.service";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { Roles } from "../auth/roles.decorator";
import { RolesGuard } from "../auth/roles.guard";
import { GymsService } from "../gyms/gyms.service";
import { AdminService } from "./admin.service";

@Controller("admin")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles("operator", "admin")
export class AdminController {
  constructor(
    private readonly adminService: AdminService,
    private readonly gymsService: GymsService,
    private readonly analyticsService: AnalyticsService,
  ) {}

  @Get("overview")
  overview() {
    return this.adminService.overview();
  }

  @Get("analytics/summary")
  analyticsSummary() {
    return this.analyticsService.summaryLastDays(7);
  }

  @Get("bookings")
  bookings() {
    return this.adminService.listBookings();
  }

  @Patch("bookings/:id/cancel")
  cancelBooking(@Param("id") id: string) {
    return this.adminService.cancelBooking(id);
  }

  @Post("gyms/sync-osm")
  @Throttle({ default: { limit: 8, ttl: 60000 } })
  syncOsmGyms(@Body() body: { location?: string }) {
    return this.gymsService.syncOsmVenues(body.location);
  }

  @Post("gyms")
  createGym(
    @Body()
    body: {
      name: string;
      address?: string;
      lat: number;
      lng: number;
      osmType?: string;
      osmId?: string;
    },
  ) {
    return this.adminService.createGym(body);
  }

  @Post("packages")
  createPackage(
    @Body()
    body: {
      name: string;
      billing: "daily" | "weekly" | "monthly" | "annual";
      priceCents: number;
      maxSessions?: number;
      highlights?: string[];
      maxSessionsPerWeek?: number;
      stripePriceId?: string;
    },
  ) {
    return this.adminService.createPackage(body);
  }

  @Get("me")
  me(@Req() req: Request & { user?: { sub: string; role: string } }) {
    return req.user ?? null;
  }

  @Get("trainers")
  listTrainers() {
    return this.adminService.listTrainers();
  }

  @Post("trainers")
  createTrainer(
    @Body()
    body: {
      gymId: string;
      name: string;
      tagline?: string;
      expertise: string[];
      availability?: { day: string; slots: string[] }[];
      photoUrl?: string;
    },
  ) {
    return this.adminService.createTrainer(body);
  }

  @Patch("trainers/:id")
  updateTrainer(
    @Param("id") id: string,
    @Body()
    body: Partial<{
      name: string;
      tagline: string;
      expertise: string[];
      availability: { day: string; slots: string[] }[];
      photoUrl: string | null;
      active: boolean;
      gymId: string;
    }>,
  ) {
    return this.adminService.updateTrainer(id, body);
  }

  @Delete("trainers/:id")
  deleteTrainer(@Param("id") id: string) {
    return this.adminService.deleteTrainer(id);
  }
}
