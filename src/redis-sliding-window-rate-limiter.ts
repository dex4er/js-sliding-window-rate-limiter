import fs from 'fs'
import Redis from 'ioredis'
import path from 'path'
import { BaseSlidingWindowRateLimiter, LimiterResult, ResultCallback } from './base-sliding-window-rate-limiter'

const lua = process.env.DEBUG_LUA
  ? fs.readFileSync(path.join(__dirname, './sliding-window-rate-limiter.lua'), 'utf8')
  : fs.readFileSync(path.join(__dirname, './sliding-window-rate-limiter.min.lua'), 'utf8')

const MODE_CHECK = 0
const MODE_RESERVE = 1
const MODE_CANCEL = 2

export interface ExtendedRedis extends Redis.Redis {
  limiter: (key: string, mode: number, interval: number, limit: number, ts: number, callback?: ResultCallback) => LimiterResult
}

export interface RedisSlidingWindowRateLimiterOptions {
  redis?: ExtendedRedis | string
  interval?: number
}

export class RedisSlidingWindowRateLimiter extends BaseSlidingWindowRateLimiter<RedisSlidingWindowRateLimiterOptions> {
  protected interval: number
  protected redis: ExtendedRedis

  constructor (options: RedisSlidingWindowRateLimiterOptions = {}) {
    super(options)

    this.options = options
    this.interval = Number(options.interval) || 60

    if (!options.redis || typeof options.redis === 'string') {
      this.redis = new Redis(options.redis) as ExtendedRedis
    } else {
      this.redis = options.redis
    }

    this.redis.defineCommand('limiter', {
      lua,
      numberOfKeys: 1
    })
  }

  check (key: string, limit: number, callback?: ResultCallback): LimiterResult {
    return this.limiter(key, MODE_CHECK, this.interval, limit, 0, callback)
  }

  reserve (key: string, limit: number, callback?: ResultCallback): LimiterResult {
    return this.limiter(key, MODE_RESERVE, this.interval, limit, 0, callback)
  }

  cancel (key: string, ts: number, callback?: ResultCallback): LimiterResult {
    return this.limiter(key, MODE_CANCEL, this.interval, 0, ts, callback)
  }

  async destroy (): Promise<void> {
    if (!this.options.redis || typeof this.options.redis === 'string') {
      await this.redis.quit()
    }
  }

  private limiter (key: string, mode: number, interval: number, limit: number, ts: number, callback?: ResultCallback): LimiterResult {
    return this.redis.limiter(key, mode, interval, limit, ts, callback)
  }
}
