# Implementation Plan: Book Haven Online Bookstore

**Branch**: `001-book-haven-bookstore` | **Date**: 2026-11-13 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/001-book-haven-bookstore/spec.md`

## Summary

Build Book Haven, an online bookstore matching the reference project's interface, styling and
features, while avoiding its known defects. The backend (Spring Boot, PostgreSQL database `books`)
is built and verified first, against a handwritten OpenAPI contract that a contract test enforces.
The frontend (React 18, Vite, Tailwind with CSS-variable theme tokens) follows, starting from the
theme tokens, then the API client, stores and providers, then pages.

Money, delivery dates, points earned and cancellation eligibility are calculated only by the
server. Tier 1 (spec stories 1-8) is built and verified before Tier 2 (stories 9-14, required).
Work is delivered in 9 small phases, each ending in a commit.

Design artifacts: [research.md](research.md), [data-model.md](data-model.md),
[contracts/openapi.yaml](contracts/openapi.yaml), [coverage-matrix.md](coverage-matrix.md),
[quickstart.md](quickstart.md).

## Technical Context

**Language/Version**: Java 21 (backend); JavaScript ES2023 on Node 22 (frontend, no TypeScript)

**Primary Dependencies**: Backend: Spring Boot 4.1.2 (decision O1), Spring Data JPA,
Spring Security, Jakarta Validation, JJWT 0.13.0, PostgreSQL driver 42.7.14, Flyway (versions
managed by the Boot BOM; Boot 4 starter names are listed in research D1).
Frontend: React 18.3.1, Vite 8.3.8, Tailwind CSS 4.3.5, TanStack Query 5.107.1, Axios,
react-router-dom, react-hook-form with zod and `@hookform/resolvers`, lucide-react.
Versions were read from Maven Central and npm on 2026-11-13; exact versions are in research D1 and D12.

**Storage**: PostgreSQL 18, database `books` (run) and `books_test` (integration tests); schema and
seed catalogue by Flyway migrations; `ddl-auto=validate`.

**Testing**: JUnit 5, Mockito, Spring Boot Test with MockMvc, and the OpenAPI contract test
(backend); Vitest, Testing Library, MSW and ESLint with `jsx-a11y` (frontend); a token check script
for colours.

**Target Platform**: Backend on a JVM bound to `127.0.0.1:5000`; frontend in current desktop and
mobile browsers (Vite dev server on `localhost:5173`).

**Project Type**: Web application (backend + frontend)

**Performance Goals**: Browse and search respond within 2 s for 95% of requests (spec SC-010);
paginated lists (12 per page, maximum 48); indexes on category, author, format and language.

**Constraints**: One validation status (400); envelope on every response; no secrets or default
credentials in the repository; configuration only through environment variables; CORS limited to
one origin; services bind to localhost; no hard-coded colours; the server is the source of truth
for money, points and cancellation.

**Scale/Scope**: Demo scale (hundreds of books, tens of members). 52 API operations (34 Tier 1,
18 Tier 2), 18 tables, about 25 frontend routes.

## Constitution Check

*GATE: passed before Phase 0 research, re-checked after Phase 1 design.*

| Principle | How the plan satisfies it | Status |
|-----------|---------------------------|--------|
| I. API-First Contract | `contracts/openapi.yaml` is handwritten with `x-requirements` and `x-tier` on all 52 operations. `OpenApiContractTest` fails the build on route drift, broken `$ref`s, unknown requirement IDs, any documented 422 and error-code drift. The spec changes first, then the code. | Pass |
| II. Layered, domain-organised | Backend packages `member`, `catalog`, `cart`, `order`, `payment`, `shipping`, each with controller, service, repository, entity and dto. Controllers hold no business logic and return DTOs only. Frontend features each have `api`, `hooks`, `components`, `pages`; shared code in `lib`. All HTTP goes through one Axios client; server state through TanStack Query. | Pass |
| III. Consistent responses and validation | One `ApiResponse` envelope and one `GlobalExceptionHandler`. Validation is always 400 with `fieldErrors`. Stable `ErrorCode` enum is in the contract. Client validation (zod) mirrors the server table of cases. 500 has a fixed message. | Pass |
| IV. Test-gated delivery | Every service has unit tests and every endpoint an integration test, mapped in `coverage-matrix.md`. Each phase has an exit gate that requires green tests. No skipped tests. | Pass |
| V. Security by default | All secrets from environment variables with no defaults; startup fails without them; BCrypt; JWT; ownership enforced in services; single-origin CORS; `127.0.0.1` binding; `.gitignore` with `.env`; `check-secrets` script; card data never stored or logged. | Pass |
| VI. Server-authoritative, real, themeable UI | Cart, order and confirmation DTOs carry totals, `pointsEarned`, `deliveryDate` and `cancellable`; the client only renders them. `check:tokens` fails the build on hard-coded colours. A page-level test asserts no dead buttons. lucide-react for icons. | Pass |
| VII. Simplicity and clear code | The related-books table is dropped in favour of a query. No generic frameworks, no CQRS, no event bus. Additions beyond the stack are justified below. | Pass, with justified additions |
| Stack constraint | Backend and frontend stacks as listed. Additions to the stack are Flyway and test tooling (see Complexity Tracking). | Pass, with additions |
| Process | Backend before frontend; small phases; commit after each; reference rebuilt through the spec-driven process, never pasted. | Pass |

**Post-design re-check**: no new violations. All five open items are decided (see below); the
constitution is at version 1.1.0 (Spring Boot 4 amendment).

## Decisions on the open items (all closed 2026-11-14)

| ID | Item | Decision |
|----|------|----------|
| O1 | **Spring Boot line.** The constitution said "Spring Boot 3"; the security policy forbids EOL or extended-support-only versions. | **Spring Boot 4.1.2.** Constitution amended to 1.1.0 ("Spring Boot 4, 4.1.x line"). Starter and library differences are in research D1. |
| O2 | **Delivery date rule** (research D4): 14:00 cut-off, 1 day handling, 2 days to metro pincodes and 4 elsewhere, no Sunday delivery. | **Accepted.** Written into the spec clarifications (2026-11-14); the numbers are configuration. |
| O3 | **Status for state conflicts.** `CANNOT_CANCEL`, `INSUFFICIENT_WALLET_BALANCE` and `EMPTY_CART` are 409; the baseline used 400. | **Accepted: 409.** FR-074a now lists them. |
| O4 | **Spec Assumptions** said Pending orders "cancel with no fee". Unpaid orders expire or fail and are never cancellable. | **Accepted.** The Assumptions sentence is replaced and the clarification recorded. |
| O5 | **Reference path.** The constitution says `reference/projectA`. | **Folder renamed to `reference/projectA`.** The constitution TODO is removed. |

## Project Structure

### Documentation (this feature)

```text
specs/001-book-haven-bookstore/
├── spec.md
├── plan.md                 # this file
├── research.md             # Phase 0
├── data-model.md           # Phase 1
├── coverage-matrix.md      # Phase 1: checklist -> phase -> test
├── quickstart.md           # Phase 1: build, test, run, validate
├── contracts/openapi.yaml  # Phase 1: handwritten source of truth
├── checklists/requirements.md
└── tasks.md                # /speckit-tasks (not created here)
```

### Source code (repository root)

```text
.gitignore                          # first file created in Phase 1
backend/
├── pom.xml
└── src/
    ├── main/
    │   ├── java/com/bookhaven/
    │   │   ├── BookHavenApplication.java
    │   │   ├── common/             # ApiResponse, ErrorCode, AppException, GlobalExceptionHandler, MoneyUtil, ClockConfig
    │   │   ├── config/             # properties binding and fail-fast checks, CorsConfig, SchedulingConfig
    │   │   ├── security/           # SecurityConfig, JwtService, JwtAuthFilter, CurrentMember
    │   │   ├── member/             # controller, service, repository, entity, dto  (auth, profile, points)
    │   │   ├── catalog/            # books, categories, brands, authors, reviews, wishlist, notify-me, recommendations
    │   │   ├── cart/               # cart, cart items
    │   │   ├── order/              # checkout, orders, cancellation, expiry job, fulfilment simulator
    │   │   ├── payment/            # PaymentDetailsValidator, SimulatedGateway, wallet
    │   │   └── shipping/           # DeliveryEstimator, ShippingCalculator, addresses
    │   └── resources/
    │       ├── application.properties          # no secret defaults
    │       ├── application-dev.properties
    │       ├── db/migration/V1__schema.sql
    │       ├── db/migration/V2__seed_catalog.sql
    │       └── static/covers/                  # generated SVG covers
    └── test/java/com/bookhaven/    # unit, integration, contract (OpenApiContractTest)
