#!/usr/bin/env node

// Usage: time node examples/rate-limiter-callbacks-bench.js 10000 >/dev/null

'use strict'

const ATTEMPTS = Number(process.argv[2]) || 1
const INTERVAL = Number(process.argv[3]) || 60

const Limiter = require('../lib/sliding-window-rate-limiter')

function main () {
  const limiter = new Limiter({
    host: process.env.REDIS_HOST,
    interval: INTERVAL,
    limit: ATTEMPTS
  })

  const key = 'limiter'

  let i = 1

  const end = () => {
    limiter.redis.quit()
  }

  const step = (err, usage) => {
    if (err) {
      throw err
    } else {
      console.log(usage)
    }
    limiter.reserve(key, i++ <= ATTEMPTS ? step : end)
  }

  limiter.reserve(key, step)
}

main()
