#!/usr/bin/env node

// Usage: time node examples/rate-limiter-async-bench.js 10000 >/dev/null

'use strict'

const ATTEMPTS = process.argv[2] || 1
const INTERVAL = process.argv[3] || 60

const Limiter = require('../lib/sliding-window-rate-limiter')

async function main () {
  const limiter = new Limiter({
    interval: INTERVAL,
    limit: ATTEMPTS
  })

  const key = 'limiter'

  for (let i = 1; i <= ATTEMPTS; i++) {
    const usage = await limiter.reserve(key)
    console.log(usage)
  }

  await limiter.redis.quit()
}

main().catch(console.error)
