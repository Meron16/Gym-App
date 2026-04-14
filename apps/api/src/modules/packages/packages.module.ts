import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module";
import { EntitlementsService } from "./entitlements.service";
import { PackagesController } from "./packages.controller";
import { PackagesService } from "./packages.service";

@Module({
  imports: [AuthModule],
  controllers: [PackagesController],
  providers: [PackagesService, EntitlementsService],
  exports: [PackagesService, EntitlementsService],
})
export class PackagesModule {}

