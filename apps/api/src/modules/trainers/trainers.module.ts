import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module";
import { PackagesModule } from "../packages/packages.module";
import { TrainerSessionsController } from "./trainer-sessions.controller";
import { TrainerSessionsService } from "./trainer-sessions.service";
import { TrainersController } from "./trainers.controller";
import { TrainersService } from "./trainers.service";

@Module({
  imports: [AuthModule, PackagesModule],
  controllers: [TrainersController, TrainerSessionsController],
  providers: [TrainersService, TrainerSessionsService],
  exports: [TrainersService, TrainerSessionsService],
})
export class TrainersModule {}
