#!/usr/bin/env node

// Usage: time node examples/redis-lua-bench.js 10000 10000 5000 >/dev/null

const ATTEMPTS = Number(process.argv[2]) || 1
const INTERVAL = Number(process.argv[3]) || 60000
const LIMIT = Number(process.argv[4]) || ATTEMPTS

import * as fs from "fs"
import * as path from "path"
import * as url from "url"

import IORedis from "ioredis"

const __filename = url.fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const lua = fs.readFileSync(path.join(__dirname, "../src/redis/reserve.lua"), "utf8")

async function main() {
  const redis = new IORedis.Redis({
    host: process.env.REDIS_HOST,
  })

  redis.defineCommand("limiter_reserve", {
    lua,
    numberOfKeys: 1,
  })

  const key = "limiter"

  for (let i = 1; i <= ATTEMPTS; i++) {
    const result = await redis.limiter_reserve(key, INTERVAL, LIMIT)
    console.info(result)
  }

  await redis.quit()
}

main().catch(console.error)
