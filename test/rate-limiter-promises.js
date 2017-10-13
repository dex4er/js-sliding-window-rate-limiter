'use strict'

const t = require('tap')
require('tap-given')(t)

const chai = require('chai')
chai.use(require('chai-as-promised'))
chai.should()

for (const backend of ['Memory', 'Redis']) {
  Feature(`Test sliding-window-rate-limiter module with promises with ${backend} backend`, () => {
    const TEST_REDIS_URL = process.env.TEST_REDIS_URL
    const redisModule = TEST_REDIS_URL ? 'ioredis' : '../mock/mock-ioredis'
    const Redis = require(redisModule)

    const delay = require('delay')
    const uuidv1 = require('uuid/v1')

    const SlidingWindowRateLimiter = require('../lib/sliding-window-rate-limiter')

    Scenario('Make one reservation', () => {
      let key
      let limiter
      let promise
      let redis
      const defaultLimit = 1

      if (backend === 'Redis') {
        Given('redis connection', () => {
          redis = new Redis(TEST_REDIS_URL)
        })
      } else {
        Given('undefined redis option', () => {
          redis = undefined
        })
      }

      And('limiter object', () => {
        limiter = SlidingWindowRateLimiter.createLimiter({
          interval: 1,
          redis: redis
        })
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

      After('destroy limiter', () => {
        limiter.destroy()
      })

      if (backend === 'Redis') {
        After('disconnect Redis', () => {
          redis.disconnect()
        })
      }
    })

    Scenario('Make one reservation and another above limit', () => {
      let key
      let limiter
      let promise
      let redis
      const defaultLimit = 1

      if (backend === 'Redis') {
        Given('redis connection', () => {
          redis = new Redis(TEST_REDIS_URL)
        })
      } else {
        Given('undefined redis option', () => {
          redis = undefined
        })
      }

      And('limiter object', () => {
        limiter = SlidingWindowRateLimiter.createLimiter({
          interval: 1,
          redis: redis
        })
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

      After('destroy limiter', () => {
        limiter.destroy()
      })

      if (backend === 'Redis') {
        After('disconnect Redis', () => {
          redis.disconnect()
        })
      }
    })

    Scenario('Make one reservation and another after interval', () => {
      let key
      let limiter
      let promise
      let redis
      const defaultLimit = 1

      if (backend === 'Redis') {
        Given('redis connection', () => {
          redis = new Redis(TEST_REDIS_URL)
        })
      } else {
        Given('undefined redis option', () => {
          redis = undefined
        })
      }

      And('limiter object', () => {
        limiter = SlidingWindowRateLimiter.createLimiter({
          interval: 1,
          redis: redis
        })
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

      After('destroy limiter', () => {
        limiter.destroy()
      })

      if (backend === 'Redis') {
        After('disconnect Redis', () => {
          redis.disconnect()
        })
      }
    })

    Scenario('Cancel reservation', () => {
      let key
      let limiter
      let redis
      const defaultLimit = 1
      let reservationToken

      if (backend === 'Redis') {
        Given('redis connection', () => {
          redis = new Redis(TEST_REDIS_URL)
        })
      } else {
        Given('undefined redis option', () => {
          redis = undefined
        })
      }

      And('limiter object', () => {
        limiter = SlidingWindowRateLimiter.createLimiter({
          interval: 5,
          redis: redis
        })
      })

      And('key', () => {
        key = 'after-interval:' + uuidv1()
      })

      When('I make one reservation', () => {
        const reservationTokenPromise = limiter.reserve(key, defaultLimit)
        reservationTokenPromise.then((resolvedReservationToken) => {
          reservationToken = resolvedReservationToken
        })
        return reservationTokenPromise
      })

      Then('usage is above zero', () => {
        return limiter.check(key, defaultLimit).should.eventually.be.above(0)
      })

      When('canceling reservation', () => {
        return limiter.cancel(key, defaultLimit, reservationToken)
      })

      Then('there should be no reservations', () => {
        return limiter.check(key, defaultLimit).should.eventually.be.equal(0)
      })

      After('destroy limiter', () => {
        limiter.destroy()
      })

      if (backend === 'Redis') {
        After('disconnect Redis', () => {
          redis.disconnect()
        })
      }
    })
  })
}
