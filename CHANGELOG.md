# Changelog

## v6.0.1 2024-06-24

- Use `node:` prefix for Node modules.

## v6.0.0 2024-06-24

- Converted to ESM module.
- Requires Node >= 16.
- Uses ioredis@5.

## v5.0.0 2020-10-04

- Requires Node >= 10.
- Converted from tslint to eslint.
- Deep requires are deprecated for uuid@8.

## v4.1.1 2019-10-08

- Update dependencies.

## v4.1.0 2019-08-06

- Safe limiter registers own listener for `error` event so errors are ignored
  by default.

## v4.0.0 2019-07-11

- Breaking change: `interval` parameter is milliseconds now.

## v3.0.0 2019-06-24

- Limiter's methods return result object with `token`, `usage`, `reset` and
  `canceled` properties.
- Lua script is split to separate scripts one by method and not minified
  anymore.
- Removed `defaultResponse` option from safe Redis backend.

## v2.1.2 2019-06-04

- Updated dependencies.

## v2.1.1 2019-06-04

- Minor tweaks in README.
- Added source map to the package.

## v2.1.0 2019-05-08

- `SlidingWindowRateLimiter.createLimiter` is now a static method rather than
  part of a namespace.

## v2.0.0 2019-03-22

- Breaking change: dropped support for Node 6.

## v1.5.0 2019-03-22

- Support for Node 6 has been restored and will be dropped in 2.x.x versions.

## v1.4.0 2019-03-21

- Dropped support for Node 6. `async`/`await` syntax is used and ES2017 code is generated.

## v1.3.0 2019-03-21

- Typescript: use `import IORedis = require('ioredis')` syntax so it can be used
  in a project without `esModuleInterop` compiler option.

## v1.2.0 2018-08-29

- IORedis typings without Bluebird.

## v1.1.3 2018-08-29

- Distribute with src directory too.

## v1.1.2 2018-08-17

- ioredis@4.0.0

## v1.1.1 2018-08-10

- Refactoring for option `operationTimeout`.

## v1.1.0 2018-08-09

- New option `operationTimeout` for Redis and SafeRedis backends.

## v1.0.1 2018-08-09

- Fix devDependencies.

## v1.0.0 2018-08-09

- Converted to Typescript.
- Callback API is removed. Only Promises are available.
- Prefer `import SlidingWindowRateLimiter from 'sliding-window-rate-limiter'`
  syntax.
- Mocha for tests.

## v0.5.0 2018-08-01

- Use ioredis@4 because of new `maxRetriesPerRequest` option.
- Dropped support for Node < 6
- `reconnectTimeout` option of safe limiter renamed to `reuseRedisAfter`.
- Redis client calls are wrapped with try/catch and then return error
  asynchronously.

## v0.4.0 2018-02-10

- Typescript: support `esModuleInterop` compiler option.

## v0.3.0 2017-10-17

- New `SafeRedis` backend.
- Method `cancel` returns the number of canceled reservations and doesn't
  have `limit` argument anymore.

## v0.2.0 2017-10-12

- `SlidingWindowRateLimiter.createLimiter` is a factory method which returns
  proper backed based on options.
- Use Redis-less backend if `redis` option is not defined.

## v0.1.0 2017-10-10

- `limit` is a argument of methods.
- New method `cancel`.
- Exports also as a class and namespace and the default.
- Typescript typings.

## v0.0.1 2017-07-07

- Initial release
