import {expect} from "chai"

import {v1 as uuidv1} from "uuid"
import {
  CheckResult,
  Redis,
  ReserveResult,
  SafeRedisSlidingWindowRateLimiter,
} from "../src/sliding-window-rate-limiter.js"

import {And, Feature, Given, Scenario, Then, When} from "./lib/steps.js"

import {MockIORedis} from "./lib/mock-ioredis.js"

Feature("Test sliding-window-rate-limiter Redis failure with safe backend", () => {
  Scenario("Redis failure with error listener", () => {
    const defaultLimit = 1
    const errors: Error[] = []

    let checkResult: CheckResult
    let key: string
    let limiter: SafeRedisSlidingWindowRateLimiter
    let redis: Redis
    let reserveResult: ReserveResult

    Given("redis connection", () => {
      redis = new MockIORedis()
    })

    And("limiter object", () => {
      limiter = new SafeRedisSlidingWindowRateLimiter({
        interval: 1,
        redis,
      })
    })

    And("key", () => {
      key = "redis-failure:" + uuidv1()
    })

    And("error listener", () => {
      limiter.on("error", err => {
        errors.push(err)
      })
    })

    When("Redis is disconnected", () => {
      redis.disconnect()
    })

    And("check method is called", async () => {
      checkResult = await limiter.check(key, defaultLimit)
    })

    Then("usage is 0", async () => {
      expect(checkResult.usage).to.equal(0)
    })

    And("one error event was fired", () => {
      expect(errors.length).to.equal(1)
    })

    When("reserve method is called", async () => {
      reserveResult = await limiter.reserve(key, defaultLimit)
    })

    Then("usage is 0", async () => {
      expect(reserveResult.usage).to.equal(0)
    })

    And("one error event was fired", () => {
      expect(errors.length).to.equal(1)
    })
  })

  Scenario("Redis failure without error listener", () => {
    const defaultLimit = 1

    let checkResult: CheckResult
    let key: string
    let limiter: SafeRedisSlidingWindowRateLimiter
    let redis: Redis
    let reserveResult: ReserveResult

    Given("redis connection", () => {
      redis = new MockIORedis()
    })

    And("limiter object", () => {
      limiter = new SafeRedisSlidingWindowRateLimiter({
        interval: 1,
        redis,
      })
    })

    And("key", () => {
      key = "redis-failure:" + uuidv1()
    })

    When("Redis is disconnected", () => {
      redis.disconnect()
    })

    And("check method is called", async () => {
      checkResult = await limiter.check(key, defaultLimit)
    })

    Then("usage is 0", async () => {
      expect(checkResult.usage).to.equal(0)
    })

    When("reserve method is called", async () => {
      reserveResult = await limiter.reserve(key, defaultLimit)
    })

    Then("usage is 0", async () => {
      expect(reserveResult.usage).to.equal(0)
    })
  })
})
