## sliding-window-rate-limiter

[![Build Status](https://secure.travis-ci.org/dex4er/js-sliding-window-rate-limiter.svg)](http://travis-ci.org/dex4er/js-sliding-window-rate-limiter) [![Coverage Status](https://coveralls.io/repos/github/dex4er/js-sliding-window-rate-limiter/badge.svg)](https://coveralls.io/github/dex4er/js-sliding-window-rate-limiter) [![npm](https://img.shields.io/npm/v/sliding-window-rate-limiter.svg)](https://www.npmjs.com/package/sliding-window-rate-limiter)

Sliding window rate limiter with Redis 3.2 backend.

### Requirements

This module requires ES6 with Node >= 4.

Redis >= 3.2.0 is required.

### Installation

```shell
npm install sliding-window-rate-limiter
```

### Usage

```js
const Limiter = require('sliding-window-rate-limiter').SlidingWindowRateLimiter
```

_Typescript:_

```ts
import { SlidingWindowRateLimiter as Limiter } from 'sliding-window-rate-limiter'
```


#### constructor

```js
const limiter = new Limiter(options)
```

_Options:_

* `interval` is a number of seconds in a sliding window
* `redis` is an instance of [`ioredis`](https://www.npmjs.com/package/ioredis)
  or URL string to Redis server (default: new instance will be created with
  default options of Redis client)

_Example:_

```js
const limiter = new Limiter({
  interval: 60
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
const usage = await limiter.cancel(key, limit, ts)
```

or

```js
limiter.reserve(key, limit, (err, usage) => {})
```

Cancels a reservation for timestamp `ts` and returns current usage for `key`.
Returns a negative number with current usage if the usage is above the limit.
Throws an error if has occurred.

### Errors

If `reserve` or `usage` methods returns an error:

```
ERR Error running script (call to f_8ff6a0f745b738fe1d9fa74079c4c13d032e9947): @user_script:1: user_script:1: attempt to call field \'replicate_commands\' (a nil value)
```

then check if Redis has proper version (>= 3.2.0).

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
