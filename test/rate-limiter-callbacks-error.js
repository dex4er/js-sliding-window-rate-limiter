'use strict'

const t = require('tap')
require('tap-given')(t)

const chai = require('chai')
chai.should()

Feature('Test sliding-window-rate-limiter module error with callbacks', () => {
  const MockRedis = require('../mock/mock-ioredis')

  const Limiter = require('../lib/sliding-window-rate-limiter')

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
      limiter = new Limiter({
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
  })
})
