'use strict'

const MemorySlidingWindowRateLimiter = require('./memory-sliding-window-rate-limiter')
const RedisSlidingWindowRateLimiter = require('./redis-sliding-window-rate-limiter')
const SafeRedisSlidingWindowRateLimiter = require('./safe-redis-sliding-window-rate-limiter')

/**
 * @callback ResultCallback
 * @param {Error | null} err
 * @param {number} result
 */

/**
 * @param {Object} [options]
 * @param {number} [options.interval]
 * @param {number} [options.defaultResponse]
 * @param {number} [options.interval]
 * @param {Redis|string} [options.redis]
 * @param {number} [options.reuseRedisAfter]
 * @param {boolean} [options.safe]
 * @returns {MemorySlidingWindowRateLimiter|RedisSlidingWindowRateLimiter|SafeRedisSlidingWindowRateLimiter}
 */
function createLimiter (options) {
  if (options.safe && options.redis) {
    return new SafeRedisSlidingWindowRateLimiter(options)
  } else if (options.redis) {
    return new RedisSlidingWindowRateLimiter(options)
  } else {
    return new MemorySlidingWindowRateLimiter(options)
  }
}

createLimiter.createLimiter = createLimiter
createLimiter.MemorySlidingWindowRateLimiter = MemorySlidingWindowRateLimiter
createLimiter.RedisSlidingWindowRateLimiter = RedisSlidingWindowRateLimiter
createLimiter.SafeRedisSlidingWindowRateLimiter = SafeRedisSlidingWindowRateLimiter

module.exports = createLimiter
