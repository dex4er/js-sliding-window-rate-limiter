# sliding-window-rate-limiter

<!-- markdownlint-disable MD013 -->
[![Build Status](https://secure.travis-ci.org/dex4er/js-sliding-window-rate-limiter.svg)](http://travis-ci.org/dex4er/js-sliding-window-rate-limiter) [![Coverage Status](https://coveralls.io/repos/github/dex4er/js-sliding-window-rate-limiter/badge.svg)](https://coveralls.io/github/dex4er/js-sliding-window-rate-limiter) [![npm](https://img.shields.io/npm/v/sliding-window-rate-limiter.svg)](https://www.npmjs.com/package/sliding-window-rate-limiter)
<!-- markdownlint-enable MD013 -->

Sliding window rate limiter with Redis 3.2 backend or in-memory backend.

## Requirements

This module requires ES6 with Node >= 6.

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
const SlidingWindowRateLimiter = require('sliding-window-rate-limiter')
```

_Typescript:_

```ts
import * as SlidingWindowRateLimiter from 'sliding-window-rate-limiter'
```

### constructor

```js
const limiter = SlidingWindowRateLimiter.createLimiter(options)
```

_Options:_

* `interval` is a number of seconds in a sliding window
* `redis` is an instance of [`ioredis`](https://www.npmjs.com/package/ioredis)
  or URL string to Redis server (only for Redis backend)
* `safe`: `true` (only for SafeRedis backend)
* `reuseRedisAfter` is a time (milliseconds) to reconnect to Redis server
  after connection failure (only for SafeRedis backend, default value: 2000
  milliseconds)
* `defaultResponse` is a number value returned when Redis server is not
  available (only for SafeRedis backend, default value: 0)

If `redis` parameter is a string then new `ioredis` object is created with
`retryStrategy` set to 1 seconds and `maxRetriesPerRequest` set to 1.

_Example:_

```js
const limiter = SlidingWindowRateLimiter.createLimiter({
  interval: 60
})
```

or

```js
const limiter = SlidingWindowRateLimiter.createLimiter({
  interval: 60,
  redis: new Redis({
    host: 'redis-server',
    retryStrategy: (_times) => 1000,
    maxRetriesPerRequest: 1
  }),
  safe: true
})
```

### check

```js
const usage = await limiter.check(key, limit)
```

Checks current usage for `key`. If usage is above limit, it returns a negative
number with current usage. Throws an error if has occurred.

### reserve

```js
const ts = await limiter.reserve(key, limit)
```

Makes a reservation and returns reserved timestamp as `ts`. Returns a negative
number with current usage if the reservation can't be done because of limit.
Throws an error if has occurred.

### cancel

```js
const canceled = await limiter.cancel(key, ts)
```

Cancels a reservation for timestamp `ts` and returns number of canceled
timestamps. It is a zero if no timestamp previously was reserved or it was
expired.

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
SafeRedis backend will always return positive response (`defaultResponse`
value), and will try to use again the Redis server after `reuseRedisAfter`.

## License

Copyright (c) 2017-2018 Piotr Roszatycki <piotr.roszatycki@gmail.com>

[MIT](https://opensource.org/licenses/MIT)

Based on Lua script from <https://github.com/3hedgehogs/inredis-ratelimiter>

Copyright (c) 2017 Serguei Poliakov <serguei.poliakov@gmail.com>

Inspired by ClassDojo blog note
<https://engineering.classdojo.com/blog/2015/02/06/rolling-rate-limiter/> and
[`rolling-rate-limiter`](https://www.npmjs.com/package/rolling-rate-limiter)
module.
