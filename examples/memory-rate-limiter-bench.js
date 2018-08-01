#!/usr/bin/env node

// Usage: time node examples/memory-rate-limiter-bench.js 10000 >/dev/null

const ATTEMPTS = Number(process.argv[2]) || 1
const INTERVAL = Number(process.argv[3]) || 60

const SlidingWindowRateLimiter = require('../lib/sliding-window-rate-limiter')

async function main () {
  const limiter = SlidingWindowRateLimiter.createLimiter({
    interval: INTERVAL
  })
    .on('error', (err) => {
      console.error(err)
    })

  const key = 'limiter'

  for (let i = 1; i <= ATTEMPTS; i++) {
    await limiter.reserve(key, ATTEMPTS)
    const usage = await limiter.check(key, ATTEMPTS)
    console.info(usage)
  }

  limiter.destroy()
}

main().catch(console.error)
