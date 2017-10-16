'use strict'

const t = require('tap')
require('tap-given')(t)

const chai = require('chai')
chai.use(require('dirty-chai'))
chai.should()

Feature('Test sliding-window-rate-limiter module with callbacks', () => {
  const TEST_REDIS_URL = process.env.TEST_REDIS_URL
  const redisModule = TEST_REDIS_URL ? 'ioredis' : '../mock/mock-ioredis'
  const Redis = require(redisModule)
  const redis = new Redis(TEST_REDIS_URL)

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
    let error
    let key
    let limiter
    let usage
    const defaultLimit = 1

    And('limiter object', () => {
      limiter = limiterFactory.createLimiter(options)
    })

    And('key', () => {
      key = 'one-reservation:' + uuidv1()
    })

    When('I check usage', done => {
      limiter.check(key, defaultLimit, (err, value) => {
        error = err
        usage = value
        done()
      })
    })

    Then('there was no error', () => {
      (error === null).should.be.true()
    })

    And('usage is zero', () => {
      return usage.should.equal(0)
    })

    When('I make one reservation', done => {
      limiter.reserve(key, defaultLimit, (err, value) => {
        error = err
        usage = value
        done()
      })
    })

    Then('there was no error', () => {
      (error === null).should.be.true()
    })

    And('usage is above zero', () => {
      return usage.should.be.above(0)
    })

    When('I check usage', done => {
      limiter.check(key, defaultLimit, (err, value) => {
        error = err
        usage = value
        done()
      })
    })

    Then('there was no error', () => {
      (error === null).should.be.true()
    })

    And('usage is above zero', () => {
      return usage.should.be.above(0)
    })

    After('destroy limiter', () => {
      limiter.destroy()
    })
  }

  function exceededLimitScenario (options) {
    let error
    let key
    let limiter
    let usage
    const defaultLimit = 1

    And('limiter object', () => {
      limiter = limiterFactory.createLimiter(options)
    })

    And('key', () => {
      key = 'above-limit:' + uuidv1()
    })

    When('I check usage', done => {
      limiter.check(key, defaultLimit, (err, value) => {
        error = err
        usage = value
        done()
      })
    })

    Then('there was no error', () => {
      (error === null).should.be.true()
    })

    And('usage is zero', () => {
      return usage.should.equal(0)
    })

    When('I make one reservation', done => {
      limiter.reserve(key, defaultLimit, (err, value) => {
        error = err
        usage = value
        done()
      })
    })

    Then('there was no error', () => {
      (error === null).should.be.true()
    })

    And('usage is above zero', () => {
      return usage.should.be.above(0)
    })

    When('I try to make another above limit', done => {
      limiter.reserve(key, defaultLimit, (err, value) => {
        error = err
        usage = value
        done()
      })
    })

    Then('there was no error', () => {
      (error === null).should.be.true()
    })

    And('usage is below zero', () => {
      return usage.should.be.below(0)
    })

    When('I check usage', done => {
      limiter.check(key, defaultLimit, (err, value) => {
        error = err
        usage = value
        done()
      })
    })

    Then('there was no error', () => {
      (error === null).should.be.true()
    })

    And('usage is above zero', () => {
      return usage.should.be.above(0)
    })

    After('destroy limiter', () => {
      limiter.destroy()
    })
  }

  function reservationAfterIntervalScenario (options) {
    let error
    let key
    let limiter
    let usage
    const defaultLimit = 1

    And('limiter object', () => {
      limiter = limiterFactory.createLimiter(options)
    })

    And('key', () => {
      key = 'after-interval:' + uuidv1()
    })

    When('I check usage', done => {
      limiter.check(key, defaultLimit, (err, value) => {
        error = err
        usage = value
        done()
      })
    })

    Then('there was no error', () => {
      (error === null).should.be.true()
    })

    And('usage is zero', () => {
      return usage.should.equal(0)
    })

    When('I make one reservation', done => {
      limiter.reserve(key, defaultLimit, (err, value) => {
        error = err
        usage = value
        done()
      })
    })

    Then('there was no error', () => {
      (error === null).should.be.true()
    })

    And('usage is above zero', () => {
      return usage.should.be.above(0)
    })

    When('I wait more than interval', done => {
      setTimeout(done, 2000)
    })

    And('I try to make another above limit', done => {
      limiter.reserve(key, defaultLimit, (err, value) => {
        error = err
        usage = value
        done()
      })
    })

    Then('usage is above zero', () => {
      return usage.should.be.above(0)
    })

    After('destroy limiter', () => {
      limiter.destroy()
    })
  }

  function cancelScenario (options) {
    let key
    let limiter
    const defaultLimit = 1
    let reservationToken
    let error

    And('limiter object', () => {
      limiter = limiterFactory.createLimiter(options)
    })

    And('key', () => {
      key = 'after-interval:' + uuidv1()
    })

    When('I make one reservation', (done) => {
      limiter.reserve(key, defaultLimit, (err, resolvedReservationToken) => {
        error = err;
        (error === null).should.be.true()
        reservationToken = resolvedReservationToken
        done()
      })
    })

    Then('usage is above zero', (done) => {
      limiter.check(key, defaultLimit, (err, checkedValue) => {
        error = err;
        (error === null).should.be.true()
        checkedValue.should.be.above(0)
        done()
      })
    })

    When('canceling reservation', (done) => {
      limiter.cancel(key, defaultLimit, reservationToken, (err, result) => {
        error = err;
        (error === null).should.be.true()
        result.should.be.at.least(0)
        done()
      })
    })

    Then('there should be no reservations', (done) => {
      limiter.check(key, defaultLimit, (err, checkedUsage) => {
        error = err;
        (error === null).should.be.true()
        checkedUsage.should.be.equal(0)
        done()
      })
    })

    After('destroy limiter', () => {
      limiter.destroy()
    })
  }

  After('quit redis', () => {
    redis.quit()
  })
})
