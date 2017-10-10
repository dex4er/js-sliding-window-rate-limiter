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

  const uuidv1 = require('uuid/v1')

  const Limiter = require('../lib/sliding-window-rate-limiter')
  const SafeLimiter = require('../lib/safe-sliding-window-rate-limiter')

  Scenario('Make one reservation', () => {
    oneReservationScenario(Limiter)
  })

  Scenario('Make one reservation with safe operations adapter', () => {
    oneReservationScenario(SafeLimiter)
  })

  Scenario('Make one reservation and another above limit', () => {
    exceededLimitScenario(Limiter)
  })

  Scenario('Make one reservation and another above limit with safe operations adapter', () => {
    exceededLimitScenario(SafeLimiter)
  })

  Scenario('Make one reservation and another after interval', () => {
    reservationAfterIntervalScenario(Limiter)
  })

  Scenario('Make one reservation and another after interval with safe operations adapter', () => {
    reservationAfterIntervalScenario(SafeLimiter)
  })

  Scenario('Cancel reservation', () => {
    cancelScenario(Limiter)
  })

  Scenario('Cancel reservation with safe operations adapter', () => {
    cancelScenario(SafeLimiter)
  })

  function oneReservationScenario (Limiter) {
    let error
    let key
    let limiter
    let redis
    let usage
    const defaultLimit = 1

    Given('redis connection', () => {
      redis = new Redis(TEST_REDIS_URL)
    })

    And('limiter object', () => {
      limiter = new Limiter({
        interval: 1,
        redis: redis
      })
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

    After('disconnect Redis', () => {
      redis.disconnect()
    })
  }

  function exceededLimitScenario (Limiter) {
    let error
    let key
    let limiter
    let redis
    let usage
    const defaultLimit = 1

    Given('redis connection', () => {
      redis = new Redis(TEST_REDIS_URL)
    })

    And('limiter object', () => {
      limiter = new Limiter({
        interval: 1,
        redis: redis
      })
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

    After('disconnect Redis', () => {
      redis.disconnect()
    })
  }

  function reservationAfterIntervalScenario (Limiter) {
    let error
    let key
    let limiter
    let redis
    let usage
    const defaultLimit = 1

    Given('redis connection', () => {
      redis = new Redis(TEST_REDIS_URL)
    })

    And('limiter object', () => {
      limiter = new Limiter({
        interval: 1,
        redis: redis
      })
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
      setTimeout(done, 2000 /* ms */)
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

    After('disconnect Redis', () => {
      redis.disconnect()
    })
  }

  function cancelScenario (Limiter) {
    let key
    let limiter
    let redis
    const defaultLimit = 1
    let reservationToken
    let error

    Given('redis connection', () => {
      redis = new Redis(TEST_REDIS_URL)
    })

    And('limiter object', () => {
      limiter = new Limiter({
        interval: 5,
        redis: redis
      })
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

    After('disconnect Redis', () => {
      redis.disconnect()
    })
  }
})
