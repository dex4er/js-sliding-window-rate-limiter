'use strict'

const t = require('tap')
require('tap-given')(t)

const chai = require('chai')
chai.use(require('dirty-chai'))
chai.should()

Feature('Test sliding-window-rate-limiter module constructor', () => {
  const Limiter = require('../lib/sliding-window-rate-limiter')

  const TEST_REDIS_URL = process.env.TEST_REDIS_URL
  const redisModule = TEST_REDIS_URL ? 'ioredis' : '../mock/mock-ioredis'
  const Redis = require(redisModule)
  let redis

  Given('redis connection', () => {
    redis = new Redis(TEST_REDIS_URL)
  })

  let limiter
  Scenario('basic usage', () => {
    When('create simple limiter', () => {
      limiter = new Limiter({ redis })
    })
  })

  Then('limiter exists', () => {
    limiter.should.be.instanceOf(Limiter)
  })

  After('disconnect Redis', () => {
    redis.disconnect()
  })
})
