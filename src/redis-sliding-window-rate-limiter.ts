/// <reference types="node" />

import {EventEmitter} from "events"
import fs from "fs"
import IORedis = require("ioredis")
import path from "path"

import {
  SlidingWindowRateLimiterBackend,
  SlidingWindowRateLimiterBackendOptions,
} from "./sliding-window-rate-limiter-backend"

type ms = number
type s = number

const enum LimiterMode {
  Check,
  Reserve,
  Cancel,
}

// Additional command defined
export interface Redis extends IORedis.Redis {
  limiter(key: string, mode: LimiterMode, interval: s, limit: number, ts: ms): Promise<number | ms>
}

export interface RedisSlidingWindowRateLimiterOptions extends SlidingWindowRateLimiterBackendOptions {
  redis?: Redis | string
  interval?: s
  operationTimeout?: ms
}

const lua = process.env.DEBUG_SLIDING_WINDOW_RATELIMITER_LUA
  ? fs.readFileSync(path.join(__dirname, "../src/sliding-window-rate-limiter.lua"), "utf8")
  : fs.readFileSync(path.join(__dirname, "../lib/sliding-window-rate-limiter.min.lua"), "utf8")

export class RedisSlidingWindowRateLimiter extends EventEmitter implements SlidingWindowRateLimiterBackend {
  readonly redis: Redis
  readonly interval: s
  readonly operationTimeout: ms

  constructor(readonly options: RedisSlidingWindowRateLimiterOptions = {}) {
    super()

    this.interval = Number(options.interval) || (60 as s)

    this.operationTimeout = options.operationTimeout || 0

    if (!options.redis || typeof options.redis === "string") {
      this.redis = new IORedis({
        host: options.redis,
        retryStrategy: _times => 1000 as ms,
        maxRetriesPerRequest: 1,
      }) as Redis
    } else {
      this.redis = options.redis
    }

    this.redis.defineCommand("limiter", {
      lua,
      numberOfKeys: 1,
    })
  }

  check(key: string, limit: number): Promise<number> {
    return this.limiter(key, LimiterMode.Check, this.interval, limit, 0)
  }

  reserve(key: string, limit: number): Promise<number | ms> {
    return this.limiter(key, LimiterMode.Reserve, this.interval, limit, 0)
  }

  cancel(key: string, ts: ms): Promise<number | ms> {
    return this.limiter(key, LimiterMode.Cancel, this.interval, 0, ts)
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

  private async limiter(key: string, mode: LimiterMode, interval: s, limit: number, ts: ms): Promise<number | ms> {
    if (!this.operationTimeout) {
      return this.redis.limiter(key, mode, interval, limit, ts)
    } else {
      return this.promiseWithTimeout(this.redis.limiter(key, mode, interval, limit, ts))
    }
  }

  private async promiseWithTimeout<T>(operationPromise: Promise<T>): Promise<T> {
    let timer: NodeJS.Timeout | undefined

    const timeoutPromise = new Promise<T>((_resolve, reject) => {
      timer = setTimeout(() => {
        reject(new Error("Operation timed out"))
      }, this.operationTimeout)
    })

    const result = await Promise.race([operationPromise, timeoutPromise])

    if (timer) clearTimeout(timer)

    return result
  }
}

export default RedisSlidingWindowRateLimiter
