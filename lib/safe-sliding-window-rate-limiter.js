'use strict'

const EventEmitter = require('events')

const SlidingWindowRateLimiter = require('./sliding-window-rate-limiter')

const ERROR_EVENT_NAME = 'connection_lost'

class SafeSlidingWindowRateLimiter extends SlidingWindowRateLimiter {
  constructor (options) {
    super(options)
    this._eventsEmitter = new EventEmitter()
    this._redisServiceAvialable = true
    this.SUCCESS_RESERVATION_TOKEN = 'SERVICE_DISABLE'
    this.SUCCESS_DEFAULT_USAGE = 1
    this._reconnnectTimeout = options.reconnectTimeout || 2000
    this._reconnectHandler = null
  }

  /**
   *
   * @param {string} key
   * @param {number} limit
   * @param callback
   * @return {*}
   */
  reserve (key, limit, callback) {
    return this._handleOperation('reserve', [key, limit], callback, this.SUCCESS_RESERVATION_TOKEN)
  }

  /**
   *
   * @param {string} key
   * @param {number} limit
   * @param {number} toRemove
   * @param callback
   * @return {*}
   */
  cancel (key, limit, toRemove, callback) {
    return this._handleOperation('cancel', [key, limit, toRemove], callback, this.SUCCESS_DEFAULT_USAGE)
  }

  /**
   *
   * @param {string} key
   * @param {number} limit
   * @param callback
   * @return {*}
   */
  check (key, limit, callback) {
    return this._handleOperation('check', [key, limit], callback, this.SUCCESS_DEFAULT_USAGE)
  }

  /**
   *
   * @param {'error'} eventName
   * @param {function} callback
   */
  on (eventName, callback) {
    if (eventName === ERROR_EVENT_NAME) {
      this._eventsEmitter.on(ERROR_EVENT_NAME, callback)
    }
  }

  removeListener (eventName, listener) {
    if (eventName === ERROR_EVENT_NAME) {
      this._eventsEmitter.removeListener(ERROR_EVENT_NAME, listener)
    }
  }

  _handleOperation (operationName, operationArgs, callback, defaultSuccessValue) {
    const callbacksMode = callback instanceof Function

    if (callbacksMode && this._redisServiceAvialable) {
      return super[operationName](...operationArgs, this._callbackErrorHandler(callback, defaultSuccessValue))
    } else if (callbacksMode && !this._redisServiceAvialable) {
      callback(null, defaultSuccessValue)
      return defaultSuccessValue
    } else if (!callbacksMode && this._redisServiceAvialable) {
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
    if (this._reconnectHandler) {
      clearTimeout(this._reconnectHandler)
    }
    this._reconnectHandler = setTimeout(() => {
      this._redisServiceAvialable = true
    }, this._reconnnectTimeout)
  }
}

module.exports = SafeSlidingWindowRateLimiter
