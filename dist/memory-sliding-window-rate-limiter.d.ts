/// <reference types="node" />
import Timer = NodeJS.Timer;
import { BaseSlidingWindowRateLimiter, ResultCallback } from './base-sliding-window-rate-limiter';
export interface MemorySlidingWindowRateLimiterOptions {
    interval?: number;
}
export declare class MemorySlidingWindowRateLimiter extends BaseSlidingWindowRateLimiter<MemorySlidingWindowRateLimiterOptions> {
    protected static returnResult(result: number, callback?: ResultCallback): Promise<number> | void;
    protected interval: number;
    protected buckets: {
        [key: string]: number[];
    };
    protected timers: {
        [key: string]: Timer;
    };
    constructor(options?: MemorySlidingWindowRateLimiterOptions);
    check(key: string, limit: number, callback?: ResultCallback): Promise<number> | void;
    reserve(key: string, limit: number, callback: ResultCallback): Promise<number> | void;
    cancel(key: string, ts: number, callback: ResultCallback): Promise<number> | void;
    destroy(): Promise<void>;
    private bucketExpireNow;
}
