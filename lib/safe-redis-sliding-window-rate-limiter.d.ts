/// <reference types="node" />

import { SlidingWindowRateLimiterBackend } from './sliding-window-rate-limiter'
import { RedisSlidingWindowRateLimiter, RedisSlidingWindowRateLimiterOptions } from './redis-sliding-window-rate-limiter'

export interface SafeRedisSlidingWindowRateLimiterOptions extends RedisSlidingWindowRateLimiterOptions {
  safe?: true
  reuseRedisAfter?: number
  defaultResponse?: number
}

export declare class SafeRedisSlidingWindowRateLimiter extends RedisSlidingWindowRateLimiter implements SlidingWindowRateLimiterBackend {
  readonly options: SafeRedisSlidingWindowRateLimiterOptions
  readonly reuseRedisAfter: number
  readonly defaultResponse: number

  constructor (options?: SafeRedisSlidingWindowRateLimiterOptions)

  addListener (event: 'error', listener: (err: Error) => void): this;
  emit (event: 'error', error: Error): boolean;
  on (event: 'error', listener: (err: Error) => void): this;
  once (event: 'error', listener: (err: Error) => void): this;
  prependListener (event: 'error', listener: (err: Error) => void): this;
  prependOnceListener (event: 'error', listener: (err: Error) => void): this;
  listeners (event: 'error'): Array<(err: Error) => void>;
}

export default SafeRedisSlidingWindowRateLimiter
