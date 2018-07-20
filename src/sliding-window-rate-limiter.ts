import { BaseSlidingWindowRateLimiter } from './base-sliding-window-rate-limiter'
import { MemorySlidingWindowRateLimiter } from './memory-sliding-window-rate-limiter'
import { RedisSlidingWindowRateLimiter } from './redis-sliding-window-rate-limiter'
import {
  SafeRedisSlidingWindowRateLimiter,
  SafeRedisSlidingWindowRateLimiterOptions
} from './safe-redis-sliding-window-rate-limiter'

export function createLimiter (options: SafeRedisSlidingWindowRateLimiterOptions): BaseSlidingWindowRateLimiter {
  if (options.safe && options.redis) {
    return new SafeRedisSlidingWindowRateLimiter(options)
  } else if (options.redis) {
    return new RedisSlidingWindowRateLimiter(options)
  } else {
    return new MemorySlidingWindowRateLimiter(options)
  }
}

export {
  MemorySlidingWindowRateLimiter,
  RedisSlidingWindowRateLimiter,
  SafeRedisSlidingWindowRateLimiter
}
