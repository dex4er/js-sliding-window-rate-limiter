#!/usr/bin/env node

// Usage: time node examples/rate-limiter-callbacks-bench.js 10000 >/dev/null

'use strict'

const ATTEMPTS = Number(process.argv[2]) || 1
const INTERVAL = Number(process.argv[3]) || 60

const REDIS_HOST = process.env.REDIS_HOST

const Redis = require('ioredis')
const createLimiter = require('../lib/sliding-window-rate-limiter').createLimiter

const noop = () => {}

function main () {
  const redis = REDIS_HOST && new Redis({
    host: process.env.REDIS_HOST,
    lazyConnect: true,
    showFriendlyErrorStack: true
  })
  .on('error', noop)

  const key = 'limiter'

  let limiter
  let i = 1

  const afterConnect = (err) => {
    if (err) throw err
    limiter = createLimiter({
      host: process.env.REDIS_HOST,
      interval: INTERVAL,
      redis
    })

    limiter.check(key, ATTEMPTS, afterCheck)
  }

  const afterEnd = () => {
    limiter.destroy()

    if (redis) {
      redis.quit()
    }
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

  if (redis) {
    redis.connect(afterConnect)
  } else {
    afterConnect()
  }
}

main()
