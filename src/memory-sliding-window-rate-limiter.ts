/// <reference types="node" />

import {EventEmitter} from "events"

import {
  CancelResult,
  CheckResult,
  ReserveResult,
  SlidingWindowRateLimiterBackend,
  SlidingWindowRateLimiterBackendOptions,
} from "./sliding-window-rate-limiter-backend"

type ms = number
type s = number

interface Buckets {
  [key: string]: ms[]
}

interface Timers {
  [key: string]: NodeJS.Timeout
}

export interface MemorySlidingWindowRateLimiterOptions extends SlidingWindowRateLimiterBackendOptions {}

export class MemorySlidingWindowRateLimiter extends EventEmitter implements SlidingWindowRateLimiterBackend {
  readonly interval: s

  private buckets: Buckets = {}
  private timers: Timers = {}

  constructor(readonly options: MemorySlidingWindowRateLimiterOptions = {}) {
    super()

    this.interval = options.interval || (60 as s)
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
      const reset = this.bucketReset(key, limit, now)
      if (reset) result.reset = reset
    }

    return result
  }

  async reserve(key: string, limit: number): Promise<ReserveResult> {
    const now = this.bucketExpireNow(key)
    const usage = this.buckets[key].length

    if (usage && usage >= limit) {
      const reset = this.bucketReset(key, limit, now)
      const result: ReserveResult = {usage}

      if (reset) result.reset = reset

      return result
    } else {
      this.buckets[key].push(now)

      if (this.timers[key]) {
        clearTimeout(this.timers[key])
      }
      this.timers[key] = setTimeout(
        () => {
          delete this.buckets[key]
          delete this.timers[key]
        },
        (this.interval * 1000) as ms,
      ).unref()

      const result: ReserveResult = {usage: usage + 1}

      result.token = now

      if (usage + 1 >= limit) {
        const reset = this.bucketReset(key, limit, now)
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

  private bucketReset(key: string, limit: number, now: ms): ms | undefined {
    const usage = this.buckets[key].length
    const oldest = this.buckets[key][usage - limit]
    if (oldest) return ((((oldest + this.interval * 1000) as ms) - now) / 1000) as s
    return
  }

  private bucketExpireNow(key: string): ms {
    const now: ms = new Date().getTime()

    this.buckets[key] = this.buckets[key]
      ? this.buckets[key].filter(ts => now - ts < ((this.interval * 1000) as ms))
      : []

    return now
  }
}

export default MemorySlidingWindowRateLimiter
