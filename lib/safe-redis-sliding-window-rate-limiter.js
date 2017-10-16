'use strict'

const RedisSlidingWindowRateLimiter = require('./redis-sliding-window-rate-limiter').RedisSlidingWindowRateLimiter

const ERROR_EVENT = 'error'

/**
 * @interface SafeRedisSlidingWindowRateLimiterOptions
 * @implements RedisSlidingWindowRateLimiterOptions
 * @property {true} [safe]
 * @property {number} [reconnectTimeout]
 */

/**
 * @class
 * @extends RedisSlidingWindowRateLimiter
 * @implements SlidingWindowRateLimiterBackend
 * @param {SafeRedisSlidingWindowRateLimiterOptions} [options]
 * @property {number} reconnectTimeout
 */
class SafeRedisSlidingWindowRateLimiter extends RedisSlidingWindowRateLimiter {
  constructor (options) {
    super(options)

    this.reconnectTimeout = options.reconnectTimeout || 2000

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
    return this._handleOperation('reserve', [key, limit], callback, SafeRedisSlidingWindowRateLimiter.SUCCESS_RESERVATION_TOKEN)
  }

  /**
   * @param {string} key
   * @param {number} limit
   * @param {number} ts
   * @param {ResultCallback} [callback]
   * @returns {Promise<number> | void}
   */
  cancel (key, limit, ts, callback) {
    return this._handleOperation('cancel', [key, limit, ts], callback, SafeRedisSlidingWindowRateLimiter.SUCCESS_DEFAULT_USAGE)
  }

  /**
   * @param {string} key
   * @param {number} limit
   * @param {ResultCallback} [callback]
   * @returns {Promise<number> | void}
   */
  check (key, limit, callback) {
    return this._handleOperation('check', [key, limit], callback, SafeRedisSlidingWindowRateLimiter.SUCCESS_DEFAULT_USAGE)
  }

  _handleOperation (operationName, operationArgs, callback, defaultSuccessValue) {
    const callbacksMode = callback instanceof Function

    if (callbacksMode && this._redisServiceAvailable) {
      return super[operationName](...operationArgs, this._callbackErrorHandler(callback, defaultSuccessValue))
    } else if (callbacksMode && !this._redisServiceAvailable) {
      callback(null, defaultSuccessValue)
      return defaultSuccessValue
    } else if (!callbacksMode && this._redisServiceAvailable) {
      return this._promiseErrorHandler(super[operationName](...operationArgs), defaultSuccessValue)
    } else {
      return Promise.resolve(defaultSuccessValue)
    }
  }

  _callbackErrorHandler (successCallback, successReturnValue) {
    return (error, successValue) => {
      if (error) {
        this._handleError(error)
        successCallback(null, successReturnValue)
      } else {
        successCallback(null, successValue)
      }
    }
  }

  /**
   *
   * @param {Promise} originPromise
   * @param {*} defaultSuccessValue
   * @return {Promise}
   * @private
   */
  _promiseErrorHandler (originPromise, defaultSuccessValue) {
    return new Promise((resolve) => {
      originPromise.then((successValue) => {
        resolve(successValue)
      }, (error) => {
        this._handleError(error)
        resolve(defaultSuccessValue)
      })
    })
  }

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
