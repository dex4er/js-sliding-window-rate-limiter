import {
  MemorySlidingWindowRateLimiter,
  MemorySlidingWindowRateLimiterOptions,
} from "./memory-sliding-window-rate-limiter.js"
import {
  RedisSlidingWindowRateLimiter,
  RedisSlidingWindowRateLimiterOptions,
} from "./redis-sliding-window-rate-limiter.js"
import {
  SafeRedisSlidingWindowRateLimiter,
  SafeRedisSlidingWindowRateLimiterOptions,
} from "./safe-redis-sliding-window-rate-limiter.js"
import {SlidingWindowRateLimiterBackend} from "./sliding-window-rate-limiter-backend.js"

export * from "./memory-sliding-window-rate-limiter.js"
export * from "./redis-sliding-window-rate-limiter.js"
export * from "./safe-redis-sliding-window-rate-limiter.js"
export * from "./sliding-window-rate-limiter-backend.js"

export class SlidingWindowRateLimiter {
  static createLimiter(options?: MemorySlidingWindowRateLimiterOptions): MemorySlidingWindowRateLimiter
  static createLimiter(options: RedisSlidingWindowRateLimiterOptions): RedisSlidingWindowRateLimiter
  static createLimiter(options: SafeRedisSlidingWindowRateLimiterOptions): SafeRedisSlidingWindowRateLimiter

  static createLimiter(
    options: MemorySlidingWindowRateLimiterOptions &
      RedisSlidingWindowRateLimiterOptions &
      SafeRedisSlidingWindowRateLimiterOptions = {},
  ): SlidingWindowRateLimiterBackend {
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
