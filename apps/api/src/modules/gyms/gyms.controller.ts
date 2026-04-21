import { Controller, Get, Query, Param } from '@nestjs/common';
import { GymsService } from './gyms.service';
import type { GymDetailDto, GymSearchQueryDto, GymSummaryDto } from './dto';

@Controller('gyms')
export class GymsController {
  constructor(private readonly gymsService: GymsService) {}

  @Get()
  async list(@Query() query: GymSearchQueryDto): Promise<GymSummaryDto[]> {
    return this.gymsService.search(query);
  }

  @Get(':id')
  detail(@Param('id') id: string): Promise<GymDetailDto> {
    return this.gymsService.detail(id);
  }
}
