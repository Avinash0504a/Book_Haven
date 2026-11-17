# Performance and consistency check (T146)

Date: 2026-11-14. This file will also receive the clean-checkout output (T141) once that is run.

## SC-010: `GET /api/products` with filters on the seed data

- Setup: backend started from this working tree against an empty `books` database, so Flyway
  created the schema and the seed catalogue. Bound to `127.0.0.1:5000`, plain HTTP, no profile.
- Method: 100 sequential requests rotating through eight filtered queries (category, language,
  format, price band, sort by price both ways, search, language with sort, format with paging).
  Seed data sanity: filtered queries returned 12 or fewer rows per page and 3 to 5 rows for the
  narrow ones, so the filters are active, not ignored.
- Result:

| Requests | Errors | Min | Median | p95 | Max | Under 2 s |
|---------:|-------:|----:|-------:|----:|----:|----------:|
| 100 | 0 | 14 ms | 21 ms | 31 ms | 44 ms | 100 % |

SC-010 (95 percent under 2 seconds): **met**. The seed catalogue is small, so this proves the
query path is sound, not behaviour under a large catalogue.

## Console and test-run cleanliness

- Frontend run of all 49 test files and 179 tests: 0 failures, 0 unhandled rejections, 0 React
  warnings, 0 `[MSW] intercepted a request without a matching request handler` warnings.
- Two sources of noise were found and fixed during this check:
  - jsdom `Not implemented: navigation` came from the E-Library download test clicking a real
    anchor; the test now stubs `HTMLAnchorElement.prototype.click`.
  - `AggregateError` and MSW warnings came from `GET /api/orders` and `GET /api/orders/:id` having
    no default handler; defaults were added to `src/test/handlers.js`. MSW now runs with
    `onUnhandledRequest: 'warn'` so a missing handler is visible instead of silently bypassed.

## Browser console check (headless Chrome, live backend, Light and Dark)

- Walk 1: 15 pages plus the cart and checkout. Walk 2: wishlist, wallet top-up, eBook reader,
  review, COD, UPI, Net Banking and Wallet purchases, orders list, gift points, profile address edit
  and delete. Walk 3: a full card purchase, then cancel preview and confirm.
- Result: no console errors or warnings and no HTTP 4xx or 5xx on any step, in either theme, after
  the fixes listed in `wireframe-conformance.md`.
- Ignored on purpose: `GET /favicon.ico` returns 404 because the app ships no favicon (cosmetic).
- Not walked: the audiobook player and file download, the `/checkout` digital-only path with a
  card, and any screen at a narrow (mobile) width. A person should open those once.
