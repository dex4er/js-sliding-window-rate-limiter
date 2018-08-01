#!/usr/bin/env ts-node

// Usage: time ts-node examples/redis-rate-limiter-async-bench-ts.ts 10000 >/dev/null

const ATTEMPTS = Number(process.argv[2]) || 1
const INTERVAL = Number(process.argv[3]) || 60

const REDIS_HOST = process.env.REDIS_HOST || 'localhost'

import Redis from 'ioredis'
import * as SlidingWindowRateLimiter from '../lib/sliding-window-rate-limiter'

import { promisify } from 'util'
const delay = promisify(setTimeout)

async function main (): Promise<void> {
  const redis = new Redis({
    host: REDIS_HOST,
    retryStrategy: (_times: number) => 1000,
    maxRetriesPerRequest: 1
  } as any)
    .on('error', (err) => {
      console.error('Redis:', err)
    })

  const limiter = SlidingWindowRateLimiter.createLimiter({
    interval: INTERVAL,
    redis,
    safe: true
  })
    .on('error', (err) => {
      console.error('Limiter:', err)
    })

  const key = 'limiter'

  for (let i = 1; i <= ATTEMPTS; i++) {
    await limiter.reserve(key, ATTEMPTS)
    const usage = await limiter.check(key, ATTEMPTS)
    console.info(usage)
    if (!usage) {
      await delay(100) // slow down because limiter is not available
    }
  }

  limiter.destroy()

  try {
    await redis.quit()
  } catch (e) {
    redis.disconnect()
  }
}

void main().catch(console.error)
