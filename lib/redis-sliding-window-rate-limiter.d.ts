import { EventEmitter } from 'events'
import { Redis } from 'ioredis'

import { SlidingWindowRateLimiterBackend, SlidingWindowRateLimiterOptions } from './sliding-window-rate-limiter'

type s = number

export interface RedisSlidingWindowRateLimiterOptions extends SlidingWindowRateLimiterOptions {
  redis?: Redis | string
}

export class RedisSlidingWindowRateLimiter extends EventEmitter implements SlidingWindowRateLimiterBackend {
  readonly options: RedisSlidingWindowRateLimiterOptions
  readonly interval: s
  readonly redis: Redis

  constructor (options?: RedisSlidingWindowRateLimiterOptions)

  check (key: string, limit: number): Promise<number>
  check (key: string, limit: number, callback: (error: Error | null, usage: number) => void): void

  reserve (key: string, limit: number): Promise<number>
  reserve (key: string, limit: number, callback: (error: Error | null, ts: number) => void): void

  cancel (key: string, ts: number): Promise<number>
  cancel (key: string, ts: number, callback: (error: Error | null, canceled: number) => void): void

  destroy (): void
}

export default RedisSlidingWindowRateLimiter
