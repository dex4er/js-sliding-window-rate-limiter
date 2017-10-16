import { SlidingWindowRateLimiterBackend } from './sliding-window-rate-limiter'
import { RedisSlidingWindowRateLimiter, RedisSlidingWindowRateLimiterOptions } from './redis-sliding-window-rate-limiter'

export interface SafeRedisSlidingWindowRateLimiterOptions extends RedisSlidingWindowRateLimiterOptions {
  safe?: true
  reconnectTimeout?: number
  defaultResponse?: number
}

export declare class SafeRedisSlidingWindowRateLimiter extends RedisSlidingWindowRateLimiter implements SlidingWindowRateLimiterBackend {
  readonly options: SafeRedisSlidingWindowRateLimiterOptions
  readonly reconnectTimeout: number
  readonly defaultResponse: number

  constructor (options?: SafeRedisSlidingWindowRateLimiterOptions)

  onConnectionLost (callback: (error: Error) => any): void

  removeConnectionLostListener (callback: (error: Error) => any): void
}
