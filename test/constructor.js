'use strict'

const t = require('tap')
require('tap-given')(t)

const chai = require('chai')
chai.use(require('dirty-chai'))
chai.should()

const backendClasses = {
  Memory: require('../lib/memory-sliding-window-rate-limiter').MemorySlidingWindowRateLimiter,
  Redis: require('../lib/redis-sliding-window-rate-limiter').RedisSlidingWindowRateLimiter,
  SafeRedis: require('../lib/safe-redis-sliding-window-rate-limiter').SafeRedisSlidingWindowRateLimiter
}

const SlidingWindowRateLimiter = require('../lib/sliding-window-rate-limiter')

for (const backend of ['Memory', 'Redis', 'SafeRedis']) {
  Feature(`Test sliding-window-rate-limiter module constructor with ${backend} backend`, () => {
    let limiter
    let redis
    let safe = false

    Scenario('basic usage', () => {
      if (backend === 'Redis' || backend === 'SafeRedis') {
        const TEST_REDIS_URL = process.env.TEST_REDIS_URL
        const redisModule = TEST_REDIS_URL ? 'ioredis' : '../mock/mock-ioredis'
        const Redis = require(redisModule)

        Given('redis connection', () => {
          redis = new Redis(TEST_REDIS_URL)
        })
      }

      if (backend === 'SafeRedis') {
        And('safe flag', () => {
          safe = true
        })
      }

      When('create simple limiter', () => {
        limiter = SlidingWindowRateLimiter.createLimiter({ safe, redis })
      })

      Then('limiter exists', () => {
        limiter.should.have.property('reserve')
      })

      And('limiter has correct class', () => {
        limiter.should.be.instanceOf(backendClasses[backend])
      })

      After('destroy limiter', () => {
        limiter.destroy()
      })

      if (backend === 'Redis' || backend === 'SafeRedis') {
        After('disconnect Redis', () => {
          redis.disconnect()
        })
      }
    })
  })
}
