#!/usr/bin/env ts-node

// Usage: time ts-node examples/rate-limiter-async-bench-ts.ts 10000 >/dev/null

const ATTEMPTS = Number(process.argv[2]) || 1
const INTERVAL = Number(process.argv[3]) || 60

import * as Redis from 'ioredis'
import { SlidingWindowRateLimiter as Limiter } from '../lib/sliding-window-rate-limiter'

const noop = () => {/*noop*/}

async function main () {
  const redis = new Redis({
    host: process.env.REDIS_HOST,
    lazyConnect: true,
    showFriendlyErrorStack: true // see: https://github.com/DefinitelyTyped/DefinitelyTyped/pull/20459
  } as Redis.RedisOptions)
  .on('error', noop)

  await redis.connect()

  const limiter = new Limiter({
    interval: INTERVAL,
    redis
  })

  const key = 'limiter'

  for (let i = 1; i <= ATTEMPTS; i++) {
    await limiter.reserve(key, ATTEMPTS)
    const usage = await limiter.check(key, ATTEMPTS)
    console.info(usage)
  }

  await limiter.redis.quit()
}

main().catch(console.error)
