import {expect} from "chai"

import IORedis from "ioredis"
import {v1 as uuidv1} from "uuid"

import {CancelResult, CheckResult, ReserveResult, SlidingWindowRateLimiter} from "../src/sliding-window-rate-limiter.js"
import {SlidingWindowRateLimiterBackend} from "../src/sliding-window-rate-limiter-backend.js"

import {After, And, Feature, Given, Scenario, Then, When} from "./lib/steps.js"

import {delay} from "./lib/delay.js"
import {MockRedis} from "./lib/mock-ioredis.js"

const TEST_REDIS_URL = process.env.TEST_REDIS_URL
const redis = TEST_REDIS_URL ? new IORedis.Redis(TEST_REDIS_URL) : new MockRedis(TEST_REDIS_URL)

const limiterBackendOptions: {[backend: string]: any} = {
  Memory: {interval: 1000},
  Redis: {redis, interval: 1000},
  SafeRedis: {safe: true, redis, interval: 1000},
}

Feature("Test sliding-window-rate-limiter module with promises", () => {
  for (const backend of Object.keys(limiterBackendOptions)) {
    Scenario(`Make one reservation with limit 2 - ${backend} backend`, () => {
      const defaultLimit = 2
      const options = limiterBackendOptions[backend]

      let checkResult: CheckResult
      let key: string
      let limiter: SlidingWindowRateLimiterBackend
      let reserveResult: ReserveResult

      Given("limiter object", () => {
        limiter = SlidingWindowRateLimiter.createLimiter(options)
      })

      And("key", () => {
        key = "one-reservation:" + uuidv1()
      })

      When("I check usage", async () => {
        checkResult = await limiter.check(key, defaultLimit)
      })

      Then("usage is zero", () => {
        expect(checkResult.usage).to.equal(0)
      })

      When("I make one reservation", async () => {
        reserveResult = await limiter.reserve(key, defaultLimit)
      })

      Then("token is provided", () => {
        expect(reserveResult.token).to.be.above(0)
      })

      And("usage is 1", () => {
        expect(reserveResult.usage).to.equal(1)
      })

      And("reset time is missing", () => {
        expect(reserveResult.reset).to.be.undefined
      })

      When("I check usage", async () => {
        checkResult = await limiter.check(key, defaultLimit)
      })

      Then("usage is 1", () => {
        expect(checkResult.usage).to.equal(1)
      })

      After(() => {
        limiter.destroy()
      })
    })

    Scenario(`Make one reservation and another with limit 1 - ${backend} backend`, () => {
      const defaultLimit = 1
      const options = limiterBackendOptions[backend]

      let checkResult: CheckResult
      let key: string
      let limiter: SlidingWindowRateLimiterBackend
      let reserveResult: ReserveResult

      Given("limiter object", () => {
        limiter = SlidingWindowRateLimiter.createLimiter(options)
      })

      And("key", () => {
        key = "above-limit:" + uuidv1()
      })

      When("I check usage", async () => {
        checkResult = await limiter.check(key, defaultLimit)
      })

      Then("usage is zero", () => {
        expect(checkResult.usage).to.equal(0)
      })

      When("I make one reservation", async () => {
        reserveResult = await limiter.reserve(key, defaultLimit)
      })

      Then("token is provided", () => {
        expect(reserveResult.token).to.be.above(0)
      })

      And("usage is 1", () => {
        expect(reserveResult.usage).to.equal(1)
      })

      And("reset time is provided", () => {
        expect(reserveResult.reset).to.be.above(0)
      })

      When("I try to make another above limit", async () => {
        reserveResult = await limiter.reserve(key, defaultLimit)
      })

      Then("token is missing", () => {
        expect(reserveResult.token).to.be.undefined
      })

      And("usage is 1", () => {
        expect(reserveResult.usage).to.equal(1)
      })

      And("reset time is provided", () => {
        expect(reserveResult.reset).to.be.above(0)
      })

      When("I check usage", async () => {
        checkResult = await limiter.check(key, defaultLimit)
      })

      Then("usage is 1", () => {
        expect(checkResult.usage).to.equal(1)
      })

      After(() => {
        limiter.destroy()
      })
    })

    Scenario("Make one reservation and another with limit 1 after interval - redis backend", () => {
      const defaultLimit = 1
      const options = limiterBackendOptions[backend]

      let key: string
      let limiter: SlidingWindowRateLimiterBackend
      let reserveResult: ReserveResult

      And("limiter object", () => {
        limiter = SlidingWindowRateLimiter.createLimiter(options)
      })

      And("key", () => {
        key = "after-interval:" + uuidv1()
      })

      When("I make one reservation", async () => {
        reserveResult = await limiter.reserve(key, defaultLimit)
      })

      Then("token is provided", () => {
        expect(reserveResult.token).to.be.above(0)
      })

      And("usage is 1", () => {
        expect(reserveResult.usage).to.equal(1)
      })

      And("reset time is provided", () => {
        expect(reserveResult.reset).to.be.above(0)
      })

      When("I wait more than interval", async () => {
        await delay(1500)
      })

      And("I try to make another above limit", async () => {
        reserveResult = await limiter.reserve(key, defaultLimit)
      })

      Then("token is provided", () => {
        expect(reserveResult.token).to.be.above(0)
      })

      And("usage is 1", () => {
        expect(reserveResult.usage).to.equal(1)
      })

      And("reset time is provided", () => {
        expect(reserveResult.reset).to.be.above(0)
      })

      After(() => {
        limiter.destroy()
      })
    })

    Scenario(`Cancel reservation - ${backend} backend`, () => {
      const defaultLimit = 1
      const options = limiterBackendOptions[backend]

      let cancelResult: CancelResult
      let checkResult: CheckResult
      let key: string
      let limiter: SlidingWindowRateLimiterBackend
      let reservationToken: number
      let reserveResult: ReserveResult

      And("limiter object", () => {
        limiter = SlidingWindowRateLimiter.createLimiter(options)
      })

      And("key", () => {
        key = "after-interval:" + uuidv1()
      })

      When("I make one reservation", async () => {
        reserveResult = await limiter.reserve(key, defaultLimit)
      })

      Then("token is provided", () => {
        reservationToken = reserveResult.token!
        expect(reservationToken).to.be.above(0)
      })

      And("usage is 1", () => {
        expect(reserveResult.usage).to.equal(1)
      })

      When("I cancel reservation", async () => {
        cancelResult = await limiter.cancel(key, reservationToken)
      })

      Then("1 token is canceled", () => {
        expect(cancelResult.canceled).to.equal(1)
      })

      When("I check usage", async () => {
        checkResult = await limiter.check(key, defaultLimit)
      })

      Then("there is no usage", () => {
        expect(checkResult.usage).to.equal(0)
      })

      When("I cancel already canceled reservation", async () => {
        cancelResult = await limiter.cancel(key, reservationToken)
      })

      Then("no token is canceled", () => {
        expect(cancelResult.canceled).to.equal(0)
      })

      After(() => {
        limiter.destroy()
      })
    })
  }

  After(async () => {
    await redis.quit()
  })
})
