"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const redis_sliding_window_rate_limiter_1 = require("./redis-sliding-window-rate-limiter");
const ERROR_EVENT = 'error';
class SafeRedisSlidingWindowRateLimiter extends redis_sliding_window_rate_limiter_1.RedisSlidingWindowRateLimiter {
    constructor(options) {
        super(options);
        this.reconnectTimeout = Number(options.reconnectTimeout) || 2000;
        this.defaultResponse = Number(options.defaultResponse) || 0;
        this.redisServiceAvailable = true;
    }
    check(key, limit, callback) {
        return this.handleOperation('check', key, limit, callback);
    }
    reserve(key, limit, callback) {
        return this.handleOperation('reserve', key, limit, callback);
    }
    cancel(key, ts, callback) {
        return this.handleOperation('cancel', key, ts, callback);
    }
    async destroy() {
        await super.destroy();
        if (this.reconnectTimer) {
            clearTimeout(this.reconnectTimer);
        }
        this.removeAllListeners(ERROR_EVENT);
    }
    handleOperation(operationName, key, operationArg, callback) {
        if (callback) {
            if (this.redisServiceAvailable) {
                return super[operationName](key, operationArg, this.callbackErrorHandler(callback, this.defaultResponse));
            }
            else {
                return callback(null, this.defaultResponse);
            }
        }
        else {
            if (this.redisServiceAvailable) {
                return this.promiseErrorHandler(super[operationName](key, operationArg), this.defaultResponse);
            }
            else {
                return Promise.resolve(this.defaultResponse);
            }
        }
    }
    callbackErrorHandler(successCallback, defaultResponse) {
        return (err, successValue) => {
            if (err) {
                this.handleError(err);
                successCallback(null, defaultResponse);
            }
            else {
                successCallback(null, successValue);
            }
        };
    }
    promiseErrorHandler(originPromise, defaultResponse) {
        return new Promise((resolve) => {
            originPromise.then((successValue) => {
                resolve(successValue);
            }, (error) => {
                this.handleError(error);
                resolve(defaultResponse);
            });
        });
    }
    handleError(error) {
        this.markServiceAsUnavailable();
        this.emit(ERROR_EVENT, error);
    }
    markServiceAsUnavailable() {
        this.redisServiceAvailable = false;
        if (this.reconnectTimer) {
            clearTimeout(this.reconnectTimer);
        }
        this.reconnectTimer = setTimeout(() => {
            this.redisServiceAvailable = true;
        }, this.reconnectTimeout);
    }
}
exports.SafeRedisSlidingWindowRateLimiter = SafeRedisSlidingWindowRateLimiter;
