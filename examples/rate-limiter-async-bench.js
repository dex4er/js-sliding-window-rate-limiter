#!/usr/bin/env node

// Usage: time node examples/rate-limiter-async-bench.js 10000 >/dev/null

'use strict'

const ATTEMPTS = Number(process.argv[2]) || 1
const INTERVAL = Number(process.argv[3]) || 60

const REDIS_HOST = process.env.REDIS_HOST

const Redis = require('ioredis')
const createLimiter = require('../lib/sliding-window-rate-limiter').createLimiter

const noop = () => {}

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

  const limiter = createLimiter({
    interval: INTERVAL,
    redis,
    safe: true
  })
  .on('error', noop)

  const key = 'limiter'

  for (let i = 1; i <= ATTEMPTS; i++) {
    await limiter.reserve(key, ATTEMPTS)
    const usage = await limiter.check(key, ATTEMPTS)
    console.log(usage)
  }

  limiter.destroy()

  if (redis) {
    await redis.quit()
  }
}

main().catch(console.error)
