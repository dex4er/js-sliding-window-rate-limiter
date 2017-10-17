import { EventEmitter } from 'events'

import { SlidingWindowRateLimiterBackend, SlidingWindowRateLimiterOptions } from './sliding-window-rate-limiter'

export type MemorySlidingWindowRateLimiterOptions = SlidingWindowRateLimiterOptions

export class MemorySlidingWindowRateLimiter extends EventEmitter implements SlidingWindowRateLimiterBackend {
  readonly options: MemorySlidingWindowRateLimiterOptions
  readonly interval: number

  constructor (options?: MemorySlidingWindowRateLimiterOptions)

  check (key: string, limit: number): Promise<number>
  check (key: string, limit: number, callback: (error: Error | null, usage: number) => void): void

  reserve (key: string, limit: number): Promise<number>
  reserve (key: string, limit: number, callback: (error: Error | null, ts: number) => void): void

  cancel (key: string, ts: number): Promise<number>
  cancel (key: string, ts: number, callback: (error: Error | null, canceled: number) => void): void

  destroy (): void
}

export default MemorySlidingWindowRateLimiter
