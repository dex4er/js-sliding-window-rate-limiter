#!/usr/bin/env ts-node

// Usage: time ts-node examples/memory-rate-limiter-bench-ts.ts 10000 >/dev/null

const ATTEMPTS = Number(process.argv[2]) || 1
const INTERVAL = Number(process.argv[3]) || 60

import * as SlidingWindowRateLimiter from '../src/sliding-window-rate-limiter'

async function main (): Promise<void> {
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

void main().catch(console.error)
