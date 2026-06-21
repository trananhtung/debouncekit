import { debounce, type AnyFn, type Debounced } from "./debounce.js";

/** Options for {@link throttle} (a subset of debounce options; `maxWait` is fixed). */
export interface ThrottleOptions {
  /** Invoke on the leading edge. Default `true`. */
  leading?: boolean;
  /** Invoke on the trailing edge. Default `true`. */
  trailing?: boolean;
  /** Abort cancels any pending call and disables further scheduling. */
  signal?: AbortSignal;
}

/**
 * Create a throttled function that invokes `fn` at most once per `wait` ms.
 *
 * Throttle is debounce with `maxWait === wait`: the call still coalesces, but
 * it can never be starved past one interval. Defaults to firing on both the
 * leading and trailing edges. Same `cancel` / `flush` / `pending` controls.
 *
 * ```ts
 * const onScroll = throttle(measure, 100);
 * window.addEventListener("scroll", onScroll);
 * ```
 */
export function throttle<F extends AnyFn>(
  fn: F,
  wait = 0,
  options: ThrottleOptions = {},
): Debounced<F> {
  return debounce(fn, wait, {
    leading: options.leading ?? true,
    trailing: options.trailing ?? true,
    maxWait: wait,
    signal: options.signal,
  });
}
