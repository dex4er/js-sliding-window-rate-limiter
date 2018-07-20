import { BaseSlidingWindowRateLimiter } from './base-sliding-window-rate-limiter';
import { MemorySlidingWindowRateLimiter } from './memory-sliding-window-rate-limiter';
import { RedisSlidingWindowRateLimiter } from './redis-sliding-window-rate-limiter';
import { SafeRedisSlidingWindowRateLimiter, SafeRedisSlidingWindowRateLimiterOptions } from './safe-redis-sliding-window-rate-limiter';
export declare function createLimiter(options: SafeRedisSlidingWindowRateLimiterOptions): BaseSlidingWindowRateLimiter;
export { MemorySlidingWindowRateLimiter, RedisSlidingWindowRateLimiter, SafeRedisSlidingWindowRateLimiter };
