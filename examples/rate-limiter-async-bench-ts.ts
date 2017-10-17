#!/usr/bin/env ts-node

// Usage: time ts-node examples/rate-limiter-async-bench-ts.ts 10000 >/dev/null

const ATTEMPTS = Number(process.argv[2]) || 1
const INTERVAL = Number(process.argv[3]) || 60

const REDIS_HOST = process.env.REDIS_HOST

import * as Redis from 'ioredis'
import * as SlidingWindowRateLimiter from '../lib/sliding-window-rate-limiter'

const noop = () => {/*noop*/}

async function main () {
  const redis = REDIS_HOST && new Redis({
    host: process.env.REDIS_HOST,
    lazyConnect: true,
    showFriendlyErrorStack: true
  })
  .on('error', noop)

  if (redis) {
    await redis.connect()
  }

  const limiter = SlidingWindowRateLimiter.createLimiter({
    interval: INTERVAL,
    redis,
    safe: true
  })
  .on('error', noop)

  const key = 'limiter'

  for (let i = 1; i <= ATTEMPTS; i++) {
    await limiter.reserve(key, ATTEMPTS)
    const usage = await limiter.check(key, ATTEMPTS)
    console.info(usage)
  }

  if (redis) {
    await redis.quit()
  }
}

main().catch(console.error)
