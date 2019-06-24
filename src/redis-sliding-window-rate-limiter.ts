/// <reference types="node" />

import {EventEmitter} from "events"
import fs from "fs"
import IORedis = require("ioredis")
import path from "path"

import {
  CancelResult,
  CheckResult,
  ReserveResult,
  SlidingWindowRateLimiterBackend,
  SlidingWindowRateLimiterBackendOptions,
} from "./sliding-window-rate-limiter-backend"

import {TimeoutError} from "./timeout-error"

type μs = number
type ms = number
type s = number

type Canceled = number
type Reset = μs
type Token = number
type Usage = number

// Additional command defined
export interface Redis extends IORedis.Redis {
  limiter_cancel(key: string, token: number): Promise<Canceled>
  limiter_check(key: string, interval: s, limit: number): Promise<[Usage, Reset]>
  limiter_reserve(key: string, interval: s, limit: number): Promise<[Token, Usage, Reset]>
}

export interface RedisSlidingWindowRateLimiterOptions extends SlidingWindowRateLimiterBackendOptions {
  redis?: Redis | string
  interval?: s
  operationTimeout?: ms
}

const LUA = {
  cancel: fs.readFileSync(path.join(__dirname, "../src/redis/cancel.lua"), "utf8"),
  check: fs.readFileSync(path.join(__dirname, "../src/redis/check.lua"), "utf8"),
  reserve: fs.readFileSync(path.join(__dirname, "../src/redis/reserve.lua"), "utf8"),
}

export class RedisSlidingWindowRateLimiter extends EventEmitter implements SlidingWindowRateLimiterBackend {
  readonly redis: Redis
  readonly interval: s
  readonly operationTimeout: ms

  constructor(readonly options: RedisSlidingWindowRateLimiterOptions = {}) {
    super()

    this.interval = Number(options.interval) || (60 as s)

    this.operationTimeout = options.operationTimeout || (0 as ms)

    if (!options.redis || typeof options.redis === "string") {
      this.redis = new IORedis({
        host: options.redis,
        retryStrategy: _times => 1000 as ms,
        maxRetriesPerRequest: 1,
      }) as Redis
    } else {
      this.redis = options.redis
    }

    this.redis.defineCommand("limiter_cancel", {lua: LUA.cancel, numberOfKeys: 1})
    this.redis.defineCommand("limiter_check", {lua: LUA.check, numberOfKeys: 1})
    this.redis.defineCommand("limiter_reserve", {lua: LUA.reserve, numberOfKeys: 1})
  }

  cancel(key: string, token: number): Promise<CancelResult> {
    return this.promiseWithTimeoutError(this.redis.limiter_cancel(key, token)).then(canceled => {
      return {canceled}
    })
  }

  check(key: string, limit: number): Promise<CheckResult> {
    return this.promiseWithTimeoutError(this.redis.limiter_check(key, this.interval, limit)).then(values => {
      const result: CheckResult = {
        usage: values[0],
      }
      if (values[1]) result.reset = values[1] / 1e6
      return result
    })
  }

  reserve(key: string, limit: number): Promise<ReserveResult> {
    return this.promiseWithTimeoutError(this.redis.limiter_reserve(key, this.interval, limit)).then(values => {
      const result: ReserveResult = {
        usage: values[1],
      }
      if (values[0]) result.token = values[0]
      if (values[2]) result.reset = values[2] / 1e6
      return result
    })
  }

  destroy(): void {
    if (!this.options.redis || typeof this.options.redis === "string") {
      try {
        this.redis.quit().catch(() => {
          this.redis.disconnect()
        })
      } catch (e) {
        this.redis.disconnect()
      }
    }
  }

  private async promiseWithTimeoutError<T>(operationPromise: Promise<T>): Promise<T> {
    if (this.operationTimeout) {
      let timer: NodeJS.Timeout | undefined

      const timeoutPromise = new Promise<T>((_resolve, reject) => {
        timer = setTimeout(() => {
          reject(new TimeoutError())
        }, this.operationTimeout).unref()
      })

      const result = await Promise.race([operationPromise, timeoutPromise])

      if (timer) clearTimeout(timer)

      return result
    } else {
      return operationPromise
    }
  }
}

export default RedisSlidingWindowRateLimiter
