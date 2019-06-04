import {expect} from "chai"

import {And, Feature, Given, Scenario, Then, When} from "./lib/steps"

import uuidv1 from "uuid/v1"
import {Redis, SafeRedisSlidingWindowRateLimiter} from "../src/sliding-window-rate-limiter"
import {MockIORedis} from "./lib/mock-ioredis"

Feature("Test sliding-window-rate-limiter Redis failure with safe backend", () => {
  Scenario("Redis failure", () => {
    const defaultLimit = 1
    const errors: Error[] = []

    let redis: Redis
    let limiter: SafeRedisSlidingWindowRateLimiter
    let key: string

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
      expect(await limiter.check(key, defaultLimit)).to.equal(0)
    })

    Then("one error event was fired", () => {
      expect(errors.length).to.equal(1)
    })

    When("reserve method is called", async () => {
      expect(await limiter.reserve(key, defaultLimit)).to.equal(0)
    })

    Then("one error event was fired", () => {
      expect(errors.length).to.equal(1)
    })
  })
})
