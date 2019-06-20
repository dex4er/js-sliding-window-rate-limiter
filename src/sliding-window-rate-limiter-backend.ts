type s = number

export interface SlidingWindowRateLimiterBackendOptions {
  interval?: s
}

export interface SlidingWindowRateLimiterBackend {
  readonly options: SlidingWindowRateLimiterBackendOptions
  readonly interval: s

  check(key: string, limit: number): Promise<number>
  reserve(key: string, limit: number): Promise<number>
  cancel(key: string, token: number): Promise<number>
  remaining(key: string, limit: number): Promise<s>
  destroy(): void
}
