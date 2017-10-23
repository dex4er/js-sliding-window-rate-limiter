#!/usr/bin/env ts-node

// Usage: time ts-node examples/rate-limiter-async-bench-ts.ts 10000 >/dev/null

import { promisify } from 'util'
const delay = promisify(setTimeout)

const ATTEMPTS = Number(process.argv[2]) || 1
const INTERVAL = Number(process.argv[3]) || 60

const REDIS_HOST = process.env.REDIS_HOST

import * as Redis from 'ioredis'
import * as SlidingWindowRateLimiter from '../lib/sliding-window-rate-limiter'

async function main () {
  const redis = REDIS_HOST && new Redis({
    enableOfflineQueue: true,
    enableReadyCheck: true,
    host: process.env.REDIS_HOST,
    lazyConnect: true,
    retryStrategy: (times) => false,
    showFriendlyErrorStack: true
  })
  .on('error', (err) => {
    console.error(err)
    if (redis && !['connecting', 'connect', 'ready'].includes(redis.status)) {
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

  if (redis) {
    await redis.connect()
  }

  for (let i = 1; i <= ATTEMPTS; i++) {
    await limiter.reserve(key, ATTEMPTS)
    const usage = await limiter.check(key, ATTEMPTS)
    console.info(usage)
    if (!usage) {
      await delay(1000) // slow down because limiter is not available
    }
  }

  limiter.destroy()

  if (redis) {
    try {
      await redis.quit()
    } catch (e) {
      redis.disconnect()
    }
  }
}

main().catch(console.error)
