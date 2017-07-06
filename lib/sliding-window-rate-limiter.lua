-- Lua script based on https://github.com/3hedgehogs/inredis-ratelimiter
--
-- Copyright (c) 2017 3hedgehogs
-- Copyright (c) 2017 Piotr Roszatycki <piotr.roszatycki@gmail.com>
--
-- Run `npm run minify` after changes in this file

local key     = KEYS[1]

local interval = tonumber(ARGV[1]) -- seconds
local limit    = tonumber(ARGV[2]) -- number
local ttl      = tonumber(ARGV[3]) -- seconds
local reserve  = (ARGV[4] ~= '0')  -- 0 or 1

-- script effects replication is available since Redis 3.2
redis.replicate_commands()

local redistime = redis.call("TIME")
local ts = redistime[1] * 1e6 + redistime[2]

local startwindow = ts - interval * 1e6
redis.call("ZREMRANGEBYSCORE", key, "-inf", startwindow)

local usage = tonumber(redis.call("ZCOUNT", key, 1, ts))

if reserve then
    if usage >= limit then
        return -usage
    end

    redis.call("ZADD", key, ts, ts)
    redis.call("EXPIRE", key, ttl)
    usage = tonumber(redis.call("ZCOUNT", key, 0, ts))
end

if usage > limit then
    return -usage
end

return usage
