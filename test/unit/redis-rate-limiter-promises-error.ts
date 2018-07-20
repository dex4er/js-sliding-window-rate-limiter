import { After, And, Feature, Given, Scenario, Then, When } from '../lib/steps'

import { MockRedis } from '../../mock/mock-ioredis'
import { BaseSlidingWindowRateLimiter } from '../../src/base-sliding-window-rate-limiter'
import { ExtendedRedis } from '../../src/redis-sliding-window-rate-limiter'
import { createLimiter } from '../../src/sliding-window-rate-limiter'

Feature('Test sliding-window-rate-limiter module error with promises with Redis backend', () => {
  Scenario('Make one reservation', () => {
    let key: string
    let limiter: BaseSlidingWindowRateLimiter
    let promise: Promise<number>
    let redis: ExtendedRedis
    const defaultLimit = 1

    Given('mock redis connection', () => {
      redis = new MockRedis()
    })

    And('limiter object', () => {
      limiter = createLimiter({
        interval: 1,
        redis
      })
    })

    And('key', () => {
      key = 'error'
    })

    When('I try to make one reservation', () => {
      promise = limiter.reserve(key, defaultLimit) as Promise<number>
      promise.catch(() => { /**/ })
    })

    Then('reservation is rejected', () => {
      return promise.should.rejectedWith(Error, /ERR Error running script/)
    })

    After(async () => {
      await limiter.destroy()
    })
  })
})
