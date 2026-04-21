import { Global, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

export const REDIS = Symbol('REDIS');

@Global()
@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: REDIS,
      inject: [ConfigService],
      useFactory: (config: ConfigService): Redis | null => {
        const url = (config.get<string>('redis.url') ?? '').trim();
        if (!url) {
          return null;
        }
        return new Redis(url, {
          maxRetriesPerRequest: 2,
          enableReadyCheck: true,
        });
      },
    },
  ],
  exports: [REDIS],
})
export class RedisModule {}
