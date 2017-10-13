'use strict'

const fs = require('fs')
const path = require('path')

const Redis = require('ioredis')

const lua = process.env.DEBUG_LUA
  ? fs.readFileSync(path.join(__dirname, '../lib/sliding-window-rate-limiter.lua'), 'utf8')
  : fs.readFileSync(path.join(__dirname, '../lib/sliding-window-rate-limiter.min.lua'), 'utf8')

const MODE_CHECK = 0
const MODE_RESERVE = 1
const MODE_CANCEL = 2

/**
 * @interface RedisSlidingWindowRateLimiterOptions
 * @implements SlidingWindowRateLimiterOptions
 * @property {Redis | string} [redis]
 */

/**
 * @class
 * @implements SlidingWindowRateLimiterBackend
 * @param {RedisSlidingWindowRateLimiterOptions} options
 * @property {number} interval
 * @property {Redis} redis
 */
class RedisSlidingWindowRateLimiter {
  constructor (options) {
    options = options || {}

    this.options = options
    this.interval = parseInt(options.interval) || 60

    if (!options.redis || typeof options.redis === 'string') {
      this.redis = new Redis(options.redis)
    } else {
      this.redis = options.redis
    }

    this.redis.defineCommand('limiter', {
      lua,
      numberOfKeys: 1
    })
  }

  /**
   * @callback ResultCallback
   * @param {Error | null} err
   * @param {number} result
   */

  /**
   * @async
   * @param {string} key
   * @param {number} limit
   * @param {ResultCallback} [callback]
   * @returns {Promise<number> | void}
   */
  reserve (key, limit, callback) {
    return this._limiter(key, MODE_RESERVE, this.interval, limit, 0, callback)
  }

  /**
   * @param {string} key
   * @param {number} limit
   * @param {number} ts
   * @param {ResultCallback} [callback]
   * @returns {Promise<number> | void}
   */
  cancel (key, limit, ts, callback) {
    return this._limiter(key, MODE_CANCEL, this.interval, limit, ts, callback)
  }

  /**
   * @param {string} key
   * @param {number} limit
   * @param {ResultCallback} [callback]
   * @returns {Promise<number> | void}
   */
  check (key, limit, callback) {
    return this._limiter(key, MODE_CHECK, this.interval, limit, 0, callback)
  }

  destroy () {
    if (!this.options.redis || typeof this.options.redis === 'string') {
      console.log(this.redis)
      this.redis.quit()
    }
  }

  /**
   * @private
   * @param {string} key
   * @param {number} mode - 0: check 1: reserve 2: cancel reservation
   * @param {number} interval
   * @param {number} limit
   * @param {number} ts
   * @param {ResultCallback} callback
   * @returns {Promise<number> | void}
   */
  _limiter (key, mode, interval, limit, ts, callback) {
    return this.redis.limiter(key, mode, interval, limit, ts, callback)
  }
}

RedisSlidingWindowRateLimiter.RedisSlidingWindowRateLimiter = RedisSlidingWindowRateLimiter
RedisSlidingWindowRateLimiter.default = RedisSlidingWindowRateLimiter

module.exports = RedisSlidingWindowRateLimiter