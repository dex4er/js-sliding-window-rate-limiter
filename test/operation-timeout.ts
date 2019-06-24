import {expect} from "chai"

import {And, Feature, Given, Scenario, Then} from "./lib/steps"

import uuidv1 from "uuid/v1"

import RedisSlidingWindowRateLimiter from "../src/redis-sliding-window-rate-limiter"
import {Redis} from "../src/sliding-window-rate-limiter"

import {MockIORedis} from "./lib/mock-ioredis"

Feature("Test sliding-window-rate-limiter Redis failure with safe backend", () => {
  const defaultLimit = 1

  let error: Error | {message: string}
  let redis: Redis
  let limiter: RedisSlidingWindowRateLimiter
  let key: string
  let operationDelay: number
  let operationTimeout: number

  Scenario("operation timeout", () => {
    Given("operation timeout shorter then operation delay", () => {
      operationTimeout = 1500
      operationDelay = 3000
    })

    And("reset error", () => {
      error = {message: ""}
    })

    And("redis connection", () => {
      redis = new MockIORedis({operationDelay})
    })

    And("limiter object", () => {
      limiter = new RedisSlidingWindowRateLimiter({
        interval: 1,
        redis,
        operationTimeout,
      })
    })

    And("key", () => {
      key = "redis-failure:" + uuidv1()
    })

    And("check method is called", () => {
      return limiter.check(key, defaultLimit).catch(err => {
        error = err
      })
    })

    Then("timeout error was fired", () => {
      expect(error).to.be.an("Error", "Operation timed out")
    })
  })

  Scenario("operation timeout not fired", () => {
    Given("operation timeout longer then operation delay", () => {
      operationTimeout = 3000
      operationDelay = 1500
    })

    And("reset error", () => {
      error = {message: ""}
    })

    And("redis connection", () => {
      redis = new MockIORedis({operationDelay})
    })

    And("limiter object", () => {
      limiter = new RedisSlidingWindowRateLimiter({
        interval: 1,
        redis,
        operationTimeout,
      })
    })

    And("key", () => {
      key = "redis-failure:" + uuidv1()
    })

    And("check method is called", async () => {
      return limiter.check(key, defaultLimit).catch(err => {
        error = err
      })
    })

    Then("timeout error was not fired", () => {
      expect(error).to.be.not.an("Error")
    })
  })
})
