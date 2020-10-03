/// <reference types="node" />

import {RedisSlidingWindowRateLimiter, RedisSlidingWindowRateLimiterOptions} from "./redis-sliding-window-rate-limiter"
import {SlidingWindowRateLimiterBackend} from "./sliding-window-rate-limiter"

import {CancelResult, CheckResult, ReserveResult} from "./sliding-window-rate-limiter-backend"

type ms = number

export interface SafeRedisSlidingWindowRateLimiterOptions extends RedisSlidingWindowRateLimiterOptions {
  safe?: true
  reuseRedisAfter?: ms
  defaultResponse?: number
}

export interface SafeRedisSlidingWindowRateLimiter {
  addListener(event: "error", listener: (err: Error) => void): this
  emit(event: "error", error: Error): boolean
  listeners(event: "error"): Array<(err: Error) => void>
  off(event: "error", listener: (err: Error) => void): this
  on(event: "error", listener: (err: Error) => void): this
  once(event: "error", listener: (err: Error) => void): this
  prependListener(event: "error", listener: (err: Error) => void): this
  prependOnceListener(event: "error", listener: (err: Error) => void): this
  removeListener(event: "error", listener: (err: Error) => void): this
}

export class SafeRedisSlidingWindowRateLimiter
  extends RedisSlidingWindowRateLimiter
  implements SlidingWindowRateLimiterBackend {
  readonly reuseRedisAfter = Number(this.options.reuseRedisAfter) || 2000

  private redisServiceAvailable = true

  private reconnectTimer?: NodeJS.Timeout
  private reconnectTimerStart?: ms

  constructor(readonly options: SafeRedisSlidingWindowRateLimiterOptions = {}) {
    super(options)
    this.on("error", this.errorHandler)
  }

  cancel(key: string, token: number): Promise<CancelResult> {
    if (this.redisServiceAvailable) {
      try {
        return super.cancel(key, token).catch(err => {
          this.handleError(err)
          return {canceled: 0}
        })
      } catch (e) {
        this.handleError(e)
      }
    }
    return Promise.resolve({canceled: 0})
  }

  async check(key: string, limit: number): Promise<CheckResult> {
    if (this.redisServiceAvailable) {
      try {
        return super.check(key, limit).catch(err => {
          this.handleError(err)
          return this.resultWithReset({usage: 0})
        })
      } catch (e) {
        this.handleError(e)
      }
    }
    return Promise.resolve(this.resultWithReset({usage: 0}))
  }

  async reserve(key: string, limit: number): Promise<ReserveResult> {
    if (this.redisServiceAvailable) {
      try {
        return super.reserve(key, limit).catch(err => {
          this.handleError(err)
          return this.resultWithReset({usage: 0})
        })
      } catch (e) {
        this.handleError(e)
      }
    }
    return Promise.resolve(this.resultWithReset({usage: 0}))
  }

  destroy(): void {
    super.destroy()
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer)
    }
    this.removeAllListeners("error")
  }

  private errorHandler(_error: Error): void {
    // ignore
  }

  private handleError(error: Error): void {
    this.markServiceAsUnavailable()
    this.emit("error", error)
  }

  private markServiceAsUnavailable(): void {
    this.redisServiceAvailable = false
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer)
    }
    this.reconnectTimer = setTimeout(() => {
      this.redisServiceAvailable = true
      this.reconnectTimerStart = undefined
    }, this.reuseRedisAfter)
    this.reconnectTimerStart = new Date().getTime()
  }

  private resultWithReset<T extends CheckResult | ReserveResult>(result: T): T {
    if (this.reconnectTimerStart) {
      const now: ms = new Date().getTime()
      result.reset = this.reconnectTimerStart + this.reuseRedisAfter - now
    }
    return result
  }
}

export default SafeRedisSlidingWindowRateLimiter
