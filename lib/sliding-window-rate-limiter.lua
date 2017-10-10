-- Lua script based on https://github.com/3hedgehogs/inredis-ratelimiter
--
-- Copyright (c) 2017 3hedgehogs
-- Copyright (c) 2017 Piotr Roszatycki <piotr.roszatycki@gmail.com>
--
-- Run `npm run minify` after changes in this file

local key      = KEYS[1]

local mode     = tonumber(ARGV[1]) or 0 -- 0: check, 1: reserve, 2: cancel
local interval = tonumber(ARGV[2]) or 0 -- seconds
local limit    = tonumber(ARGV[3]) or 0 -- number
local tscancel = tonumber(ARGV[4]) or 0 -- timestamp to cancel

-- script effects replication is available since Redis 3.2
redis.replicate_commands()

local redistime = redis.call("TIME")
local ts = redistime[1] * 1e6 + redistime[2]

local startwindow = ts - interval * 1e6
redis.call("ZREMRANGEBYSCORE", key, "-inf", startwindow)

local usage = tonumber(redis.call("ZCOUNT", key, 1, ts)) or 0

if mode == 2 then
    local removed = tonumber(redis.call("ZREM", key, tscancel)) or 0
    usage = usage - removed
elseif mode == 1 then
    if usage >= limit then
        return -usage
    end

    redis.call("ZADD", key, "NX", ts, ts)
    redis.call("EXPIRE", key, interval)
    return ts
end

if usage > limit then
    return -usage
end

return usage
