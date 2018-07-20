import { And, Feature, Given, Scenario, Then, When } from '../lib/steps'

import Redis from 'ioredis'
import uuidv1 from 'uuid/v1'
import { MockRedis } from '../../mock/mock-ioredis'
import { ExtendedRedis } from '../../src/redis-sliding-window-rate-limiter'
import { SafeRedisSlidingWindowRateLimiter } from '../../src/safe-redis-sliding-window-rate-limiter'

Feature('Limiter safe operations extension', () => {
  const TEST_REDIS_URL = process.env.TEST_REDIS_URL

  Scenario('Operations with promises interface', () => {
    let redis: ExtendedRedis
    let limiter: SafeRedisSlidingWindowRateLimiter
    let key: string
    const errors: Error[] = []
    const defaultLimit = 1

    Given('redis connection', () => {
      redis = TEST_REDIS_URL ? new Redis(TEST_REDIS_URL) as ExtendedRedis : new MockRedis()
    })

    And('limiter object', () => {
      limiter = new SafeRedisSlidingWindowRateLimiter({
        interval: 1,
        redis
      })
    })

    And('key', () => {
      key = 'redis-failure:' + uuidv1()
    })

    And('error listener', () => {
      limiter.on('error', (err) => {
        errors.push(err)
      })
    })

    When('Redis is disconnected', () => {
      return redis.disconnect()
    })

    And('check method is called', () => {
      return (limiter.check(key, defaultLimit) as Promise<number>).should.eventually.equal(0)
    })

    Then('one error event was fired', () => {
      errors.length.should.equals(1)
    })

    When('reserve method is called', () => {
      return (limiter.reserve(key, defaultLimit) as Promise<number>).should.eventually.equal(0)
    })

    Then('one error event was fired', () => {
      errors.length.should.equals(1)
    })

    When('cancel method is called', () => {
      return (limiter.cancel(key, 0) as Promise<number>).should.eventually.equal(0)
    })

    Then('one error event was fired', () => {
      errors.length.should.equals(1)
    })
  })

  Scenario('Operations with callbacks interface', () => {
    let canceled: number | undefined
    let redis: ExtendedRedis
    let limiter: SafeRedisSlidingWindowRateLimiter
    let key: string
    let ts: number | undefined
    const failures: Error[] = []
    let usage: number | undefined
    const defaultLimit = 1

    Given('redis connection', () => {
      redis = TEST_REDIS_URL ? new Redis(TEST_REDIS_URL) as ExtendedRedis : new MockRedis()
    })

    And('limiter object', () => {
      limiter = new SafeRedisSlidingWindowRateLimiter({
        interval: 1,
        redis
      })
    })

    And('key', () => {
      key = 'redis-failure:' + uuidv1()
    })

    And('error listener', () => {
      limiter.on('error', (err) => {
        failures.push(err)
      })
    })

    When('Redis is disconnected', () => {
      return redis.disconnect()
    })

    And('check method is called', () => {
      return new Promise((resolve) => {
        limiter.check(key, defaultLimit, (err, response) => {
          if (!err) {
            usage = response
          }
          resolve()
        })
      })
    })

    Then('check method should return default usage', () => {
      Number(usage).should.equals(0)
    })

    And('one error event was fired', () => {
      failures.length.should.equals(1)
    })

    When('reserve method is called', () => {
      return new Promise((resolve) => {
        limiter.reserve(key, defaultLimit, (err, response) => {
          if (!err) {
            ts = response
          }
          resolve()
        })
      })
    })

    Then('reserve method should return default timestamp', () => {
      Number(ts).should.equals(0)
    })

    And('one error event was fired', () => {
      failures.length.should.equals(1)
    })

    When('cancel method is called', () => {
      return new Promise((resolve) => {
        limiter.cancel(key, Number(ts), (err, response) => {
          if (!err) {
            canceled = response
          }
          resolve()
        })
      })
    })

    Then('reservation was canceled', () => {
      Number(canceled).should.equals(0)
    })

    And('one error event was fired', () => {
      failures.length.should.equals(1)
    })
  })
})
