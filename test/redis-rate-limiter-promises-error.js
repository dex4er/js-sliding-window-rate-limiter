'use strict'

const t = require('tap')
require('tap-given')(t)

const chai = require('chai')
chai.use(require('chai-as-promised'))
chai.should()

Feature('Test sliding-window-rate-limiter module error with promises with Redis backend', () => {
  const MockRedis = require('../mock/mock-ioredis')

  const SlidingWindowRateLimiter = require('../lib/sliding-window-rate-limiter')

  Scenario('Make one reservation', () => {
    let key
    let limiter
    let promise
    let redis
    const defaultLimit = 1

    Given('mock redis connection', () => {
      redis = new MockRedis()
    })

    And('limiter object', () => {
      limiter = SlidingWindowRateLimiter.createLimiter({
        interval: 1,
        redis: redis
      })
    })

    And('key', () => {
      key = 'error'
    })

    When('I try to make one reservation', () => {
      promise = limiter.reserve(key, defaultLimit)
    })

    Then('reservation is rejected', () => {
      return promise.should.rejectedWith(Error, /ERR Error running script/)
    })

    After('destroy limiter', () => {
      limiter.destroy()
    })
  })
})
