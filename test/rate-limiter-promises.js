'use strict'

const t = require('tap')
require('tap-given')(t)

const chai = require('chai')
const chaiAsPromised = require('chai-as-promised')
chai.use(chaiAsPromised)
chai.should()

Feature('Test sliding-window-rate-limiter module with promises', () => {
  const TEST_REDIS_URL = process.env.TEST_REDIS_URL
  const redisModule = TEST_REDIS_URL ? 'ioredis' : '../mock/mock-ioredis'
  const Redis = require(redisModule)

  const uuidv1 = require('uuid/v1')

  const Limiter = require('../lib/sliding-window-rate-limiter')

  Scenario('Make one reservation', () => {
    let key
    let limiter
    let promise
    let redis

    Given('redis connection', () => {
      redis = new Redis(TEST_REDIS_URL)
    })

    Given('limiter object', () => {
      limiter = new Limiter({
        limit: 1,
        interval: 1,
        redis: redis
      })
    })

    And('key', () => {
      key = 'one-reservation:' + uuidv1()
    })

    When('I make one reservation', () => {
      promise = limiter.reserve(key)
    })

    Then('usage is above zero', () => {
      return promise.should.eventually.be.above(0)
    })

    After('disconnect Redis', () => {
      limiter.redis.disconnect()
    })
  })
})
