type ms = number

export interface SlidingWindowRateLimiterBackendOptions {
  interval?: ms
}

export interface CancelResult {
  canceled: number
}

export interface CheckResult {
  usage: number
  reset?: ms
}

export interface ReserveResult {
  token?: number
  usage: number
  reset?: ms
}

export interface SlidingWindowRateLimiterBackend {
  readonly options: SlidingWindowRateLimiterBackendOptions
  readonly interval: ms

  cancel(key: string, token: number): Promise<CancelResult>
  check(key: string, limit: number): Promise<CheckResult>
  reserve(key: string, limit: number): Promise<ReserveResult>

  destroy(): void
}
