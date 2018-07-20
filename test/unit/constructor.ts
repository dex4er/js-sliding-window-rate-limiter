import { After, And, Feature, Given, Scenario, Then, When } from '../lib/steps'

import Redis from 'ioredis'

import { MockRedis } from '../../mock/mock-ioredis'
import { BaseSlidingWindowRateLimiter } from '../../src/base-sliding-window-rate-limiter'
import { MemorySlidingWindowRateLimiter } from '../../src/memory-sliding-window-rate-limiter'
import { ExtendedRedis, RedisSlidingWindowRateLimiter } from '../../src/redis-sliding-window-rate-limiter'
import { SafeRedisSlidingWindowRateLimiter } from '../../src/safe-redis-sliding-window-rate-limiter'
import { createLimiter } from '../../src/sliding-window-rate-limiter'

const backendClasses: { [key: string]: typeof MemorySlidingWindowRateLimiter | typeof RedisSlidingWindowRateLimiter } = {
  Memory: MemorySlidingWindowRateLimiter,
  Redis: RedisSlidingWindowRateLimiter,
  SafeRedis: SafeRedisSlidingWindowRateLimiter
}

for (const backend of ['Memory', 'Redis', 'SafeRedis']) {
  Feature(`Test sliding-window-rate-limiter module constructor with ${backend} backend`, () => {
    let limiter: BaseSlidingWindowRateLimiter
    let redis: ExtendedRedis
    let safe = false

    Scenario('basic usage', () => {
      if (backend === 'Redis' || backend === 'SafeRedis') {
        const TEST_REDIS_URL = process.env.TEST_REDIS_URL

        Given('redis connection', () => {
          redis = TEST_REDIS_URL ? new Redis(TEST_REDIS_URL) as ExtendedRedis : new MockRedis()
        })
      }

      if (backend === 'SafeRedis') {
        And('safe flag', () => {
          safe = true
        })
      }

      When('create simple limiter', () => {
        limiter = createLimiter({ safe, redis })
      })

      Then('limiter exists', () => {
        limiter.should.have.property('reserve')
      })

      And('limiter has correct class', () => {
        limiter.should.be.instanceOf(backendClasses[backend])
      })

      After(async () => {
        await limiter.destroy()
      })

      if (backend === 'Redis' || backend === 'SafeRedis') {
        After(() => {
          redis.disconnect()
        })
      }
    })
  })
}
