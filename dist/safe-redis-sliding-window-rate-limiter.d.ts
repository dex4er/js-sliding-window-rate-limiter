/// <reference types="node" />
import { LimiterResult, ResultCallback } from './base-sliding-window-rate-limiter';
import { RedisSlidingWindowRateLimiter, RedisSlidingWindowRateLimiterOptions } from './redis-sliding-window-rate-limiter';
import Timer = NodeJS.Timer;
export interface SafeRedisSlidingWindowRateLimiterOptions extends RedisSlidingWindowRateLimiterOptions {
    safe?: boolean;
    reconnectTimeout?: number;
    defaultResponse?: number;
}
export declare class SafeRedisSlidingWindowRateLimiter extends RedisSlidingWindowRateLimiter {
    protected reconnectTimeout: number;
    protected defaultResponse: number;
    protected redisServiceAvailable: boolean;
    protected reconnectTimer?: Timer;
    constructor(options: SafeRedisSlidingWindowRateLimiterOptions);
    check(key: string, limit: number, callback?: ResultCallback): LimiterResult;
    reserve(key: string, limit: number, callback?: ResultCallback): LimiterResult;
    cancel(key: string, ts: number, callback?: ResultCallback): LimiterResult;
    destroy(): Promise<void>;
    protected handleOperation(operationName: 'cancel' | 'check' | 'reserve', key: string, operationArg: number, callback?: ResultCallback): LimiterResult;
    protected callbackErrorHandler(successCallback: ResultCallback, defaultResponse: number): ResultCallback;
    protected promiseErrorHandler(originPromise: Promise<number>, defaultResponse: number): Promise<number>;
    protected handleError(error: Error): void;
    protected markServiceAsUnavailable(): void;
}
