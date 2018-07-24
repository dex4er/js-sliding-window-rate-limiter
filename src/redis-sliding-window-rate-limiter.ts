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

export interface LimiterParams {
  key: string
  mode: number
  interval: number
  limit: number
  ts: number
  callback?: ResultCallback
}

export interface RedisSlidingWindowRateLimiterOptions {
  redis?: ExtendedRedis | string
  interval?: number
  operationTimeout?: number
}

export class RedisSlidingWindowRateLimiter extends BaseSlidingWindowRateLimiter<RedisSlidingWindowRateLimiterOptions> {
  protected interval: number
  protected redis: ExtendedRedis
  protected operationTimeout: number

  constructor (options: RedisSlidingWindowRateLimiterOptions = {}) {
    super(options)

    this.options = options
    this.interval = Number(options.interval) || 60
    this.operationTimeout = options.operationTimeout || 0

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
    const params: LimiterParams = { key, mode, interval, limit, ts, callback }

    if (this.operationTimeout) {
      if (callback) {
        this.handleTimeout((result) => callback(null, result), callback, params, (success, fail) => {
          this.redis.limiter(key, mode, interval, limit, ts, (error, result) => {
            if (error) {
              fail(error)
            } else {
              success(result as number)
            }
          })
        })
      } else {
        return new Promise<number>((resolve, reject) => {
          this.handleTimeout(resolve, reject, params, (success, fail) => {
            (this.redis.limiter(key, mode, interval, limit, ts) as Promise<number>).then(success, fail)
          })
        })
      }
    } else {
      return this.redis.limiter(key, mode, interval, limit, ts, callback)
    }
  }

  private handleTimeout (
    successCallback: (result: number) => void,
    failCallback: (err: Error) => void,
    limiterParams: LimiterParams,
    operation: (resolve: (result: number) => void, reject: (err: Error) => void) => void)
    : void {
    let timedOut: boolean = false
    const timer = setTimeout(() => {
      timedOut = true

      failCallback(new Error(`Redis limiter operation timed out. (${this.operationTimeout}ms) key: ${limiterParams.key}, mode: ${limiterParams.mode}`))
    }, this.operationTimeout)

    function opCb<T> (arg: T, cb: (arg: T) => void): void {
      if (!timedOut) {
        clearTimeout(timer)
        cb(arg)
      }
    }

    operation((result: number) => opCb(result, successCallback), (err: Error) => opCb(err, failCallback))
  }
}
