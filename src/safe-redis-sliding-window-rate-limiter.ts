/// <reference types="node" />

import {RedisSlidingWindowRateLimiter, RedisSlidingWindowRateLimiterOptions} from './redis-sliding-window-rate-limiter'
import {SlidingWindowRateLimiterBackend} from './sliding-window-rate-limiter'

type ms = number

export interface SafeRedisSlidingWindowRateLimiterOptions extends RedisSlidingWindowRateLimiterOptions {
  safe?: true
  reuseRedisAfter?: number
  defaultResponse?: number
}

export interface SafeRedisSlidingWindowRateLimiter {
  addListener(event: 'error', listener: (err: Error) => void): this
  emit(event: 'error', error: Error): boolean
  listeners(event: 'error'): Array<(err: Error) => void>
  off(event: 'error', listener: (err: Error) => void): this
  on(event: 'error', listener: (err: Error) => void): this
  once(event: 'error', listener: (err: Error) => void): this
  prependListener(event: 'error', listener: (err: Error) => void): this
  prependOnceListener(event: 'error', listener: (err: Error) => void): this
  removeListener(event: 'error', listener: (err: Error) => void): this
}

export class SafeRedisSlidingWindowRateLimiter extends RedisSlidingWindowRateLimiter
  implements SlidingWindowRateLimiterBackend {
  readonly reuseRedisAfter: number
  readonly defaultResponse: number

  protected redisServiceAvailable: boolean = true
  protected reconnectTimer?: NodeJS.Timeout = undefined

  constructor(readonly options: SafeRedisSlidingWindowRateLimiterOptions = {}) {
    super(options)

    this.reuseRedisAfter = Number(options.reuseRedisAfter) || (2000 as ms)
    this.defaultResponse = Number(options.defaultResponse) || 0
  }

  async check(key: string, limit: number): Promise<number> {
    if (this.redisServiceAvailable) {
      return this.promiseErrorHandler(super.check(key, limit), this.defaultResponse)
    } else {
      return this.defaultResponse
    }
  }

  async reserve(key: string, limit: number): Promise<number | ms> {
    if (this.redisServiceAvailable) {
      return this.promiseErrorHandler(super.reserve(key, limit), this.defaultResponse)
    } else {
      return this.defaultResponse
    }
  }

  async cancel(key: string, ts: ms): Promise<number | ms> {
    if (this.redisServiceAvailable) {
      return this.promiseErrorHandler(super.cancel(key, ts), this.defaultResponse)
    } else {
      return this.defaultResponse
    }
  }

  destroy(): void {
    super.destroy()
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer)
    }
    this.removeAllListeners('error')
  }

  private async promiseErrorHandler(
    originPromise: Promise<number | ms>,
    defaultResponse: number,
  ): Promise<number | ms> {
    try {
      const successValue = await originPromise
      return successValue
    } catch (e) {
      this.handleError(e)
      return defaultResponse
    }
  }

  private handleError(error: Error): void {
    this.markServiceAsUnavailable()
    this.emit('error', error)
  }

  private markServiceAsUnavailable(): void {
    this.redisServiceAvailable = false
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer)
    }
    this.reconnectTimer = setTimeout(() => {
      this.redisServiceAvailable = true
    }, this.reuseRedisAfter)
  }
}

export default SafeRedisSlidingWindowRateLimiter
