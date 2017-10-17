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
    let usage1
    let usage2
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

    And('check method is called', async () => {
      usage1 = await limiter.check(key, defaultLimit)
    })

    And('one error event was fired', () => {
      errors.length.should.equals(1)
    })

    Then('check method should return default usage', () => {
      usage1.should.equals(0)
    })

    When('reserve method is called', async () => {
      ts = await limiter.reserve(key, defaultLimit)
    })

    Then('reserve method should return default timestamp', () => {
      ts.should.equals(0)
    })

    And('one error event was fired', () => {
      errors.length.should.equals(1)
    })

    When('cancel method is called', async () => {
      usage2 = await limiter.cancel(key, defaultLimit, ts)
    })

    Then('cancel method should return default usage', () => {
      usage2.should.equals(0)
    })

    And('one error event was fired', () => {
      errors.length.should.equals(1)
    })
  })

  Scenario('Operations with callbacks interface', () => {
    let redis
    let limiter
    let key
    let ts
    let failures = []
    let usage1
    let usage2
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
          usage1 = response
        }
        done()
      })
    })

    Then('check method should return default usage', () => {
      usage1.should.equals(0)
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
      limiter.cancel(key, defaultLimit, ts, (err, response) => {
        if (!err) {
          usage2 = response
        }
        done()
      })
    })

    Then('check method should return default usage', () => {
      usage2.should.equals(0)
    })

    And('one error event was fired', () => {
      failures.length.should.equals(1)
    })
  })
})
