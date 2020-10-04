# sliding-window-rate-limiter

<!-- markdownlint-disable MD013 -->

[![Build Status](https://secure.travis-ci.org/dex4er/js-sliding-window-rate-limiter.svg)](http://travis-ci.org/dex4er/js-sliding-window-rate-limiter) [![Coverage Status](https://coveralls.io/repos/github/dex4er/js-sliding-window-rate-limiter/badge.svg)](https://coveralls.io/github/dex4er/js-sliding-window-rate-limiter) [![npm](https://img.shields.io/npm/v/sliding-window-rate-limiter.svg)](https://www.npmjs.com/package/sliding-window-rate-limiter)

<!-- markdownlint-enable MD013 -->

Sliding window rate limiter with Redis >= 3.2 backend or in-memory backend.

## Requirements

This module requires ES6 with Node >= 10.

Redis >= 3.2.0 is required for Redis backend.

## Installation

```shell
npm install sliding-window-rate-limiter
```

_Additionally for Typescript:_

```shell
npm install -D @types/node @types/ioredis
```

## Usage

```js
const {SlidingWindowRateLimiter} = require("sliding-window-rate-limiter")
```

_Typescript:_

```ts
import SlidingWindowRateLimiter from "sliding-window-rate-limiter"
// or
import {SlidingWindowRateLimiter} from "sliding-window-rate-limiter"
```

### constructor

```js
const limiter = SlidingWindowRateLimiter.createLimiter(options)
```

_Options:_

- `interval` is a number of milliseconds in a sliding window
- `redis` is an instance of [`ioredis`](https://www.npmjs.com/package/ioredis)
  or URL string to Redis server (only for Redis backend)
- `operationTimeout` is a time in milliseconds after Redis operation is canceled
  (for Redis and SafeRedis backends, optional)
- `safe`: `true` (only for SafeRedis backend)
- `reuseRedisAfter` is a time (milliseconds) to reconnect to Redis server
  after connection failure (only for SafeRedis backend, default value: 2000
  milliseconds)

If `redis` parameter is a string then new `ioredis` object is created with
`retryStrategy` set to 1 second and `maxRetriesPerRequest` set to 1.

_Example:_

```js
const limiter = SlidingWindowRateLimiter.createLimiter({
  interval: 60000,
})
```

or

```js
const limiter = SlidingWindowRateLimiter.createLimiter({
  interval: 60000,
  redis: new Redis({
    host: "redis-server",
    retryStrategy: _times => 1000,
    maxRetriesPerRequest: 1,
  }),
  safe: true,
})
```

### check

```js
const result = await limiter.check(key, limit)
const {usage, reset} = result
```

Checks current usage for `key`. If `usage` is equal or above `limit`,
additionaly sets `reset` time in milliseconds.

### reserve

```js
const result = await limiter.reserve(key, limit)
const {token, usage, reset} = result
```

Makes a reservation and returns `token` with a reservation. If `usage` is equal
or above `limit`, additionaly sets `reset` time in milliseconds. Throws an
error if has occurred.

### cancel

```js
const result = await limiter.cancel(key, token)
const {canceled} = result
```

Cancels a reservation for `token` and returns number of `canceled` tokens. It
is a zero if no token previously was reserved or it was expired.

### destroy

```js
limiter.destroy()
```

Frees resources used by limiter (timers and Redis connection if was created by
limiter itself).

## Errors

If `reserve` or `usage` methods returns an error:

<!-- markdownlint-disable MD013 -->

```console
ERR Error running script (call to f_8ff6a0f745b738fe1d9fa74079c4c13d032e9947): @user_script:1: user_script:1: attempt to call field \'replicate_commands\' (a nil value)
```

<!-- markdownlint-enable MD013 -->

then check if Redis has proper version (>= 3.2.0).

## Backends

### Memory

This backend holds all data in memory.

### Redis

This backend requires Redis 3.2 to work. Main advantage is that the state of
limiter can be shared between many clients.

### SafeRedis

There is extended version of limiter, which behaves gracefully, when Redis
server is unavailable for any reason. In case of Redis connection failure,
SafeRedis backend will always return positive response object and will try to
use again the Redis server after `reuseRedisAfter`.

## License

Copyright (c) 2017-2020 Piotr Roszatycki <piotr.roszatycki@gmail.com>

[MIT](https://opensource.org/licenses/MIT)

Based on Lua script from <https://github.com/3hedgehogs/inredis-ratelimiter>

Copyright (c) 2017 Serguei Poliakov <serguei.poliakov@gmail.com>

Inspired by ClassDojo blog note
<https://engineering.classdojo.com/blog/2015/02/06/rolling-rate-limiter/> and
[`rolling-rate-limiter`](https://www.npmjs.com/package/rolling-rate-limiter)
module.
