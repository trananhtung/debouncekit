# debouncekit

[![All Contributors](https://img.shields.io/badge/all_contributors-1-orange.svg?style=flat-square)](#contributors-)

> Tiny, type-safe **`debounce`** and **`throttle`** — lodash-compatible `leading` / `trailing` / `maxWait`, plus **`AbortSignal`** and `cancel` / `flush` / `pending`. **Zero dependencies**.

[![CI](https://github.com/trananhtung/debouncekit/actions/workflows/ci.yml/badge.svg)](https://github.com/trananhtung/debouncekit/actions/workflows/ci.yml)
[![npm version](https://img.shields.io/npm/v/debouncekit.svg)](https://www.npmjs.com/package/debouncekit)
[![bundle size](https://img.shields.io/bundlephobia/minzip/debouncekit)](https://bundlephobia.com/package/debouncekit)
[![types](https://img.shields.io/npm/types/debouncekit.svg)](https://www.npmjs.com/package/debouncekit)
[![license](https://img.shields.io/npm/l/debouncekit.svg)](./LICENSE)

You usually reach for `lodash.debounce` and pull in a chunk of lodash, or copy a
half-correct snippet that botches `maxWait` and leaks the timer. `debouncekit` is
the whole thing — correct leading/trailing/maxWait edges — in a **zero-dependency**,
fully-typed package, plus the modern bits lodash never added: an **`AbortSignal`**
to tear it down, and `cancel` / `flush` / `pending` for explicit control.

```ts
import { debounce } from "debouncekit";

const save = debounce((draft: string) => persist(draft), 300);

input.addEventListener("input", () => save(input.value)); // coalesces keystrokes
// later: save.flush() to persist now, save.cancel() to drop it
```

## Why debouncekit?

- **Debounce & throttle in one tiny module.** `throttle` is just `debounce` with
  `maxWait === wait`, so behavior is consistent and predictable.
- **lodash-compatible edges.** `leading`, `trailing`, and `maxWait` behave exactly
  as you expect — drop-in for the cases people actually use.
- **Cancellable.** Pass an `AbortSignal`; aborting cancels any pending call and
  disables further scheduling. No dangling timers.
- **Explicit control.** `cancel()` drops a pending call, `flush()` runs it now and
  returns its result, `pending()` tells you if one is scheduled.
- **Type-safe.** Argument types, return type, and `this` are all preserved.
- **Zero dependencies**, ESM + CJS + types, ~1 kB min+gzip.

## Install

```bash
npm install debouncekit
# or: pnpm add debouncekit  /  yarn add debouncekit  /  bun add debouncekit
```

## `debounce(fn, wait?, options?)`

Delays `fn` until `wait` ms have passed since the last call.

```ts
import { debounce } from "debouncekit";

const search = debounce((q: string) => fetchResults(q), 250);
search("a"); search("ab"); search("abc");
// only fetchResults("abc") runs, 250ms after the last keystroke
```

```ts
interface DebounceOptions {
  leading?: boolean;  // fire on the leading edge (default false)
  trailing?: boolean; // fire on the trailing edge (default true)
  maxWait?: number;   // force a call after at most this many ms
  signal?: AbortSignal;
}
```

The returned function carries:

| Member | Description |
| --- | --- |
| `cancel()` | Drop the pending trailing call without invoking `fn`. |
| `flush()` | Invoke a pending call immediately; returns its result. |
| `pending()` | `true` if a trailing call is currently scheduled. |

`maxWait` turns a debounce into a debounce-with-a-ceiling: under constant
pressure `fn` still runs at least once every `maxWait` ms.

## `throttle(fn, wait?, options?)`

Invokes `fn` at most once per `wait` ms (leading **and** trailing by default).

```ts
import { throttle } from "debouncekit";

const onScroll = throttle(() => measure(), 100);
window.addEventListener("scroll", onScroll);

// drop the trailing call and tear everything down
const ac = new AbortController();
const ping = throttle(send, 1000, { signal: ac.signal });
// ac.abort() → no more pings, pending call cancelled
```

`ThrottleOptions` is `{ leading?, trailing?, signal? }` — same `cancel` / `flush`
/ `pending` controls as `debounce`.

## Notes

- Calls preserve `this` and are invoked with the **most recent** arguments.
- The synchronous return value is the result of the last actual invocation
  (like lodash); use `flush()` when you need the result right now.
- Works anywhere `setTimeout` exists — Node and browsers.

## Pairs well with

| Need | Use |
| --- | --- |
| Cap *concurrency* of async work | [`runpool`](https://www.npmjs.com/package/runpool) |
| Cap *rate* (token bucket, per second) | [`ratebucket`](https://www.npmjs.com/package/ratebucket) |
| Retry a flaky async call | [`retryfn`](https://www.npmjs.com/package/retryfn) |
| Add a timeout to awaited work | [`timefence`](https://www.npmjs.com/package/timefence) |

## Contributors ✨

This project follows the [all-contributors](https://github.com/all-contributors/all-contributors) specification. Contributions of any kind are welcome — code, docs, bug reports, ideas, reviews! See the [emoji key](https://allcontributors.org/docs/en/emoji-key) for how each contribution is recognized, and open a PR or issue to get involved.

Thanks goes to these wonderful people:

<!-- ALL-CONTRIBUTORS-LIST:START - Do not remove or modify this section -->
<!-- prettier-ignore-start -->
<!-- markdownlint-disable -->
<table>
  <tbody>
    <tr>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/trananhtung"><img src="https://avatars.githubusercontent.com/u/30992229?v=4?s=100" width="100px;" alt="Tung Tran"/><br /><sub><b>Tung Tran</b></sub></a><br /><a href="https://github.com/trananhtung/debouncekit/commits?author=trananhtung" title="Code">💻</a> <a href="#maintenance-trananhtung" title="Maintenance">🚧</a></td>
    </tr>
  </tbody>
</table>

<!-- markdownlint-restore -->
<!-- prettier-ignore-end -->

<!-- ALL-CONTRIBUTORS-LIST:END -->

## License

[MIT](./LICENSE) © Tung Tran
