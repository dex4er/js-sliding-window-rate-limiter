'use strict'

const assert = require('assert')
const fs = require('fs')
const path = require('path')

const Redis = require('ioredis')

const lua = fs.readFileSync(path.join(__dirname, '../lib/sliding-window-rate-limiter.min.lua'), 'utf8')

class SlidingWindowRateLimiter {
  constructor (options) {
    options = options || {}

    assert(options.interval)
    assert(options.limit)

    this.interval = options.interval
    this.limit = options.limit
    this.ttl = options.ttl || this.interval * 2

    if (!options.redis || typeof options.redis === 'string') {
      this.redis = new Redis(options.redis)
    } else {
      this.redis = options.redis
    }

    this.redis.defineCommand('limiter', {
      lua,
      numberOfKeys: 1
    })
  }

  _limiter (key, reserve, callback) {
    return this.redis.limiter(key, this.interval, this.limit, this.ttl, reserve, callback)
  }

  reserve (key, callback) {
    return this._limiter(key, 1, callback)
  }

  usage (key, callback) {
    return this._limiter(key, 0, callback)
  }
}

module.exports = SlidingWindowRateLimiter
