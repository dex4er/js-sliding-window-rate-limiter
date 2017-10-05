'use strict'

const crypto = require('crypto')

class MockRedis {
  constructor (options) {
    options = options || {}
    this.host = options.host
    this.bucket = []
  }

  defineCommand (command, options) {}

  disconnect () {}

  // naive implementation of limiter
  limiter (key, mode, interval, limit, toRemove, callback) {
    if (key === 'error') {
      const sha1sum = crypto.createHash('sha1').update(String(Math.random())).digest('hex')

      const error = Object.assign(new Error(`ERR Error running script (call to f_${sha1sum}): @user_script:1: user_script:1: attempt to call field 'replicate_commands' (a nil value) `), {
        name: 'ReplyError',
        command: {
          name: 'evalsha',
          args: [
            sha1sum,
            '1',
            key,
            interval,
            limit,
            mode,
            toRemove,
            ''
          ]
        }
      })

      if (callback) {
        return callback(error)
      } else {
        return Promise.reject(error)
      }
    }

    const now = new Date().getTime()

    this.bucket = this.bucket.filter(ts => now - ts < interval * 1000 /* ms */)

    let result, usage

    result = usage = this.bucket.length

    if (mode === 2) {
      const index = this.bucket.indexOf(toRemove)
      this.bucket.splice(index, 1)
      result = usage = this.bucket.length
    } else if (mode === 1) {
      if (usage >= limit) {
        result = usage = -limit
      } else {
        this.bucket.push(now)
        result = now
      }
    }

    if (callback) {
      return callback(null, result)
    } else {
      return Promise.resolve(result)
    }
  }
}

module.exports = MockRedis
