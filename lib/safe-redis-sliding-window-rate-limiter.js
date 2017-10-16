'use strict'

const RedisSlidingWindowRateLimiter = require('./redis-sliding-window-rate-limiter').RedisSlidingWindowRateLimiter

const ERROR_EVENT = 'error'

/**
 * @interface SafeRedisSlidingWindowRateLimiterOptions
 * @implements RedisSlidingWindowRateLimiterOptions
 * @property {true} [safe]
 * @property {number} [reconnectTimeout]
 * @property {number} [defaultResponse]
 */

/**
 * @class
 * @extends RedisSlidingWindowRateLimiter
 * @implements SlidingWindowRateLimiterBackend
 * @param {SafeRedisSlidingWindowRateLimiterOptions} [options]
 * @property {number} reconnectTimeout
 * @property {number} [defaultResponse]
 */
class SafeRedisSlidingWindowRateLimiter extends RedisSlidingWindowRateLimiter {
  constructor (options) {
    super(options)

    this.reconnectTimeout = options.reconnectTimeout || 2000
    this.defaultResponse = options.defaultResponse || 0

    this._redisServiceAvailable = true
    this._reconnectTimer = null
  }

  /**
   * @callback ResultCallback
   * @param {Error | null} err
   * @param {number} result
   */

  /**
   * @param {string} key
   * @param {number} limit
   * @param {ResultCallback} [callback]
   * @returns {Promise<number> | void}
   */
  reserve (key, limit, callback) {
    return this._handleOperation('reserve', [key, limit], callback)
  }

  /**
   * @param {string} key
   * @param {number} limit
   * @param {number} ts
   * @param {ResultCallback} [callback]
   * @returns {Promise<number> | void}
   */
  cancel (key, limit, ts, callback) {
    return this._handleOperation('cancel', [key, limit, ts], callback)
  }

  /**
   * @param {string} key
   * @param {number} limit
   * @param {ResultCallback} [callback]
   * @returns {Promise<number> | void}
   */
  check (key, limit, callback) {
    return this._handleOperation('check', [key, limit], callback)
  }

  /**
   * @private
   * @param {string} operationName
   * @param {any[]} operationArgs
   * @param {ResultCallback} callback
   */
  _handleOperation (operationName, operationArgs, callback) {
    if (callback) {
      if (this._redisServiceAvailable) {
        return super[operationName](...operationArgs, this._callbackErrorHandler(callback, this.defaultResponse))
      } else {
        return callback(null, this.defaultResponse)
      }
    } else {
      if (this._redisServiceAvailable) {
        return this._promiseErrorHandler(super[operationName](...operationArgs), this.defaultResponse)
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
    }, this.reconnectTimeout)
  }

  destroy () {
    super.destroy()
    if (this._reconnectTimer) {
      clearTimeout(this._reconnectTimer)
    }
    this.removeAllListeners(ERROR_EVENT)
  }
}

SafeRedisSlidingWindowRateLimiter.SUCCESS_RESERVATION_TOKEN = 0
SafeRedisSlidingWindowRateLimiter.SUCCESS_DEFAULT_USAGE = 1

SafeRedisSlidingWindowRateLimiter.SafeRedisSlidingWindowRateLimiter = SafeRedisSlidingWindowRateLimiter
SafeRedisSlidingWindowRateLimiter.default = SafeRedisSlidingWindowRateLimiter

module.exports = SafeRedisSlidingWindowRateLimiter
