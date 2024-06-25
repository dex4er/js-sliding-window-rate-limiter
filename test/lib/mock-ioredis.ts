import * as crypto from "node:crypto"

import IORedis from "ioredis"

type μs = number
type ms = number

type Canceled = number
type Reset = μs
type Token = number
type Usage = number

interface Buckets {
  [key: string]: number[]
}

interface MockRedisOptions extends IORedis.RedisOptions {
  operationDelay?: ms
}

export class MockRedis extends IORedis.Redis {
  private operationDelay?: ms

  private buckets: Buckets = {}
  private connected: boolean = true

  constructor(options: MockRedisOptions | string = {}) {
    super()

    if (typeof options === "string") {
      options = {host: options}
    }

    this.operationDelay = options.operationDelay
  }

  connect(): Promise<any> {
    return Promise.resolve()
  }

  defineCommand(_command: string, _options: any): void {
    // noop
  }

  disconnect(): void {
    this.connected = false
  }

  quit(): Promise<"OK"> {
    this.disconnect()
    return Promise.resolve("OK")
  }

  // naive implementation of limiter
  limiter_cancel(key: string, token: number): Promise<Canceled> {
    return this.limiter_prepare(key).then(() => {
      const usage0 = this.buckets[key].length
      this.buckets[key] = this.buckets[key].filter(ts => ts !== token)
      return usage0 - this.buckets[key].length
    })
  }

  limiter_check(key: string, interval: ms, limit: number): Promise<[Usage, Reset]> {
    return this.limiter_prepare(key).then(() => {
      const now = new Date().getTime()

      this.buckets[key] = this.buckets[key].filter(ts => now - ts < interval)

      const usage = this.buckets[key].length

      if (usage >= limit) {
        return [usage, 1]
      } else {
        return [usage, 0]
      }
    })
  }

  limiter_reserve(key: string, interval: ms, limit: number): Promise<[Token, Usage, Reset]> {
    return this.limiter_prepare(key).then(() => {
      const now = new Date().getTime()

      this.buckets[key] = this.buckets[key].filter(ts => now - ts < interval)

      const usage = this.buckets[key].length

      if (usage >= limit) {
        return [0, usage, 1]
      } else {
        this.buckets[key].push(now)
        if (usage + 1 >= limit) {
          return [now, usage + 1, 1]
        } else {
          return [now, usage + 1, 0]
        }
      }
    })
  }

  private limiter_prepare(key: string): Promise<void> {
    if (!this.buckets[key]) {
      this.buckets[key] = []
    }

    if (key === "exception") {
      throw new Error("Redis throws an exception")
    }

    if (key === "error" || !this.connected) {
      const sha1sum = crypto.createHash("sha1").update(String(Math.random())).digest("hex")

      const error = Object.assign(
        new Error(
          `ERR Error running script (call to f_${sha1sum}): @user_script:1: user_script:1: attempt to call field 'replicate_commands' (a nil value) `,
        ),
        {
          name: "ReplyError",
          command: {
            name: "evalsha",
            args: [sha1sum, "1", key, ""],
          },
        },
      )

      return Promise.reject(error)
    }

    const delayPromise = this.operationDelay
      ? new Promise<void>(resolve => {
          setTimeout(() => resolve(), this.operationDelay!)
        })
      : Promise.resolve()

    return delayPromise
  }
}
