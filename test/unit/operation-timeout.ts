import delay from 'delay'

import { And, Feature, Given, Scenario, Then, When } from '../lib/steps'

import { MockRedis } from '../../mock/mock-ioredis'
import { BaseSlidingWindowRateLimiter } from '../../src/base-sliding-window-rate-limiter'
import { ExtendedRedis } from '../../src/redis-sliding-window-rate-limiter'
import { createLimiter } from '../../src/sliding-window-rate-limiter'

Feature('operation timeout', () => {
  let redis: ExtendedRedis
  let operationDelay: number
  let operationTimeout: number
  let limiter: BaseSlidingWindowRateLimiter
  let promise: Promise<number>
  let error: Error
  const key = 'key'

  Scenario('basic usage', () => {
    Given('delay for operation', () => {
      operationDelay = 2000
    })

    And('operation timeout', () => {
      operationTimeout = Math.round(operationDelay / 2)
    })

    And('redis connection', () => {
      redis = new MockRedis({ operationDelay })
    })

    And('limiter', () => {
      limiter = createLimiter({ redis, operationTimeout })
    })

    When('executing simple operation', () => {
      promise = limiter.check(key, 5) as Promise<number>
      promise.catch((e) => { error = e })
    })

    And('wait for operation timeout', async () => {
      return delay(operationTimeout)
    })

    Then('operation is timed out', () => {
      /* tslint:disable:no-unused-expression */
      promise.should.be.rejected
      /* tslint:enable:no-unused-expression */
      error.should.be.instanceOf(Error)
      error.message.should.equal(`Redis limiter operation timed out. (${operationTimeout}ms) key: ${key}, mode: ${0}`)
    })
  })
})
