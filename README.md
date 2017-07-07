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
const Limiter = require('sliding-window-rate-limiter')
```

#### constructor

```js
const limiter = new Limiter(options)
```

_Options:_

* `interval` is a number of seconds in a sliding window
* `limit` is a number of maximum reservations in a window
* `redis` is an instance of [`ioredis`](https://www.npmjs.com/package/ioredis)
  or URL string to Redis server (default: new instance will be created with
  default options of Redis client)

_Example:_

```js
const limiter = new Limiter({
  interval: 60,
  limit: 100
})
```

#### check

```js
const usage = async limiter.check(key)
```

or

```js
limiter.check(key, function (err, usage) {})
```

Checks current usage for `key`. If usage is above limit, it returns a negative
number with current usage. Throws an error if has occurred.

#### reserve

```js
const usage = async limiter.reserve(key)
```

or

```js
limiter.reserve(key, function (err, usage) {})
```

Makes a reservation and returns current usage for `key`. Returns a negative
number with current usage if the reservation can't be done because of limit.
Throws an error if has occurred.

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
