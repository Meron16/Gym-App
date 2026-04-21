import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import {
  ThrottlerGuard,
  ThrottlerModule,
  ThrottlerStorageService,
} from '@nestjs/throttler';
import { AppController } from './app.controller';
import configuration from './config/configuration';
import { AdminModule } from './modules/admin/admin.module';
import { ActivityModule } from './modules/activity/activity.module';
import { AnalyticsModule } from './modules/analytics/analytics.module';
import { AuditModule } from './modules/audit/audit.module';
import { AuthModule } from './modules/auth/auth.module';
import { BookingsModule } from './modules/bookings/bookings.module';
import { GymsModule } from './modules/gyms/gyms.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { PackagesModule } from './modules/packages/packages.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { TrainersModule } from './modules/trainers/trainers.module';
import { PrismaModule } from './prisma/prisma.module';
import { REDIS, RedisModule } from './redis/redis.module';
import { RedisThrottlerStorage } from './redis/redis-throttler.storage';
import type Redis from 'ioredis';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
    }),
    RedisModule,
    AuditModule,
    ThrottlerModule.forRootAsync({
      imports: [RedisModule],
      inject: [REDIS],
      useFactory: (redis: Redis | null) => ({
        throttlers: [
          {
            name: 'default',
            ttl: 60000,
            limit: 200,
          },
        ],
        storage: redis
          ? new RedisThrottlerStorage(redis)
          : new ThrottlerStorageService(),
      }),
    }),
    PrismaModule,
    AuthModule,
    GymsModule,
    BookingsModule,
    PackagesModule,
    PaymentsModule,
    NotificationsModule,
    AnalyticsModule,
    TrainersModule,
    ActivityModule,
    AdminModule,
  ],
  controllers: [AppController],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
