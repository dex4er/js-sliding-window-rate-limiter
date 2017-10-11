import {SlidingWindowRateLimiter, SlidingWindowRateLimiterOptions} from "./sliding-window-rate-limiter";

export interface SafeSlidingWindowRateLimiterOptions extends SlidingWindowRateLimiterOptions{
  reconnectTimeout?: number
}

export declare class SafeSlidingWindowRateLimiter extends SlidingWindowRateLimiter{
  constructor (options: SafeSlidingWindowRateLimiterOptions)

  onConnectionLost (callback: (error: Error) => any): void
  removeConnectionLostListener (callback: (error: Error) => any): void
}
