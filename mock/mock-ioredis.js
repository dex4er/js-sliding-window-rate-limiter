'use strict'

const crypto = require('crypto')

class MockRedis {
  constructor (options) {
    options = options || {}
    this.host = options.host
    this.buckets = {}
    this.connected = true
  }

  defineCommand (command, options) {}

  disconnect () {
    this.connected = false
  }

  quit () {
    this.disconnect()
  }

  // naive implementation of limiter
  limiter (key, mode, interval, limit, toRemove, callback) {
    if (!this.buckets[key]) {
      this.buckets[key] = []
    }

    if (key === 'error' || !this.connected) {
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

    this.buckets[key] = this.buckets[key].filter(ts => now - ts < interval * 1000 /* ms */)

    let result, usage

    result = usage = this.buckets[key].length

    if (mode === 2) {
      const index = this.buckets[key].indexOf(toRemove)
      this.buckets[key].splice(index, 1)
      result = usage = this.buckets[key].length
    } else if (mode === 1) {
      if (usage >= limit) {
        result = usage = -limit
      } else {
        this.buckets[key].push(now)
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
