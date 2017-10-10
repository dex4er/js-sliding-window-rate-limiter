'use strict'

const fs = require('fs')
const path = require('path')

const Redis = require('ioredis')

const lua = fs.readFileSync(path.join(__dirname, '../lib/sliding-window-rate-limiter.min.lua'), 'utf8')

const MODE_CHECK = 0
const MODE_RESERVE = 1
const MODE_CANCEL = 2

/**
 *
 * @constructor
 * @param {Object} options
 */
class SlidingWindowRateLimiter {
  constructor (options) {
    options = options || {}

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
   *
   * @private
   * @param {string} key
   * @param {number} mode - 0: check 1: reserve 2: cancel reservation
   * @param {number} limit
   * @param {number} tsRemove
   * @param {Function} callback
   * @return {number}
   */
  _limiter (key, mode, limit, tsRemove, callback) {
    return this.redis.limiter(key, mode, this.interval, limit, tsRemove, callback)
  }

  /**
   *
   * @param {string} key
   * @param {number} limit
   * @param {Function} callback
   * @return {number}
   */
  reserve (key, limit, callback) {
    return this._limiter(key, MODE_RESERVE, limit, 0, callback)
  }

  /**
   *
   * @param {string} key
   * @param {number} limit
   * @param {number} tsRemove
   * @param {Function} callback
   * @return {number}
   */
  cancel (key, limit, tsRemove, callback) {
    return this._limiter(key, MODE_CANCEL, limit, tsRemove, callback)
  }

  /**
   *
   * @param {string} key
   * @param {number} limit
   * @param {Function} callback
   * @return {number}
   */
  check (key, limit, callback) {
    return this._limiter(key, MODE_CHECK, limit, 0, callback)
  }
}

module.exports = SlidingWindowRateLimiter
