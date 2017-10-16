import {
  default as RedisSlidingWindowRateLimiter,
  RedisSlidingWindowRateLimiterOptions
} from './redis-sliding-window-rate-limiter'

export interface SafeRedisSlidingWindowRateLimiterOptions extends RedisSlidingWindowRateLimiterOptions {
  reconnectTimeout?: number,
  safe: true
}

export declare class SafeSlidingWindowRateLimiter extends RedisSlidingWindowRateLimiter {
  constructor (options: SafeRedisSlidingWindowRateLimiterOptions)

  onConnectionLost (callback: (error: Error) => any): void

  removeConnectionLostListener (callback: (error: Error) => any): void
}
