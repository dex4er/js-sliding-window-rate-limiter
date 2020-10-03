/// <reference types="node" />

import {EventEmitter} from "events"

import {
  CancelResult,
  CheckResult,
  ReserveResult,
  SlidingWindowRateLimiterBackend,
  SlidingWindowRateLimiterBackendOptions,
} from "./sliding-window-rate-limiter-backend"

interface Buckets {
  [key: string]: number[]
}

interface Timers {
  [key: string]: NodeJS.Timeout
}

export interface MemorySlidingWindowRateLimiterOptions extends SlidingWindowRateLimiterBackendOptions {}

export class MemorySlidingWindowRateLimiter extends EventEmitter implements SlidingWindowRateLimiterBackend {
  readonly interval: number

  private buckets: Buckets = {}
  private timers: Timers = {}

  constructor(readonly options: MemorySlidingWindowRateLimiterOptions = {}) {
    super()

    this.interval = options.interval || 60000
  }

  async cancel(key: string, token: number): Promise<CancelResult> {
    this.bucketExpireNow(key)
    const usage = this.buckets[key].length

    let position: number
    while ((position = this.buckets[key].indexOf(token)) !== -1) {
      this.buckets[key].splice(position, 1)
    }

    const usage2 = this.buckets[key].length

    return {
      canceled: usage - usage2,
    }
  }

  async check(key: string, limit: number): Promise<CheckResult> {
    const now = this.bucketExpireNow(key)
    const usage = this.buckets[key].length

    const result: CheckResult = {usage}

    if (usage && usage >= limit) {
      const reset = this.bucketResetValue(key, limit, now)
      if (reset) result.reset = reset
    }

    return result
  }

  async reserve(key: string, limit: number): Promise<ReserveResult> {
    const now = this.bucketExpireNow(key)
    const usage = this.buckets[key].length

    if (usage && usage >= limit) {
      const reset = this.bucketResetValue(key, limit, now)
      const result: ReserveResult = {usage}

      if (reset) result.reset = reset

      return result
    } else {
      this.buckets[key].push(now)

      if (this.timers[key]) {
        clearTimeout(this.timers[key])
      }
      this.timers[key] = setTimeout(() => {
        delete this.buckets[key]
        delete this.timers[key]
      }, this.interval).unref()

      const result: ReserveResult = {usage: usage + 1}

      result.token = now

      if (usage + 1 >= limit) {
        const reset = this.bucketResetValue(key, limit, now)
        if (reset) result.reset = reset
      }

      return result
    }
  }

  destroy(): void {
    for (const key of Object.keys(this.timers)) {
      clearTimeout(this.timers[key])
    }
  }

  private bucketResetValue(key: string, limit: number, now: number): number | undefined {
    const usage = this.buckets[key].length
    const oldest = this.buckets[key][usage - limit]
    return oldest ? oldest + this.interval - now : undefined
  }

  private bucketExpireNow(key: string): number {
    const now = new Date().getTime()

    this.buckets[key] = this.buckets[key] ? this.buckets[key].filter(ts => now - ts < this.interval) : []

    return now
  }
}

export default MemorySlidingWindowRateLimiter
