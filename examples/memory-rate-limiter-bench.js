#!/usr/bin/env node

// Usage: time node examples/memory-rate-limiter-bench.js 10000 10000 5000 >/dev/null

const ATTEMPTS = Number(process.argv[2]) || 1
const INTERVAL = Number(process.argv[3]) || 60000
const LIMIT = Number(process.argv[4]) || ATTEMPTS

import SlidingWindowRateLimiter from "../lib/sliding-window-rate-limiter.js"

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

void main().catch(console.error)
