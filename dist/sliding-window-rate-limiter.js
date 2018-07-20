"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const memory_sliding_window_rate_limiter_1 = require("./memory-sliding-window-rate-limiter");
exports.MemorySlidingWindowRateLimiter = memory_sliding_window_rate_limiter_1.MemorySlidingWindowRateLimiter;
const redis_sliding_window_rate_limiter_1 = require("./redis-sliding-window-rate-limiter");
exports.RedisSlidingWindowRateLimiter = redis_sliding_window_rate_limiter_1.RedisSlidingWindowRateLimiter;
const safe_redis_sliding_window_rate_limiter_1 = require("./safe-redis-sliding-window-rate-limiter");
exports.SafeRedisSlidingWindowRateLimiter = safe_redis_sliding_window_rate_limiter_1.SafeRedisSlidingWindowRateLimiter;
function createLimiter(options) {
    if (options.safe && options.redis) {
        return new safe_redis_sliding_window_rate_limiter_1.SafeRedisSlidingWindowRateLimiter(options);
    }
    else if (options.redis) {
        return new redis_sliding_window_rate_limiter_1.RedisSlidingWindowRateLimiter(options);
    }
    else {
        return new memory_sliding_window_rate_limiter_1.MemorySlidingWindowRateLimiter(options);
    }
}
exports.createLimiter = createLimiter;
