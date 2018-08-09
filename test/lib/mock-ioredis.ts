// TODO: Bluebird is used because of outdated typings for ioredis
import Bluebird from 'bluebird'
import crypto from 'crypto'
import IORedis from 'ioredis'

interface Buckets {
  [key: string]: number[]
}

export class MockIORedis extends IORedis {
  host?: string
  buckets: Buckets = {}
  connected: boolean = true

  constructor (options: IORedis.RedisOptions | string = {}, protected delayOperation?: number) {
    super()

    if (typeof options === 'string') {
      options = { host: options }
    }

    this.host = options.host
  }

  connect (): Bluebird<any> {
    return Bluebird.resolve()
  }

  defineCommand (_command: string, _options: any): void {
    // noop
  }

  disconnect (): void {
    this.connected = false
  }

  quit (): Bluebird<string> {
    this.disconnect()
    return Bluebird.resolve('OK')
  }

  // naive implementation of limiter
  async limiter (key: string, mode: number, interval: number, limit: number, toRemove: number): Promise<number> {
    if (!this.buckets[key]) {
      this.buckets[key] = []
    }

    if (key === 'exception') {
      throw new Error('Redis throws an exception')
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

      return Promise.reject(error)
    }

    if (this.delayOperation) {
      await new Promise((resolve) => {
        setTimeout(() => resolve(), this.delayOperation)
      })
    }

    const now = new Date().getTime()

    this.buckets[key] = this.buckets[key].filter((ts) => now - ts < interval * 1000)

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

    return Promise.resolve(result)
  }
}

export default MockIORedis
