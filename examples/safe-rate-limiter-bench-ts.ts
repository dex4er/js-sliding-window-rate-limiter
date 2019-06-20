#!/usr/bin/env ts-node

// Usage: time ts-node examples/safe-rate-limiter-bench-ts.ts 10000 10 5000 >/dev/null

const ATTEMPTS = Number(process.argv[2]) || 1
const INTERVAL = Number(process.argv[3]) || 60
const LIMIT = Number(process.argv[4]) || ATTEMPTS

const REDIS_HOST = process.env.REDIS_HOST || "localhost"

import SlidingWindowRateLimiter from "../src/sliding-window-rate-limiter"

import {promisify} from "util"
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
    const reservation = await limiter.reserve(key, LIMIT)
    const usage = await limiter.check(key, LIMIT)
    const remaining = await limiter.remaining(key, LIMIT)
    console.info({reservation, usage, remaining})
    if (!usage) {
      await delay(100) // slow down because limiter is not available
    }
  }

  limiter.destroy()
}

void main().catch(console.error)
