'use strict'

const { RedisSlidingWindowRateLimiter } = require('./redis-sliding-window-rate-limiter')

const ERROR_EVENT = 'error'

/**
 * @class
 * @extends RedisSlidingWindowRateLimiter
 * @implements SlidingWindowRateLimiterBackend
 * @param {Object} [options]
 * @param {number} [options.defaultResponse]
 * @param {number} [options.interval]
 * @param {Redis|string} [options.redis]
 * @param {number} [options.reuseRedisAfter]
 * @property {number} reuseRedisAfter
 * @property {number} [defaultResponse]
 */
class SafeRedisSlidingWindowRateLimiter extends RedisSlidingWindowRateLimiter {
  constructor (options) {
    super(options)

    this.reuseRedisAfter = Number(options.reuseRedisAfter) || 2000
    this.defaultResponse = Number(options.defaultResponse) || 0

    this._redisServiceAvailable = true
    this._reconnectTimer = null
  }

  /**
   * @param {string} key
   * @param {number} limit
   * @param {ResultCallback} [callback]
   * @returns {Promise<number> | void}
   */
  check (key, limit, callback) {
    return this._handleOperation('check', key, limit, callback)
  }

  /**
   * @param {string} key
   * @param {number} limit
   * @param {ResultCallback} [callback]
   * @returns {Promise<number> | void}
   */
  reserve (key, limit, callback) {
    return this._handleOperation('reserve', key, limit, callback)
  }

  /**
   * @param {string} key
   * @param {number} ts
   * @param {ResultCallback} [callback]
   * @returns {Promise<number> | void}
   */
  cancel (key, ts, callback) {
    return this._handleOperation('cancel', key, ts, callback)
  }

  /**
   * @private
   * @param {string} operationName
   * @param {string} key
   * @param {number} operationArg
   * @param {ResultCallback} callback
   */
  _handleOperation (operationName, key, operationArg, callback) {
    if (callback) {
      if (this._redisServiceAvailable) {
        return super[operationName](key, operationArg, this._callbackErrorHandler(callback, this.defaultResponse))
      } else {
        return callback(null, this.defaultResponse)
      }
    } else {
      if (this._redisServiceAvailable) {
        return this._promiseErrorHandler(super[operationName](key, operationArg), this.defaultResponse)
      } else {
        return Promise.resolve(this.defaultResponse)
      }
    }
  }

  /**
   * @private
   * @param {ResultCallback} successCallback
   * @param {number} defaultResponse
   * @returns {ResultCallback}
   */
  _callbackErrorHandler (successCallback, defaultResponse) {
    return (err, successValue) => {
      if (err) {
        this._handleError(err)
        successCallback(null, defaultResponse)
      } else {
        successCallback(null, successValue)
      }
    }
  }

  /**
   * @private
   * @param {Promise} originPromise
   * @param {number} defaultResponse
   * @returns {Promise}
   */
  _promiseErrorHandler (originPromise, defaultResponse) {
    return new Promise((resolve) => {
      originPromise.then((successValue) => {
        resolve(successValue)
      }, (error) => {
        this._handleError(error)
        resolve(defaultResponse)
      })
    })
  }

  /**
   * @param {Error} error
   */
  _handleError (error) {
    this._markServiceAsUnavailable()
    this.emit(ERROR_EVENT, error)
  }

  _markServiceAsUnavailable () {
    this._redisServiceAvailable = false
    if (this._reconnectTimer) {
      clearTimeout(this._reconnectTimer)
    }
    this._reconnectTimer = setTimeout(() => {
      this._redisServiceAvailable = true
    }, this.reuseRedisAfter)
  }

  destroy () {
    super.destroy()
    if (this._reconnectTimer) {
      clearTimeout(this._reconnectTimer)
    }
    this.removeAllListeners(ERROR_EVENT)
  }
}

SafeRedisSlidingWindowRateLimiter.SafeRedisSlidingWindowRateLimiter = SafeRedisSlidingWindowRateLimiter

module.exports = SafeRedisSlidingWindowRateLimiter
