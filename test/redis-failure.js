'use strict'

const t = require('tap')
require('tap-given')(t)

const chai = require('chai')
chai.use(require('chai-as-promised'))
chai.use(require('dirty-chai'))
chai.should()

const SafeLimiter = require('../dist/safe-redis-sliding-window-rate-limiter')

const uuidv1 = require('uuid/v1')

Feature('Limiter safe operations extension', () => {
  const TEST_REDIS_URL = process.env.TEST_REDIS_URL
  const redisModule = TEST_REDIS_URL ? 'ioredis' : '../mock/mock-ioredis'
  const Redis = require(redisModule)

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

  Scenario('Operations with callbacks interface', () => {
    let canceled
    let redis
    let limiter
    let key
    let ts
    let failures = []
    let usage
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
        failures.push(err)
      })
    })

    When('Redis is disconnected', () => {
      return redis.disconnect()
    })

    And('check method is called', (done) => {
      limiter.check(key, defaultLimit, (err, response) => {
        if (!err) {
          usage = response
        }
        done()
      })
    })

    Then('check method should return default usage', () => {
      usage.should.equals(0)
    })

    And('one error event was fired', () => {
      failures.length.should.equals(1)
    })

    When('reserve method is called', (done) => {
      limiter.reserve(key, defaultLimit, (err, response) => {
        if (!err) {
          ts = response
        }
        done()
      })
    })

    Then('reserve method should return default timestamp', () => {
      ts.should.equals(0)
    })

    And('one error event was fired', () => {
      failures.length.should.equals(1)
    })

    When('cancel method is called', (done) => {
      limiter.cancel(key, ts, (err, response) => {
        if (!err) {
          canceled = response
        }
        done()
      })
    })

    Then('reservation was canceled', () => {
      canceled.should.equals(0)
    })

    And('one error event was fired', () => {
      failures.length.should.equals(1)
    })
  })
})
