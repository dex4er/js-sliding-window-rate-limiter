## sliding-window-rate-limiter

[![Build Status](https://secure.travis-ci.org/dex4er/js-sliding-window-rate-limiter.svg)](http://travis-ci.org/dex4er/js-sliding-window-rate-limiter) [![Coverage Status](https://coveralls.io/repos/github/dex4er/js-sliding-window-rate-limiter/badge.svg)](https://coveralls.io/github/dex4er/js-sliding-window-rate-limiter) [![npm](https://img.shields.io/npm/v/sliding-window-rate-limiter.svg)](https://www.npmjs.com/package/sliding-window-rate-limiter)

Sliding window rate limiter with Redis 3.2 backend or in-memory backend.

### Requirements

This module requires ES6 with Node >= 4. For Node < 5 `--harmony` flag is required.

Redis >= 3.2.0 is required for Redis backend.

### Installation

```shell
npm install sliding-window-rate-limiter
```

### Usage

```js
const SlidingWindowRateLimiter = require('sliding-window-rate-limiter')
```

_Typescript:_

```ts
import * as SlidingWindowRateLimiter from 'sliding-window-rate-limiter'
```

#### constructor

```js
const limiter = SlidingWindowRateLimiter.createLimiter(options)
```

_Options:_

* `interval` is a number of seconds in a sliding window
* `redis` is an instance of [`ioredis`](https://www.npmjs.com/package/ioredis)
  or URL string to Redis server (only for Redis backend)
* `safe`: `true` (only for SafeRedis backend)
* `reconnectTimeout` is a time (milliseconds) to reconnect to Redis server
  after connection failure (only for SafeRedis backend, default value: 2000
  milliseconds)
* `defaultResponse` is a number value returned when Redis server is not
  available (only for SafeRedis backend, default value: 0)

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
  redis: new Redis({ host: 'redis-server' }),
  safe: true
})
```

#### check

```js
const usage = await limiter.check(key, limit)
```

or

```js
limiter.check(key, limit, (err, usage) => {})
```

Checks current usage for `key`. If usage is above limit, it returns a negative
number with current usage. Throws an error if has occurred.

#### reserve

```js
const ts = await limiter.reserve(key, limit)
```

or

```js
limiter.reserve(key, limit, (err, ts) => {})
```

Makes a reservation and returns reserved timestamp as `ts`. Returns a negative
number with current usage if the reservation can't be done because of limit.
Throws an error if has occurred.

#### cancel

```js
const canceled = await limiter.cancel(key, ts)
```

or

```js
limiter.cancel(key, (err, canceled) => {})
```

Cancels a reservation for timestamp `ts` and returns number of canceled
timestamps. It is a zero if no timestamp previously was reserved or it was
expired.

#### destroy

```js
limiter.destroy()
```

Frees resources used by limiter (timers and connections).

### Errors

If `reserve` or `usage` methods returns an error:

```
ERR Error running script (call to f_8ff6a0f745b738fe1d9fa74079c4c13d032e9947): @user_script:1: user_script:1: attempt to call field \'replicate_commands\' (a nil value)
```

then check if Redis has proper version (>= 3.2.0).

### Backends

#### Memory

This backend holds all data in memory.

#### Redis

This backend requires Redis 3.2 to work. Main advantage is that the state of
limiter can be shared between many clients.

#### SafeRedis

There is extended version of limiter, which behaves gracefully, when Redis
server is unavailable for any reason. In case of Redis connection failure,
SafeRedis backend will always return positive response (`defaultResponse`
value), and will try to reconnect to Redis server after `reconnectTimeout`.

### Lua

Minified script is sent to Redis server by default. Full script can be sent
instead when `DEBUG_LUA` environment variable is set.

### License

Copyright (c) 2017 Piotr Roszatycki <piotr.roszatycki@gmail.com>

[MIT](https://opensource.org/licenses/MIT)

Based on Lua script from https://github.com/3hedgehogs/inredis-ratelimiter

Copyright (c) 2017 3hedgehogs

Inspired by ClassDojo blog note
https://engineering.classdojo.com/blog/2015/02/06/rolling-rate-limiter/
and
[`rolling-rate-limiter`](https://www.npmjs.com/package/rolling-rate-limiter)
module.