frontend/
├── package.json  vite.config.js  index.html  eslint.config.js
└── src/
    ├── styles/theme.css            # CSS-variable tokens, light and dark; created first
    ├── lib/                        # axiosClient, queryClient, format, schemas (zod), errors
    ├── providers/                  # AuthProvider, ThemeProvider, PincodeProvider, QueryProvider
    ├── components/                 # ui primitives and layout (Navbar, Footer)
    ├── features/
    │   ├── auth/  catalog/  cart/  checkout/  orders/      # Tier 1
    │   └── wallet/  wishlist/  writers/  reviews/  library/  profile/  help/   # Tier 2
    │       (each feature: api/  hooks/  components/  pages/)
    └── App.jsx  main.jsx
scripts/
├── check-secrets.ps1               # fails on committed secrets or .env
├── check-tokens.mjs                # fails on hard-coded colours
├── check-env-docs.ps1              # README variables equal properties file
└── generate-covers.mjs
README.md
```

**Structure Decision**: web application with `backend/` and `frontend/`, as in the constitution.
The contract lives with the spec in `contracts/openapi.yaml`; `OpenApiContractTest` reads it through
one path constant.

## Phases

Each phase ends with its exit gate green and a commit. Work stops at a gate until it passes.

| # | Phase | Scope | Exit gate |
|---|-------|-------|-----------|
| 1 | Backend foundation | `.gitignore`; Maven project; configuration from environment with fail-fast; Flyway V1 schema and V2 seed; entities and repositories; envelope, `ErrorCode`, global handler (one 400); Spring Security, JWT, BCrypt, CORS single origin; auth endpoints; dev-only demo member seeder; **contract test and the contract in CI path** | `mvn verify`: auth tests, config and CORS tests, seed tests, contract test green; app refuses to start without `APP_JWT_SECRET`; restart does not alter data |
| 2 | Catalogue, recommendations, cart, addresses | Filters, sort, search, pagination, detail, related, recommendations, delivery estimator, notify-me, cart, addresses with default rules | Matrix rows for P2 green; ownership tests green; contract test still green |
| 3 | Checkout, payment, orders, cancellation | Pricing, order creation with stock reservation and idempotency, payment validation and simulated gateway, confirm and fail, 15-minute expiry, fulfilment simulator, order history, buy again, cancel preview and cancel with 48-hour window and fee tiers, wallet and bank refunds | Matrix rows for P3 green, including boundary tests with a fixed clock; **backend gate**: the quickstart backend scenarios 1-9 pass |
| 4 | Frontend foundation | Vite project; `theme.css` tokens and the token check; Axios client; auth, theme and pincode stores; Query client; routing and `RequireAuth`; Navbar (links, pincode picker, wallet pill, cart badge 9+, user menu with theme toggle), Footer; login and register | `check:tokens`, lint, tests and build green; light, dark and system verified on login and register |
| 5 | Frontend browse | Home with category sidebar or pills, filters in the URL, curated rows, paginated results; book tile; Add to Cart control and stepper; product page with stock badge, pincode check, related, about the writer, Notify Me | Phase tests green; manual scenario 2 passes in both themes |
| 6 | Frontend cart, checkout, payment, confirmation | Cart with address selector (default pre-selected), progress bar, points hint; single address form; payment tabs and zod validation mirroring the server; gift points redemption; confirmation page | Phase tests green, including the invalid-payment table shared with the backend; manual scenario 3 and 4 pass in both themes |
| 7 | Frontend orders | History with tracker, details, Buy Again, cancel flow with preview, reason and refund destination; Cancel hidden when the server says `cancellable=false` | Phase tests green; **Tier 1 verified end to end** (spec SC-011) |
| 8 | Tier 2 extras (required) | Wallet top-up, wishlist, writers and follow, reviews, E-Library and reader, gift points history, profile and addresses, help page; backend first, then frontend, per feature | Tier 2 matrix rows green |
| 9 | Polish | README (run instructions, variable table checked against the properties file), full test pass, secret scan, accessibility pass, dependency audit | All commands in "Build, test and run" green on a clean checkout |

Phase 8 starts only after the Phase 7 gate. Tier 2 is required: the build is not complete until the
Phase 8 gate passes. Tier 2 navbar entries are added as each feature is built, so no link is ever
dead (spec FR-070).

## Testing strategy

| Layer | Tool | What it proves | Where |
|-------|------|----------------|-------|
| Pure rules | JUnit 5, no Spring | Pricing, shipping, points, cancellation math, delivery estimator, payment validators, state machine | `*UT` classes; fixed `Clock` |
| Services | JUnit 5 + Mockito | Business flow with repositories mocked: reservation, expiry, refunds, recommendations | `*ServiceTest` |
| Endpoints | Spring Boot Test + MockMvc on `books_test` | Status, envelope, validation, ownership, persistence | `*IT` classes; tests roll back or clean per class |
| Contract | `OpenApiContractTest` | Code and `openapi.yaml` agree (routes, refs, ids, requirements, error codes, no 422) | Runs inside `mvn verify`; fails the build |
| Frontend units | Vitest + Testing Library | Components, hooks, zod schemas | `*.test.jsx` |
| Frontend flows | Vitest + MSW | Pages with a mocked API: filters in URL, default address, payment forms, no dead buttons, no promo or language controls | page tests |
| Colours | `check-tokens.mjs` | No hex, `rgb()` or default palette classes in `src` | `npm run check:tokens` |
| Secrets | `check-secrets.ps1` | No secret, `.env` or default password committed | pre-commit and Phase 9 |
| Manual | `quickstart.md` section 6 | Cross-page flows and themes in a real browser | Phase gates 3, 5, 6, 7 |

Rules: a feature is not done until its tests pass (constitution IV); the same table of payment cases
is used by the server validator test and the zod schema test, so the two cannot drift; time-based
rules (48 hours, 15 minutes, delivery cut-off) are tested with an injected `Clock`.

## Build, test and run

Full instructions and prerequisites are in [quickstart.md](quickstart.md). Summary:

```powershell
# one-time shell setup (JDK 21, PostgreSQL tools on PATH, environment variables)
$env:JAVA_HOME = 'C:\Program Files\Microsoft\jdk-21.0.12.101-hotspot'

