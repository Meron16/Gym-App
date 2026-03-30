import { Body, Controller, Get, Param, Patch, Post, Req, UseGuards } from "@nestjs/common";
import { Request } from "express";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { Roles } from "../auth/roles.decorator";
import { RolesGuard } from "../auth/roles.guard";
import { AdminService } from "./admin.service";

@Controller("admin")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles("operator", "admin")
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get("overview")
  overview() {
    return this.adminService.overview();
  }

  @Get("bookings")
  bookings() {
    return this.adminService.listBookings();
  }

  @Patch("bookings/:id/cancel")
  cancelBooking(@Param("id") id: string) {
    return this.adminService.cancelBooking(id);
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
    },
  ) {
    return this.adminService.createPackage(body);
  }

  @Get("me")
  me(@Req() req: Request & { user?: { sub: string; role: string } }) {
    return req.user ?? null;
  }
}
