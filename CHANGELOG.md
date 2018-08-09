# Changelog

## v1.0.1 2018-08-09

* Fix devDependencies.

## v1.0.0 2018-08-09

* Converted to Typescript.
* Callback API is removed. Only Promises are available.
* Prefer `import SlidingWindowRateLimiter from 'sliding-window-rate-limiter'`
  syntax.
* Mocha for tests.

## v0.5.0 2018-08-01

* Use ioredis@4 because of new `maxRetriesPerRequest` option.
* Dropped support for Node < 6
* `reconnectTimeout` option of safe limiter renamed to `reuseRedisAfter`.
* Redis client calls are wrapped with try/catch and then return error
  asynchronously.

## v0.4.0 2018-02-10

* Typescript: support `esModuleInterop` compiler option.

## v0.3.0 2017-10-17

* New `SafeRedis` backend.
* Method `cancel` returns the number of canceled reservations and doesn't
  have `limit` argument anymore.

## v0.2.0 2017-10-12

* `SlidingWindowRateLimiter.createLimiter` is a factory method which returns
  proper backed based on options.
* Use Redis-less backend if `redis` option is not defined.

## v0.1.0 2017-10-10

* `limit` is a argument of methods.
* New method `cancel`.
* Exports also as a class and namespace and the default.
* Typescript typings.

## v0.0.1 2017-07-07

* Initial release
