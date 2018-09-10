export function delay (ms: number): Promise<void> {
  return new Promise((resolve, _reject) => {
    setTimeout(resolve, ms)
  })
}
