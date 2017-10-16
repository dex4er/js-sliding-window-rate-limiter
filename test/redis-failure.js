'use strict'

const t = require('tap')
require('tap-given')(t)

const chai = require('chai')
chai.use(require('chai-as-promised'))
chai.use(require('dirty-chai'))
chai.should()

const SafeLimiter = require('../lib/safe-redis-sliding-window-rate-limiter')

Feature('Limiter safe operations extension', () => {
  const TEST_REDIS_URL = process.env.TEST_REDIS_URL
  const redisModule = TEST_REDIS_URL ? 'ioredis' : '../mock/mock-ioredis'
  const Redis = require(redisModule)

  const uuidv1 = require('uuid/v1')

  Scenario('Operations with promises interface', () => {
    let redis
    let limiter
    let key
    let ts
    let errors = []
    const defaultLimit = 1

    Given('redis connection', () => {
      redis = new Redis(TEST_REDIS_URL)
    })

    And('limiter object', () => {
      limiter = new SafeLimiter({
        interval: 1,
        redis: redis
      })
    })

    And('key', () => {
      key = 'redis-failure:' + uuidv1()
    })

    And('failure listener', () => {
      limiter.on('error', (err) => {
        errors.push(err)
      })
    })

    When('disconnect redis', () => {
      return redis.disconnect()
    })

    Then('check method should not throw any errors', () => {
      return limiter.check(key, defaultLimit).should.eventually.be.equal(0)
    })

    And('reserve method should not throw any errors', () => {
      const promise = limiter.reserve(key, defaultLimit)

      promise.then((result) => {
        ts = result
      })

      return promise.should.eventually.be.equal(SafeLimiter.SafeRedisSlidingWindowRateLimiter.SUCCESS_RESERVATION_TOKEN)
    })

    And('cancel method should not throw any errors', () => {
      return limiter.cancel(key, defaultLimit, ts).should.eventually.be.equal(0)
    })

    And('one error event fired', () => {
      errors.length.should.equals(1)
    })
  })

  Scenario('Operations with callbacks interface', () => {
    let redis
    let limiter
    let key
    let ts
    let failures = []
    let error
    const defaultLimit = 1

    Given('redis connection', () => {
      redis = new Redis(TEST_REDIS_URL)
    })

    And('limiter object', () => {
      limiter = new SafeLimiter({
        interval: 1,
        redis: redis
      })
    })

    And('key', () => {
      key = 'redis-failure:' + uuidv1()
    })

    And('failure listener', () => {
      limiter.on('error', (err) => {
        failures.push(err)
      })
    })

    When('disconnect redis', () => {
      return redis.disconnect()
    })

    Then('check method should not throw any errors', (done) => {
      limiter.check(key, defaultLimit, (err, successResponse) => {
        error = err;
        (error === null).should.be.true()
        successResponse.should.be.equal(0)
        done()
      })
    })

    And('reserve method should not throw any errors', (done) => {
      limiter.reserve(key, defaultLimit, (err, successResponse) => {
        error = err;
        (error === null).should.be.true()
        ts = successResponse
        successResponse.should.be.equal(SafeLimiter.SafeRedisSlidingWindowRateLimiter.SUCCESS_RESERVATION_TOKEN)
        done()
      })
    })

    And('cancel method should not throw any errors', (done) => {
      limiter.cancel(key, defaultLimit, ts, (err, successResponse) => {
        error = err;
        (error === null).should.be.true()
        successResponse.should.be.equal(0)
        done()
      })
    })

    And('one connection_fail event fired', () => {
      failures.length.should.equals(1)
    })
  })
})
