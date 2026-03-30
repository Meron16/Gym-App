import { Controller, Get } from "@nestjs/common";
import { TrainersService } from "./trainers.service";

@Controller("trainers")
export class TrainersController {
  constructor(private readonly trainersService: TrainersService) {}

  @Get()
  list() {
    return this.trainersService.list();
  }
}
