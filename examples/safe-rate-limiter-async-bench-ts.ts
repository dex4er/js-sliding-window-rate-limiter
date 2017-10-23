#!/usr/bin/env ts-node

// Usage: time ts-node examples/safe-rate-limiter-async-bench-ts.ts 10000 >/dev/null

import { promisify } from 'util'
const delay = promisify(setTimeout)

const ATTEMPTS = Number(process.argv[2]) || 1
const INTERVAL = Number(process.argv[3]) || 60

const REDIS_HOST = process.env.REDIS_HOST || 'localhost'

import * as Redis from 'ioredis'
import * as SlidingWindowRateLimiter from '../lib/sliding-window-rate-limiter'

async function main () {
  const redis = new Redis({
    enableOfflineQueue: true,
    enableReadyCheck: true,
    host: REDIS_HOST,
    lazyConnect: true,
    retryStrategy: (times) => false,
    showFriendlyErrorStack: true
  })
  .on('error', (err) => {
    console.error(err)
    if (!['connecting', 'connect', 'ready'].includes(redis.status)) {
      void redis.connect()
    }
  })

  const limiter = SlidingWindowRateLimiter.createLimiter({
    interval: INTERVAL,
    redis,
    safe: true
  })
  .on('error', (err) => {
    console.error(err)
  })

  const key = 'limiter'

  await redis.connect()

  for (let i = 1; i <= ATTEMPTS; i++) {
    await limiter.reserve(key, ATTEMPTS)
    const usage = await limiter.check(key, ATTEMPTS)
    console.info(usage)
    if (!usage) {
      await delay(1000) // slow down because limiter is not available
    }
  }

  limiter.destroy()

  try {
    await redis.quit()
  } catch (e) {
    redis.disconnect()
  }
}

main().catch(console.error)
