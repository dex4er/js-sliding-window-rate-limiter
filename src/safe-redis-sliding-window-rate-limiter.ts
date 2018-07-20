import { LimiterResult, ResultCallback } from './base-sliding-window-rate-limiter'
import {
  RedisSlidingWindowRateLimiter,
  RedisSlidingWindowRateLimiterOptions
} from './redis-sliding-window-rate-limiter'

import Timer = NodeJS.Timer

const ERROR_EVENT = 'error'

export interface SafeRedisSlidingWindowRateLimiterOptions extends RedisSlidingWindowRateLimiterOptions {
  safe?: boolean
  reconnectTimeout?: number
  defaultResponse?: number
}

export class SafeRedisSlidingWindowRateLimiter extends RedisSlidingWindowRateLimiter {
  protected reconnectTimeout: number
  protected defaultResponse: number
  protected redisServiceAvailable: boolean
  protected reconnectTimer?: Timer

  constructor (options: SafeRedisSlidingWindowRateLimiterOptions) {
    super(options)

    this.reconnectTimeout = Number(options.reconnectTimeout) || 2000
    this.defaultResponse = Number(options.defaultResponse) || 0

    this.redisServiceAvailable = true
  }

  check (key: string, limit: number, callback?: ResultCallback): LimiterResult {
    return this.handleOperation('check', key, limit, callback)
  }

  reserve (key: string, limit: number, callback?: ResultCallback): LimiterResult {
    return this.handleOperation('reserve', key, limit, callback)
  }

  cancel (key: string, ts: number, callback?: ResultCallback): LimiterResult {
    return this.handleOperation('cancel', key, ts, callback)
  }

  async destroy (): Promise<void> {
    await super.destroy()
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer)
    }
    this.removeAllListeners(ERROR_EVENT)
  }

  protected handleOperation (operationName: 'cancel' | 'check' | 'reserve', key: string, operationArg: number, callback?: ResultCallback): LimiterResult {
    if (callback) {
      if (this.redisServiceAvailable) {
        return super[operationName](key, operationArg, this.callbackErrorHandler(callback, this.defaultResponse))
      } else {
        return callback(null, this.defaultResponse)
      }
    } else {
      if (this.redisServiceAvailable) {
        return this.promiseErrorHandler(super[operationName](key, operationArg) as Promise<number>, this.defaultResponse)
      } else {
        return Promise.resolve(this.defaultResponse)
      }
    }
  }

  protected callbackErrorHandler (successCallback: ResultCallback, defaultResponse: number): ResultCallback {
    return (err, successValue) => {
      if (err) {
        this.handleError(err)
        successCallback(null, defaultResponse)
      } else {
        successCallback(null, successValue)
      }
    }
  }

  protected promiseErrorHandler (originPromise: Promise<number>, defaultResponse: number): Promise<number> {
    return new Promise((resolve) => {
      originPromise.then((successValue) => {
        resolve(successValue)
      }, (error) => {
        this.handleError(error)
        resolve(defaultResponse)
      })
    })
  }

  protected handleError (error: Error): void {
    this.markServiceAsUnavailable()
    this.emit(ERROR_EVENT, error)
  }

  protected markServiceAsUnavailable (): void {
    this.redisServiceAvailable = false
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer)
    }
    this.reconnectTimer = setTimeout(() => {
      this.redisServiceAvailable = true
    }, this.reconnectTimeout)
  }
}
