import { EventEmitter } from 'events'

export interface SlidingWindowRateLimiterOptions {
  interval?: number
}

export type ResultCallback = (error: Error | null, result?: number) => any
export type LimiterResult = Promise<number> | void

export abstract class BaseSlidingWindowRateLimiter<T extends SlidingWindowRateLimiterOptions = SlidingWindowRateLimiterOptions> extends EventEmitter {
  constructor (protected options: T) {
    super()
  }

  abstract check (key: string, limit: number, callback?: ResultCallback): LimiterResult

  abstract reserve (key: string, limit: number, callback?: ResultCallback): LimiterResult

  abstract cancel (key: string, ts: number, callback?: ResultCallback): LimiterResult

  abstract async destroy (): Promise<void>
}
