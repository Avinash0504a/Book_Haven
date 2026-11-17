# Phase 0 Research: Book Haven

Inputs reviewed: `spec.md`, the constitution, `reference/projectA-backend-checklist.md`,
`reference/projectA/docs/{requirements,data-model,openapi}`, and the reference backend
(`CheckoutService`, `OrderService`, `ProductService`, `SecurityConfig`, `OpenApiContractTests`,
`application.properties`). Reference code was read to learn the rules; nothing is copied.

Each entry: **Decision**, **Rationale**, **Alternatives considered**.

## Decisions on the items that needed confirmation (all closed 2026-11-14)

| # | Item | Decision |
|---|------|----------|
| O1 | Spring Boot version (D1) | **Spring Boot 4.1.2.** The constitution is amended to 1.1.0. |
| O2 | Delivery date rule (D4) | **Accepted as proposed.** Recorded in the spec clarifications. |
| O3 | Error status mapping (D5) | **Accepted: 409** for `CANNOT_CANCEL`, `INSUFFICIENT_WALLET_BALANCE`, `EMPTY_CART`. |
| O4 | Spec assumption on Pending orders (D6) | **Accepted:** Pending orders are never cancellable; the Assumptions sentence is corrected. |
| O5 | Reference path | **Folder renamed to `reference/projectA`.** |

## Backend decisions

