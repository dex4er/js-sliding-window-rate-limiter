'use strict'

const EventEmitter = require('events')

const RedisSlidingWindowRateLimiter = require('./redis-sliding-window-rate-limiter')

const ERROR_EVENT_NAME = 'error'

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
class SafeSlidingWindowRateLimiter extends RedisSlidingWindowRateLimiter {
  constructor (options) {
    super(options)

    this._eventsEmitter = new EventEmitter()
    this._redisServiceAvialable = true
    this._reconnnectTimeout = options.reconnectTimeout || 2000
    this._reconnectTimer = null
  }

  reserve (key, limit, callback) {
    return this._handleOperation('reserve', [key, limit], callback, SafeSlidingWindowRateLimiter.SUCCESS_RESERVATION_TOKEN)
  }

  cancel (key, limit, ts, callback) {
    return this._handleOperation('cancel', [key, limit, ts], callback, SafeSlidingWindowRateLimiter.SUCCESS_DEFAULT_USAGE)
  }

  check (key, limit, callback) {
    return this._handleOperation('check', [key, limit], callback, SafeSlidingWindowRateLimiter.SUCCESS_DEFAULT_USAGE)
  }

  /**
   *
   * @param {function} callback
   */
  onConnectionLost (callback) {
    this._eventsEmitter.on(ERROR_EVENT_NAME, callback)
  }

  removeConnectionLostListener (listener) {
    this._eventsEmitter.removeListener(ERROR_EVENT_NAME, listener)
  }

  _handleOperation (operationName, operationArgs, callback, defaultSuccessValue) {
    const callbacksMode = callback instanceof Function

    if (callbacksMode && this._redisServiceAvialable) {
      return super[operationName].apply(this, operationArgs.concat([this._callbackErrorHandler(callback, defaultSuccessValue)]))
    } else if (callbacksMode && !this._redisServiceAvialable) {
      callback(null, defaultSuccessValue)
      return defaultSuccessValue
    } else if (!callbacksMode && this._redisServiceAvialable) {
      return this._promiseErrorHandler(super[operationName].apply(this, operationArgs), defaultSuccessValue)
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
    return new Promise((resolve, reject) => {
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
    this._eventsEmitter.emit(ERROR_EVENT_NAME, error)
  }

  _markServiceAsUnavailable () {
    this._redisServiceAvialable = false
    if (this._reconnectTimer) {
      clearTimeout(this._reconnectTimer)
    }
    this._reconnectTimer = setTimeout(() => {
      this._redisServiceAvialable = true
    }, this._reconnnectTimeout)
  }

  destroy () {
    super.destroy()
    if (this._reconnectTimer) {
      clearTimeout(this._reconnectTimer)
    }
  }
}

SafeSlidingWindowRateLimiter.SUCCESS_RESERVATION_TOKEN = 0
SafeSlidingWindowRateLimiter.SUCCESS_DEFAULT_USAGE = 1

SafeSlidingWindowRateLimiter.SafeSlidingWindowRateLimiter = SafeSlidingWindowRateLimiter
SafeSlidingWindowRateLimiter.default = SafeSlidingWindowRateLimiter

module.exports = SafeSlidingWindowRateLimiter
