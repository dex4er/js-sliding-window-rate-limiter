import { After, And, Feature, Given, Scenario, Then, When } from '../lib/steps'

import { MockRedis } from '../../mock/mock-ioredis'
import { BaseSlidingWindowRateLimiter } from '../../src/base-sliding-window-rate-limiter'
import { ExtendedRedis } from '../../src/redis-sliding-window-rate-limiter'
import { createLimiter } from '../../src/sliding-window-rate-limiter'

Feature('Test sliding-window-rate-limiter module error with callbacks with Redis backend', () => {
  Scenario('Make one reservation', () => {
    let error: Error | null
    let key: string
    let limiter: BaseSlidingWindowRateLimiter
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

    When('I try to make one reservation', async () => {
      return new Promise((resolve) => {
        limiter.reserve(key, defaultLimit, (err) => {
          error = err
          resolve()
        })
      })
    })

    Then('reply error occured', () => {
      (error || {}).should.be.an('error').with.property('name', 'ReplyError')
    })

    After(async () => {
      await limiter.destroy()
    })
  })
})