### D1. Language, framework and library versions
- **Decision (O1, closed)**: Java 21, Maven, Spring Boot **4.1.2** (newest stable on Maven
  Central; 4.2.0 is still at RC2), Spring Data JPA, Spring Security (managed by Boot, 7.1.2),
  Hibernate 7.4.13, Jakarta Validation, JJWT **0.13.0**, PostgreSQL driver **42.7.14** (the version
  Boot 4.1.2 manages), Flyway **12.4.0** (managed by the Boot BOM; do not override it). Versions
  were read from Maven Central on 2026-11-14. The constitution is amended to 1.1.0 ("Spring Boot 4,
  4.1.x line").
- **Rationale**: the security policy forbids EOL and extended-support-only releases and the
  constitution requires the latest stable dependencies, so the newest stable line is used.
- **Boot 4 differences to apply in phase 1** (checked against the 4.1.2 POMs on Central):
  - The web starter is `spring-boot-starter-webmvc`; its test starter is
    `spring-boot-starter-webmvc-test` (gives `MockMvc` and the Boot 4 test annotations). Use
    `spring-boot-starter-data-jpa`, `spring-boot-starter-security`,
    `spring-boot-starter-validation` and `spring-boot-starter-flyway` (Flyway needs its own starter
    in Boot 4; `flyway-database-postgresql` is still required for PostgreSQL). Test starters:
    `spring-boot-starter-security-test` and `spring-boot-starter-data-jpa-test`.
  - Jackson 3 (`tools.jackson`, managed 3.1.7) is the default in Boot 4; Jackson annotations keep
    the `com.fasterxml.jackson.annotation` package. JJWT 0.13.0 pulls in `jackson-databind` from the
    2.x line for its own use; keep `jjwt-jackson` at runtime and confirm in T004 that the two
    Jackson lines do not clash. If they do, use `jjwt-gson` or Boot's `jackson-2-bom` (2.21.7).
  - Spring Security 7 and Hibernate 7 are on the classpath: write `SecurityFilterChain` beans with
    the lambda DSL only, and run `mvn -q verify` after each new dependency.
  - JUnit is 6.0.3 and Mockito 5.23.0 (Boot-managed).
  - Boot 4 needs Java 17 or later, so Java 21 is fine.
- **Risk**: I have not compiled a project on 4.1.2 yet. The first build in T004 and T008 is the
  proof; any API difference is fixed there and recorded in this section.
- **Alternatives**: Boot 3.5.16 (the old line, rejected by your decision); Boot 3.3.4 as in the
  reference (older and not the latest patch).
- **Environment note**: `java` on `PATH` is 1.8. JDK 21 is installed at
  `C:\Program Files\Microsoft\jdk-21.0.12.101-hotspot`, so `JAVA_HOME` must point there. Maven 3.9.11
  is installed. A PostgreSQL 18 service is running; `psql` is not on `PATH`. Docker is not installed.

- **T004 result (2026-11-14)**: `mvn -q validate` passes under JDK 21 and fails under the Java 8 on `PATH` (enforcer message names `JAVA_HOME`). The dependency tree has one Boot version (4.1.2) and one Jackson 3 line (`tools.jackson` 3.1.7). `jjwt-jackson` 0.13.0 is runtime-scoped and brings `com.fasterxml.jackson` 2.21.7 (databind and core) on the runtime classpath only; the compile classpath has no Jackson 2 databind. A throwaway test that built, signed and parsed a JJWT token and also used Boot's Jackson 3 `JsonMapper` passed (1 test, 0 failures), so no fallback (`jjwt-gson` or `jackson-2-bom`) is needed. Two Jackson lines coexist at runtime; keep JJWT use inside `JwtService` and never pass Jackson 2 types across it. Latest stable checked on Maven Central: Boot 4.1.2 (4.2.0-RC2 exists but is a release candidate), JJWT 0.13.0, PostgreSQL driver 42.7.14, swagger-parser 2.1.48, enforcer 3.7.0.

### D2. Schema management
- **Decision**: Flyway SQL migrations (`V1__schema.sql`, `V2__seed_catalog.sql`) with
  `spring.jpa.hibernate.ddl-auto=validate`.
- **Rationale**: the reference used `ddl-auto=update`, which changes schemas without a record, and a
  startup `DataInitializer` that re-encodes a seeded user's password when it runs. Migrations are
  reviewable, repeatable and are the natural home for "seed categories, brands and sample books
  always". Flyway runs each migration once per database, so seed rows are never re-applied or reset
  on later starts.
- **Alternatives**: `ddl-auto=update` plus a Java seeder (reference approach; no schema history, and
  the reference's seeder reset passwords at every start); `create-drop` (loses data).

### D3. Test database
- **Decision**: integration tests run against a separate local PostgreSQL database `books_test`,
  using the same Flyway migrations. Unit tests use no database. The test JWT secret is generated at
  runtime in the test setup and is never committed.
- **Rationale**: Docker is unavailable, so Testcontainers is not an option here. H2 would test a
  different SQL dialect from the one that ships. PostgreSQL is already running locally.
- **Alternatives**: H2 in PostgreSQL mode (dialect drift, as the reference accepted); Testcontainers
  (needs Docker).

### D4. Delivery date rule (resolves the clarification deferred from the spec; O2 closed)
- **Decision** (time zone Asia/Kolkata):
  1. Every pincode that matches `^[1-9][0-9]{5}$` is serviceable. There is no "delivery not
     available" state; a malformed pincode is a 400 validation error, not an unserviceable area.
  2. Dispatch day = today, or tomorrow if the time is 14:00 or later.
  3. Handling = 1 day. Transit = 2 days when the first three digits are in a configured metro set
     (`110, 400, 411, 500, 560, 600, 700, 380`), otherwise 4 days.
  4. Date = dispatch day + handling + transit, moved forward off Sundays.
  5. Digital books have no delivery date. The default pincode for guests and for members with none
     is `110001`.
  6. The date is calculated by the server and returned on tiles, product pages, the cart and the
     confirmation. It is never calculated in the client (FR-072).
- **Rationale**: it is deterministic, testable with an injected `Clock`, needs no courier
  integration, and the metro set is configuration, not code.
- **Alternatives**: a fixed number of days (cannot respond to the pincode picker); a courier API
  (out of scope).
- **Closed (O2)**: accepted on 2026-11-14 and written into the spec clarifications. The numbers
  stay in configuration.

### D5. HTTP status and error mapping (implements FR-074a)
- **Decision**:

| Status | Used for | `code` |
|--------|----------|--------|
| 400 | Every validation error: malformed body, field rules, payment details, points above balance or above payable, amount out of range, COD for digital, address missing for physical | `VALIDATION_ERROR` with `data.fieldErrors[] = {field, message, reason}` |
| 401 | No or bad token; wrong login | `UNAUTHORIZED`, `INVALID_CREDENTIALS` |
| 402 | Simulated gateway declined the payment | `PAYMENT_DECLINED` |
| 403 | Another member's data | `FORBIDDEN` |
| 404 | Not found (also used for other members' orders, so existence is not revealed) | `NOT_FOUND` |
| 409 | State conflicts | `DUPLICATE_EMAIL`, `DUPLICATE_REVIEW`, `INSUFFICIENT_STOCK`, `PRODUCT_UNAVAILABLE`, `EMPTY_CART`, `INSUFFICIENT_WALLET_BALANCE`, `CANNOT_CANCEL`, `REFUND_CHANGED`, `ORDER_EXPIRED` |
| 500 | Unexpected | `INTERNAL_ERROR`, fixed message `Internal server error` |

  The baseline's stable reasons (`COD_NOT_AVAILABLE`, `ADDRESS_REQUIRED`, `INVALID_AMOUNT`,
  `INSUFFICIENT_POINTS`) are kept as the `reason` of a field error.
- **Rationale**: the spec allows only one status for validation errors (400). Separating request
  mistakes (400) from state conflicts (409) keeps both sets stable and testable.
- **Closed (O3)**: the baseline returned 400 for `CANNOT_CANCEL`, `INSUFFICIENT_WALLET_BALANCE` and
  `EMPTY_CART`. Accepted on 2026-11-14: they are 409 state conflicts, and FR-074a now names them.
- **Alternatives**: 422 for validation (rejected by your clarification); everything 400 (a client
  cannot tell a typo from a conflict by status alone).

### D6. Order lifecycle, stock and expiry
- **Decision**:
  - States: `PENDING → CONFIRMED → PROCESSING → SHIPPED → DELIVERED`, plus `CANCELLED` and an
    internal `FAILED` (payment declined, failed or expired).
  - `POST /checkout/order` validates everything, then in one transaction reserves stock with an
    atomic conditional update (`stock = stock - :q WHERE stock >= :q`, row count checked), deducts
    points, and creates the order `PENDING` with a unique `Idempotency-Key` per member (FR-049).
  - `confirm-payment` makes it `CONFIRMED`, debits the wallet when paid by wallet, clears the cart,
    and awards `floor(payable / 10)` points. It is idempotent: a second call returns the same order.
  - `fail-payment`, a declined payment, and the 15-minute expiry job move the order to `FAILED` and
    restore stock and points. `ORDER_EXPIRED` is returned if a failed or expired order is paid.
  - `PENDING` and `FAILED` orders are not shown in order history and are not cancellable. Only
    `CONFIRMED`, `PROCESSING` and `SHIPPED` can be cancelled.
  - Digital items do not consume stock.
  - Digital-only orders have nothing to ship: `confirm-payment` moves them to `CONFIRMED` and the
    same transaction marks them `DELIVERED` (`deliveredAt = confirmedAt`), so the library entry is
    available at once. Mixed orders follow the physical path below.
  - There is no admin, so a scheduled `FulfilmentSimulator` advances confirmed orders from
    `confirmedAt` using configurable offsets (default: Processing +2 h, Shipped +6 h, Delivered the
    next day at 15:00). This is why orders pass through all fee tiers inside the 48-hour window.
    The window is open while `now < createdAt + 48h` and closed at exactly 48 hours.
  - Time comes from an injected `java.time.Clock`, so the 48-hour boundary, expiry and fulfilment are
    testable without sleeping.
- **Rationale**: stock reservation, idempotency and expiry follow the clarifications and FR-046a.
  A conditional update is the simplest correct protection against two buyers taking the last copy.
- **Closed (O4)**: accepted on 2026-11-14. Pending orders are never cancellable; the spec
  Assumptions sentence was replaced and the clarification recorded.
- **Alternatives**: pessimistic row locks (heavier); optimistic `@Version` (retries needed on the
  hottest row); a `CANCELLED` status for failed payments (pollutes history and refund fields).

### D7. Payment simulation and validation
- **Decision**: the server validates payment details with the FR-043 rules before reserving any
  stock (`PaymentDetailsValidator`). The simulated gateway declines a card number ending in `0000`
  (documented test card) and approves everything else. Card number, CVV and UPI ID are validated and
  discarded: they are never persisted, never logged and never returned (FR-043a). Only method,
  status, amount and a generated reference are stored. COD orders are `CONFIRMED` with payment
  `PENDING` until delivery.
- **Rationale**: gives a deterministic failure path to test `fail-payment` and stock restoration
  without a real gateway.
- **Alternatives**: random failures (untestable); no failure path (leaves FR-046 untested).

### D8. Recommendations and related books (implements FR-011a, FR-014a)
- **Decision**: rule-based SQL in `RecommendationService`. Related: same author first, then same
  category, excluding the book, in-stock first, limit 6. Recommended: categories and authors from the
  member's confirmed orders and wishlist, excluding already-bought books, in-stock first, limit 6;
  fallback to top sellers by `base_sold_count + units sold`. The endpoint is public and reads the
  member only if a token is present.
- **Rationale**: matches the clarification, works for guests, and needs no extra data. The reference
  `ProductRelation` table is dropped because "same author, then same category" gives the same result
  with no hand-maintained links.
- **Alternatives**: curated relations table (hand upkeep); collaborative filtering (over-engineering).

### D9. Security and configuration
- **Decision**: `server.address=127.0.0.1`, port 5000. All settings come from environment variables
  with **no defaults for secrets**: `SPRING_DATASOURCE_URL` (`jdbc:postgresql://localhost:5432/books`),
  `SPRING_DATASOURCE_USERNAME`, `SPRING_DATASOURCE_PASSWORD`, `APP_JWT_SECRET`,
  `APP_CORS_ALLOWED_ORIGIN`. Non-secret settings (`APP_JWT_EXPIRATION_MS`, fulfilment offsets,
  metro pincodes, expiry minutes) have defaults in `application.properties`. Startup fails fast if a
  required variable is missing or if `APP_JWT_SECRET` is shorter than 32 bytes. CORS allows exactly
  one origin, with no wildcard. BCrypt hashes passwords. Ownership is enforced in services by
  loading every row through `(id, memberId)` queries. Logs never contain secrets or payment details.
  **Token lifetime and storage (H5, decided 2026-11-14)**: JWT lifetime is 60 minutes
  (`APP_JWT_EXPIRATION_MS` default 3600000). The frontend keeps the token in memory only, never in
  `localStorage` or `sessionStorage`; logout clears it client-side (the server logout call is public and
  stateless). A page refresh therefore logs the user out; this is accepted. Local JWT with BCrypt
  deviates from the Bob security policy (SAML or OIDC, MFA, httpOnly cookies); the deviation is
  recorded in `plan.md` Complexity Tracking (H2, option a). Loopback HTTP is demo-only.

  A committed `.gitignore` excludes `.env`, `target/`, `node_modules/` and `dist/`.
- **Rationale**: constitution principle V and the security policy.
- **Alternatives**: a vault (heavier than this project needs; the environment-variable interface
  would still be the contract).

### D10. Seed data
- **Decision**: `V2__seed_catalog.sql` inserts 19 categories (from the home wireframe), brands,
  authors and about 36 sample books with fixed slugs, covering all four formats and five languages,
  plus some out-of-stock titles. A Java `DevDemoMemberSeeder` runs only under the `dev` profile, only
  when `APP_DEMO_USER_EMAIL` and `APP_DEMO_USER_PASSWORD` are set, and only inserts the member if
  absent. It never updates an existing password. There is no admin account.
- **Rationale**: matches your seeding rules and the "no default passwords" rule.
- **Alternatives**: committed demo credentials (forbidden).

### D11. Contract test
- **Decision**: `OpenApiContractTest` loads
  `specs/001-book-haven-bookstore/contracts/openapi.yaml` (path in one constant) and fails when:
  (a) a route in `RequestMappingHandlerMapping` under `/api/` is missing from the spec or the reverse;
  (b) any `$ref` does not resolve; (c) an operation lacks `operationId`, `summary` or
  `x-requirements`; (d) an `x-requirements` ID is not an FR ID found in `spec.md`; (e) an
  `operationId` is duplicated; (f) the set of status codes the global handler can produce
  (`400,401,402,403,404,409,500`) is not the set the spec documents under `ErrorCode`; (g) any
  operation documents `422`.
- **Rationale**: this implements principle I and the "one validation status" rule, and extends the
  reference test with (d), (f) and (g).
- **Alternatives**: generated spec from code (violates "handwritten, source of truth").

## Frontend decisions

### D12. Libraries and versions
- **Decision**: React **18.3.1** (the constitution fixes 18), Vite **8.3.8**,
  `@vitejs/plugin-react` 6.3.0, Tailwind CSS **4.3.5** with `@tailwindcss/vite`, TanStack Query
  5.107.1, Axios 1.21.1, react-router-dom 7.18.5, react-hook-form 7.92.0, `@hookform/resolvers`
  7.0.6, zod 4.6.7, lucide-react 1.72.0; tests with Vitest 5.1.0, Testing Library, and MSW 3.0.5.
  Versions were read from the npm registry on 2026-11-13. Exact versions are locked in
  `package-lock.json` after phase 4 runs `npm install` and `npm audit`.
- **Rationale**: the constitution fixes only "React 18" and the named libraries, so everything else
  is the latest stable. React 18.3.1 is the last 18.x release. The newest React on npm is 19.x, so
  staying on 18 is a deliberate constitution choice, not an oversight.
- **Risk**: I did not check peer dependency ranges (for example `@hookform/resolvers` 7 with zod 4,
  or the Vite 8 plugin with React 18). Phase 4's first task is `npm install`. If a peer conflict
  appears, fall back to the newest mutually compatible release and record it here.
- **Alternatives**: React 19 (needs an amendment); Tailwind 3.4.19 (older line, and v4's `@theme`
  maps directly onto CSS-variable tokens).

### D13. Theme tokens first
- **Decision**: `src/styles/theme.css` defines semantic CSS variables (`--color-bg`, `--color-surface`,
  `--color-text`, `--color-muted`, `--color-border`, `--color-primary`, `--color-primary-fg`,
  `--color-success`, `--color-danger`, `--color-warning`) for `:root` (light) and `.dark`, and maps
  them in Tailwind's `@theme` as utilities such as `bg-surface` and `text-muted`. A tiny inline script
  in `index.html` applies the saved theme (or the system preference) before first paint to avoid a
  flash. A theme-token check (`npm run check:tokens`) fails the build if source files contain hex or
  `rgb()/hsl()` colours or default Tailwind palette classes (for example `bg-blue-600`), which proves
  FR-071 and SC-004 mechanically. The wireframes' dark look with an IBM-blue accent sets the dark
  palette values.
- **Rationale**: defects in the reference (payment pages ignoring dark mode, hard-coded colours)
  come from colours being chosen per component. Making the build fail on them removes the cause.
- **Alternatives**: review only (misses cases); `dark:` variants per element (the exact thing that
  went wrong).

### D14. Frontend structure and state
- **Decision**: feature folders under `src/features/<feature>/{api,hooks,components,pages}` with
  shared code in `src/lib` (Axios client, query client, formatters, zod schemas) and
  `src/components/ui`. App-wide stores (auth, theme, pincode) are small React contexts; all server
  data goes through TanStack Query; the Axios client unwraps the envelope and maps error codes to
  messages. Money, points earned, delivery dates and cancellation eligibility are rendered from
  server fields only (FR-072). Routes needing login use one `RequireAuth` wrapper that remembers the
  return location (FR-001 scenario 4). One `AddressForm` is used by the cart, checkout and profile
  (FR-037).
- **Alternatives**: Redux (unneeded); a separate pages folder (spreads each feature over four trees).

### D15. Cover images
- **Decision**: seeded books point at `/covers/<slug>.svg`, generated by a small script into
  `backend/src/main/resources/static/covers/`. The reference's image files are not copied.
- **Rationale**: the brief says never paste reference files in bulk, and generated covers avoid any
  question about the reference's image rights.
- **Alternatives**: copy the reference's 83 covers (forbidden as bulk copy); remote image URLs
  (external dependency).

## Testing decisions

- **Backend**: JUnit 5, Mockito for service unit tests, `@SpringBootTest` + MockMvc against
  `books_test` for integration tests, plus the contract test. Clock injection for time rules.
- **Frontend**: Vitest + Testing Library + MSW for component, hook and page tests; the token check;
  ESLint with `jsx-a11y`. No browser end-to-end suite is planned; the manual walk-through in
  `quickstart.md` covers cross-page flows.
- **Coverage gate**: `coverage-matrix.md` lists every checklist endpoint, entity and rule with its
  phase and test. Tier 2 rows are required and built after the Tier 1 gate.

## Dependency audit, 2026-11-14 (T144)

- **Backend runtime tree**: 94 jars resolved with `mvn dependency:list`, all queried against OSV
  (`api.osv.dev`, Maven ecosystem): **0 advisories**. No OWASP Dependency-Check or Trivy is installed
  on this machine, so OSV is the vulnerability source. Re-run before release.
- **Spring Boot**: parent is 4.1.2, the newest 4.1.x (4.1.0, 4.1.1, 4.1.2 exist). The only newer
  parent is 4.2.0-RC2, a release candidate, so it is not adopted. The 4.1.x line is kept, so no
  constitution amendment is needed.
- **Direct versions**: jjwt 0.13.0 and swagger-parser 2.1.48 are the latest releases.
  `versions:display-dependency-updates` lists only managed transitive versions that Spring Boot
  controls (for example Flyway 12.4.0 to 13.x, Jackson 2.21 to 2.23, Logback 1.5 to 1.6); these move
  with the next Boot patch and are not overridden, because overriding a managed version breaks the
  tested combination.
- **Frontend**: `npm audit` reports **0 vulnerabilities**. `npm outdated` shows newer majors for
  React (18 to 19), Vite (6 to 8), ESLint (9 to 10), jsdom, msw, lucide-react and others. They are
  deferred on purpose: the constitution fixes React 18 and Vite 6, none is EOL, and a major upgrade
  would need its own amendment and a full regression run.
- **Re-test after the audit**: no dependency was changed, so the earlier results stand: backend
  58 integration tests green, frontend 46 files and 171 tests green.
