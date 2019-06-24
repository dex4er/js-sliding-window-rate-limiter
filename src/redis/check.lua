-- Copyright (c) 2017 Serguei Poliakov <serguei.poliakov@gmail.com>
-- Copyright (c) 2017-2019 Piotr Roszatycki <piotr.roszatycki@gmail.com>

local key = KEYS[1]

local interval = tonumber(ARGV[1]) or 0 -- seconds
local limit = tonumber(ARGV[2]) or 0 -- number

-- requires Redis >= 3.2
redis.replicate_commands()

local redistime = redis.call("TIME")
local now = redistime[1] * 1e6 + redistime[2]

local startwindow = now - interval * 1e6
redis.call("ZREMRANGEBYSCORE", key, "-inf", startwindow)

local usage = tonumber(redis.call("ZCOUNT", key, "-inf", now)) or 0

if usage >= limit then
    local oldest = tonumber(redis.call("ZRANGEBYSCORE", key, "-inf", "+inf", "LIMIT", usage - limit, 1)[1]) or 0

    if oldest > 0 then
        local reset = oldest + interval * 1e6 - now
        return {usage, reset}
    end
end

return {usage, 0}
