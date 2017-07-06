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

#### immediate

Create timer

```js
const timer = timers.immediate(cb, [...args])
```

Remove timer

```js
timer.remove()
```

#### interval

Create timer

```js
const timer = timers.interval(delay, cb, [...args])
```

Remove timer

```js
timer.remove()
```

#### timeout

Create timer

```js
const timer = timers.timeout(delay, cb, [...args])
```

Remove timer

```js
timer.remove()
```

### License

Copyright (c) 2016-2017 Piotr Roszatycki <piotr.roszatycki@gmail.com>

[MIT](https://opensource.org/licenses/MIT)
