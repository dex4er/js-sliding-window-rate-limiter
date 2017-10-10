import {Redis} from "ioredis";

export interface SlidingWindowRateLimiterOptions {
    interval?: number
    redis?: Redis
}

export declare class SlidingWindowRateLimiter {
    readonly interval: number
    readonly redis: Redis

    constructor (options: SlidingWindowRateLimiterOptions)

    reserve (key: string, limit: number): Promise<number>
    reserve (key: string, limit: number, callback: (error: Error, number) => void): void

    check (key: string, limit: number): Promise<number>
    check (key: string, limit: number, callback: (error: Error, number) => void): void

    cancel (key: string, limit: number, reservationId: number): Promise<number>
    cancel (key: string, limit: number, reservationId: number, callback: (error: Error, number) => void): void
}