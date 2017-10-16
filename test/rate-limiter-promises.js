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

  const memoryBackendOptions = {interval: 1}
  const redisBackendOptions = {redis, interval: 1}
  const safeRedisBackendOptions = {safe: true, redis, interval: 1}
  const limiterFactory = require('./../lib/sliding-window-rate-limiter')

  Scenario('Make one reservation - redis backend', () => {
    oneReservationScenario(redisBackendOptions)
  })

  Scenario('Make one reservation and another above limit - redis backend', () => {
    exceededLimitScenario(redisBackendOptions)
  })

  Scenario('Make one reservation and another after interval - redis backend', () => {
    reservationAfterIntervalScenario(redisBackendOptions)
  })

  Scenario('Cancel reservation - redis backend', () => {
    cancelScenario(redisBackendOptions)
  })

  Scenario('Make one reservation - safe redis backend', () => {
    oneReservationScenario(safeRedisBackendOptions)
  })

  Scenario('Make one reservation and another above limit - safe redis backend', () => {
    exceededLimitScenario(safeRedisBackendOptions)
  })

  Scenario('Make one reservation and another after interval - safe redis backend', () => {
    reservationAfterIntervalScenario(safeRedisBackendOptions)
  })

  Scenario('Cancel reservation - safe redis backend', () => {
    cancelScenario(safeRedisBackendOptions)
  })

  Scenario('Make one reservation - memory backend', () => {
    oneReservationScenario(memoryBackendOptions)
  })

  Scenario('Make one reservation and another above limit - memory backend', () => {
    exceededLimitScenario(memoryBackendOptions)
  })

  Scenario('Make one reservation and another after interval - memory backend', () => {
    reservationAfterIntervalScenario(memoryBackendOptions)
  })

  Scenario('Cancel reservation - memory backend', () => {
    cancelScenario(memoryBackendOptions)
  })

  function oneReservationScenario (options) {
    let key
    let limiter
    let promise
    const defaultLimit = 1

    And('limiter object', () => {
      limiter = limiterFactory.createLimiter(options)
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

    After('disconnect Redis', () => {
      limiter.destroy()
    })
  }

  function exceededLimitScenario (options) {
    let key
    let limiter
    let promise
    const defaultLimit = 1

    And('limiter object', () => {
      limiter = limiterFactory.createLimiter(options)
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

    After('disconnect Redis', () => {
      limiter.destroy()
    })
  }

  function reservationAfterIntervalScenario (options) {
    let key
    let limiter
    let promise
    const defaultLimit = 1

    And('limiter object', () => {
      limiter = limiterFactory.createLimiter(options)
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

    After('disconnect Redis', () => {
      limiter.destroy()
    })
  }

  function cancelScenario (options) {
    let key
    let limiter
    const defaultLimit = 1
    let reservationToken

    And('limiter object', () => {
      limiter = limiterFactory.createLimiter(options)
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

    After('disconnect Redis', () => {
      limiter.destroy()
    })
  }

  After('disconnect redis', () => {
    redis.quit()
  })
})