# backend
cd backend
mvn -q verify                 # build + all tests incl. contract test
mvn -q spring-boot:run        # http://127.0.0.1:5000

# frontend
cd ../frontend
npm ci
npm run check:tokens; npm run lint; npm test; npm run build
npm run dev                   # http://localhost:5173
```

Required environment variables: `SPRING_DATASOURCE_URL` (`jdbc:postgresql://localhost:5432/books`),
`SPRING_DATASOURCE_USERNAME`, `SPRING_DATASOURCE_PASSWORD`, `APP_JWT_SECRET`,
`APP_CORS_ALLOWED_ORIGIN`. None has a default.

## Risks

| Risk | Mitigation |
|------|------------|
| Spring Boot 4.1.2 is newer than the reference's 3.x code and my first build on it is untested | T004 and T008 are the first compile and run; starter names, Jackson 3 and Spring Security 7 differences are listed in research D1 and any fix is recorded there |
| Frontend peer-dependency conflicts (React 18 with the newest Vite, router and resolvers) | First task of Phase 4 is `npm install` and `npm audit`; fall back to the newest compatible versions and record them in research D12 |
| `java` on `PATH` is 1.8 | Quickstart sets `JAVA_HOME` to JDK 21; the Maven enforcer rule requires Java 21 |
| No Docker, so no Testcontainers | Integration tests use the local PostgreSQL database `books_test` |
| Reference defects creeping back | Each defect has a named test or script in coverage-matrix section 5 |
| Bulk copying the reference | Covers are generated, code is written from the spec; reviews check for copied files |

