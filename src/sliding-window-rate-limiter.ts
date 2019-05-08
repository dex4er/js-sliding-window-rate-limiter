import {
  MemorySlidingWindowRateLimiter,
  MemorySlidingWindowRateLimiterOptions,
} from './memory-sliding-window-rate-limiter'
import {RedisSlidingWindowRateLimiter, RedisSlidingWindowRateLimiterOptions} from './redis-sliding-window-rate-limiter'
import {
  SafeRedisSlidingWindowRateLimiter,
  SafeRedisSlidingWindowRateLimiterOptions,
} from './safe-redis-sliding-window-rate-limiter'

export * from './memory-sliding-window-rate-limiter'
export * from './redis-sliding-window-rate-limiter'
export * from './safe-redis-sliding-window-rate-limiter'
export * from './sliding-window-rate-limiter-backend'

export class SlidingWindowRateLimiter {
  static createLimiter(options?: MemorySlidingWindowRateLimiterOptions): MemorySlidingWindowRateLimiter
  static createLimiter(options: RedisSlidingWindowRateLimiterOptions): RedisSlidingWindowRateLimiter
  static createLimiter(options: SafeRedisSlidingWindowRateLimiterOptions): SafeRedisSlidingWindowRateLimiter

  static createLimiter(
    options: MemorySlidingWindowRateLimiterOptions &
      RedisSlidingWindowRateLimiterOptions &
      SafeRedisSlidingWindowRateLimiterOptions = {},
  ): any {
    if (options.safe && options.redis) {
      return new SafeRedisSlidingWindowRateLimiter(options)
    } else if (options.redis) {
      return new RedisSlidingWindowRateLimiter(options)
    } else {
      return new MemorySlidingWindowRateLimiter(options)
    }
  }
}

export default SlidingWindowRateLimiter
