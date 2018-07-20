/// <reference types="node" />
import { EventEmitter } from 'events';
export interface SlidingWindowRateLimiterOptions {
    interval?: number;
}
export declare type ResultCallback = (error: Error | null, result?: number) => any;
export declare type LimiterResult = Promise<number> | void;
export declare abstract class BaseSlidingWindowRateLimiter<T extends SlidingWindowRateLimiterOptions = SlidingWindowRateLimiterOptions> extends EventEmitter {
    protected options: T;
    constructor(options: T);
    abstract check(key: string, limit: number, callback?: ResultCallback): LimiterResult;
    abstract reserve(key: string, limit: number, callback?: ResultCallback): LimiterResult;
    abstract cancel(key: string, ts: number, callback?: ResultCallback): LimiterResult;
    abstract destroy(): Promise<void>;
}
