export interface SlidingWindowRateLimiterBackendOptions {
  interval?: number
}

export interface CancelResult {
  canceled: number
}

export interface CheckResult {
  usage: number
  reset?: number
}

export interface ReserveResult {
  token?: number
  usage: number
  reset?: number
}

export interface SlidingWindowRateLimiterBackend {
  readonly options: SlidingWindowRateLimiterBackendOptions
  readonly interval: number

  cancel(key: string, token: number): Promise<CancelResult>
  check(key: string, limit: number): Promise<CheckResult>
  reserve(key: string, limit: number): Promise<ReserveResult>

  destroy(): void
}
