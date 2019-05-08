type ms = number
type s = number

export interface SlidingWindowRateLimiterBackendOptions {
  interval?: s
}

export interface SlidingWindowRateLimiterBackend {
  readonly options: SlidingWindowRateLimiterBackendOptions
  readonly interval: s

  check(key: string, limit: number): Promise<number>
  reserve(key: string, limit: number): Promise<number | ms>
  cancel(key: string, ts: ms): Promise<number | ms>
  destroy(): void
}
