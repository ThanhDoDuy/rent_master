import { Injectable } from '@nestjs/common';
import { RateLimiterRedis, RateLimiterMemory } from 'rate-limiter-flexible';
import Redis from 'ioredis';
import { AppBadRequestException } from '../exceptions/app.exception';
import { ErrorCode } from '../constants/error-codes';

@Injectable()
export class RateLimiterHelper {
  private rateLimiter: RateLimiterRedis | RateLimiterMemory;

  constructor(
    private readonly keyPrefix: string,
    private readonly points: number, // Maximum number of requests
    private readonly duration: number, // Per duration in seconds
  ) {
    if (process.env.REDIS_HOST) {
      const redisClient = new Redis({
        host: process.env.REDIS_HOST,
        port: parseInt(process.env.REDIS_PORT || '6379'),
      });

      this.rateLimiter = new RateLimiterRedis({
        storeClient: redisClient,
        keyPrefix: this.keyPrefix,
        points: this.points,
        duration: this.duration,
      });
    } else {
      // Fallback to in-memory rate limiter if Redis is not available
      this.rateLimiter = new RateLimiterMemory({
        keyPrefix: this.keyPrefix,
        points: this.points,
        duration: this.duration,
      });
    }
  }

  async consume(key: string, points = 1): Promise<void> {
    try {
      await this.rateLimiter.consume(key, points);
    } catch (rateLimiterRes: any) {
      const waitSeconds = Math.ceil(rateLimiterRes.msBeforeNext / 1000);
      throw new AppBadRequestException(
        ErrorCode.RATE_LIMIT_TOO_MANY_REQUESTS,
        `Quá nhiều yêu cầu. Vui lòng thử lại sau ${waitSeconds} giây.`,
      );
    }
  }

  async block(key: string, duration: number): Promise<void> {
    await this.rateLimiter.block(key, duration);
  }

  async set(key: string, points: number, duration: number): Promise<void> {
    await this.rateLimiter.set(key, points, duration);
  }
}

