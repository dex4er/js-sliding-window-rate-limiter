'use strict'

const t = require('tap')
require('tap-given')(t)

const chai = require('chai')
chai.use(require('dirty-chai'))
chai.should()

for (const backend of ['Memory', 'Redis']) {
  Feature(`Test sliding-window-rate-limiter module constructor with ${backend} backend`, () => {
    const SlidingWindowRateLimiter = require('../lib/sliding-window-rate-limiter')

    let limiter
    let redis

    Scenario('basic usage', () => {
      if (backend === 'Redis') {
        const TEST_REDIS_URL = process.env.TEST_REDIS_URL
        const redisModule = TEST_REDIS_URL ? 'ioredis' : '../mock/mock-ioredis'
        const Redis = require(redisModule)

        Given('redis connection', () => {
          redis = new Redis(TEST_REDIS_URL)
        })
      }

      When('create simple limiter', () => {
        limiter = SlidingWindowRateLimiter.createLimiter({ redis })
      })

      Then('limiter exists', () => {
        limiter.should.have.property('reserve')
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
