import { Redis } from 'ioredis'

import { SlidingWindowRateLimiterBackend, SlidingWindowRateLimiterOptions } from './sliding-window-rate-limiter'

export type MemorySlidingWindowRateLimiterOptions = SlidingWindowRateLimiterOptions

export class MemorySlidingWindowRateLimiter implements SlidingWindowRateLimiterBackend {
  readonly options: MemorySlidingWindowRateLimiterOptions
  readonly interval: number

  constructor (options?: MemorySlidingWindowRateLimiterOptions)

  reserve (key: string, limit: number): Promise<number>
  reserve (key: string, limit: number, callback: (error: Error | null, ts: number) => void): void

  check (key: string, limit: number): Promise<number>
  check (key: string, limit: number, callback: (error: Error | null, usage: number) => void): void

  cancel (key: string, limit: number, ts: number): Promise<number>
  cancel (key: string, limit: number, ts: number, callback: (error: Error | null, usage: number) => void): void

  destroy (): void
}

export default MemorySlidingWindowRateLimiter
