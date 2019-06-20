-- Lua script based on https://github.com/3hedgehogs/inredis-ratelimiter
--
-- Copyright (c) 2017 Serguei Poliakov <serguei.poliakov@gmail.com>
-- Copyright (c) 2017-2019 Piotr Roszatycki <piotr.roszatycki@gmail.com>
--
-- Run `npm run minify` after changes in this file

local key      = KEYS[1]

local mode     = tonumber(ARGV[1]) or 0 -- 0: check, 1: reserve, 2: cancel, 3: remaining
local interval = tonumber(ARGV[2]) or 0 -- seconds
local limit    = tonumber(ARGV[3]) or 0 -- number
local token    = tonumber(ARGV[4]) or 0 -- token to cancel

-- requires Redis >= 3.2
redis.replicate_commands()

local redistime = redis.call("TIME")
local now = redistime[1] * 1e6 + redistime[2]

local startwindow = now - interval * 1e6
redis.call("ZREMRANGEBYSCORE", key, "-inf", startwindow)

local usage = tonumber(redis.call("ZCOUNT", key, 1, now)) or 0

-- mode: remaining
if mode == 3 then
    local oldestts = tonumber(redis.call("ZRANGEBYSCORE", key, "-inf", "+inf", "WITHSCORES", "LIMIT", usage - limit, 1)[1]) or 0
    if oldestts > 0 then
        return oldestts + interval * 1e6 - now
    else
        return 0
    end

-- mode: cancel
elseif mode == 2 then
    return tonumber(redis.call("ZREM", key, token)) or 0

-- mode: reserve
elseif mode == 1 then
    if usage >= limit then
        return -usage
    end

    redis.call("ZADD", key, "NX", now, now)
    redis.call("EXPIRE", key, interval)
    return now
end

-- mode: check or reserve
if usage > limit then
    return -usage
end

return usage
