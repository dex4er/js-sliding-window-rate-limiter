import Timer = NodeJS.Timer
import { BaseSlidingWindowRateLimiter, ResultCallback } from './base-sliding-window-rate-limiter'

export interface MemorySlidingWindowRateLimiterOptions {
  interval?: number
}

export class MemorySlidingWindowRateLimiter extends BaseSlidingWindowRateLimiter<MemorySlidingWindowRateLimiterOptions> {
  protected static returnResult (result: number, callback?: ResultCallback): Promise<number> | void {
    if (callback) {
      return callback(null, result)
    } else {
      return Promise.resolve(result)
    }
  }

  protected interval: number
  protected buckets: {[key: string]: number[]} = {}
  protected timers: {[key: string]: Timer} = {}

  constructor (options: MemorySlidingWindowRateLimiterOptions = {}) {
    super(options)
    this.interval = Number(options.interval) || 60
  }

  check (key: string, limit: number, callback?: ResultCallback): Promise<number> | void {
    this.bucketExpireNow(key)

    const usage = this.buckets[key].length

    if (usage > limit) {
      return MemorySlidingWindowRateLimiter.returnResult(-limit, callback)
    } else {
      return MemorySlidingWindowRateLimiter.returnResult(usage, callback)
    }
  }

  reserve (key: string, limit: number, callback: ResultCallback): Promise<number> | void {
    const now = this.bucketExpireNow(key)

    const usage = this.buckets[key].length

    if (usage >= limit) {
      return MemorySlidingWindowRateLimiter.returnResult(-limit, callback)
    } else {
      this.buckets[key].push(now)

      if (this.timers[key]) {
        clearTimeout(this.timers[key])
      }
      this.timers[key] = setTimeout(() => {
        delete this.buckets[key]
        delete this.timers[key]
      }, this.interval * 1000 /* ms */)

      return MemorySlidingWindowRateLimiter.returnResult(now, callback)
    }
  }

  cancel (key: string, ts: number, callback: ResultCallback): Promise<number> | void {
    this.bucketExpireNow(key)

    let canceled = 0

    const position = this.buckets[key].indexOf(ts)

    if (position !== -1) {
      canceled = this.buckets[key].splice(position, 1).length
    }

    return MemorySlidingWindowRateLimiter.returnResult(canceled, callback)
  }

  async destroy (): Promise<void> {
    for (const key of Object.keys(this.timers)) {
      clearTimeout(this.timers[key])
    }
  }

  private bucketExpireNow (key: string): number {
    const now = new Date().getTime()
    this.buckets[key] = this.buckets[key] ? this.buckets[key].filter((ts) => now - ts < this.interval * 1000 /* ms */) : []
    return now
  }
}
