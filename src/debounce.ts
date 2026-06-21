/** Any function that can be debounced or throttled. */
export type AnyFn = (...args: never[]) => unknown;

export interface DebounceOptions {
  /** Invoke on the leading edge of the timeout. Default `false`. */
  leading?: boolean;
  /** Invoke on the trailing edge of the timeout. Default `true`. */
  trailing?: boolean;
  /**
   * Maximum time `fn` is allowed to be delayed before it is forced to run.
   * Turns a debounce into a debounce-with-a-ceiling (this is how `throttle`
   * is built).
   */
  maxWait?: number;
  /** Abort cancels any pending call and disables all further scheduling. */
  signal?: AbortSignal;
}

/** A debounced/throttled wrapper around a function, with manual controls. */
export interface Debounced<F extends AnyFn> {
  (this: ThisParameterType<F>, ...args: Parameters<F>): ReturnType<F> | undefined;
  /** Cancel any pending trailing invocation without calling `fn`. */
  cancel(): void;
  /** Immediately invoke a pending call (if any) and return its result. */
  flush(): ReturnType<F> | undefined;
  /** Whether a trailing invocation is currently scheduled. */
  pending(): boolean;
}

/**
 * Create a debounced function that delays invoking `fn` until `wait` ms have
 * elapsed since the last time it was called.
 *
 * Lodash-compatible `leading` / `trailing` / `maxWait` semantics, plus
 * `AbortSignal` support and `cancel` / `flush` / `pending` controls. Zero deps.
 *
 * ```ts
 * const save = debounce(persist, 300);
 * input.addEventListener("input", () => save(input.value));
 * ```
 */
export function debounce<F extends AnyFn>(
  fn: F,
  wait = 0,
  options: DebounceOptions = {},
): Debounced<F> {
  if (typeof fn !== "function") {
    throw new TypeError("debounce: expected a function");
  }

  const leading = options.leading ?? false;
  const trailing = options.trailing ?? true;
  const maxing = options.maxWait !== undefined;
  const maxWait = maxing ? Math.max(options.maxWait as number, wait) : 0;
  const signal = options.signal;

  let lastArgs: Parameters<F> | undefined;
  let lastThis: ThisParameterType<F> | undefined;
  let result: ReturnType<F> | undefined;
  let timer: ReturnType<typeof setTimeout> | undefined;
  let lastCallTime: number | undefined;
  let lastInvokeTime = 0;
  let aborted = false;

  const now = () => Date.now();

  function invokeFunc(time: number): ReturnType<F> | undefined {
    const args = lastArgs as Parameters<F>;
    const thisArg = lastThis;
    lastArgs = undefined;
    lastThis = undefined;
    lastInvokeTime = time;
    result = fn.apply(thisArg, args) as ReturnType<F>;
    return result;
  }

  function startTimer(pendingFor: number): void {
    timer = setTimeout(timerExpired, pendingFor);
  }

  function leadingEdge(time: number): ReturnType<F> | undefined {
    lastInvokeTime = time;
    startTimer(wait);
    return leading ? invokeFunc(time) : result;
  }

  function remainingWait(time: number): number {
    const timeSinceLastCall = time - (lastCallTime as number);
    const timeSinceLastInvoke = time - lastInvokeTime;
    const timeWaiting = wait - timeSinceLastCall;
    return maxing
      ? Math.min(timeWaiting, maxWait - timeSinceLastInvoke)
      : timeWaiting;
  }

  function shouldInvoke(time: number): boolean {
    if (lastCallTime === undefined) return true;
    const timeSinceLastCall = time - lastCallTime;
    const timeSinceLastInvoke = time - lastInvokeTime;
    return (
      timeSinceLastCall >= wait ||
      timeSinceLastCall < 0 ||
      (maxing && timeSinceLastInvoke >= maxWait)
    );
  }

  function timerExpired(): void {
    const time = now();
    if (shouldInvoke(time)) {
      trailingEdge(time);
      return;
    }
    startTimer(remainingWait(time));
  }

  function trailingEdge(time: number): ReturnType<F> | undefined {
    timer = undefined;
    if (trailing && lastArgs) return invokeFunc(time);
    lastArgs = undefined;
    lastThis = undefined;
    return result;
  }

  function cancel(): void {
    if (timer !== undefined) clearTimeout(timer);
    lastInvokeTime = 0;
    lastArgs = undefined;
    lastCallTime = undefined;
    lastThis = undefined;
    timer = undefined;
  }

  function flush(): ReturnType<F> | undefined {
    return timer === undefined ? result : trailingEdge(now());
  }

  function pending(): boolean {
    return timer !== undefined;
  }

  function debounced(
    this: ThisParameterType<F>,
    ...args: Parameters<F>
  ): ReturnType<F> | undefined {
    if (aborted) return result;
    const time = now();
    const isInvoking = shouldInvoke(time);

    lastArgs = args;
    lastThis = this;
    lastCallTime = time;

    if (isInvoking) {
      if (timer === undefined) return leadingEdge(lastCallTime);
      if (maxing) {
        startTimer(wait);
        return invokeFunc(lastCallTime);
      }
    }
    if (timer === undefined) startTimer(wait);
    return result;
  }

  debounced.cancel = cancel;
  debounced.flush = flush;
  debounced.pending = pending;

  if (signal) {
    if (signal.aborted) {
      aborted = true;
    } else {
      signal.addEventListener(
        "abort",
        () => {
          aborted = true;
          cancel();
        },
        { once: true },
      );
    }
  }

  return debounced;
}
