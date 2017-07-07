#!/usr/bin/env node

// Usage: time node examples/rate-limiter-async-bench.js 10000 >/dev/null

'use strict'

const ATTEMPTS = Number(process.argv[2]) || 1
const INTERVAL = Number(process.argv[3]) || 60

const Redis = require('ioredis')
const Limiter = require('../lib/sliding-window-rate-limiter')

const noop = () => {}

async function main () {
  const redis = new Redis({
    host: process.env.REDIS_HOST,
    lazyConnect: true
  })
  .on('error', noop)

  await redis.connect()

  const limiter = new Limiter({
    interval: INTERVAL,
    limit: ATTEMPTS,
    redis
  })

  const key = 'limiter'

  for (let i = 1; i <= ATTEMPTS; i++) {
    const usage = await limiter.reserve(key)
    console.log(usage)
  }

  await limiter.redis.quit()
}

main().catch(console.error)
