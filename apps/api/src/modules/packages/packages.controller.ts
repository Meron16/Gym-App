import { Controller, Get } from "@nestjs/common";
import { PackagesService } from "./packages.service";
import type { PackagesResponseDto } from "./dto";

@Controller("packages")
export class PackagesController {
  constructor(private readonly packagesService: PackagesService) {}

  @Get()
  list(): PackagesResponseDto {
    return this.packagesService.list();
  }
}

