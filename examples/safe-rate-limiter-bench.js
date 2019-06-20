#!/usr/bin/env node

// Usage: time node examples/safe-rate-limiter-bench.js 10000 10 5000 >/dev/null

const ATTEMPTS = Number(process.argv[2]) || 1
const INTERVAL = Number(process.argv[3]) || 60
const LIMIT = Number(process.argv[4]) || ATTEMPTS

const REDIS_HOST = process.env.REDIS_HOST || "localhost"

const {SlidingWindowRateLimiter} = require("../lib/sliding-window-rate-limiter")

const {promisify} = require("util")
const delay = promisify(setTimeout)

async function main() {
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

main().catch(console.error)
