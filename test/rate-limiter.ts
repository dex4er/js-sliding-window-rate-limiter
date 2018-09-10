import { After, And, Feature, Given, Scenario, Then, When } from './lib/steps'

import IORedis from 'ioredis'
import uuidv1 from 'uuid/v1'

import { SlidingWindowRateLimiter } from '../src/sliding-window-rate-limiter'
import { SlidingWindowRateLimiterBackend } from '../src/sliding-window-rate-limiter-backend'

import { delay } from './lib/delay'
import { MockIORedis } from './lib/mock-ioredis'

const TEST_REDIS_URL = process.env.TEST_REDIS_URL
const redis = TEST_REDIS_URL ? new IORedis(TEST_REDIS_URL) : new MockIORedis(TEST_REDIS_URL)

const limiterBackendOptions: {[backend: string]: any} = {
  Memory: { interval: 1 },
  Redis: { redis, interval: 1 },
  SafeRedis: { safe: true, redis, interval: 1 }
}

Feature('Test sliding-window-rate-limiter module with promises', () => {
  for (const backend of Object.keys(limiterBackendOptions)) {
    Scenario(`Make one reservation - ${backend} backend`, () => {
      const defaultLimit = 1
      const options = limiterBackendOptions[backend]

      let key: string
      let limiter: SlidingWindowRateLimiterBackend
      let promise: Promise<number>

      Given('limiter object', () => {
        limiter = SlidingWindowRateLimiter.createLimiter(options)
      })

      And('key', () => {
        key = 'one-reservation:' + uuidv1()
      })

      When('I check usage', () => {
        promise = limiter.check(key, defaultLimit)
      })

      Then('usage is zero', () => {
        return promise.should.eventually.equal(0)
      })

      When('I make one reservation', () => {
        promise = limiter.reserve(key, defaultLimit)
      })

      Then('usage is above zero', () => {
        return promise.should.eventually.be.above(0)
      })

      When('I check usage', () => {
        promise = limiter.check(key, defaultLimit)
      })

      Then('usage is above zero', () => {
        return promise.should.eventually.be.above(0)
      })

      After(() => {
        limiter.destroy()
      })
    })

    Scenario(`Make one reservation and another above limit - ${backend} backend`, () => {
      const defaultLimit = 1
      const options = limiterBackendOptions[backend]

      let key: string
      let limiter: SlidingWindowRateLimiterBackend
      let promise: Promise<number>

      Given('limiter object', () => {
        limiter = SlidingWindowRateLimiter.createLimiter(options)
      })

      And('key', () => {
        key = 'above-limit:' + uuidv1()
      })

      When('I check usage', () => {
        promise = limiter.check(key, defaultLimit)
      })

      Then('usage is zero', () => {
        return promise.should.eventually.equal(0)
      })

      When('I make one reservation', () => {
        promise = limiter.reserve(key, defaultLimit)
      })

      Then('usage is above zero', () => {
        return promise.should.eventually.be.above(0)
      })

      When('I try to make another above limit', () => {
        promise = limiter.reserve(key, defaultLimit)
      })

      Then('usage is below zero', () => {
        return promise.should.eventually.be.below(0)
      })

      When('I check usage', () => {
        promise = limiter.check(key, defaultLimit)
      })

      Then('usage is above zero', () => {
        return promise.should.eventually.be.above(0)
      })

      After(() => {
        limiter.destroy()
      })
    })

    Scenario('Make one reservation and another after interval - redis backend', () => {
      const defaultLimit = 1
      const options = limiterBackendOptions[backend]

      let key: string
      let limiter: SlidingWindowRateLimiterBackend
      let promise: Promise<number>

      And('limiter object', () => {
        limiter = SlidingWindowRateLimiter.createLimiter(options)
      })

      And('key', () => {
        key = 'after-interval:' + uuidv1()
      })

      When('I make one reservation', () => {
        promise = limiter.reserve(key, defaultLimit)
      })

      Then('usage is above zero', () => {
        return promise.should.eventually.be.above(0)
      })

      When('I wait more than interval', () => {
        return delay(2000 /* ms */)
      })

      And('I try to make another above limit', () => {
        promise = limiter.reserve(key, defaultLimit)
      })

      Then('usage is above zero', () => {
        return promise.should.eventually.be.above(0)
      })

      After(() => {
        limiter.destroy()
      })
    })

    Scenario(`Cancel reservation - ${backend} backend`, () => {
      const defaultLimit = 1
      const options = limiterBackendOptions[backend]

      let key: string
      let limiter: SlidingWindowRateLimiterBackend
      let reservationToken: number

      And('limiter object', () => {
        limiter = SlidingWindowRateLimiter.createLimiter(options)
      })

      And('key', () => {
        key = 'after-interval:' + uuidv1()
      })

      When('I make one reservation', () => {
        const reservationTokenPromise = limiter.reserve(key, defaultLimit)
        return reservationTokenPromise.then((resolvedReservationToken) => {
          reservationToken = resolvedReservationToken
        })
      })

      Then('reservation token is correct', () => {
        reservationToken.should.be.above(0)
      })

      And('usage is above zero', () => {
        return limiter.check(key, defaultLimit).should.eventually.be.above(0)
      })

      When('I cancel reservation', () => {
        return limiter.cancel(key, reservationToken).should.eventually.equal(1)
      })

      Then('there should be no reservations', () => {
        return limiter.check(key, defaultLimit).should.eventually.be.equal(0)
      })

      When('I cancel already canceled reservation', () => {
        return limiter.cancel(key, reservationToken).should.eventually.equal(0)
      })

      Then('there should be no reservations', () => {
        return limiter.check(key, defaultLimit).should.eventually.be.equal(0)
      })

      After(() => {
        limiter.destroy()
      })
    })
  }

  After(async () => {
    await redis.quit()
  })
})
