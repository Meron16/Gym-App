import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { JwtAuthGuard, JwtUser } from '../auth/jwt-auth.guard';
import { PackagesService } from './packages.service';
import type { PackagesResponseDto } from './dto';

@Controller('packages')
export class PackagesController {
  constructor(private readonly packagesService: PackagesService) {}

  @Get()
  list(): Promise<PackagesResponseDto> {
    return this.packagesService.list();
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  listMine(
    @Req() req: Request & { user: JwtUser },
  ): Promise<PackagesResponseDto> {
    return this.packagesService.listForUser(req.user.sub);
  }
}
