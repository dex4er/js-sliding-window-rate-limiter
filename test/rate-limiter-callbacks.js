'use strict'

const t = require('tap')
require('tap-given')(t)

const chai = require('chai')
chai.use(require('dirty-chai'))
chai.should()

for (const backend of ['Memory', 'Redis']) {
  Feature(`Test sliding-window-rate-limiter module with callbacks with ${backend} backend`, () => {
    const TEST_REDIS_URL = process.env.TEST_REDIS_URL
    const redisModule = TEST_REDIS_URL ? 'ioredis' : '../mock/mock-ioredis'
    const Redis = require(redisModule)

    const uuidv1 = require('uuid/v1')

    const SlidingWindowRateLimiter = require('../lib/sliding-window-rate-limiter')

    Scenario('Make one reservation', () => {
      let error
      let key
      let limiter
      let redis
      let usage
      const defaultLimit = 1

      if (backend === 'Redis') {
        Given('redis connection', () => {
          redis = new Redis(TEST_REDIS_URL)
        })
      } else {
        Given('undefined redis option', () => {
          redis = undefined
        })
      }

      And('limiter object', () => {
        limiter = SlidingWindowRateLimiter.createLimiter({
          interval: 1,
          redis: redis
        })
      })

      And('key', () => {
        key = 'one-reservation:' + uuidv1()
      })

      When('I check usage', done => {
        limiter.check(key, defaultLimit, (err, value) => {
          error = err
          usage = value
          done()
        })
      })

      Then('there was no error', () => {
        (error === null).should.be.true()
      })

      And('usage is zero', () => {
        return usage.should.equal(0)
      })

      When('I make one reservation', done => {
        limiter.reserve(key, defaultLimit, (err, value) => {
          error = err
          usage = value
          done()
        })
      })

      Then('there was no error', () => {
        (error === null).should.be.true()
      })

      And('usage is above zero', () => {
        return usage.should.be.above(0)
      })

      When('I check usage', done => {
        limiter.check(key, defaultLimit, (err, value) => {
          error = err
          usage = value
          done()
        })
      })

      Then('there was no error', () => {
        (error === null).should.be.true()
      })

      And('usage is above zero', () => {
        return usage.should.be.above(0)
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

    Scenario('Make one reservation and another above limit', () => {
      let error
      let key
      let limiter
      let redis
      let usage
      const defaultLimit = 1

      if (backend === 'Redis') {
        Given('redis connection', () => {
          redis = new Redis(TEST_REDIS_URL)
        })
      } else {
        Given('undefined redis option', () => {
          redis = undefined
        })
      }

      And('limiter object', () => {
        limiter = SlidingWindowRateLimiter.createLimiter({
          interval: 1,
          redis: redis
        })
      })

      And('key', () => {
        key = 'above-limit:' + uuidv1()
      })

      When('I check usage', done => {
        limiter.check(key, defaultLimit, (err, value) => {
          error = err
          usage = value
          done()
        })
      })

      Then('there was no error', () => {
        (error === null).should.be.true()
      })

      And('usage is zero', () => {
        return usage.should.equal(0)
      })

      When('I make one reservation', done => {
        limiter.reserve(key, defaultLimit, (err, value) => {
          error = err
          usage = value
          done()
        })
      })

      Then('there was no error', () => {
        (error === null).should.be.true()
      })

      And('usage is above zero', () => {
        return usage.should.be.above(0)
      })

      When('I try to make another above limit', done => {
        limiter.reserve(key, defaultLimit, (err, value) => {
          error = err
          usage = value
          done()
        })
      })

      Then('there was no error', () => {
        (error === null).should.be.true()
      })

      And('usage is below zero', () => {
        return usage.should.be.below(0)
      })

      When('I check usage', done => {
        limiter.check(key, defaultLimit, (err, value) => {
          error = err
          usage = value
          done()
        })
      })

      Then('there was no error', () => {
        (error === null).should.be.true()
      })

      And('usage is above zero', () => {
        return usage.should.be.above(0)
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

    Scenario('Make one reservation and another after interval', () => {
      let error
      let key
      let limiter
      let redis
      let usage
      const defaultLimit = 1

      if (backend === 'Redis') {
        Given('redis connection', () => {
          redis = new Redis(TEST_REDIS_URL)
        })
      } else {
        Given('undefined redis option', () => {
          redis = undefined
        })
      }

      And('limiter object', () => {
        limiter = SlidingWindowRateLimiter.createLimiter({
          interval: 1,
          redis: redis
        })
      })

      And('key', () => {
        key = 'after-interval:' + uuidv1()
      })

      When('I check usage', done => {
        limiter.check(key, defaultLimit, (err, value) => {
          error = err
          usage = value
          done()
        })
      })

      Then('there was no error', () => {
        (error === null).should.be.true()
      })

      And('usage is zero', () => {
        return usage.should.equal(0)
      })

      When('I make one reservation', done => {
        limiter.reserve(key, defaultLimit, (err, value) => {
          error = err
          usage = value
          done()
        })
      })

      Then('there was no error', () => {
        (error === null).should.be.true()
      })

      And('usage is above zero', () => {
        return usage.should.be.above(0)
      })

      When('I wait more than interval', done => {
        setTimeout(done, 2000 /* ms */)
      })

      And('I try to make another above limit', done => {
        limiter.reserve(key, defaultLimit, (err, value) => {
          error = err
          usage = value
          done()
        })
      })

      Then('usage is above zero', () => {
        return usage.should.be.above(0)
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
