'use strict'

const t = require('tap')
require('tap-given')(t)

const chai = require('chai')
chai.use(require('chai-as-promised'))
chai.should()

Feature('Test sliding-window-rate-limiter module with promises', () => {
  const TEST_REDIS_URL = process.env.TEST_REDIS_URL
  const redisModule = TEST_REDIS_URL ? 'ioredis' : '../mock/mock-ioredis'
  const Redis = require(redisModule)

  const delay = require('delay')
  const uuidv1 = require('uuid/v1')

  const Limiter = require('../lib/sliding-window-rate-limiter')

  Scenario('Make one reservation', () => {
    let key
    let limiter
    let promise
    let redis
    const defaultLimit = 1

    Given('redis connection', () => {
      redis = new Redis(TEST_REDIS_URL)
    })

    And('limiter object', () => {
      limiter = new Limiter({
        interval: 1,
        redis: redis
      })
    })

    And('key', () => {
      key = 'one-reservation:' + uuidv1()
    })

    When('I check usage', () => {
      promise = limiter.check(key, defaultLimit)
    })

    Then('usage is zero', () => {
      return promise.should.eventually.equal(0)
    })

    When('I make one reservation', () => {
      promise = limiter.reserve(key, defaultLimit)
    })

    Then('usage is above zero', () => {
      return promise.should.eventually.be.above(0)
    })

    When('I check usage', () => {
      promise = limiter.check(key, defaultLimit)
    })

    Then('usage is above zero', () => {
      return promise.should.eventually.be.above(0)
    })

    After('disconnect Redis', () => {
      redis.disconnect()
    })
  })

  Scenario('Make one reservation and another above limit', () => {
    let key
    let limiter
    let promise
    let redis
    const defaultLimit = 1

    Given('redis connection', () => {
      redis = new Redis(TEST_REDIS_URL)
    })

    And('limiter object', () => {
      limiter = new Limiter({
        interval: 1,
        redis: redis
      })
    })

    And('key', () => {
      key = 'above-limit:' + uuidv1()
    })

    When('I check usage', () => {
      promise = limiter.check(key, defaultLimit)
    })

    Then('usage is zero', () => {
      return promise.should.eventually.equal(0)
    })

    When('I make one reservation', () => {
      promise = limiter.reserve(key, defaultLimit)
    })

    Then('usage is above zero', () => {
      return promise.should.eventually.be.above(0)
    })

    When('I try to make another above limit', () => {
      promise = limiter.reserve(key, defaultLimit)
    })

    Then('usage is below zero', () => {
      return promise.should.eventually.be.below(0)
    })

    When('I check usage', () => {
      promise = limiter.check(key, defaultLimit)
    })

    Then('usage is above zero', () => {
      return promise.should.eventually.be.above(0)
    })

    After('disconnect Redis', () => {
      redis.disconnect()
    })
  })

  Scenario('Make one reservation and another after interval', () => {
    let key
    let limiter
    let promise
    let redis
    const defaultLimit = 1

    Given('redis connection', () => {
      redis = new Redis(TEST_REDIS_URL)
    })

    And('limiter object', () => {
      limiter = new Limiter({
        interval: 1,
        redis: redis
      })
    })

    And('key', () => {
      key = 'after-interval:' + uuidv1()
    })

    When('I make one reservation', () => {
      promise = limiter.reserve(key, defaultLimit)
    })

    Then('usage is above zero', () => {
      return promise.should.eventually.be.above(0)
    })

    When('I wait more than interval', () => {
      return delay(2000 /* ms */)
    })

    And('I try to make another above limit', () => {
      promise = limiter.reserve(key, defaultLimit)
    })

    Then('usage is above zero', () => {
      return promise.should.eventually.be.above(0)
    })

    After('disconnect Redis', () => {
      redis.disconnect()
    })
  })
})
