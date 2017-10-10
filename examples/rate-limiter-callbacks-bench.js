#!/usr/bin/env node

// Usage: time node examples/rate-limiter-callbacks-bench.js 10000 >/dev/null

'use strict'

const ATTEMPTS = Number(process.argv[2]) || 1
const INTERVAL = Number(process.argv[3]) || 60

const Limiter = require('../lib/sliding-window-rate-limiter')

function main () {
  const limiter = new Limiter({
    host: process.env.REDIS_HOST,
    interval: INTERVAL
  })

  const key = 'limiter'

  let i = 1

  const afterEnd = () => {
    limiter.redis.quit()
  }

  const afterCheck = (err, usage) => {
    if (err) throw err
    console.log(usage)
    limiter.reserve(key, ATTEMPTS, i++ <= ATTEMPTS ? afterReserve : afterEnd)
  }

  const afterReserve = (err, ts) => {
    if (err) {
      throw err
    }
    limiter.check(key, ATTEMPTS, afterCheck)
  }

  limiter.check(key, ATTEMPTS, afterCheck)
}

main()
