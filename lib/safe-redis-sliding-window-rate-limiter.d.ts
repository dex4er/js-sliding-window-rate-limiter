import { SlidingWindowRateLimiterBackend } from './sliding-window-rate-limiter'
import { RedisSlidingWindowRateLimiter, RedisSlidingWindowRateLimiterOptions } from './redis-sliding-window-rate-limiter'

export interface SafeRedisSlidingWindowRateLimiterOptions extends RedisSlidingWindowRateLimiterOptions {
  safe?: true
  reconnectTimeout?: number
}

export declare class SafeRedisSlidingWindowRateLimiter extends RedisSlidingWindowRateLimiter implements SlidingWindowRateLimiterBackend {
  readonly options: SafeRedisSlidingWindowRateLimiterOptions
  readonly reconnectTimeout: number

  constructor (options?: SafeRedisSlidingWindowRateLimiterOptions)

  onConnectionLost (callback: (error: Error) => any): void

  removeConnectionLostListener (callback: (error: Error) => any): void
}
