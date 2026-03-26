import { Module } from "@nestjs/common";
import { AppController } from "./app.controller";
import { GymsModule } from "./modules/gyms/gyms.module";
import { BookingsModule } from "./modules/bookings/bookings.module";
import { PackagesModule } from "./modules/packages/packages.module";
import { PaymentsModule } from "./modules/payments/payments.module";
import { AuthModule } from "./modules/auth/auth.module";

@Module({
  imports: [AuthModule, GymsModule, BookingsModule, PackagesModule, PaymentsModule],
  controllers: [AppController],
})
export class AppModule {}
