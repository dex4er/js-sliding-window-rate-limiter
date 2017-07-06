#!/usr/bin/env node

// Usage: time node examples/redis-lua-bench.js 10000 >/dev/null

'use strict'

const fs = require('fs')
const path = require('path')

const Redis = require('ioredis')

const lua = fs.readFileSync(path.join(__dirname, '../lib/sliding-window-rate-limiter.min.lua'), 'utf8')

const ATTEMPTS = process.argv[2] || 1

async function main () {
  const redis = new Redis()

  redis.defineCommand('limiter', {
    lua,
    numberOfKeys: 1
  })

  const key = 'limiter'
  const period = 60
  const limit = ATTEMPTS
  const ttl = 90
  const reserv = 1

  for (let i = 1; i <= ATTEMPTS; i++) {
    const status = await redis.limiter(key, period, limit, ttl, reserv)
    console.log(status)
  }

  await redis.quit()
}

main().catch(console.error)
