class MockRedis {
  constructor (options) {
    options = options || {}
    this.host = options.host
    this.bucket = []
  }

  defineCommand (command, options) {}

  disconnect () {}

  // naive implementation of limiter
  limiter (key, interval, limit, reserve, callback) {
    const now = new Date().getTime()

    this.bucket = this.bucket.filter(ts => now - ts < interval * 1000 /* ms */)

    let usage = this.bucket.length

    if (reserve) {
      if (usage >= limit) {
        usage = -limit
      } else {
        this.bucket.push(now)
        usage = this.bucket.length
      }
    } else {
      if (usage > limit) {
        usage = -limit
      }
    }

    if (callback) {
      callback(null, usage)
    } else {
      return Promise.resolve(usage)
    }
  }
}

module.exports = MockRedis