## Complexity Tracking

| Addition | Why needed | Simpler alternative rejected because |
|----------|------------|--------------------------------------|
| Flyway (not in the constitution stack) | Reviewable, repeatable schema and seed that runs once per database; `ddl-auto=validate` catches drift | `ddl-auto=update` plus a startup seeder changes schema silently and re-runs seeding on every start, which is how the reference ends up resetting seeded users' passwords |
| Scheduled jobs (order expiry, fulfilment simulator) | FR-046a needs 15-minute expiry; with no admin, nothing else moves orders through the fee tiers | Manual status changes would leave the 10% and 20% tiers untestable and unusable |
| Idempotency key on order creation | FR-049: a repeated submit must not create a second order | Client-side disabling of the button does not survive a refresh or double request |
| Test tooling (Vitest, Testing Library, MSW, `jsx-a11y`) | Constitution IV and FR-077 need frontend tests and accessibility checks | No tests would break the "feature is not done until tests pass" rule |
| Token check script | Turns FR-071 and SC-004 from a review item into a build failure | Manual review alone can miss a hard-coded colour; the spec lists dark-mode defects in the reference payment pages |
| Local JWT with BCrypt instead of SAML or OpenID Connect, no MFA, no httpOnly session cookie (**deviation from the Bob security policy, section 6, accepted 2026-11-14**) | The product is a self-contained demo with its own member table; the spec and constitution define email and password registration, and there is no identity provider to federate with | Adding an OIDC provider means a second system to run and a login flow the spec does not describe. Mitigations: HS256 secret of at least 32 bytes from the environment, BCrypt, 60-minute token, token held in memory only (never `localStorage`) so script injection cannot read it from storage, single-origin CORS, generic login errors, ownership checks on every row. The service binds to `127.0.0.1` and runs over plain HTTP on loopback; this is **demo-only**. Any non-local deployment needs TLS 1.2+ and an OIDC provider with MFA before use |
| In-memory token, 60-minute lifetime, no refresh token (decision H5, 2026-11-14) | Keeps the token out of storage readable by scripts; logout clears it client-side | A refresh therefore logs the user out. This is accepted. A refresh-token cookie flow would add endpoints and CSRF handling the spec does not ask for |
| CodeQL and OWASP Dependency-Check in CI instead of Mend (security policy sections 7 and 11; `.github/workflows/ci.yml`) | The policy names Mend, which needs an organisation token this repository does not have. CodeQL (Java and JavaScript) covers SAST and `org.owasp:dependency-check-maven:check` (fails at CVSS 7.0) plus `npm audit --audit-level=high` cover dependency scanning | Running no scan until Mend is available would leave the "scan on every commit" rule unmet. Replace both with Mend once a token exists |


