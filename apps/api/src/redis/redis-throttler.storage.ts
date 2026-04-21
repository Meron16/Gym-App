import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import type { ThrottlerStorage } from '@nestjs/throttler';
import type { ThrottlerStorageRecord } from '@nestjs/throttler/dist/throttler-storage-record.interface';
import Redis from 'ioredis';

/**
 * Distributed fixed-window throttling backed by Redis.
 * When REDIS_URL is unset, AppModule falls back to in-memory ThrottlerStorageService.
 */
@Injectable()
export class RedisThrottlerStorage
  implements ThrottlerStorage, OnModuleDestroy
{
  private readonly log = new Logger(RedisThrottlerStorage.name);

  constructor(private readonly redis: Redis) {}

  async increment(
    key: string,
    ttl: number,
    limit: number,
    blockDuration: number,
    throttlerName: string,
  ): Promise<ThrottlerStorageRecord> {
    const rk = `thr:hits:${throttlerName}:${key}`;
    const bk = `thr:block:${throttlerName}:${key}`;

    try {
      const blockMs = await this.redis.pttl(bk);
      if (blockMs > 0) {
        const hitMs = await this.redis.pttl(rk);
        return {
          totalHits: limit + 1,
          timeToExpire: Math.max(0, Math.ceil(hitMs / 1000)),
          isBlocked: true,
          timeToBlockExpire: Math.ceil(blockMs / 1000),
        };
      }

      const n = await this.redis.incr(rk);
      if (n === 1) {
        await this.redis.pexpire(rk, ttl);
      }

      const pttl = await this.redis.pttl(rk);
      const timeToExpire = Math.max(0, Math.ceil(pttl / 1000));

      if (n > limit) {
        await this.redis.set(bk, '1', 'PX', blockDuration);
        return {
          totalHits: n,
          timeToExpire,
          isBlocked: true,
          timeToBlockExpire: Math.ceil(blockDuration / 1000),
        };
      }

      return {
        totalHits: n,
        timeToExpire,
        isBlocked: false,
        timeToBlockExpire: -1,
      };
    } catch (e) {
      this.log.warn(
        `Redis throttler increment failed: ${(e as Error).message}`,
      );
      return {
        totalHits: 1,
        timeToExpire: Math.ceil(ttl / 1000),
        isBlocked: false,
        timeToBlockExpire: -1,
      };
    }
  }

  onModuleDestroy() {
    this.redis.disconnect();
  }
}
