import Redis from 'ioredis';
import { BaseSlidingWindowRateLimiter, LimiterResult, ResultCallback } from './base-sliding-window-rate-limiter';
export interface ExtendedRedis extends Redis.Redis {
    limiter: (key: string, mode: number, interval: number, limit: number, ts: number, callback?: ResultCallback) => LimiterResult;
}
export interface RedisSlidingWindowRateLimiterOptions {
    redis?: ExtendedRedis | string;
    interval?: number;
}
export declare class RedisSlidingWindowRateLimiter extends BaseSlidingWindowRateLimiter<RedisSlidingWindowRateLimiterOptions> {
    protected interval: number;
    protected redis: ExtendedRedis;
    constructor(options?: RedisSlidingWindowRateLimiterOptions);
    check(key: string, limit: number, callback?: ResultCallback): LimiterResult;
    reserve(key: string, limit: number, callback?: ResultCallback): LimiterResult;
    cancel(key: string, ts: number, callback?: ResultCallback): LimiterResult;
    destroy(): Promise<void>;
    private limiter;
}
