'use strict'

const fs = require('fs')
const path = require('path')

const Redis = require('ioredis')

const lua = fs.readFileSync(path.join(__dirname, '../lib/sliding-window-rate-limiter.min.lua'), 'utf8')

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
   * @param key
   * @param limit
   * @param {number} mode - 0: check 1: reserve 2: cancel reservation
   * @param callback
   * @return {*}
   * @private
   */
  _limiter (key, limit, mode, callback) {
    return this.redis.limiter(key, this.interval, limit, mode, callback)
  }

  /**
   *
   * @param {string} key
   * @param {number} limit
   * @param callback
   * @return {*}
   */
  reserve (key, limit, callback) {
    return this._limiter(key, limit, 1, callback)
  }

  /**
   *
   * @param {string} key
   * @param {number} limit
   * @param callback
   * @return {*}
   */
  check (key, limit, callback) {
    return this._limiter(key, limit, 0, callback)
  }
}

module.exports = SlidingWindowRateLimiter
