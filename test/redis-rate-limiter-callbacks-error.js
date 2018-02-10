'use strict'

const t = require('tap')
require('tap-given')(t)

const chai = require('chai')
chai.should()

const MockRedis = require('../mock/mock-ioredis')

const SlidingWindowRateLimiter = require('../lib/sliding-window-rate-limiter')

Feature('Test sliding-window-rate-limiter module error with callbacks with Redis backend', () => {
  Scenario('Make one reservation', () => {
    let error
    let key
    let limiter
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

    When('I try to make one reservation', done => {
      limiter.reserve(key, defaultLimit, (err, value) => {
        error = err
        done()
      })
    })

    Then('reply error occured', () => {
      error.should.be.an('error').with.property('name', 'ReplyError')
    })

    After('destroy limiter', () => {
      limiter.destroy()
    })
  })
})
