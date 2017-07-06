class MockRedis {
  defineCommand (command, options) {
    this[command] = function (key, interval, limit, ttl, reserve, callback) {
      const usage = 1
      if (callback) {
        callback(null, usage)
      } else {
        return Promise.resolve(usage)
      }
    }
  }

  disconnect () {}
}

module.exports = MockRedis
