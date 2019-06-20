/// <reference types="node" />

import {EventEmitter} from "events"

import {
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

export type MemorySlidingWindowRateLimiterOptions = SlidingWindowRateLimiterBackendOptions

export class MemorySlidingWindowRateLimiter extends EventEmitter implements SlidingWindowRateLimiterBackend {
  readonly interval: s

  protected buckets: Buckets = {}
  protected timers: Timers = {}

  constructor(readonly options: MemorySlidingWindowRateLimiterOptions = {}) {
    super()

    this.interval = Number(options.interval) || (60 as s)
  }

  async check(key: string, limit: number): Promise<number> {
    this.bucketExpireNow(key)

    const usage = this.buckets[key].length

    if (usage > limit) {
      return -limit
    } else {
      return usage
    }
  }

  async reserve(key: string, limit: number): Promise<number> {
    const now = this.bucketExpireNow(key)
    const usage = this.buckets[key].length

    if (usage >= limit) {
      return -limit
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
      )
      this.timers[key].unref()

      return now as number
    }
  }

  async cancel(key: string, token: number): Promise<number> {
    this.bucketExpireNow(key)

    let canceled = 0

    const position = this.buckets[key].indexOf(token)

    if (position !== -1) {
      canceled = this.buckets[key].splice(position, 1).length
    }

    return canceled
  }

  async remaining(key: string, limit: number): Promise<s> {
    const now = this.bucketExpireNow(key)
    const usage = this.buckets[key].length
    const lastTimestamp = this.buckets[key][usage - limit]

    if (lastTimestamp) {
      return ((lastTimestamp + this.interval * (1000 as ms) - now) / 1000) as s
    } else {
      return 0
    }
  }

  destroy(): void {
    for (const key of Object.keys(this.timers)) {
      clearTimeout(this.timers[key])
    }
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
