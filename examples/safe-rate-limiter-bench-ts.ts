#!/usr/bin/env ts-node

// Usage: time ts-node examples/safe-rate-limiter-bench-ts.ts 10000 10000 5000 >/dev/null

const ATTEMPTS = Number(process.argv[2]) || 1
const INTERVAL = Number(process.argv[3]) || 60000
const LIMIT = Number(process.argv[4]) || ATTEMPTS

const REDIS_HOST = process.env.REDIS_HOST || "localhost"

import {promisify} from "util"

import SlidingWindowRateLimiter from "../src/sliding-window-rate-limiter"

const delay = promisify(setTimeout)

async function main(): Promise<void> {
  const limiter = SlidingWindowRateLimiter.createLimiter({
    interval: INTERVAL,
    redis: REDIS_HOST,
    safe: true,
  }).on("error", err => {
    console.error("Limiter:", err)
  })

  limiter.redis.on("error", err => {
    console.error("Redis:", err)
  })

  const key = "limiter"

  for (let i = 1; i <= ATTEMPTS; i++) {
    const result = await limiter.reserve(key, LIMIT)
    console.info(result)
    if (result.reset) {
      await delay(result.reset) // slow down because limiter is not available
    }
  }

  limiter.destroy()
}

void main().catch(console.error)
