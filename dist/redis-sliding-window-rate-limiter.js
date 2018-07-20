"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("fs"));
const ioredis_1 = __importDefault(require("ioredis"));
const path_1 = __importDefault(require("path"));
const base_sliding_window_rate_limiter_1 = require("./base-sliding-window-rate-limiter");
const lua = process.env.DEBUG_LUA
    ? fs_1.default.readFileSync(path_1.default.join(__dirname, './sliding-window-rate-limiter.lua'), 'utf8')
    : fs_1.default.readFileSync(path_1.default.join(__dirname, './sliding-window-rate-limiter.min.lua'), 'utf8');
const MODE_CHECK = 0;
const MODE_RESERVE = 1;
const MODE_CANCEL = 2;
class RedisSlidingWindowRateLimiter extends base_sliding_window_rate_limiter_1.BaseSlidingWindowRateLimiter {
    constructor(options = {}) {
        super(options);
        this.options = options;
        this.interval = Number(options.interval) || 60;
        if (!options.redis || typeof options.redis === 'string') {
            this.redis = new ioredis_1.default(options.redis);
        }
        else {
            this.redis = options.redis;
        }
        this.redis.defineCommand('limiter', {
            lua,
            numberOfKeys: 1
        });
    }
    check(key, limit, callback) {
        return this.limiter(key, MODE_CHECK, this.interval, limit, 0, callback);
    }
    reserve(key, limit, callback) {
        return this.limiter(key, MODE_RESERVE, this.interval, limit, 0, callback);
    }
    cancel(key, ts, callback) {
        return this.limiter(key, MODE_CANCEL, this.interval, 0, ts, callback);
    }
    async destroy() {
        if (!this.options.redis || typeof this.options.redis === 'string') {
            await this.redis.quit();
        }
    }
    limiter(key, mode, interval, limit, ts, callback) {
        return this.redis.limiter(key, mode, interval, limit, ts, callback);
    }
}
exports.RedisSlidingWindowRateLimiter = RedisSlidingWindowRateLimiter;
