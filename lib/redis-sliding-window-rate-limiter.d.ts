import { Redis } from 'ioredis'

import { SlidingWindowRateLimiterBackend, SlidingWindowRateLimiterOptions } from './sliding-window-rate-limiter'

export interface RedisSlidingWindowRateLimiterOptions extends SlidingWindowRateLimiterOptions {
  redis?: Redis | string
}

export class RedisSlidingWindowRateLimiter implements SlidingWindowRateLimiterBackend {
  readonly options: RedisSlidingWindowRateLimiterOptions
  readonly interval: number
  readonly redis: Redis

  constructor (options?: RedisSlidingWindowRateLimiterOptions)

  reserve (key: string, limit: number): Promise<number>
  reserve (key: string, limit: number, callback: (error: Error | null, ts: number) => void): void

  check (key: string, limit: number): Promise<number>
  check (key: string, limit: number, callback: (error: Error | null, usage: number) => void): void

  cancel (key: string, limit: number, ts: number): Promise<number>
  cancel (key: string, limit: number, ts: number, callback: (error: Error | null, usage: number) => void): void

  destroy (): void
}

export default RedisSlidingWindowRateLimiter
