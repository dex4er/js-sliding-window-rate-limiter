import { After, And, Feature, Given, Scenario, Then, When } from '../lib/steps'

import delay from 'delay'
import Redis from 'ioredis'
import uuidv1 from 'uuid/v1'
import { MockRedis } from '../../mock/mock-ioredis'
import { BaseSlidingWindowRateLimiter } from '../../src/base-sliding-window-rate-limiter'
import { ExtendedRedis } from '../../src/redis-sliding-window-rate-limiter'
import { SafeRedisSlidingWindowRateLimiterOptions } from '../../src/safe-redis-sliding-window-rate-limiter'
import { createLimiter } from '../../src/sliding-window-rate-limiter'

Feature('Test sliding-window-rate-limiter module with promises', () => {
  const TEST_REDIS_URL = process.env.TEST_REDIS_URL
  const redis = TEST_REDIS_URL ? new Redis(TEST_REDIS_URL) as ExtendedRedis : new MockRedis()

  const limiterBackendOptions: { [key: string]: SafeRedisSlidingWindowRateLimiterOptions } = {
    Memory: { interval: 1 },
    Redis: { redis, interval: 1 },
    SafeRedis: { safe: true, redis, interval: 1 }
  }

  for (const backend of Object.keys(limiterBackendOptions)) {
    Scenario(`Make one reservation - ${backend} backend`, () => {
      let key: string
      let limiter: BaseSlidingWindowRateLimiter
      let promise: Promise<number>
      const defaultLimit = 1
      const options = limiterBackendOptions[backend]

      Given('limiter object', () => {
        limiter = createLimiter(options)
      })

      And('key', () => {
        key = 'one-reservation:' + uuidv1()
      })

      When('I check usage', () => {
        promise = limiter.check(key, defaultLimit) as Promise<number>
      })

      Then('usage is zero', () => {
        return promise.should.eventually.equal(0)
      })

      When('I make one reservation', () => {
        promise = limiter.reserve(key, defaultLimit) as Promise<number>
      })

      Then('usage is above zero', () => {
        return promise.should.eventually.be.above(0)
      })

      When('I check usage', () => {
        promise = limiter.check(key, defaultLimit) as Promise<number>
      })

      Then('usage is above zero', () => {
        return promise.should.eventually.be.above(0)
      })

      After(async () => {
        await limiter.destroy()
      })
    })

    Scenario(`Make one reservation and another above limit - ${backend} backend`, () => {
      let key: string
      let limiter: BaseSlidingWindowRateLimiter
      let promise: Promise<number>
      const defaultLimit = 1
      const options = limiterBackendOptions[backend]

      Given('limiter object', () => {
        limiter = createLimiter(options)
      })

      And('key', () => {
        key = 'above-limit:' + uuidv1()
      })

      When('I check usage', () => {
        promise = limiter.check(key, defaultLimit) as Promise<number>
      })

      Then('usage is zero', () => {
        return promise.should.eventually.equal(0)
      })

      When('I make one reservation', () => {
        promise = limiter.reserve(key, defaultLimit) as Promise<number>
      })

      Then('usage is above zero', () => {
        return promise.should.eventually.be.above(0)
      })

      When('I try to make another above limit', () => {
        promise = limiter.reserve(key, defaultLimit) as Promise<number>
      })

      Then('usage is below zero', () => {
        return promise.should.eventually.be.below(0)
      })

      When('I check usage', () => {
        promise = limiter.check(key, defaultLimit) as Promise<number>
      })

      Then('usage is above zero', () => {
        return promise.should.eventually.be.above(0)
      })

      After(async () => {
        await limiter.destroy()
      })
    })

    Scenario('Make one reservation and another after interval - redis backend', () => {
      let key: string
      let limiter: BaseSlidingWindowRateLimiter
      let promise: Promise<number>
      const defaultLimit = 1
      const options = limiterBackendOptions[backend]

      And('limiter object', () => {
        limiter = createLimiter(options)
      })

      And('key', () => {
        key = 'after-interval:' + uuidv1()
      })

      When('I make one reservation', () => {
        promise = limiter.reserve(key, defaultLimit) as Promise<number>
      })

      Then('usage is above zero', () => {
        return promise.should.eventually.be.above(0)
      })

      When('I wait more than interval', () => {
        return delay(2000 /* ms */)
      })

      And('I try to make another above limit', () => {
        promise = limiter.reserve(key, defaultLimit) as Promise<number>
      })

      Then('usage is above zero', () => {
        return promise.should.eventually.be.above(0)
      })

      After(async () => {
        await limiter.destroy()
      })
    })

    Scenario(`Cancel reservation - ${backend} backend`, () => {
      let key: string
      let limiter: BaseSlidingWindowRateLimiter
      let reservationToken: number
      const defaultLimit = 1
      const options = limiterBackendOptions[backend]

      And('limiter object', () => {
        limiter = createLimiter(options)
      })

      And('key', () => {
        key = 'after-interval:' + uuidv1()
      })

      When('I make one reservation', () => {
        const reservationTokenPromise = limiter.reserve(key, defaultLimit) as Promise<number>
        reservationTokenPromise.then((resolvedReservationToken) => {
          reservationToken = resolvedReservationToken
        }).catch(() => {/**/})
        return reservationTokenPromise
      })

      Then('reservation token is correct', () => {
        reservationToken.should.be.above(0)
      })

      And('usage is above zero', () => {
        return (limiter.check(key, defaultLimit) as Promise<number>).should.eventually.be.above(0)
      })

      When('I cancel reservation', () => {
        return (limiter.cancel(key, reservationToken) as Promise<number>).should.eventually.equal(1)
      })

      Then('there should be no reservations', () => {
        return (limiter.check(key, defaultLimit) as Promise<number>).should.eventually.be.equal(0)
      })

      When('I cancel already canceled reservation', () => {
        return (limiter.cancel(key, reservationToken) as Promise<number>).should.eventually.equal(0)
      })

      Then('there should be no reservations', () => {
        return (limiter.check(key, defaultLimit) as Promise<number>).should.eventually.be.equal(0)
      })

      After(async () => {
        await limiter.destroy()
      })
    })
  }

  After(async () => {
    return redis.quit()
  })
})
