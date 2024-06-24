/// <reference types="node" />

import {EventEmitter} from "node:events"
import * as fs from "node:fs"
import * as path from "node:path"
import * as url from "node:url"
import IORedis = require("ioredis")

import {
  CancelResult,
  CheckResult,
  ReserveResult,
  SlidingWindowRateLimiterBackend,
  SlidingWindowRateLimiterBackendOptions,
} from "./sliding-window-rate-limiter-backend.js"

import {TimeoutError} from "./timeout-error.js"

type Canceled = number
type Reset = number
type Token = number
type Usage = number

// Additional command defined
export interface Redis extends IORedis.Redis {
  // eslint-disable-next-line @typescript-eslint/naming-convention
  limiter_cancel(key: string, token: number): Promise<Canceled>
  // eslint-disable-next-line @typescript-eslint/naming-convention
  limiter_check(key: string, interval: number, limit: number): Promise<[Usage, Reset]>
  // eslint-disable-next-line @typescript-eslint/naming-convention
  limiter_reserve(key: string, interval: number, limit: number): Promise<[Token, Usage, Reset]>
}

export interface RedisSlidingWindowRateLimiterOptions extends SlidingWindowRateLimiterBackendOptions {
  redis?: Redis | string
  interval?: number
  operationTimeout?: number
}

const __filename = url.fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const LUA = {
  cancel: fs.readFileSync(path.join(__dirname, "../src/redis/cancel.lua"), "utf8"),
  check: fs.readFileSync(path.join(__dirname, "../src/redis/check.lua"), "utf8"),
  reserve: fs.readFileSync(path.join(__dirname, "../src/redis/reserve.lua"), "utf8"),
}

export class RedisSlidingWindowRateLimiter extends EventEmitter implements SlidingWindowRateLimiterBackend {
  readonly redis: Redis
  readonly interval: number
  readonly operationTimeout: number

  constructor(readonly options: RedisSlidingWindowRateLimiterOptions = {}) {
    super()

    this.interval = Number(options.interval) || 60000

    this.operationTimeout = options.operationTimeout || 0

    if (!options.redis || typeof options.redis === "string") {
      this.redis = new IORedis({
        host: options.redis,
        retryStrategy: _times => 1000,
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
    return this.promiseWithTimeoutError(this.redis.limiter_cancel(key, token)).then(canceled => ({canceled}))
  }

  check(key: string, limit: number): Promise<CheckResult> {
    return this.promiseWithTimeoutError(this.redis.limiter_check(key, this.interval, limit)).then(values => {
      const result: CheckResult = {
        usage: values[0],
      }
      if (values[1]) result.reset = Math.ceil(values[1] / 1000)
      return result
    })
  }

  reserve(key: string, limit: number): Promise<ReserveResult> {
    return this.promiseWithTimeoutError(this.redis.limiter_reserve(key, this.interval, limit)).then(values => {
      const result: ReserveResult = {
        usage: values[1],
      }
      if (values[0]) result.token = values[0]
      if (values[2]) result.reset = Math.ceil(values[2] / 1000)
      return result
    })
  }

  destroy(): void {
    if (!this.options.redis || typeof this.options.redis === "string") {
      try {
        this.redis.quit().catch(() => {
          this.redis.disconnect()
        })
      } catch (_e) {
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
