import { MemorySlidingWindowRateLimiter, MemorySlidingWindowRateLimiterOptions } from './memory-sliding-window-rate-limiter'
import { RedisSlidingWindowRateLimiter, RedisSlidingWindowRateLimiterOptions } from './redis-sliding-window-rate-limiter'
import { SafeRedisSlidingWindowRateLimiter, SafeRedisSlidingWindowRateLimiterOptions } from './safe-redis-sliding-window-rate-limiter'

export * from './memory-sliding-window-rate-limiter'
export * from './redis-sliding-window-rate-limiter'
export * from './safe-redis-sliding-window-rate-limiter'
export * from './sliding-window-rate-limiter-backend'

export function createLimiter (options: MemorySlidingWindowRateLimiterOptions): MemorySlidingWindowRateLimiter
export function createLimiter (options: RedisSlidingWindowRateLimiterOptions): RedisSlidingWindowRateLimiter
export function createLimiter (options: SafeRedisSlidingWindowRateLimiterOptions): SafeRedisSlidingWindowRateLimiter
export function createLimiter (options: any): any {
  if (options.safe && options.redis) {
    return new SafeRedisSlidingWindowRateLimiter(options)
  } else if (options.redis) {
    return new RedisSlidingWindowRateLimiter(options)
  } else {
    return new MemorySlidingWindowRateLimiter(options)
  }
}

export default createLimiter
