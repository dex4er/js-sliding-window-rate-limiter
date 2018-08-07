'use strict'

const t = require('tap')
require('tap-given')(t)

const chai = require('chai')
chai.use(require('chai-as-promised'))
chai.use(require('dirty-chai'))
chai.should()

const SafeLimiter = require('../lib/safe-redis-sliding-window-rate-limiter').SafeRedisSlidingWindowRateLimiter

const uuidv1 = require('uuid/v1')

Feature('Test sliding-window-rate-limiter with redis failure', () => {
  const TEST_REDIS_URL = process.env.TEST_REDIS_URL
  const redisModule = TEST_REDIS_URL ? 'ioredis' : '../mock/mock-ioredis'
  const Redis = require(redisModule)

  Scenario('Redis failure', () => {
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

    And('error listener', () => {
      limiter.on('error', (err) => {
        errors.push(err)
      })
    })

    When('Redis is disconnected', () => {
      return redis.disconnect()
    })

    And('check method is called', () => {
      return limiter.check(key, defaultLimit).should.eventually.equal(0)
    })

    Then('one error event was fired', () => {
      errors.length.should.equals(1)
    })

    When('reserve method is called', () => {
      return limiter.reserve(key, defaultLimit).should.eventually.equal(0)
    })

    Then('one error event was fired', () => {
      errors.length.should.equals(1)
    })

    When('cancel method is called', () => {
      return limiter.cancel(key, ts).should.eventually.equal(0)
    })

    Then('one error event was fired', () => {
      errors.length.should.equals(1)
    })
  })
})
