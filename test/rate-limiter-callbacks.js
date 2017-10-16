'use strict'

const t = require('tap')
require('tap-given')(t)

const chai = require('chai')
chai.use(require('dirty-chai'))
chai.should()

Feature('Test sliding-window-rate-limiter module with callbacks', () => {
  const TEST_REDIS_URL = process.env.TEST_REDIS_URL
  const redisModule = TEST_REDIS_URL ? 'ioredis' : '../mock/mock-ioredis'
  const Redis = require(redisModule)
  const redis = new Redis(TEST_REDIS_URL)

  const uuidv1 = require('uuid/v1')

  const limiterBackendOptions = {
    'Memory': { interval: 1 },
    'Redis': { redis, interval: 1 },
    'SafeRedis': { safe: true, redis, interval: 1 }
  }

  const limiterFactoryClass = require('./../lib/sliding-window-rate-limiter')

  for (const backend of Object.keys(limiterBackendOptions)) {
    Scenario(`Make one reservation - ${backend} backend`, () => {
      let error
      let key
      let limiter
      let usage
      const defaultLimit = 1
      const options = limiterBackendOptions[backend]

      Given('limiter object', () => {
        limiter = limiterFactoryClass.createLimiter(options)
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
    })

    Scenario(`Make one reservation and another above limit - ${backend} backend`, () => {
      let error
      let key
      let limiter
      let usage
      const defaultLimit = 1
      const options = limiterBackendOptions[backend]

      Given('limiter object', () => {
        limiter = limiterFactoryClass.createLimiter(options)
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
    })

    Scenario(`Make one reservation and another after interval - ${backend} backend`, () => {
      let error
      let key
      let limiter
      let usage
      const defaultLimit = 1
      const options = limiterBackendOptions[backend]

      Given('limiter object', () => {
        limiter = limiterFactoryClass.createLimiter(options)
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
        setTimeout(done, 2000)
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
    })

    Scenario(`Cancel reservation - ${backend} backend`, () => {
      let key
      let limiter
      let reservationToken
      let error
      const defaultLimit = 1
      const options = limiterBackendOptions[backend]

      Given('limiter object', () => {
        limiter = limiterFactoryClass.createLimiter(options)
      })

      And('key', () => {
        key = 'after-interval:' + uuidv1()
      })

      When('I make one reservation', (done) => {
        limiter.reserve(key, defaultLimit, (err, resolvedReservationToken) => {
          error = err;
          (error === null).should.be.true()
          reservationToken = resolvedReservationToken
          done()
        })
      })

      Then('usage is above zero', (done) => {
        limiter.check(key, defaultLimit, (err, checkedValue) => {
          error = err;
          (error === null).should.be.true()
          checkedValue.should.be.above(0)
          done()
        })
      })

      When('canceling reservation', (done) => {
        limiter.cancel(key, defaultLimit, reservationToken, (err, result) => {
          error = err;
          (error === null).should.be.true()
          result.should.be.at.least(0)
          done()
        })
      })

      Then('there should be no reservations', (done) => {
        limiter.check(key, defaultLimit, (err, checkedUsage) => {
          error = err;
          (error === null).should.be.true()
          checkedUsage.should.be.equal(0)
          done()
        })
      })

      After('destroy limiter', () => {
        limiter.destroy()
      })
    })
  }

  After('quit redis', () => {
    redis.quit()
  })
})
