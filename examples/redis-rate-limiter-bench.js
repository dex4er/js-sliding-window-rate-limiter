#!/usr/bin/env node

// Usage: time node examples/safe-rate-limiter-bench.js 10000 >/dev/null

const ATTEMPTS = Number(process.argv[2]) || 1
const INTERVAL = Number(process.argv[3]) || 60

const REDIS_HOST = process.env.REDIS_HOST || "localhost"

const SlidingWindowRateLimiter = require("../lib/sliding-window-rate-limiter")

async function main() {
  const limiter = SlidingWindowRateLimiter.createLimiter({
    interval: INTERVAL,
    redis: REDIS_HOST,
  }).on("error", err => {
    console.error("Limiter:", err)
  })

  limiter.redis.on("error", err => {
    console.error("Redis:", err)
  })

  const key = "limiter"

  for (let i = 1; i <= ATTEMPTS; i++) {
    try {
      await limiter.reserve(key, ATTEMPTS)
    } catch (e) {
      console.error("Benchmark:", e)
    }
    try {
      const usage = await limiter.check(key, ATTEMPTS)
      console.info(usage)
    } catch (e) {
      console.error("Benchmark:", e)
    }
  }

  limiter.destroy()
}

main().catch(console.error)
