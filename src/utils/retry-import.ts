/**
 * Wraps a dynamic import so a transient chunk-load failure (CDN blip, flaky
 * network) is retried once after a short delay before giving up. Returning the
 * module on success and rejecting only after the retry also fails lets a
 * surrounding error boundary surface a recoverable UI.
 *
 * @param importFn  The dynamic import thunk, e.g. `() => import("./Page")`.
 * @param delayMs   Delay before the single retry attempt (default 1000ms).
 */
export function retryDynamicImport<T>(
  importFn: () => Promise<T>,
  delayMs = 1000
): Promise<T> {
  return importFn().catch(
    () =>
      new Promise<T>((resolve, reject) => {
        setTimeout(() => {
          importFn().then(resolve).catch(reject);
        }, delayMs);
      })
  );
}
