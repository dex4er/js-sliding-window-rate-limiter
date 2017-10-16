'use strict'

const EventEmitter = require('events').EventEmitter

/**
 * @interface MemorySlidingWindowRateLimiterOptions
 * @implements SlidingWindowRateLimiterOptions
 */

/**
 * @class
 * @implements SlidingWindowRateLimiterBackend
 * @param {MemorySlidingWindowRateLimiterOptions} [options]
 * @property {number} interval
 */
class MemorySlidingWindowRateLimiter extends EventEmitter {
  constructor (options) {
    super()

    options = options || {}

    this.interval = Number(options.interval) || 60

    this._buckets = {}
    this._timers = {}
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
    const now = this._bucketExpireNow(key)

    const usage = this._buckets[key].length

    if (usage >= limit) {
      return this._returnResult(-limit, callback)
    } else {
      this._buckets[key].push(now)

      if (this._timers[key]) {
        clearTimeout(this._timers[key])
      }
      this._timers[key] = setTimeout(() => {
        delete this._buckets[key]
        delete this._timers[key]
      }, this.interval)

      return this._returnResult(now, callback)
    }
  }

  /**
   * @param {string} key
   * @param {number} limit
   * @param {number} ts
   * @param {ResultCallback} [callback]
   * @returns {Promise<number> | void}
   */
  cancel (key, limit, ts, callback) {
    this._bucketExpireNow(key)

    const position = this._buckets[key].indexOf(ts)

    if (~position) {
      this._buckets[key].splice(position, 1)
    }

    const usage = this._buckets[key].length

    if (usage > limit) {
      return this._returnResult(-limit, callback)
    } else {
      return this._returnResult(limit, callback)
    }
  }

  /**
   * @param {string} key
   * @param {number} limit
   * @param {ResultCallback} [callback]
   * @returns {Promise<number> | void}
   */
  check (key, limit, callback) {
    this._bucketExpireNow(key)

    const usage = this._buckets[key].length

    if (usage > limit) {
      return this._returnResult(-limit, callback)
    } else {
      return this._returnResult(usage, callback)
    }
  }

  destroy () {
    for (const key of Object.keys(this._timers)) {
      clearTimeout(this._timers[key])
    }
  }

  /**
   * @private
   * @param {string} key
   * @returns {number}
   */
  _bucketExpireNow (key) {
    const now = new Date().getTime()
    this._buckets[key] = this._buckets[key] ? this._buckets[key].filter(ts => now - ts < this.interval * 1000 /* ms */) : []
    return now
  }

  /**
   * @private
   * @param {number} result
   * @param {ResultCallback} [callback]
   * @returns Promise<number> | void
   */
  _returnResult (result, callback) {
    if (callback) {
      return callback(null, result)
    } else {
      return Promise.resolve(result)
    }
  }
}

MemorySlidingWindowRateLimiter.SlidingWindowRateLimiter = MemorySlidingWindowRateLimiter
MemorySlidingWindowRateLimiter.default = MemorySlidingWindowRateLimiter

module.exports = MemorySlidingWindowRateLimiter
