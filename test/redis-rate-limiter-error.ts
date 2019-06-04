import {expect} from "chai"

import {After, And, Feature, Given, Scenario, Then, When} from "./lib/steps"

import {Redis, RedisSlidingWindowRateLimiter, SlidingWindowRateLimiter} from "../src/sliding-window-rate-limiter"

import {MockIORedis} from "./lib/mock-ioredis"

Feature("Test sliding-window-rate-limiter module error with Redis backend", () => {
  Scenario("Redis returns error", () => {
    const defaultLimit = 1

    let key: string
    let limiter: RedisSlidingWindowRateLimiter
    let error: Error
    let redis: Redis

    Given("mock redis connection", () => {
      redis = new MockIORedis()
    })

    And("limiter object", () => {
      limiter = SlidingWindowRateLimiter.createLimiter({
        interval: 1,
        redis,
      })
    })

    And("key", () => {
      key = "error"
    })

    When("I try to make one reservation", async () => {
      try {
        await limiter.reserve(key, defaultLimit)
      } catch (e) {
        error = e
      }
    })

    Then("reservation is rejected", () => {
      expect(error)
        .to.be.an("Error")
        .and.has.property("message")
        .that.matches(/ERR Error running script/)
    })

    After(() => {
      limiter.destroy()
    })
  })

  Scenario("Redis throws an exception", () => {
    const defaultLimit = 1

    let key: string
    let limiter: RedisSlidingWindowRateLimiter
    let error: Error
    let redis: Redis

    Given("mock redis connection", () => {
      redis = new MockIORedis()
    })

    And("limiter object", () => {
      limiter = SlidingWindowRateLimiter.createLimiter({
        interval: 1,
        redis,
      })
    })

    And("key", () => {
      key = "exception"
    })

    When("I try to make one reservation", async () => {
      try {
        await limiter.reserve(key, defaultLimit)
      } catch (e) {
        error = e
      }
    })

    Then("limiter throws an exception", () => {
      expect(error).to.be.an("Error", "Redis throws an exception")
    })

    After(() => {
      limiter.destroy()
    })
  })
})
