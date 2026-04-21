import {
  Body,
  Controller,
  Delete,
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
import { AnalyticsService } from '../analytics/analytics.service';
import { AuditService } from '../audit/audit.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { GymsService } from '../gyms/gyms.service';
import { AdminService } from './admin.service';

function clientIp(req: Request): string | undefined {
  const x = req.headers['x-forwarded-for'];
  if (typeof x === 'string') {
    return x.split(',')[0]?.trim();
  }
  return req.ip;
}

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('operator', 'admin')
export class AdminController {
  constructor(
    private readonly adminService: AdminService,
    private readonly gymsService: GymsService,
    private readonly analyticsService: AnalyticsService,
    private readonly auditService: AuditService,
  ) {}

  @Get('overview')
  overview() {
    return this.adminService.overview();
  }

  @Get('revenue/summary')
  revenueSummary(@Query('days') days?: string) {
    const n = days != null ? parseInt(days, 10) : 14;
    return this.adminService.revenueSummary(Number.isFinite(n) ? n : 14);
  }

  @Get('users')
  listUsers(
    @Query('q') q?: string,
    @Query('role') role?: 'user' | 'operator' | 'admin',
    @Query('limit') limit?: string,
  ) {
    const n = limit != null ? parseInt(limit, 10) : undefined;
    return this.adminService.listUsersAdmin({
      q,
      role:
        role && ['user', 'operator', 'admin'].includes(role) ? role : undefined,
      limit: Number.isFinite(n as number) ? n : undefined,
    });
  }

  @Get('users/:id')
  getUser(@Param('id') id: string) {
    return this.adminService.getUserAdmin(id);
  }

  @Patch('users/:id')
  updateUser(
    @Param('id') id: string,
    @Body()
    body: Partial<{
      displayName: string | null;
      phone: string | null;
      role: 'user' | 'operator' | 'admin';
    }>,
    @Req() req: Request & { user?: { sub: string } },
  ) {
    return this.adminService.updateUserAdmin(id, body).then(async (u) => {
      await this.auditService.log({
        actorId: req.user?.sub,
        action: 'user.update',
        resource: `user:${id}`,
        metadata: { fields: Object.keys(body), role: body.role },
        ip: clientIp(req),
        userAgent:
          typeof req.headers['user-agent'] === 'string'
            ? req.headers['user-agent']
            : undefined,
      });
      return u;
    });
  }

  @Get('gyms')
  listGyms() {
    return this.adminService.listGymsAdmin();
  }

  @Get('gyms/:id')
  getGym(@Param('id') id: string) {
    return this.adminService.getGymAdmin(id);
  }

  @Patch('gyms/:id')
  updateGym(
    @Param('id') id: string,
    @Body()
    body: Partial<{
      name: string;
      location: string;
      address: string;
      capacityBase: number;
      rating: number;
      priceFrom: string;
      tag: string;
      operatingHours: unknown;
      amenities: unknown;
      photos: unknown;
      lat: number;
      lng: number;
    }>,
    @Req() req: Request & { user?: { sub: string } },
  ) {
    return this.adminService.updateGymAdmin(id, body).then(async (g) => {
      await this.auditService.log({
        actorId: req.user?.sub,
        action: 'gym.update',
        resource: `gym:${id}`,
        metadata: { fields: Object.keys(body) },
        ip: clientIp(req),
        userAgent:
          typeof req.headers['user-agent'] === 'string'
            ? req.headers['user-agent']
            : undefined,
      });
      return g;
    });
  }

  @Get('analytics/summary')
  analyticsSummary() {
    return this.analyticsService.summaryLastDays(7);
  }

  @Get('bookings')
  bookings() {
    return this.adminService.listBookings();
  }

  @Patch('bookings/:id/cancel')
  cancelBooking(@Param('id') id: string) {
    return this.adminService.cancelBooking(id);
  }

  @Post('gyms/sync-osm')
  @Throttle({ default: { limit: 8, ttl: 60000 } })
  syncOsmGyms(@Body() body: { location?: string }) {
    return this.gymsService.syncOsmVenues(body.location);
  }

  @Post('gyms')
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
    @Req() req: Request & { user?: { sub: string } },
  ) {
    return this.adminService.createGym(body).then(async (g) => {
      await this.auditService.log({
        actorId: req.user?.sub,
        action: 'gym.create',
        resource: `gym:${g.id}`,
        metadata: { name: body.name },
        ip: clientIp(req),
        userAgent:
          typeof req.headers['user-agent'] === 'string'
            ? req.headers['user-agent']
            : undefined,
      });
      return g;
    });
  }

  @Get('packages')
  listPackages() {
    return this.adminService.listPackages();
  }

  @Post('packages')
  createPackage(
    @Body()
    body: {
      name: string;
      billing: 'daily' | 'weekly' | 'monthly' | 'annual';
      priceCents: number;
      maxSessions?: number;
      highlights?: string[];
      maxSessionsPerWeek?: number;
      stripePriceId?: string;
    },
  ) {
    return this.adminService.createPackage(body);
  }

  @Get('me')
  me(@Req() req: Request & { user?: { sub: string; role: string } }) {
    return req.user ?? null;
  }

  @Get('trainers')
  listTrainers() {
    return this.adminService.listTrainers();
  }

  @Post('trainers')
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

  @Patch('trainers/:id')
  updateTrainer(
    @Param('id') id: string,
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

  @Delete('trainers/:id')
  deleteTrainer(@Param('id') id: string) {
    return this.adminService.deleteTrainer(id);
  }
}
