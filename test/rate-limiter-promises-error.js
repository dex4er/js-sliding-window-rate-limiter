'use strict'

const t = require('tap')
require('tap-given')(t)

const chai = require('chai')
chai.use(require('chai-as-promised'))
chai.should()

Feature('Test sliding-window-rate-limiter module error with promises', () => {
  const MockRedis = require('../mock/mock-ioredis')

  const Limiter = require('../lib/sliding-window-rate-limiter')

  Scenario('Make one reservation', () => {
    let key
    let limiter
    let promise
    let redis

    Given('mock redis connection', () => {
      redis = new MockRedis()
    })

    And('limiter object', () => {
      limiter = new Limiter({
        limit: 1,
        interval: 1,
        redis: redis
      })
    })

    And('key', () => {
      key = 'error'
    })

    When('I try to make one reservation', () => {
      promise = limiter.reserve(key)
    })

    Then('reservation is rejected', () => {
      return promise.should.rejectedWith(Error, /ERR Error running script/)
    })
  })
})
