import Bluebird = require('bluebird')

import crypto from 'crypto'
import Redis from 'ioredis'
import { LimiterResult, ResultCallback } from '../src/base-sliding-window-rate-limiter'

export class MockRedis extends Redis {
  protected connected: boolean
  protected buckets: { [key: string]: number[] }
  protected operationDelay: number

  constructor (options?: { operationDelay?: number }) {
    super()
    super.disconnect()
    options = options || {}
    this.operationDelay = options.operationDelay || 0
    this.buckets = {}
    this.connected = true
  }

  defineCommand (_command: string, _options: any): void {
    /**/
  }

  disconnect (): void {
    this.connected = false
  }

  quit (): Bluebird<string> {
    this.disconnect()

    return new Bluebird<string>((resolve) => {
      resolve('')
    })
  }

  // naive implementation of limiter
  limiter (key: string, mode: number, interval: number, limit: number, toRemove: number, callback?: ResultCallback): LimiterResult {
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
        setTimeout(() => {
          callback(error)
        }, this.operationDelay)
        return
      } else {
        return new Promise((_resolve, reject) => {
          setTimeout(() => {
            reject(error)
          })
        })
      }
    }

    const now = new Date().getTime()

    this.buckets[key] = this.buckets[key].filter((ts) => now - ts < interval * 1000 /* ms */)

    let result: number
    let usage: number

    result = usage = this.buckets[key].length

    if (mode === 2) {
      const index = this.buckets[key].indexOf(toRemove)
      result = this.buckets[key].splice(index, 1).length
    } else if (mode === 1) {
      if (usage >= limit) {
        result = usage = -limit
      } else {
        this.buckets[key].push(now)
        result = now
      }
    }

    if (callback) {
      setTimeout(() => {
        callback(null, result)
      }, this.operationDelay)
      return
    } else {
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve(result)
        }, this.operationDelay)
      })
    }
  }
}
