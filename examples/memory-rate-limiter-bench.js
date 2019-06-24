#!/usr/bin/env node

// Usage: time node examples/memory-rate-limiter-bench.js 10000 10 5000 >/dev/null

const ATTEMPTS = Number(process.argv[2]) || 1
const INTERVAL = Number(process.argv[3]) || 60
const LIMIT = Number(process.argv[4]) || ATTEMPTS

const {SlidingWindowRateLimiter} = require("../lib/sliding-window-rate-limiter")

async function main() {
  const limiter = SlidingWindowRateLimiter.createLimiter({
    interval: INTERVAL,
  }).on("error", err => {
    console.error(err)
  })

  const key = "limiter"

  for (let i = 1; i <= ATTEMPTS; i++) {
    const result = await limiter.reserve(key, LIMIT)
    console.info(result)
  }

  limiter.destroy()
}

main().catch(console.error)
