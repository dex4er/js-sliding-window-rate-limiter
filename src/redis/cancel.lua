-- Copyright (c) 2017 Serguei Poliakov <serguei.poliakov@gmail.com>
-- Copyright (c) 2017-2019 Piotr Roszatycki <piotr.roszatycki@gmail.com>

local key = KEYS[1]

local token = tonumber(ARGV[1]) or 0 -- token to cancel

-- requires Redis >= 3.2
redis.replicate_commands()

return tonumber(redis.call("ZREM", key, token)) or 0
