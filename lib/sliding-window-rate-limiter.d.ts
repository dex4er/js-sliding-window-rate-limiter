import { MemorySlidingWindowRateLimiter, MemorySlidingWindowRateLimiterOptions } from './memory-sliding-window-rate-limiter'
import { RedisSlidingWindowRateLimiter, RedisSlidingWindowRateLimiterOptions } from './redis-sliding-window-rate-limiter'
import { SafeRedisSlidingWindowRateLimiter, SafeRedisSlidingWindowRateLimiterOptions } from './safe-redis-sliding-window-rate-limiter'

export { MemorySlidingWindowRateLimiter, MemorySlidingWindowRateLimiterOptions } from './memory-sliding-window-rate-limiter'
export { RedisSlidingWindowRateLimiter, RedisSlidingWindowRateLimiterOptions } from './redis-sliding-window-rate-limiter'
export { SafeRedisSlidingWindowRateLimiter, SafeRedisSlidingWindowRateLimiterOptions } from './safe-redis-sliding-window-rate-limiter'

type s = number

export interface SlidingWindowRateLimiterOptions {
  interval?: s
}

export declare interface SlidingWindowRateLimiterBackend {
  readonly options: SlidingWindowRateLimiterOptions
  readonly interval: s

  reserve (key: string, limit: number): Promise<number>
  reserve (key: string, limit: number, callback: (error: Error | null, ts: number) => void): void

  check (key: string, limit: number): Promise<number>
  check (key: string, limit: number, callback: (error: Error | null, usage: number) => void): void

  cancel (key: string, ts: number): Promise<number>
  cancel (key: string, ts: number, callback: (error: Error | null, usage: number) => void): void

  destroy (): void
}

export function createLimiter (options: MemorySlidingWindowRateLimiterOptions): MemorySlidingWindowRateLimiter
export function createLimiter (options: RedisSlidingWindowRateLimiterOptions): RedisSlidingWindowRateLimiter
export function createLimiter (options: SafeRedisSlidingWindowRateLimiterOptions): SafeRedisSlidingWindowRateLimiter

export default createLimiter
