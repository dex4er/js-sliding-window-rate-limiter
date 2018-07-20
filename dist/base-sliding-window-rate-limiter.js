"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const events_1 = require("events");
class BaseSlidingWindowRateLimiter extends events_1.EventEmitter {
    constructor(options) {
        super();
        this.options = options;
    }
}
exports.BaseSlidingWindowRateLimiter = BaseSlidingWindowRateLimiter;
