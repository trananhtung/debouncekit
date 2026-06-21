# Changelog

All notable changes to this project are documented here.
The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] - 2026-06-21

### Added

- `debounce(fn, wait?, options?)` — delays invocation until `wait` ms after the
  last call, with lodash-compatible `leading` / `trailing` / `maxWait` edges.
- `throttle(fn, wait?, options?)` — at most one invocation per `wait` ms, leading
  and trailing by default (built on `debounce` with `maxWait === wait`).
- `cancel()`, `flush()`, and `pending()` controls on the returned function.
- `AbortSignal` support: aborting cancels any pending call and disables further
  scheduling; an already-aborted signal makes the wrapper a no-op.
- Preserves argument types, return type, and `this`.
- ESM + CJS builds, types, and CI across Node 18 / 20 / 22.
