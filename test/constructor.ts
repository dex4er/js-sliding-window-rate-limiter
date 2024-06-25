import {expect} from "chai"

import IORedis from "ioredis"

import {MemorySlidingWindowRateLimiter} from "../src/memory-sliding-window-rate-limiter.js"
import {RedisSlidingWindowRateLimiter} from "../src/redis-sliding-window-rate-limiter.js"
import {SafeRedisSlidingWindowRateLimiter} from "../src/safe-redis-sliding-window-rate-limiter.js"
import {SlidingWindowRateLimiter} from "../src/sliding-window-rate-limiter.js"
import {SlidingWindowRateLimiterBackend} from "../src/sliding-window-rate-limiter-backend.js"

import {After, And, Feature, Scenario, Then, When} from "./lib/steps.js"

import {MockRedis} from "./lib/mock-ioredis.js"

const TEST_REDIS_URL = process.env.TEST_REDIS_URL
const redis = TEST_REDIS_URL ? new IORedis.Redis(TEST_REDIS_URL) : new MockRedis(TEST_REDIS_URL)

const backendClasses: {[backend: string]: any} = {
  Memory: MemorySlidingWindowRateLimiter,
  Redis: RedisSlidingWindowRateLimiter,
  SafeRedis: SafeRedisSlidingWindowRateLimiter,
}

const limiterBackendOptions: {[backend: string]: any} = {
  Memory: {interval: 1},
  Redis: {redis, interval: 1},
  SafeRedis: {safe: true, redis, interval: 1},
}

for (const backend of ["Memory", "Redis", "SafeRedis"]) {
  Feature(`Test sliding-window-rate-limiter module constructor with ${backend} backend`, () => {
    const options = limiterBackendOptions[backend]
    let limiter: SlidingWindowRateLimiterBackend

    Scenario("basic usage", () => {
      When("create simple limiter", () => {
        limiter = SlidingWindowRateLimiter.createLimiter(options)
      })

      Then("limiter exists", () => {
        expect(limiter).to.have.property("reserve")
      })

      And("limiter has correct class", () => {
        expect(limiter).to.be.instanceOf(backendClasses[backend])
      })

      After(() => {
        limiter.destroy()
      })

      if (backend === "Redis" || backend === "SafeRedis") {
        After(() => {
          redis.disconnect()
        })
      }
    })
  })
}
