import { After, And, Feature, Given, Scenario, Then, When } from '../lib/steps'

import Redis from 'ioredis'
import uuidv1 from 'uuid/v1'
import { MockRedis } from '../../mock/mock-ioredis'
import { BaseSlidingWindowRateLimiter } from '../../src/base-sliding-window-rate-limiter'
import { ExtendedRedis } from '../../src/redis-sliding-window-rate-limiter'
import { SafeRedisSlidingWindowRateLimiterOptions } from '../../src/safe-redis-sliding-window-rate-limiter'
import { createLimiter } from '../../src/sliding-window-rate-limiter'

Feature('Test sliding-window-rate-limiter module with callbacks', () => {
  const TEST_REDIS_URL = process.env.TEST_REDIS_URL
  const redis = TEST_REDIS_URL ? new Redis(TEST_REDIS_URL) as ExtendedRedis : new MockRedis()

  const limiterBackendOptions: { [key: string]: SafeRedisSlidingWindowRateLimiterOptions } = {
    Memory: { interval: 1 },
    Redis: { redis, interval: 1 },
    SafeRedis: { safe: true, redis, interval: 1 }
  }

  for (const backend of Object.keys(limiterBackendOptions)) {
    Scenario(`Make one reservation - ${backend} backend`, () => {
      let error: Error | null
      let key: string
      let limiter: BaseSlidingWindowRateLimiter
      let usage: number | undefined
      const defaultLimit = 1
      const options = limiterBackendOptions[backend]

      Given('limiter object', () => {
        limiter = createLimiter(options)
      })

      And('key', () => {
        key = 'one-reservation:' + uuidv1()
      })

      When('I check usage', async () => {
        await new Promise((resolve) => {
          limiter.check(key, defaultLimit, (err, value) => {
            error = err
            usage = value
            resolve()
          })
        })
      })

      Then('there was no error', () => {
        (error === null).should.be.equal(true)
      })

      And('usage is zero', () => {
        return Number(usage).should.equal(0)
      })

      When('I make one reservation', async () => {
        await new Promise((resolve) => {
          limiter.reserve(key, defaultLimit, (err, value) => {
            error = err
            usage = value
            resolve()
          })
        })
      })

      Then('there was no error', () => {
        (error === null).should.be.equal(true)
      })

      And('usage is above zero', () => {
        return Number(usage).should.be.above(0)
      })

      When('I check usage', async () => {
        await new Promise((resolve) => {
          limiter.check(key, defaultLimit, (err, value) => {
            error = err
            usage = value
            resolve()
          })
        })
      })

      Then('there was no error', () => {
        (error === null).should.be.equal(true)
      })

      And('usage is above zero', () => {
        return Number(usage).should.be.above(0)
      })

      After(async () => {
        await limiter.destroy()
      })
    })

    Scenario(`Make one reservation and another above limit - ${backend} backend`, () => {
      let error: Error | null
      let key: string
      let limiter: BaseSlidingWindowRateLimiter
      let usage: number | undefined
      const defaultLimit = 1
      const options = limiterBackendOptions[backend]

      Given('limiter object', () => {
        limiter = createLimiter(options)
      })

      And('key', () => {
        key = 'above-limit:' + uuidv1()
      })

      When('I check usage', async () => {
        await new Promise((resolve) => {
          limiter.check(key, defaultLimit, (err, value) => {
            error = err
            usage = value
            resolve()
          })
        })
      })

      Then('there was no error', () => {
        (error === null).should.be.equal(true)
      })

      And('usage is zero', () => {
        return Number(usage).should.equal(0)
      })

      When('I make one reservation', async () => {
        await new Promise((resolve) => {
          limiter.reserve(key, defaultLimit, (err, value) => {
            error = err
            usage = value
            resolve()
          })
        })
      })

      Then('there was no error', () => {
        (error === null).should.be.equal(true)
      })

      And('usage is above zero', () => {
        return Number(usage).should.be.above(0)
      })

      When('I try to make another above limit', async () => {
        await new Promise((resolve) => {
          limiter.reserve(key, defaultLimit, (err, value) => {
            error = err
            usage = value
            resolve()
          })
        })
      })

      Then('there was no error', () => {
        (error === null).should.be.equal(true)
      })

      And('usage is below zero', () => {
        return Number(usage).should.be.below(0)
      })

      When('I check usage', async () => {
        await new Promise((resolve) => {
          limiter.check(key, defaultLimit, (err, value) => {
            error = err
            usage = value
            resolve()
          })
        })
      })

      Then('there was no error', () => {
        (error === null).should.be.equal(true)
      })

      And('usage is above zero', () => {
        return Number(usage).should.be.above(0)
      })

      After(async () => {
        await limiter.destroy()
      })
    })

    Scenario(`Make one reservation and another after interval - ${backend} backend`, () => {
      let error: Error | null
      let key: string
      let limiter: BaseSlidingWindowRateLimiter
      let usage: number | undefined
      const defaultLimit = 1
      const options = limiterBackendOptions[backend]

      Given('limiter object', () => {
        limiter = createLimiter(options)
      })

      And('key', () => {
        key = 'after-interval:' + uuidv1()
      })

      When('I check usage', async () => {
        await new Promise((resolve) => {
          limiter.check(key, defaultLimit, (err, value) => {
            error = err
            usage = value
            resolve()
          })
        })
      })

      Then('there was no error', () => {
        (error === null).should.equal(true)
      })

      And('usage is zero', () => {
        return Number(usage).should.equal(0)
      })

      When('I make one reservation', async () => {
        await new Promise((resolve) => {
          limiter.reserve(key, defaultLimit, (err, value) => {
            error = err
            usage = value
            resolve()
          })
        })
      })

      Then('there was no error', () => {
        (error === null).should.be.equal(true)
      })

      And('usage is above zero', () => {
        return Number(usage).should.be.above(0)
      })

      When('I wait more than interval', async () => {
        await new Promise((resolve) => {
          setTimeout(resolve, 2000)
        })

      })

      And('I try to make another above limit', async () => {
        await new Promise((resolve) => {
          limiter.reserve(key, defaultLimit, (err, value) => {
            error = err
            usage = value
            resolve()
          })
        })
      })

      Then('usage is above zero', () => {
        return Number(usage).should.be.above(0)
      })

      After(async () => {
        await limiter.destroy()
      })
    })

    Scenario(`Cancel reservation - ${backend} backend`, () => {
      let canceled: number | undefined
      let error: Error | null
      let key: string
      let limiter: BaseSlidingWindowRateLimiter
      let reservationToken: number | undefined
      let usage: number | undefined
      const defaultLimit = 1
      const options = limiterBackendOptions[backend]

      Given('limiter object', () => {
        limiter = createLimiter(options)
      })

      And('key', () => {
        key = 'after-interval:' + uuidv1()
      })

      When('I make one reservation', async () => {
        await new Promise((resolve) => {
          limiter.reserve(key, defaultLimit, (err, result) => {
            error = err
            reservationToken = result
            resolve()
          })
        })
      })

      Then('there was no error', () => {
        (error === null).should.be.equal(true)
      })

      And('reservation token is correct', () => {
        Number(reservationToken).should.be.above(0)
      })

      When('I check usage', async () => {
        await new Promise((resolve) => {
          limiter.check(key, defaultLimit, (err, result) => {
            error = err
            usage = result
            resolve()
          })
        })
      })

      Then('usage is above zero', () => {
        Number(usage).should.be.above(0)
      })

      When('I cancel reservation', async () => {
        await new Promise((resolve) => {
          limiter.cancel(key, Number(reservationToken), (err, result) => {
            error = err
            canceled = result
            resolve()
          })
        })
      })

      Then('reservation is canceled', () => {
        Number(canceled).should.equals(1)
      })

      When('I check usage', async () => {
        await new Promise((resolve) => {
          limiter.check(key, defaultLimit, (err, result) => {
            error = err
            usage = result
            resolve()
          })
        })

      })

      Then('usage is zero', () => {
        Number(usage).should.be.equals(0)
      })

      When('I cancel canceled reservation', async () => {
        await new Promise((resolve) => {
          limiter.cancel(key, Number(reservationToken), (err, result) => {
            error = err
            canceled = result
            resolve()
          })
        })
      })

      Then('reservation was already canceled', () => {
        Number(canceled).should.equals(0)
      })

      After(async () => {
        await limiter.destroy()
      })
    })
  }

  After(async () => {
    await redis.quit()
  })
})
