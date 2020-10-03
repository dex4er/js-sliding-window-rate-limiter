#!/usr/bin/env ts-node

// Usage: time ts-node examples/redis-lua-bench-ts.ts 10000 10000 5000 >/dev/null

const ATTEMPTS = Number(process.argv[2]) || 1
const INTERVAL = Number(process.argv[3]) || 60000
const LIMIT = Number(process.argv[4]) || ATTEMPTS

import fs from "fs"
import path from "path"

import IORedis from "ioredis"

interface Redis extends IORedis.Redis {
  // eslint-disable-next-line @typescript-eslint/naming-convention
  limiter_reserve(key: string, interval: number, limit: number): Promise<[number, number, number]>
}

const lua = fs.readFileSync(path.join(__dirname, "../src/redis/reserve.lua"), "utf8")

async function main(): Promise<void> {
  const redis = new IORedis({
    host: process.env.REDIS_HOST,
  }) as Redis

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
