'use strict'

const MemorySlidingWindowRateLimiter = require('./memory-sliding-window-rate-limiter')
const RedisSlidingWindowRateLimiter = require('./redis-sliding-window-rate-limiter')
const SafeRedisSlidingWindowRateLimiter = require('./safe-redis-sliding-window-rate-limiter')

/**
 * @interface SlidingWindowRateLimiterOptions
 * @property {number} [interval]
 */

/**
 * @interface SlidingWindowRateLimiterBackend
 * @param {SlidingWindowRateLimiterOptions} options
 * @property {number} interval
 */

/**
 * @method
 * @name reserve
 * @memberof SlidingWindowRateLimiterBackend
 * @instance
 * @param {string} key
 * @param {number} limit
 * @param {ResultCallback} [callback]
 * @returns {Promise<number> | void}
 */

/**
 * @method
 * @name cancel
 * @memberof SlidingWindowRateLimiterBackend
 * @instance
 * @param {string} key
 * @param {number} limit
 * @param {number} ts
 * @param {ResultCallback} callback
 * @returns {number}
 */

/**
 * @method
 * @name check
 * @memberof SlidingWindowRateLimiterBackend
 * @instance
 * @param {string} key
 * @param {number} limit
 * @param {ResultCallback} [callback]
 * @returns {Promise<number> | void}
 */

/**
 * @param {SlidingWindowRateLimiterOptions} options
 * @returns {SlidingWindowRateLimiterBackend}
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

module.exports = {
  MemorySlidingWindowRateLimiter,
  RedisSlidingWindowRateLimiter,
  SafeRedisSlidingWindowRateLimiter,
  createLimiter,
  default: createLimiter
}
