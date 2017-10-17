'use strict'

const t = require('tap')
require('tap-given')(t)

const chai = require('chai')
chai.use(require('chai-as-promised'))
chai.should()

Feature('Test sliding-window-rate-limiter module with promises', () => {
  const TEST_REDIS_URL = process.env.TEST_REDIS_URL
  const redisModule = TEST_REDIS_URL ? 'ioredis' : '../mock/mock-ioredis'
  const Redis = require(redisModule)
  const redis = new Redis(TEST_REDIS_URL)

  const delay = require('delay')
  const uuidv1 = require('uuid/v1')

  const limiterBackendOptions = {
    'Memory': { interval: 1 },
    'Redis': { redis, interval: 1 },
    'SafeRedis': { safe: true, redis, interval: 1 }
  }

  const limiterFactoryClass = require('./../lib/sliding-window-rate-limiter')

  for (const backend of Object.keys(limiterBackendOptions)) {
    Scenario(`Make one reservation - ${backend} backend`, () => {
      let key
      let limiter
      let promise
      const defaultLimit = 1
      const options = limiterBackendOptions[backend]

      Given('limiter object', () => {
        limiter = limiterFactoryClass.createLimiter(options)
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
    })

    Scenario(`Make one reservation and another above limit - ${backend} backend`, () => {
      let key
      let limiter
      let promise
      const defaultLimit = 1
      const options = limiterBackendOptions[backend]

      Given('limiter object', () => {
        limiter = limiterFactoryClass.createLimiter(options)
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
    })

    Scenario('Make one reservation and another after interval - redis backend', () => {
      let key
      let limiter
      let promise
      const defaultLimit = 1
      const options = limiterBackendOptions[backend]

      And('limiter object', () => {
        limiter = limiterFactoryClass.createLimiter(options)
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
    })

    Scenario(`Cancel reservation - ${backend} backend`, () => {
      let key
      let limiter
      let reservationToken
      const defaultLimit = 1
      const options = limiterBackendOptions[backend]

      And('limiter object', () => {
        limiter = limiterFactoryClass.createLimiter(options)
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

      After('destroy limiter', () => {
        limiter.destroy()
      })
    })
  }

  After('disconnect Redis', () => {
    redis.quit()
  })
})
