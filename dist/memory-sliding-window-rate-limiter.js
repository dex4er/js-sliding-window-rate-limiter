"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const base_sliding_window_rate_limiter_1 = require("./base-sliding-window-rate-limiter");
class MemorySlidingWindowRateLimiter extends base_sliding_window_rate_limiter_1.BaseSlidingWindowRateLimiter {
    constructor(options = {}) {
        super(options);
        this.buckets = {};
        this.timers = {};
        this.interval = Number(options.interval) || 60;
    }
    static returnResult(result, callback) {
        if (callback) {
            return callback(null, result);
        }
        else {
            return Promise.resolve(result);
        }
    }
    check(key, limit, callback) {
        this.bucketExpireNow(key);
        const usage = this.buckets[key].length;
        if (usage > limit) {
            return MemorySlidingWindowRateLimiter.returnResult(-limit, callback);
        }
        else {
            return MemorySlidingWindowRateLimiter.returnResult(usage, callback);
        }
    }
    reserve(key, limit, callback) {
        const now = this.bucketExpireNow(key);
        const usage = this.buckets[key].length;
        if (usage >= limit) {
            return MemorySlidingWindowRateLimiter.returnResult(-limit, callback);
        }
        else {
            this.buckets[key].push(now);
            if (this.timers[key]) {
                clearTimeout(this.timers[key]);
            }
            this.timers[key] = setTimeout(() => {
                delete this.buckets[key];
                delete this.timers[key];
            }, this.interval * 1000 /* ms */);
            return MemorySlidingWindowRateLimiter.returnResult(now, callback);
        }
    }
    cancel(key, ts, callback) {
        this.bucketExpireNow(key);
        let canceled = 0;
        const position = this.buckets[key].indexOf(ts);
        if (position !== -1) {
            canceled = this.buckets[key].splice(position, 1).length;
        }
        return MemorySlidingWindowRateLimiter.returnResult(canceled, callback);
    }
    async destroy() {
        for (const key of Object.keys(this.timers)) {
            clearTimeout(this.timers[key]);
        }
    }
    bucketExpireNow(key) {
        const now = new Date().getTime();
        this.buckets[key] = this.buckets[key] ? this.buckets[key].filter((ts) => now - ts < this.interval * 1000 /* ms */) : [];
        return now;
    }
}
exports.MemorySlidingWindowRateLimiter = MemorySlidingWindowRateLimiter;
