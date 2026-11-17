---

description: "Task list for Book Haven Online Bookstore"
---

# Tasks: Book Haven Online Bookstore

**Input**: Design documents from `specs/001-book-haven-bookstore/`

**Prerequisites**: [plan.md](plan.md), [spec.md](spec.md), [research.md](research.md), [data-model.md](data-model.md), [contracts/openapi.yaml](contracts/openapi.yaml), [coverage-matrix.md](coverage-matrix.md), [quickstart.md](quickstart.md)

**Tests**: Required. Constitution principle IV: a feature is not done until its tests pass. Test tasks come before the code they cover and must fail first.

**Organization**: The nine phases follow the plan. Phase 1 is split into setup, foundation and the first story. Each of phases 2 to 8 groups tasks by user story. Each phase ends with a gate task and a commit.

## Format: `- [ ] T### [P?] [US#?] Description with file path`

- **[P]**: can run in parallel (different files, no unfinished dependency)
- **[US#]**: user story from `spec.md`. Used only in story phases. Setup, foundational, gate and polish tasks carry no story label.
- **Area prefix** at the start of each description: **BE** backend, **FE** frontend, **DB** database, **TEST** testing, **DOC** documentation, **OPS** scripts and tooling.
- Every task has a second line: **Accept** (acceptance criteria), **Dep** (dependencies), **Check** (the test or manual check that proves it).

## Path conventions

- Backend: `backend/src/main/java/com/bookhaven/<domain>/`, tests in `backend/src/test/java/com/bookhaven/`
- Frontend: `frontend/src/features/<feature>/{api,hooks,components,pages}`, shared code in `frontend/src/lib`
- Domains: `member`, `catalog`, `cart`, `order`, `payment`, `shipping` (plus `common`, `config`, `security`)
- Shell setup for every backend command: `$env:JAVA_HOME = 'C:\Program Files\Microsoft\jdk-21.0.12.101-hotspot'`

---

## Phase 1: Backend foundation

**Purpose**: Project skeleton, configuration, schema, envelope, security, contract test, and the first story (auth).

**Exit gate**: `mvn verify` green (auth, config, CORS, seed and contract tests); the app refuses to start without `APP_JWT_SECRET`; a restart does not alter data.

### 1A. Setup

- [x] T001 DOC: Settle open items O1 to O5 (done 2026-11-14): Spring Boot 4.1.2 chosen and the constitution amended to 1.1.0 (O1); delivery rule accepted (O2); 409 for state conflicts accepted (O3); Pending orders never cancellable and the spec Assumptions sentence replaced (O4); folder renamed to `reference/projectA` and `TODO(REFERENCE_PATH)` removed (O5). Recorded in `plan.md`, `research.md` D1, D4 to D6, and the `spec.md` clarifications of Session 2026-11-14.
  - Accept: all five items are decided and written down; the constitution has no `TODO(REFERENCE_PATH)`; the spec Assumptions no longer promise a Pending-order cancel.
  - Dep: none (blocked T004).
  - Check: `Select-String -Path .specify/memory/constitution.md -Pattern 'TODO\(REFERENCE_PATH\)'` returns nothing; `Select-String -Path specs/001-book-haven-bookstore/spec.md -Pattern 'cancel with no fee'` returns nothing.

- [x] T002 OPS: Create `.gitignore` at the repository root excluding `.env`, `.env.*`, `target/`, `node_modules/`, `dist/`, `*.log`, `.bob/tmp/`.
  - Accept: it is the first file committed; `git status` ignores a test `.env`.
  - Dep: none.
  - Check: `New-Item .env; git status --short` does not list `.env`; then delete the test file.

- [x] T003 [P] OPS: Write `scripts/check-secrets.ps1` that fails (exit 1) if any tracked file is named `.env*`, contains a `password=`, `secret=` or `jwt` assignment with a literal value, or contains a JDBC URL with an embedded password.
  - Accept: passes on a clean tree; fails when a fake secret line is added to a tracked file.
  - Dep: T002.
  - Check: run the script clean (exit 0), add `x.properties` with `spring.datasource.password=abc`, `git add`, run again (exit 1), then undo.

- [x] T004 BE: Create `backend/pom.xml` for `com.bookhaven` with parent `spring-boot-starter-parent` **4.1.2**, Java 21, and the Boot 4 starters from research D1: `spring-boot-starter-webmvc`, `spring-boot-starter-data-jpa`, `spring-boot-starter-security`, `spring-boot-starter-validation`, `spring-boot-starter-flyway` plus `flyway-database-postgresql` (Flyway 12.4.0 comes from the Boot BOM, not overridden); PostgreSQL driver 42.7.14 (Boot-managed); JJWT 0.13.0 (`jjwt-api`, runtime `jjwt-impl`, `jjwt-jackson`); swagger-parser for the contract test; test starters `spring-boot-starter-webmvc-test`, `spring-boot-starter-security-test`, `spring-boot-starter-data-jpa-test` (JUnit 6 and Mockito come from the BOM); Maven Enforcer requiring Java 21; surefire for `*Test`/`*UT`, failsafe for `*IT`. No actuator.
  - Accept: `mvn -q validate` succeeds under JDK 21 and fails under the Java 8 on `PATH`; every version is the latest stable and not EOL; no `spring-boot-starter-web` (the Boot 3 name) appears in the POM.
  - Dep: T001 (done).
  - Check: run `mvn -q validate` with and without `JAVA_HOME`; `mvn -q dependency:tree` shows one Boot version (4.1.2) and one Jackson 3 line (`tools.jackson`, 3.1.7); if `jjwt-jackson` brings a second Jackson line that clashes, record the fix in `research.md` D1.

- [x] T005 DB: Create PostgreSQL databases `books` and `books_test` with a dedicated login role whose password is supplied from the shell and never written to a file (steps added to `quickstart.md`).
  - Accept: both databases exist; the role owns them and has no superuser right.
  - Dep: none.
  - Check: `& 'C:\Program Files\PostgreSQL\18\bin\psql.exe' -l` lists `books` and `books_test`.

- [x] T006 BE: Write `backend/src/main/resources/application.properties` and `application-dev.properties`: `server.address=127.0.0.1`, `server.port=5000`, `spring.jpa.hibernate.ddl-auto=validate`, Flyway on, datasource, JWT secret and CORS origin read only from `SPRING_DATASOURCE_URL`, `SPRING_DATASOURCE_USERNAME`, `SPRING_DATASOURCE_PASSWORD`, `APP_JWT_SECRET`, `APP_CORS_ALLOWED_ORIGIN` with no default; non-secret defaults for `APP_JWT_EXPIRATION_MS` (3600000 = the 60-minute token of decision H5), `logging.structured.format.console=logstash` (JSON logs), `logging.logback.rollingpolicy.max-history=90` (90-day retention), order expiry minutes (15), fulfilment offsets, metro prefixes, cut-off hour, handling days, transit days, free threshold 500, flat charge 49.
  - Accept: no secret has a default; no value in either file is a password, key or credential.
  - Dep: T004.
  - Check: `scripts/check-secrets.ps1` passes; `Select-String` finds no `:default` after any of the five required names.

- [x] T007 TEST: Write `backend/src/test/java/com/bookhaven/config/ConfigIT.java` first: `startupFailsWithoutRequiredEnv` (each of the five variables missing in turn), `jwtSecretShorterThan32BytesRejected`, `serverBindsToLoopback`.
  - Accept: tests fail before T008 and pass after it.
  - Dep: T006.
  - Check: `mvn -q -Dtest=ConfigIT verify` red, then green after T008.

- [x] T008 BE: Create `BookHavenApplication.java`, `config/AppProperties.java` (typed binding) and `config/StartupValidator.java` that fails fast naming the missing variable (never printing its value) and rejects `APP_JWT_SECRET` shorter than 32 bytes and a wildcard CORS origin.
  - Accept: the application will not start without all five variables; the error names the variable only.
  - Dep: T007.
  - Check: `ConfigIT` green; manual: `mvn spring-boot:run` with `APP_JWT_SECRET` unset exits with a clear message.

### 1B. Foundation (blocks every story)

- [x] T009 DB: Write `backend/src/main/resources/db/migration/V1__schema.sql` for the 18 tables in `data-model.md` (`member`, `address`, `category`, `brand`, `author`, `book`, `review`, `stock_notification`, `cart`, `cart_item`, `orders`, `order_item`, `payment`, `order_cancellation`, `gift_points_transaction`, `wallet_transaction`, `wishlist_item`, `author_follow`). Primary keys UUID; money `NUMERIC(12,2)`; timestamps `timestamptz`; every table has `created_at`. Constraints quoted from the data model: `giftPoints` ">= 0"; `walletBalance` ">= 0"; `fullName` "2-100 chars"; `email` "unique (case-insensitive)" via unique index on `lower(email)`; address `postalCode` "`^[1-9][0-9]{5}$`" and "at most one default per member (partial unique index where `isDefault AND deletedAt IS NULL`)"; book `price` "> 0", `discountPercent` "0-90", `stockQuantity` ">= 0", `slug` unique, `language` "one of English, Hindi, Tamil, Telugu, Kannada"; cart `memberId` unique and cart_item "unique `(cartId, bookId)`" with `quantity` "1-10"; orders "unique `idempotencyKey` with `memberId`"; order_item `cancelledQuantity` "0..quantity"; review `rating` "1-5", `body` "<= 100 chars", "unique `(memberId, bookId)`"; wishlist, follow and stock_notification "unique `(memberId, bookId)`" or "`(memberId, authorId)`"; payment `orderId` unique; wallet_transaction `amount` "> 0". Indexes on `(categoryId)`, `(authorId)`, `(format)`, `(language)` and `lower(title)`.
  - Accept: a clean `books_test` migrates with no error; every constraint above exists in the catalog.
  - Dep: T005, T006.
  - Check: `SchemaIT` (T022) green; `psql -d books_test -c "\d address"` shows the partial unique index.

- [x] T010 DB: Write `V2__seed_catalog.sql`: 19 categories (from the home wireframe), about 6 brands, about 24 authors and about 36 books with fixed slugs, covering all four formats and five languages, some discounted, a few out of stock, `coverImageUrl` `/covers/<slug>.svg`. No members, passwords, orders or reviews.
  - Accept: re-running migrations on an existing database never changes rows; no credential in the file.
  - Dep: T009.
  - Check: `SeedDataIT` (T022) green; `check-secrets.ps1` green.

- [x] T011 [P] OPS: Write `scripts/generate-covers.mjs` that creates one SVG cover per seeded slug in `backend/src/main/resources/static/covers/` (title and author text, colours chosen only for the generated image).
  - Accept: one file per seeded slug; no reference image is copied.
  - Dep: T010 (slug list).
  - Check: `node scripts/generate-covers.mjs`, then count equals the number of books in V2; `GET /covers/<slug>.svg` returns 200 after T025.

- [x] T012 [P] BE: Create `common/ApiResponse.java` (`success`, `data`, `message`, `code`), `common/ErrorCode.java` (every code in the OpenAPI `ErrorCode` enum) and `common/AppException.java` (code, HTTP status, message, optional field errors).
  - Accept: a single envelope type; each `ErrorCode` maps to exactly one status from research D5. FR-073, FR-074a.
  - Dep: T004.
  - Check: `OpenApiContractTest#errorCodesInCodeMatchSpec` (T026) green.

- [x] T013 [P] BE: Create `common/MoneyUtil.java` (`BigDecimal`, scale 2, `RoundingMode.HALF_UP`) and `common/ClockConfig.java` providing a `Clock` bean for `Asia/Kolkata`.
  - Accept: no `double` or `float` is used for money anywhere.
  - Dep: T004.
  - Check: `MoneyUT` (T014).

- [x] T014 TEST: Write `common/MoneyUT.java`: `roundsHalfUpToTwoDecimals`, `neverUsesFloatingPoint`.
  - Accept: covers 0.005, 0.015 and 1.005 boundary values.
  - Dep: T013.
  - Check: `mvn -q -Dtest=MoneyUT test` green.

- [x] T015 TEST: Write `ResponseEnvelopeIT#successAndErrorsUseEnvelope`, `ValidationStatusIT#everyValidationFailureIs400WithFieldErrors` (malformed JSON, missing field, bad type, business-rule violation) and `GlobalExceptionHandlerIT#unexpectedErrorHidesDetails` (fixed message `Internal server error`, no stack trace) under `backend/src/test/java/com/bookhaven/common/`. Use a test-only controller in `src/test`.
  - Accept: red before T016. No other status than 400 appears for validation.
  - Dep: T012.
  - Check: tests fail then pass after T016.

- [x] T016 BE: Implement `common/GlobalExceptionHandler.java`: `VALIDATION_ERROR` always 400 with `data.fieldErrors[] = {field, message, reason}`; 401, 402, 403, 404, 409 per research D5; 500 with the fixed message; stack traces only in the log; no secret or payment value in any log line.
  - Accept: every response uses the envelope; unknown exceptions never leak a message. FR-073, FR-074, FR-074a.
  - Dep: T015.
  - Check: T015 tests green.

- [x] T017 [P] BE: Create member-domain entities and repositories: `Member`, `GiftPointsTransaction`, `WalletTransaction` in `member/entity` and `member/repository`, with the enums `WalletTxnType`.
  - Accept: field names and types match `data-model.md`; `passwordHash` is never serialised.
  - Dep: T009.
  - Check: `SchemaIT` (T022).

- [x] T018 [P] BE: Create catalog-domain entities and repositories: `Category`, `Brand`, `Author`, `Book`, `StockNotification` and enum `BookFormat` in `catalog/entity` and `catalog/repository`.
  - Accept: `Book` has no stored `unitPrice`, `inStock`, `deliveryDate` or `soldCount`.
  - Dep: T009.
  - Check: `SchemaIT` (T022).

- [x] T019 [P] BE: Create cart-domain entities and repositories: `Cart`, `CartItem` in `cart/entity` and `cart/repository`. No unit price column.
  - Accept: matches the data model (price always read from the book). FR-030, FR-032.
  - Dep: T009.
  - Check: `SchemaIT` (T022).

- [x] T020 [P] BE: Create order and payment entities and repositories: `Order` (table `orders`), `OrderItem`, `OrderCancellation`, `Payment`, enums `OrderStatus`, `PaymentMethod`, `PaymentStatus`, `RefundMethod`, `RefundStatus`.
  - Accept: `OrderStatus` lists `PENDING, CONFIRMED, PROCESSING, SHIPPED, DELIVERED, CANCELLED, FAILED`; no `ADMIN` and no `MOCK` anywhere.
  - Dep: T009.
  - Check: `SchemaIT` (T022); `grep -ri "MOCK\|ADMIN" backend/src/main` finds nothing.

- [x] T021 [P] BE: Create `shipping/entity/Address.java` and `shipping/repository/AddressRepository.java` with `deletedAt` soft delete and enum `AddressLabel`.
  - Accept: queries only ever load by `(id, memberId)`.
  - Dep: T009.
  - Check: `SchemaIT` (T022); `AddressIT` in Phase 2.

- [x] T022 TEST: Write `SchemaIT#flywayMatchesEntities` (`ddl-auto=validate`), `SeedDataIT#categoriesPresent`, `#brandsPresent`, `#booksCoverAllFormatsAndLanguages`, `#catalogSeededInAnyProfile`, and `MemberRepositoryIT#emailUniqueCaseInsensitive` against `books_test`.
  - Accept: entity or migration drift fails the build; 19 categories seeded.
  - Dep: T010, T017, T018, T019, T020, T021.
  - Check: `mvn -q -Dtest='SchemaIT,SeedDataIT,MemberRepositoryIT' verify` green.

- [x] T023 TEST: Write `security/SecurityIT#protectedRouteWithoutTokenIs401`, `#publicRoutesNeedNoToken`, `#everyOtherRouteNeedsToken`, `security/CorsIT#allowedOriginOnly`, `#otherOriginRejected`, and `security/JwtServiceTest` (Mockito/fixed `Clock`: `issuesTokenWith60MinuteLifetime`, `rejectsTamperedToken`, `rejectsExpiredToken`).
  - Accept: the public list is exactly: register, login, logout, catalogue reads, recommendations, delivery estimate, covers. FR-004.
  - Dep: T016.
  - Check: red before T024/T025; `publicRoutesNeedNoToken` completes in Phase 2 when the routes exist.

- [x] T024 BE: Create `security/JwtService.java` (JJWT 0.13.0, HS256, secret from `APP_JWT_SECRET`, expiry from `APP_JWT_EXPIRATION_MS`), `security/JwtAuthFilter.java` and `security/CurrentMember.java` (resolves the authenticated member id for services).
  - Accept: invalid, expired or tampered tokens give 401 `UNAUTHORIZED`; the token never appears in a log; the default lifetime is 60 minutes and there is no refresh token (H5).
  - Dep: T017, T023.
  - Check: `SecurityIT` tests green.

- [x] T025 BE: Create `security/SecurityConfig.java` (stateless, BCrypt `PasswordEncoder`, public routes only as listed) and `config/CorsConfig.java` allowing exactly the origin in `APP_CORS_ALLOWED_ORIGIN`, no wildcard, with methods and headers listed explicitly.
  - Accept: a request from another origin gets no CORS headers; no `0.0.0.0` binding.
  - Dep: T024.
  - Check: `CorsIT` and `SecurityIT` green.

- [x] T026 TEST: Write `backend/src/test/java/com/bookhaven/contract/OpenApiContractTest.java` reading `specs/001-book-haven-bookstore/contracts/openapi.yaml` through one path constant. It fails when: a route under `/api/` is missing from the spec or the reverse (`everyRouteIsInTheSpecAndViceVersa`); a `$ref` does not resolve; an operation lacks `operationId`, `summary` or `x-requirements`; an `x-requirements` id is not an `FR-` id in `spec.md`; an `operationId` is duplicated; the status codes the handler can produce differ from the documented set (`errorCodesInCodeMatchSpec`); any operation documents `422` (`no422Documented`).
  - Accept: the build fails on any drift. Until later phases add routes, a temporary allow-list names every not-yet-built operation and must be empty at T123.
  - Dep: T016, T025.
  - Check: delete one path from a copy of the YAML to prove it fails; with the real file it is green (allow-list in place).

- [x] T026a OPS: Add CI and scanning. `.github/workflows/ci.yml` (runs on every push and pull request: `mvn -q verify`, then `npm ci; npm run check:tokens; npm run lint; npm test; npm run build` once `frontend/` exists, then `scripts/check-secrets.ps1`); a SAST step (CodeQL for Java and JavaScript); a dependency scan (`mvn org.owasp:dependency-check-maven:check` failing at CVSS 7.0, and `npm audit --audit-level=high`). The security policy names Mend; record in `plan.md` that Mend needs an organisation token, and that OWASP Dependency-Check plus CodeQL stand in until it is available.
  - Accept: the workflow file exists and is valid YAML; no secret is written in it (only `${{ secrets.* }}` references); a High finding fails the job.
  - Dep: T004, T002.
  - Check: `Select-String -Path .github/workflows/ci.yml -Pattern 'codeql|dependency-check|npm audit'` finds all three; `scripts/check-secrets.ps1` still passes. The first real run happens when the repository is pushed (not testable offline; recorded in the Phase 1 gate commit body).

- [x] T026b TEST: Write `config/LoggingIT` (`logsAreJson`, `loginFailureLoggedWithoutPassword`, `loginSuccessLogsMemberIdOnly`, `forbiddenAccessLogged`, `noTokenOrPasswordInAnyLine`) capturing log output. Structured fields: `event`, `memberId`, `outcome`, `requestId`; never the password, token, payment values or full request body.
  - Accept: failed logins, 401 and 403 responses each write one WARN structured line; INFO, WARN and ERROR levels are used as in `research.md` D9; logs are never returned to clients (security policy section 8).
  - Dep: T016, T025.
  - Check: red before T026c.

- [x] T026c BE: Add `common/RequestLoggingFilter` (generates `requestId`, puts it in the MDC) and `security/SecurityEventLogger`, called from the login service, `JwtAuthFilter` and the access-denied handler.
  - Accept: `LoggingIT` green; no sensitive value appears in any line.
  - Dep: T026b.
  - Check: `LoggingIT` green.

- [x] T027 BE: Create `member/DevDemoMemberSeeder.java` active only under profile `dev`, only when `APP_DEMO_USER_EMAIL` and `APP_DEMO_USER_PASSWORD` are set, inserting the member only if absent and never updating an existing password. No admin account exists.
  - Accept: nothing is seeded outside `dev`; a second start leaves the password hash unchanged.
  - Dep: T017, T025.
  - Check: `DevDemoMemberSeederIT#onlyInDevAndOnlyWhenAbsent`, `#neverResetsPassword`, `#noAdminAccountExists` green (written in the same task).

**Checkpoint**: Foundation ready. Stories can start.

### 1C. User Story 1 - Register, log in, log out (backend)

**Goal**: A visitor can register, log in and log out through the API; protected routes need a token.

**Independent test**: Register, log in with a wrong then the right password, call `GET /api/auth/me`, call a protected route without a token (401).

- [x] T028 [US1] TEST: Write `member/AuthIT` (`loginOk`, `wrongPassword401GenericMessage`, `logoutIsPublicAndOk`, `meReturnsPointsAndWallet`, `registerOk`, `duplicateEmail409`, `shortPassword400`, `unknownEmailSameMessageAsWrongPassword`) and `member/PasswordHashingUT#storesBCryptNotPlaintext`, plus Mockito `member/AuthServiceTest` (`registerHashesPassword`, `duplicateEmailThrowsDuplicateEmail`, `unknownEmailAndWrongPasswordSameError`, `loginIssuesToken`; repository and `JwtService` mocked). FR-001 to FR-003.
  - Accept: password rule quoted from the data model: "password 6-72 chars on input (72 is BCrypt's limit)"; messages never say which of email or password was wrong.
  - Dep: T025.
  - Check: red before T029 and T030.

- [x] T029 [US1] BE: Create `member/dto/RegisterRequest`, `LoginRequest`, `AuthResponse`, `MemberDto` and `member/service/AuthService.java`: BCrypt hashing, case-insensitive duplicate check (409 `DUPLICATE_EMAIL`), `INVALID_CREDENTIALS` 401 for both unknown email and wrong password, token issue.
  - Accept: `fullName` "required, 2-100 chars"; `email` "valid format"; `passwordHash` is never returned. FR-075.
  - Dep: T028.
  - Check: `AuthIT` service-level cases green.

- [x] T030 [US1] BE: Create `member/controller/AuthController.java` for `register`, `login`, `logout`, `me` as in `openapi.yaml` (`GET /api/auth/me` returns `giftPoints` and `walletBalance`).
  - Accept: responses match the contract schemas; `logout` is public and returns the envelope. FR-002.
  - Dep: T029.
  - Check: `AuthIT` green; `OpenApiContractTest` allow-list shrinks by four.

### Phase 1 gate

- [x] T031 Gate: Run `mvn -q verify` under JDK 21, start without `APP_JWT_SECRET` (must refuse), start twice and compare row counts and the demo member hash, run `scripts/check-secrets.ps1`, then commit `feat: backend foundation and auth`.
  - Accept: all Phase 1 tests green; no secret in the diff; `git status` clean after the commit.
  - Dep: T001 to T030 including T026a to T026c.
  - Check: command output saved to the commit message body (test counts).

---

## Phase 2: Catalogue, recommendations, cart, addresses (backend)

**Purpose**: Everything a member needs before checkout.

**Exit gate**: matrix rows for P2 green; ownership tests green; contract test still green.

### User Story 2 - Browse, search and filter (backend)

**Independent test**: Call `GET /api/products` with each filter, sort and page; call `GET /api/recommendations` as a guest and as a member.

- [x] T032 [US2] TEST: Write `catalog/CatalogIT` (`categoriesSeeded`, `brandsListed`, `filtersSortSearchPagination`, `categoryBooksPaged`, `brandBooksFiltered`, `pageSizeCappedAt48`, `invalidFilterIs400`) and Mockito `catalog/CatalogServiceTest` (`passesFiltersToSpecification`, `capsPageSize`, `unknownCategoryThrowsNotFound`; repositories mocked). FR-010 to FR-012.
  - Accept: default page size 12, maximum 48; filters language, format, price bands, search, category, brand; sorts `price_asc`, `price_desc`, `rating_desc`, `bestselling`, `newest`.
  - Dep: T031.
  - Check: red before T033 to T035.

- [x] T033 [US2] BE: Create `catalog/repository/BookRepository` and `BookSpecifications` for the filters, search on `lower(title)`/author/description, sort modes and pagination.
  - Accept: the 2-second goal (SC-010) holds on the seed data; indexes from V1 are used. FR-010, FR-012.
  - Dep: T032.
  - Check: `EXPLAIN` on a filtered query shows an index scan; `CatalogIT` partly green.

- [x] T034 [P] [US2] BE: Create DTOs in `catalog/dto`: `BookSummary`, `PageResponse`, `CategoryDto`, `BrandDto`.
  - Accept: money fields are `BigDecimal`; `unitPrice`, `inStock`, `deliveryDate` and `soldCount` come from the server.
  - Dep: T018.
  - Check: contract test schema check.

- [x] T035 [US2] BE: Create `catalog/service/CatalogService`, `controller/BookController`, `CategoryController`, `BrandController` for `listBooks`, `listCategories`, `listCategoryBooks`, `listBrands`, `listBrandBooks`.
  - Accept: all five operations public; envelope on every response.
  - Dep: T033, T034.
  - Check: `CatalogIT` green; `SecurityIT#publicRoutesNeedNoToken` partly green.

- [x] T036 [US2] TEST: Write `catalog/RecommendationServiceUT` (`relatedSameAuthorThenCategory`, `relatedNeverIncludesSelfOutOfStockLast`, `fromOrdersAndWishlistElseTopSellers`, `guestGetsTopSellers`, `excludesAlreadyBought`, `limitSix`).
  - Accept: encodes FR-011a and FR-014a.
  - Dep: T018.
  - Check: red before T037.

- [x] T037 [US2] BE: Create `catalog/service/RecommendationService` and `RecommendationController` for `GET /api/recommendations` (public, reads the member only if a token is present) using the rule-based queries in research D8.
  - Accept: up to 6 books, out-of-stock last; fallback by `baseSoldCount` plus units sold in confirmed orders.
  - Dep: T036.
  - Check: `RecommendationServiceUT` green; manual call as guest.

### User Story 4 - Delivery estimate (backend share)

**Independent test**: `GET /api/delivery/estimate?pincode=...` before and after 14:00 with a fixed clock.

- [x] T038 [US4] TEST: Write `shipping/DeliveryEstimatorUT` (`cutoffAfterTwoPm`, `skipsSunday`, `metroVsOther`, `digitalHasNone`, `defaultPincode110001`) and `CatalogIT#badPincode400`.
  - Accept: rule from research D4; pincode "`^[1-9][0-9]{5}$`".
  - Dep: T013.
  - Check: red before T039.

- [x] T039 [US4] BE: Create `shipping/service/DeliveryEstimator` (configurable cut-off, handling, transit, metro set; injected `Clock`) and `shipping/controller/DeliveryController` for `estimateDelivery`.
  - Accept: invalid pincode gives 400 `VALIDATION_ERROR`; digital items return no date; every valid pincode gets a date (no "not available" state). FR-016, FR-024, FR-072.
  - Dep: T038, T006.
  - Check: `DeliveryEstimatorUT` and `CatalogIT#badPincode400` green.

### User Story 3 - Product page data and Notify Me (backend)

**Independent test**: `GET /api/products/{id}` shows stock, delivery date, sold count, writer; related list; Notify Me on an out-of-stock book.

- [x] T040 [US3] TEST: Write `CatalogIT#detailHasDeliveryDateSoldCountWriter`, `#digitalHasNoDeliveryDate`, `#relatedEndpoint`, `#notifyOnlyWhenOutOfStock`, `#notifyDuplicate409`, `#unknownBook404`, and Mockito `catalog/StockNotificationServiceTest` (`rejectsInStockBook`, `rejectsDuplicate`, `savesOnce`). FR-014, FR-015.
  - Accept: Notify Me requires login and an out-of-stock book.
  - Dep: T035, T039.
  - Check: red before T041.

- [x] T041 [US3] BE: Implement `getBook` (detail DTO with stock badge, delivery date for the request pincode, sold count, publisher, writer summary), `relatedBooks`, and `notifyMe` (`catalog/service/StockNotificationService`, unique `(memberId, bookId)`, 409 on repeat).
  - Accept: related uses `RecommendationService`; Notify Me never sends a message (out of scope). FR-014, FR-014a, FR-015, FR-016.
  - Dep: T040, T037.
  - Check: `CatalogIT` fully green.

### User Story 5 - Pricing, cart and addresses (backend)

**Independent test**: add books under and over 500 rupees and read the cart summary; create, default and delete addresses.

- [x] T042 [US5] TEST: Write `shipping/PricingUT` first part: `unitPriceRoundsHalfUp`, `shipping49Under500FreeAtOrAbove`, and `CartIT#digitalOnlyNoShipping`, `#mixedCartThresholdUsesPhysicalOnly`.
  - Accept: unit price = `round(price x (1 - discountPercent / 100), 2)`; shipping `0` "if no physical item or `subtotal >= 500`, else `49`".
  - Dep: T013.
  - Check: red before T043.

- [x] T043 [US5] BE: Create `shipping/service/ShippingCalculator` and `cart/service/PricingCalculator` (unit price, line totals, subtotal, shipping, `freeShippingRemaining`, `pointsToEarn`).
  - Accept: thresholds from configuration, not literals. FR-032, FR-033, FR-072.
  - Dep: T042.
  - Check: `PricingUT` green.

- [x] T044 [US5] TEST: Write `cart/CartIT` (`totalsShippingAndPointsHint`, `addLimitedByStock`, `guestIs401`, `removeItem`, `quantityZeroRemoves`, `clear`, `quantityOver10Is400`) and Mockito `cart/CartServiceTest` (`addCapsAtStock`, `digitalIgnoresStock`, `updateToZeroRemoves`, `onlyOwnCartLoaded`; repositories and `PricingCalculator` mocked). FR-030 to FR-033.
  - Accept: cart item `quantity` "1-10 and <= stock for physical"; digital items ignore stock.
  - Dep: T043.
  - Check: red before T045.

- [x] T045 [US5] BE: Create `cart/service/CartService`, `cart/controller/CartController`, `cart/dto/*` for `getCart`, `addCartItem`, `updateCartItem`, `removeCartItem`, `clearCart`.
  - Accept: the cart never reserves stock; prices always from the current book; summary fields `subtotal`, `shippingAmount`, `freeShippingRemaining`, `total`, `pointsToEarn`, `hasPhysical`, `hasDigital`, `itemCount`.
  - Dep: T044.
  - Check: `CartIT` green.

- [x] T046 [US5] TEST: Write `shipping/AddressIT` (`defaultFirst`, `firstBecomesDefault`, `badPincode400`, `newDefaultClearsOld`, `softDeleteKeepsOrderSnapshot`, `deletingDefaultLeavesNone`) and Mockito `shipping/AddressServiceTest` (`firstBecomesDefault`, `newDefaultClearsOld`, `deleteIsSoft`, `loadsByIdAndMemberOnly`). FR-036, FR-037.
  - Accept: `recipientName` "(2-100)", `phone` "(10 digits)", `line1` "(required, <=120)", `postalCode` "(`^[1-9][0-9]{5}$`)", `country` "(default `India`)".
  - Dep: T021, T025.
  - Check: red before T047.

- [x] T047 [US5] BE: Create `shipping/service/AddressService`, `shipping/controller/AddressController`, `shipping/dto/*` for `listAddresses`, `createAddress`, `updateAddress`, `deleteAddress`.
  - Accept: "the first address becomes the default; setting a new default clears the old one in the same transaction"; delete is soft. FR-036, FR-037, FR-066.
  - Dep: T046.
  - Check: `AddressIT` green.

- [x] T048 [US5] TEST: Write `OwnershipIT` for cart and addresses (another member's address or cart item returns 404, never data).
  - Accept: SC-009 for these resources. FR-005.
  - Dep: T045, T047.
  - Check: green.

### Phase 2 gate

- [x] T049 Gate: `mvn -q verify` green; `SecurityIT#publicRoutesNeedNoToken` and `#everyOtherRouteNeedsToken` complete; contract allow-list reduced to Phase 3 and 8 operations only; commit `feat: catalogue, cart, addresses`.
  - Accept: P2 matrix rows (sections 2 to 4) all pass.
  - Dep: T032 to T048.
  - Check: test report counts in the commit body.

---

## Phase 3: Checkout, payment, orders, cancellation (backend)

**Purpose**: Money, points, stock, order lifecycle and cancellation, all server-side.

**Exit gate**: matrix rows for P3 green, including boundary tests with a fixed clock; quickstart backend scenarios 1 to 9 pass.

### User Story 6 - Checkout, payment, confirmation (backend)

**Independent test**: for each payment method, validate, create an order, confirm; try each invalid payment; fail a payment and see stock and points restored.

- [x] T050 [US6] TEST: Extend `PricingUT` with `pointsDiscount`, `tenPointsOneRupee`, `totalNeverNegative`, `pointsEarnedFloor`, `pointsCappedAtBalanceAndPayable`.
  - Accept: "Points discount `points x 0.10`"; "Payable `max(0, subtotal + shipping - discount)`"; "Points earned `floor(payable / 10)`"; points "capped at the member's balance and at `subtotal + shipping`".
  - Dep: T049.
  - Check: red before T051.

- [x] T051 [US6] BE: Extend `cart/service/PricingCalculator` with `applyPoints`, `payable` and `pointsEarned`.
  - Accept: one place calculates money; no controller or DTO mapper does arithmetic.
  - Dep: T050.
  - Check: `PricingUT` green.

- [x] T052 [P] [US6] TEST: Create the shared payment-case table `backend/src/test/resources/payment-cases.json` (valid and invalid cases per method with the expected `field` and `reason`) and write `payment/PaymentDetailsValidatorUT` driven by it.
  - Accept: cases quoted from FR-043: card number "exactly 16 digits (spaces and dashes allowed; no checksum test)"; name "2 to 50 letters"; CVV "exactly 3 digits"; expiry "MM/YYYY format that is the current month or later"; UPI "`name@handle`, using letters, digits, dots, dashes or underscores"; Net Banking "one bank chosen from a fixed list"; COD "physical-only orders with a payable amount of at most 50,000 rupees". Expiry tests use a fixed clock.
  - Dep: T049.
  - Check: red before T053. The frontend task T096 reads the same file.

- [x] T053 [US6] BE: Create `payment/service/PaymentDetailsValidator` and `payment/dto/PaymentDetails` (card, UPI, bank, wallet, COD variants); fixed bank list served by `GET /api/checkout/banks`.
  - Accept: every failure is 400 `VALIDATION_ERROR` with `reason` (`COD_NOT_AVAILABLE`, `ADDRESS_REQUIRED`, `INVALID_AMOUNT`, `INSUFFICIENT_POINTS` kept as reasons); card number, CVV and UPI id are never assigned to a field that is persisted or logged.
  - Dep: T052.
  - Check: `PaymentDetailsValidatorUT` green.

- [x] T054 [US6] TEST: Write `payment/SimulatedGatewayUT` (`cardEndingZeroesDeclined`, `everythingElseApproved`) and `payment/PaymentPrivacyIT#noSensitiveDataInDbOrLogs` (captures log output and dumps `payment` and `orders` rows after paying with a known card number, CVV and UPI id).
  - Accept: none of the three values appears in any column or log line, including at DEBUG level. FR-043a.
  - Dep: T049.
  - Check: red before T055.

- [x] T055 [US6] BE: Create `payment/service/SimulatedGateway` and `payment/service/PaymentService` storing only method, status, amount and a generated reference (research D7); COD orders are `CONFIRMED` with payment `PENDING`.
  - Accept: a declined card gives 402 `PAYMENT_DECLINED`; nothing sensitive reaches the entity.
  - Dep: T054, T053.
  - Check: `SimulatedGatewayUT` and `PaymentPrivacyIT` green.

- [x] T056 [US6] TEST: Write `order/CheckoutIT` (`emptyCart409`, `addressRequiredForPhysical`, `digitalNeedsNoAddress`, `codBlockedForDigital`, `pointsOverBalance400`, `reservesStockDeductsPointsPending`, `lastCopyOnlyOneBuyer` using two threads, `duplicateKeySameOrder`, `banksFixedList`, `invalidPayment400`, `validateReturnsCurrentPrices`) and Mockito `order/CheckoutServiceTest` (`reservesStockWithConditionalUpdate`, `rejectsEmptyCart`, `sameKeyReturnsSameOrder`, `deductsPointsAndWritesLedger`, `snapshotsAddress`). FR-040 to FR-046a, FR-049.
  - Accept: `Idempotency-Key` unique per member; the loser of the last-copy race gets 409 `INSUFFICIENT_STOCK` and the cart is updated.
  - Dep: T051, T055.
  - Check: red before T057.

- [x] T057 [US6] BE: Create `order/service/CheckoutService`, `order/controller/CheckoutController` and DTOs for `validateCheckout`, `applyPoints`, `createOrder`, `listBanks`. In one transaction: validate, reserve stock with an atomic conditional update (`stock = stock - :q WHERE stock >= :q`, row count checked), deduct points and write a `REDEEMED` ledger row, snapshot the address, calculate `deliveryDate`, create the order `PENDING` with `expiresAt = createdAt + 15 min`. Digital items do not consume stock.
  - Accept: the server returns `subtotal`, `shippingAmount`, `discountAmount`, `totalAmount`, `deliveryDate`; the same idempotency key returns the same order; `validateCheckout` returns the cart priced from the current book rows, so a price or stock change since the cart was filled is visible before payment (spec edge case; `CheckoutIT#validateReturnsCurrentPrices`).
  - Dep: T056, T047.
  - Check: `CheckoutIT` creation cases green.

- [x] T058 [US6] TEST: Write `CheckoutIT` for completion (`confirmClearsCartAwardsPoints`, `pointsEarnedFromServer`, `eachPaymentMethod`, `idempotent`, `failReleasesStockAndPoints`, `walletInsufficient409`, `walletPaymentDebitsOnce`, `pointsLedger`, `payExpiredOrder409`, `payOtherMembersOrder404`, `digitalOnlyOrderDeliveredAtConfirm`, `mixedOrderStaysConfirmed`) and Mockito cases in `order/CheckoutServiceTest` and `payment/WalletServiceTest` (`confirmIsIdempotent`, `failRestoresStockAndPoints`, `walletDebitWritesOneRow`, `walletRejectsShortfall`). FR-044, FR-046, FR-047.
  - Accept: `confirmPayment` twice returns the same order and one ledger entry; a digital-only order becomes `CONFIRMED` and then `DELIVERED` in the same transaction (`deliveredAt = confirmedAt`, research D6) so the library opens at once; an order with any physical line stays `CONFIRMED` for the simulator.
  - Dep: T057.
  - Check: red before T059 and T060.

- [x] T059 [US6] BE: Implement `confirmPayment` and `failPayment` in `CheckoutService`; add `payment/service/WalletService` (balance change and `WalletTransaction` row in one transaction with `SELECT ... FOR UPDATE` on the member); award `floor(payable / 10)` points with an `EARNED` row; `fail` restores stock and points with `RESTORED_ON_FAILURE`.
  - Accept: wallet payment writes a `DEBIT` row with source `ORDER_PAYMENT`; `ORDER_EXPIRED` 409 when the order is not `PENDING`; digital-only orders are marked `DELIVERED` as described in T058.
  - Dep: T058.
  - Check: `CheckoutIT` fully green.

- [x] T059a [US6] TEST: Write `order/OrderTotalsMatrixIT` (SC-005): one parameterised test over 3 order types (physical, digital, mixed) x 6 payment methods (credit card, debit card, UPI, net banking, wallet, COD), with and without redeemed points. For each cell it creates, pays and then cancels a confirmed physical line where allowed, and asserts `subtotal`, `shippingAmount`, `discountAmount`, `totalAmount`, `pointsEarned` and the cancellation fee against values computed independently in the test from the data-model formulas. COD with a digital line must return 400 `COD_NOT_AVAILABLE`; wallet cells top up first through `WalletService`.
  - Accept: 18 cells x 2 (points on and off) all pass; 100 percent of figures match the formulas (SC-005, FR-032, FR-033, FR-045, FR-046).
  - Dep: T059.
  - Check: `mvn -q -Dtest=OrderTotalsMatrixIT verify` green; a deliberately wrong fee rate in a scratch run turns it red.

- [x] T060 [US6] TEST: Write `order/OrderExpiryUT#expiresAfterFifteenMinutes` and `#notBeforeFifteenMinutes` with a fixed clock, and `order/OrderStateUT#legalAndIllegalTransitions`.
  - Accept: legal transitions are exactly those in the state diagram of `data-model.md`.
  - Dep: T057.
  - Check: red before T061.

- [x] T061 [US6] BE: Create `order/service/OrderStateMachine` and `order/job/OrderExpiryJob` (scheduled, uses `Clock`, restores stock and points, sets `FAILED`); add `config/SchedulingConfig`.
  - Accept: the job is idempotent and safe if two instances run.
  - Dep: T060.
  - Check: `OrderExpiryUT` and `OrderStateUT` green.

### User Story 7 - Order history, tracking, Buy Again (backend)

**Independent test**: place two orders; list newest first; open one; Buy Again with one book out of stock.

- [x] T062 [US7] TEST: Write `order/OrderIT` (`newestFirstConfirmedOnly`, `otherMembersOrderIs404`, `detailHasAllFields`, `buyAgainReportsUnavailable`, `pendingAndFailedHidden`), Mockito `order/OrderServiceTest` (`listsConfirmedAndLaterOnly`, `buyAgainSkipsUnavailable`, `loadsByIdAndMemberOnly`) and `FulfilmentSimulatorUT` (`advancesByOffsets`, `neverSkipsStatus`).
  - Accept: history excludes `PENDING` and `FAILED`; detail shows items, quantities, prices, delivery charge, points redeemed and earned, payment method, address, status, dates and the server field `cancellable`.
  - Dep: T059.
  - Check: red before T063 and T064.

- [x] T063 [US7] BE: Create `order/service/OrderService`, `order/controller/OrderController` and `order/dto/OrderDto` for `listOrders`, `getOrder`, `buyAgain`.
  - Accept: ownership by `(id, memberId)` query; `cancellable` computed by the server.
  - Dep: T062.
  - Check: `OrderIT` green.

- [x] T064 [US7] BE: Create `order/job/FulfilmentSimulator` advancing `CONFIRMED` orders that contain at least one physical line to `PROCESSING` (+2 h), `SHIPPED` (+6 h) and `DELIVERED` (next day 15:00) using configured offsets and the injected `Clock`; COD orders follow the same path.
  - Accept: offsets come from `application.properties`; timestamps `packedAt`, `shippedAt`, `deliveredAt` are set; digital-only orders are never touched (already `DELIVERED`).
  - Dep: T062.
  - Check: `FulfilmentSimulatorUT` green.

### User Story 8 - Cancel an order (backend)

**Independent test**: cancel part of an order inside the window and compare preview to result; confirm a forced cancel after 48 hours is rejected.

- [x] T065 [US8] TEST: Write `order/CancellationMathUT` (`refundFormula`, `pointsRestoredProportional`, `feeTiersByStatus`, `refundNeverNegative`).
  - Accept: FR-054 (discount share and refund), FR-055 (fee tiers), FR-056 (refund), FR-057 (points restored). "Cancel fee `valueCancelled x rate`; rate 0 (`CONFIRMED`), 0.10 (`PROCESSING`), 0.20 (`SHIPPED`)"; "Discount share `discountAmount x valueCancelled / subtotal`"; "Refund `max(0, valueCancelled - discountShare - fee)`; shipping is not refunded"; "Points restored `round(giftPointsUsed x valueCancelled / subtotal)`".
  - Dep: T049.
  - Check: red before T066.

- [x] T066 [US8] BE: Create `order/service/CancellationCalculator` implementing the formulas with `BigDecimal` and `MoneyUtil`.
  - Accept: pure class, no repository access.
  - Dep: T065.
  - Check: `CancellationMathUT` green.

- [x] T067 [US8] TEST: Write `CancellationWindowIT` (`insideWindowAllowed`, `oneSecondBeforeBoundaryAllowed`, `atExactBoundaryRefused`, `afterWindow409CannotCancel`, `previewBlockedReason`, `orderDtoCancellableFalseAfterWindow`) and `CancellationIT` (`feeTiers`, `deliveredBlocked`, `alreadyCancelledBlocked`, `digitalNotCancellable`, `mixedOrderPhysicalOnly`, `partialByQuantity`, `overQuantity400`, `previewMatchesCancel`, `walletRefundCreditsAtOnce`, `bankRefundInitiatedMasked`, `badIfsc400`, `restocks`, `pointsRestoredOnCancel`, `reasonRequired400`, `otherMembersOrderIs404`) and Mockito `order/CancellationServiceTest` (`windowCheckedBeforeStatus`, `restocksCancelledQuantity`, `restoresPointsProportionally`, `refundsToWalletViaWalletService`, `setsCancelledOnlyWhenNoPhysicalLeft`). FR-053 to FR-059.
  - Accept: FR-053 (window), FR-054 to FR-058 covered by the tests listed; window is "open while `now < createdAt + 48h`, tested before any fee"; at exactly 48 hours it is closed (spec edge case), and the two boundary tests fix both sides with a fixed `Clock`; bank details: "holder 2+ chars, account 9-18 digits, IFSC `^[A-Z]{4}0[A-Z0-9]{6}$`", account stored masked as `XXXXXX1234`.
  - Dep: T064, T066.
  - Check: red before T068 and T069.

- [x] T068 [US8] BE: Implement `cancelPreview` and `cancelOrder` in `order/service/CancellationService` and `OrderController`: window check first, then status, then items; write an `OrderCancellation` row, update `cancelledQuantity`, running `cancellationFee` and `refundAmount`; return stock; restore points with `RESTORED_ON_CANCEL`; set `CANCELLED` only when no physical quantity remains; refund to wallet through `WalletService` (`ORDER_REFUND`, `PROCESSED`) or to bank (`INITIATED`, masked destination).
  - Accept: `CANNOT_CANCEL` and `REFUND_CHANGED` are 409; preview and cancel use the same calculator; the response and the order DTO show the server's `cancellable`.
  - Dep: T067.
  - Check: `CancellationIT` and `CancellationWindowIT` green.

- [x] T069 [US8] TEST: Extend `OwnershipIT` to orders, payments and cancellations; add `WalletTransactionIT#refundWritesCreditRow`.
  - Accept: no cross-member read or write succeeds on any Phase 3 route. FR-005, SC-009.
  - Dep: T068.
  - Check: green.

### Phase 3 gate

- [x] T070 Gate: run `mvn -q verify`; walk `quickstart.md` backend scenarios 1 to 9 with `Invoke-RestMethod`; run `OpenApiContractTest` with the allow-list reduced to Tier 2 operations; commit `feat: checkout, orders, cancellation`.
  - Accept: every P3 row of `coverage-matrix.md` has a passing test; the backend gate is declared in the commit body.
  - Dep: T050 to T069 including T059a.
  - Check: scenario notes and test counts in the commit body.

---

## Phase 4: Frontend foundation

**Purpose**: Theme tokens, client plumbing, navigation frame, login and register.

**Exit gate**: `check:tokens`, lint, tests and build green; light, dark and system verified on login and register.

### 4A. Setup

- [x] T071 FE: Create `frontend/package.json` and install the stack from research D12 with `npm install`, then run `npm audit`. Record every version actually installed and any fallback for peer conflicts in `research.md` D12; commit `package-lock.json`.
  - Accept: React 18.3.1; no high or critical audit finding; any downgrade is recorded with the reason.
  - Dep: T070.
  - Check: `npm ls --depth=0` matches D12; `npm audit --audit-level=high` exits 0.

- [x] T072 [P] FE: Create `frontend/vite.config.js` (dev server on `localhost:5173`, API proxy to `http://127.0.0.1:5000`, Vitest settings), `index.html`, `eslint.config.js` with `jsx-a11y` and a `no-restricted-imports` rule that allows icons only from `lucide-react` (constitution VI), and scripts `dev`, `build`, `lint`, `test`, `check:tokens`.
  - Accept: no external URLs; the proxy target is loopback.
  - Dep: T071.
  - Check: `npm run lint` and `npm run build` run on the empty shell.

- [x] T073 [P] OPS: Write `scripts/check-tokens.mjs` failing on hex colours, `rgb()`, `hsl()`, named colours in styles, and default Tailwind palette classes (for example `bg-blue-600`, `text-gray-500`) inside `frontend/src`, except `theme.css`.
  - Accept: exits 1 on a planted `bg-blue-600`; exits 0 on tokens.
  - Dep: T072.
  - Check: plant, run, remove.

### 4B. Foundation

- [x] T074 FE: Create `frontend/src/styles/theme.css` with the semantic tokens of research D13 (`--color-bg`, `--color-surface`, `--color-text`, `--color-muted`, `--color-border`, `--color-primary`, `--color-primary-fg`, `--color-success`, `--color-danger`, `--color-warning`) for `:root` and `.dark`, mapped in Tailwind `@theme`; add the pre-paint theme script to `index.html`.
  - Accept: first file of the frontend source; contrast of text on surface is at least 4.5:1 in both themes.
  - Dep: T073.
  - Check: `npm run check:tokens` green; manual contrast check of the two palettes.

- [x] T075 [P] FE: Create `src/lib/axiosClient.js` (one instance, base `/api`, bearer token, envelope unwrap, error-code to message map, 401 redirect with return location), `src/lib/queryClient.js`, `src/lib/format.js` (rupee formatting) and `src/lib/errors.js`.
  - Accept: no component calls Axios directly; internal error details are never shown (FR-073); the bearer token lives in a module variable in memory only, never in `localStorage` or `sessionStorage` (decision H5).
  - Dep: T072.
  - Check: `axiosClient.test.js` (envelope unwrap, 401 handling, `VALIDATION_ERROR` field errors) green.

- [x] T076 [P] FE: Create the UI primitives in `src/components/ui` (`Button`, `Input`, `Select`, `Card`, `Badge`, `Spinner`, `EmptyState`, `ErrorState`, `Pagination`, `Modal`) using tokens only.
  - Accept: each has accessible labels and keyboard operation (FR-077); loading, empty and error states exist (FR-076).
  - Dep: T074.
  - Check: component tests plus `check:tokens`.

- [x] T077 FE: Create providers `src/providers/ThemeProvider.jsx` (Light, Dark, System, persisted, follows device), `PincodeProvider.jsx` (6-digit validation, persisted), `AuthProvider.jsx` (token, member, logout) and `QueryProvider.jsx`.
  - Accept: theme applies at once and survives reload; invalid pincode is rejected with a message; `AuthProvider` keeps the token in memory only, so a reload logs the user out (decision H5) and logout clears it.
  - Dep: T075.
  - Check: `ThemeProvider.test.jsx`, `PincodeProvider.test.jsx`, `AuthProvider.test.jsx#tokenNotInStorage`, `#logoutClearsToken` green.

- [x] T077a [P] TEST: Create the shared test utilities used by every later page test: `src/test/setup.js` (Vitest setup, MSW server start and reset), `src/test/handlers.js` (default handlers for the envelope), `src/test/renderWithProviders.jsx` (Router, Query, Theme, Pincode, Auth providers) and `src/test/pages.js` (a registry of every routed page with its main endpoint, extended by each page task).
  - Accept: one place for MSW and render helpers; no page test builds its own provider tree.
  - Dep: T077.
  - Check: `renderWithProviders.test.jsx` green.

- [x] T078 FE: Create `src/App.jsx`, `src/main.jsx`, router and `RequireAuth` that remembers the return location.
  - Accept: guest on a protected route goes to login and returns after login.
  - Dep: T077.
  - Check: `RequireAuth.test.jsx` green.

- [x] T078a [US4] FE: Create `src/features/cart/api/cartApi.js` and the read hook `src/features/cart/hooks/useCart.js` (server cart, item count for the badge). Moved here from T087 so the Navbar can use it.
  - Accept: `useCart` returns the server cart and `itemCount`; nothing is computed in the client (FR-072).
  - Dep: T075, T077.
  - Check: `useCart.test.jsx` (MSW) green.

- [x] T079 [US4] FE: Execution order note: build T078a and T080 first, then this task. Create `src/components/layout/Navbar.jsx` and `Footer.jsx`: logo, search entry, links to My Orders, Wishlist, E-Library and Writers, pincode picker, wallet pill, cart badge ("9+" above 9), user menu (Profile, Wallet, Gift Points, theme toggle, Help, Logout); guests see Login and Register instead of user items. Links for Tier 2 routes are added in Phase 8 as each page exists, so no link is ever dead.
  - Accept: FR-020, FR-021 (badge 9+), FR-022 (user menu), FR-023 (theme), FR-024 (pincode), FR-070, FR-077; the wallet pill and user menu read `useAuth` (T080), the badge reads `useCart` (T078a).
  - Dep: T078, T078a, T080.
  - Check: `NavbarTest#badgeNinePlus`, `#guestSeesLoginRegister`, `#themeToggleChangesTheme`, `#pincodeRejectsInvalid`, `#noDeadLinks` green.

### User Story 1 - Register, log in, log out (frontend)

**Independent test**: register, log out, log in, and as a guest press Add to Cart (Phase 5) to be sent to login and returned.

- [x] T080 [P] [US1] FE: Runs before T079. Create `src/lib/schemas.js` zod schemas for register and login mirroring the server rules ("password 6-72 chars", name 2-100, valid email) and `src/features/auth/api/authApi.js`, `hooks/useAuth.js`.
  - Accept: messages are field-level; nothing is sent until valid; `useAuth` exposes `member`, `giftPoints` and `walletBalance` from `GET /api/auth/me`.
  - Dep: T077.
  - Check: `authSchemas.test.js` green.

- [x] T081 [US1] FE: Create `src/features/auth/pages/LoginPage.jsx` and `RegisterPage.jsx` with react-hook-form and zod; show the server's generic invalid-credentials message and the duplicate-email message.
  - Accept: scenarios 1 to 6 of US1; works in light and dark. FR-001 to FR-004, FR-071, FR-074.
  - Dep: T079, T080.
  - Check: `LoginPage.test.jsx`, `RegisterPage.test.jsx` (MSW) green; manual check in both themes.

### Phase 4 gate

- [x] T082 Gate: run `npm run check:tokens; npm run lint; npm test; npm run build`; manually verify login and register in Light, Dark and System; commit `feat: frontend foundation and auth`.
  - Accept: all four commands exit 0; no hard-coded colour.
  - Dep: T071 to T081 including T077a and T078a.
  - Check: output summary in the commit body.

---

## Phase 5: Frontend browse

**Purpose**: Home, filters, tiles, product page.

**Exit gate**: phase tests green; manual scenario 2 passes in both themes.

### User Story 2 - Browse, search and filter (frontend)

**Independent test**: open the home page as a guest, pick a category and a filter, reload, and see the same results.

- [x] T083 [P] [US2] FE: Create `src/features/catalog/api/catalogApi.js` and hooks `useBooks`, `useCategories`, `useRecommendations`, `useBestsellers`, `useNewLaunches`, plus the product-page hooks `useBook`, `useRelated`, `useNotifyMe` and `useDeliveryEstimate` (TanStack Query, keys include every filter and the pincode).
  - Accept: one hook per server call; no filter logic duplicated in components.
  - Dep: T082.
  - Check: `useBooks.test.jsx` and `useProductHooks.test.jsx` (MSW) green.

- [x] T084 [US2] FE: Create `src/features/catalog/hooks/useFilterParams.js` holding category, search, language, format, price, sort and page in the URL.
  - Accept: FR-012: reload, share and back button reproduce the view. FR-010.
  - Dep: T083.
  - Check: `HomePageTest#filtersRoundTripThroughUrl`.

- [x] T085 [US2] FE: Create `BookTile.jsx` (cover, title, author link, format, price with discount, delivery date from the server, no date for digital) and `BookGrid.jsx`.
  - Accept: FR-013 and FR-016.
  - Dep: T083.
  - Check: `BookTile.test.jsx#digitalHasNoDeliveryDate`.

- [x] T086 [US2] FE: Create `HomePage.jsx` with category sidebar (pills on small screens), search, Language, Format, Price and Sort filters, curated rows when no filter is set, paginated results otherwise, and an empty state with Clear filters.
  - Accept: US2 scenarios 1 to 6; no language picker control anywhere (FR-017). FR-010, FR-011, FR-011a, FR-076.
  - Dep: T084, T085.
  - Check: `HomePageTest` (curated rows, filtered results, empty state, mobile pills) and `NoForbiddenControlsTest#noLanguagePicker` green.

### User Story 3 - Tile cart controls and product page (frontend)

**Independent test**: as a member add a book from its tile, use the stepper, open the product page, check a pincode.

- [x] T087 [P] [US3] FE: Extend `src/features/cart/api/cartApi.js` (created in T078a) with the mutation hooks `useAddToCart`, `useUpdateCartItem`, `useRemoveCartItem`; optimistic updates are not used, the server reply is shown.
  - Accept: cart badge and totals come from the server response.
  - Dep: T082, T078a.
  - Check: `useCartMutations.test.jsx` green.

- [x] T088 [US3] FE: Create `src/features/cart/components/CartControl.jsx`: Add to Cart, then quantity stepper plus Go to Cart; guest is sent to login and returned; stock limit shows a clear message.
  - Accept: US3 scenarios 1 to 3; quantity zero returns to Add to Cart. FR-004, FR-030, FR-031.
  - Dep: T087, T085.
  - Check: `CartControl.test.jsx` (guest redirect, stepper, stock refusal) green.

- [x] T089 [US3] FE: Create `src/features/catalog/pages/ProductPage.jsx` with stock badge, price, delivery date, pincode check (physical only), publisher, related books, About the Writer, and Notify Me in place of Add to Cart when out of stock; a placeholder slot for reviews and wishlist is not rendered until Phase 8.
  - Accept: US3 scenarios 4 to 7. FR-014, FR-014a, FR-015, FR-016, FR-076.
  - Dep: T088.
  - Check: `ProductPage.test.jsx` (out of stock shows Notify Me, ebook shows no pincode check, invalid pincode message) green.

- [x] T090 [US3] TEST: Write `NoDeadButtonsTest` for the login, register, home and product pages: every `button` has a handler or `type=submit`; and `NoForbiddenControlsTest#noPromoField` base case.
  - Accept: the test is reused by later phases.
  - Dep: T089.
  - Check: green.

### Phase 5 gate

- [x] T091 Gate: run `npm run check:tokens; npm run lint; npm test; npm run build`; walk `quickstart.md` manual scenario 2 in Light and Dark; commit `feat: frontend browse`.
  - Accept: all green; both themes legible.
  - Dep: T083 to T090.
  - Check: notes in the commit body.

---

## Phase 6: Frontend cart, checkout, payment, confirmation

**Purpose**: Turn the cart into a paid order using only server-calculated values.

**Exit gate**: phase tests green, including the invalid-payment table shared with the backend; manual scenarios 3 and 4 pass in both themes.

### User Story 5 - Cart and delivery address selection (frontend)

**Independent test**: add books under and over 500 rupees, check delivery charge, progress bar and points hint; confirm the default address is pre-selected.

- [x] T092 [P] [US5] FE: Create `src/features/profile/api/addressApi.js` and hooks `useAddresses`, `useCreateAddress`, `useUpdateAddress`, `useDeleteAddress`.
  - Accept: one place for address calls; the profile page in Phase 8 reuses them.
  - Dep: T091.
  - Check: `useAddresses.test.jsx` (MSW) green.

- [x] T093 [US5] FE: Create the single `src/components/AddressForm.jsx` with a zod schema in `src/lib/schemas.js` mirroring the server ("recipientName 2-100", "phone 10 digits", "line1 required, <=120", "postalCode `^[1-9][0-9]{5}$`").
  - Accept: FR-037: this is the only address form; this task creates `scripts/check-single-address-form.mjs` (fails if any file other than `AddressForm.jsx` contains a form with a `postalCode` field) and chains it into `npm run lint`.
  - Dep: T092.
  - Check: `AddressFormTest` (valid, bad pincode, bad phone) green; the grep check runs in `npm run lint`.

- [x] T094 [US5] FE: Create `src/features/cart/pages/CartPage.jsx` with line items, stepper and remove, `AddressSelector.jsx` (default pre-selected, add address through `AddressForm`), `FreeDeliveryBar.jsx`, a summary panel (subtotal, delivery, Grand Total, points hint), an empty state, and no promo field.
  - Accept: US5 scenarios 1 to 9; FR-032 to FR-036, FR-040, FR-072, FR-076; every amount comes from the cart response; digital-only carts hide the address selector; mixed carts require an address; FR-034 (free-delivery bar) and FR-035 (no promo field) are asserted by `#under500Shows49AndBar` and `#noPromoField`.
  - Dep: T093, T087.
  - Check: `CartPageTest#defaultAddressPreselected`, `#under500Shows49AndBar`, `#atOrAbove500Free`, `#digitalOnlyNoAddress`, `#mixedRequiresAddress`, `#emptyState`, `#noPromoField`, `#totalsComeFromServer` green.

### User Story 6 - Checkout, payment, confirmation (frontend)

**Independent test**: place one order with each payment method, confirm invalid forms are blocked, check the confirmation page, points and wallet balances.

- [x] T095 [P] [US6] FE: Create `src/features/checkout/api/checkoutApi.js` and hooks `useValidateCheckout`, `useApplyPoints`, `useCreateOrder`, `useConfirmPayment`, `useFailPayment`, `useBanks`; the `Idempotency-Key` is generated once per checkout attempt and reused on retry.
  - Accept: a double click or browser back never sends a second order (FR-049).
  - Dep: T091.
  - Check: `useCheckout.test.jsx` (same key on retry) green.

- [x] T096 [US6] TEST: Write `src/lib/paymentSchema.test.js` driven by the same `payment-cases.json` as `PaymentDetailsValidatorUT` (copied by a Vitest setup that reads `../backend/src/test/resources/payment-cases.json` rather than a second copy).
  - Accept: one table, two consumers; the test fails if a case is added on only one side.
  - Dep: T052, T091.
  - Check: red before T097.

- [x] T097 [US6] FE: Add `paymentSchema` to `src/lib/schemas.js`: card ("exactly 16 digits (spaces and dashes allowed; no checksum test)", name "2 to 50 letters", CVV "exactly 3 digits", expiry "MM/YYYY format that is the current month or later"), UPI, bank from the server list, wallet, COD.
  - Accept: same accept and reject results as the server table.
  - Dep: T096.
  - Check: `paymentSchema.test.js` green.

- [x] T098 [US6] FE: Create `src/features/checkout/pages/CheckoutPage.jsx` with six tabs (`PaymentTabs.jsx`: Credit Card, Debit Card, UPI, Net Banking, Book Haven Wallet, Cash on Delivery), a payable amount from the server, `PointsRedeem.jsx` (10 points = 1 rupee, never above balance), disabled COD with an explanation when a digital item is present, and inline field errors from both zod and server `fieldErrors`.
  - Accept: FR-041, FR-042 (COD off for digital), FR-043, FR-044, FR-045; the Wallet tab shows only the Book Haven Wallet and its balance, and refuses an insufficient balance with a message; no promo field; the page uses tokens only.
  - Dep: T097, T095, T094.
  - Check: `PaymentTabsTest#walletTabOnlyBookHavenWallet`, `#codDisabledForDigital`, `#invalidCardBlocksSubmit`, `#invalidUpiBlocksSubmit`, `#noBankBlocksSubmit`, `#pointsOverBalanceRefused`, `#insufficientWalletMessage`, `NoForbiddenControlsTest#noPromoOnPayment` green.

- [x] T099 [US6] FE: Create `src/features/checkout/pages/ConfirmationPage.jsx` showing success message, purchased books, delivery date from the server, `pointsEarned` from the server and Continue Shopping; a failed payment returns the user to checkout with stock and points restored message and a Retry action.
  - Accept: FR-046, FR-047, FR-048, FR-049; the page never computes points; navigating back does not resubmit.
  - Dep: T098.
  - Check: `ConfirmationPageTest#showsServerPoints`, `#backDoesNotResubmit`, `#failedPaymentRetry` green.

- [x] T100 [US6] FE: Handle mid-checkout session expiry: a 401 sends the user to login and returns to checkout with the cart intact; handle a stock or price change reply (409 `INSUFFICIENT_STOCK`, changed totals) by showing current values before payment.
  - Accept: spec edge cases for session expiry, price change and last-copy race.
  - Dep: T098.
  - Check: `CheckoutEdgeCasesTest#sessionExpiryReturnsToCheckout`, `#stockConflictShowsMessage` green.

- [x] T101 [US6] TEST: Extend `NoDeadButtonsTest` to the cart, checkout and confirmation pages, and run a theme check that renders each page with `class="dark"` and asserts no inline colour style.
  - Accept: FR-070, FR-071 for these pages.
  - Dep: T099.
  - Check: green; `npm run check:tokens` green.

### Phase 6 gate

- [x] T102 Gate: run `npm run check:tokens; npm run lint; npm test; npm run build`; with the backend running walk `quickstart.md` manual scenarios 3 and 4 (one order per payment method, invalid forms, failed payment, wallet shortfall, digital-only order) in Light and Dark; commit `feat: frontend cart, checkout, confirmation`.
  - Accept: all green; payment and confirmation pages respect both themes.
  - Dep: T092 to T101.
  - Check: notes in the commit body.

---

## Phase 7: Frontend orders

**Purpose**: History, details, Buy Again and cancellation.

**Exit gate**: phase tests green; Tier 1 verified end to end (SC-011).

### User Story 7 - Order history, tracking, Buy Again (frontend)

**Independent test**: place two orders, open My Orders, open a detail, use Buy Again.

- [x] T103 [P] [US7] FE: Create `src/features/orders/api/orderApi.js` and hooks `useOrders`, `useOrder`, `useBuyAgain`, `useCancelPreview`, `useCancelOrder`.
  - Accept: cancel preview and cancel share one request body builder.
  - Dep: T102.
  - Check: `useOrders.test.jsx` green.

- [x] T104 [US7] FE: Create `OrderCard.jsx` with `OrderTracker.jsx` (Confirmed, Processing, Shipped, Delivered, or Cancelled; Pending and Failed orders never reach the list) and `OrdersPage.jsx` (newest first, empty state with link to browsing).
  - Accept: FR-050, FR-059; the tracker starts at Confirmed; Cancel button shown only when the server field `cancellable` is true.
  - Dep: T103.
  - Check: `OrdersPageTest#newestFirst`, `#emptyState`, `OrderCardTest#noCancelButtonWhenNotCancellable`, `#trackerShowsStatus` green.

- [x] T105 [US7] FE: Create `OrderDetailPage.jsx` (items, quantities, prices, delivery charge, points redeemed and earned, payment method, address snapshot, status, dates, cancelled items) and the Buy Again action with a message naming unavailable titles.
  - Accept: US7 scenarios 2, 3 and 5; another member's order id shows a not-found state. FR-051, FR-052, FR-005, FR-076.
  - Dep: T104.
  - Check: `OrderDetailPageTest#showsAllFields`, `#buyAgainListsUnavailable`, `#otherMembersOrderNotFound` green.

### User Story 8 - Cancel an order (frontend)

**Independent test**: cancel part of an order inside the window and see the preview; an order older than 48 hours offers no Cancel.

- [x] T106 [US8] FE: Create `CancelOrderModal.jsx`: item and quantity selection (physical only), mandatory reason, refund destination (wallet or bank), bank form (holder, account number, IFSC validated with zod: "holder 2+ chars, account 9-18 digits, IFSC `^[A-Z]{4}0[A-Z0-9]{6}$`"), a server preview (fee tier, fee, refund, points restored) before the confirm button, and the masked account on the result.
  - Accept: US8 scenarios 1 to 11; FR-053 to FR-059; every figure is from the preview or cancel response; digital lines are not selectable.
  - Dep: T105.
  - Check: `CancelOrderModalTest#previewBeforeConfirm`, `#reasonRequired`, `#digitalLinesNotSelectable`, `#bankDetailsValidated`, `#showsMaskedAccount`, `#serverRejectionShownClearly` green.

- [x] T107 [US8] TEST: Write `CancellationVisibilityTest#hiddenAfter48HoursAndOnDeliveredCancelledDigital` using MSW orders with `cancellable` true and false; extend `NoDeadButtonsTest` to the orders pages.
  - Accept: SC-006 at UI level.
  - Dep: T106.
  - Check: green.

- [x] T107a [US8] TEST: Write `PageStatesTest` (FR-076) that loops over the page registry in `src/test/pages.js` and, for every Tier 1 page that fetches data, uses MSW to assert the loading state (delayed reply shows `Spinner`), the empty state (empty list shows `EmptyState` with its call to action) and the error state (500 shows `ErrorState` with the generic message and a Retry action, no internal detail).
  - Accept: every Tier 1 routed page is in the registry; a page missing from the registry fails `PageStatesTest#registryCoversEveryRoute`.
  - Dep: T107, T077a.
  - Check: green; T137 extends the registry for Tier 2.

### Phase 7 gate

- [x] T108 Gate (Tier 1 verification, SC-011): run all frontend and backend checks; walk `quickstart.md` manual scenarios 1 to 6 in Light and Dark; confirm every acceptance scenario of stories 1 to 8 with a tick list in `specs/001-book-haven-bookstore/checklists/tier1-verification.md`; commit `feat: frontend orders; Tier 1 verified`.
  - Accept: the tick list has no unticked scenario; this gate must pass before T109.
  - Dep: T103 to T107a.
  - Check: the tick list file is committed. Create `tier1-verification.md` with one `- [ ] US#-S#` line per acceptance scenario of stories 1 to 8, copied from `spec.md`.

---

## Phase 8: Tier 2 extras (required)

**Purpose**: Wallet top-up, gift points history, wishlist, writers and follow, reviews, E-Library and reader, profile and address management, help page. Backend first, then frontend, per feature.

**Entry rule**: starts only after T108 (Tier 1 verified, SC-011). Tier 2 is required: the build is not complete until T138 passes.

**Exit gate**: Tier 2 matrix rows green; contract allow-list empty; Tier 2 navbar entries all live (FR-070).

**Contract note**: the route parameters are those in `contracts/openapi.yaml`, which governs over the coverage matrix wording: `/api/library/{bookId}/...`, `/api/wishlist/{bookId}`, `/api/authors/{slug}`, `/api/following/{slug}`.

### 8A. Backend

#### User Story 9 - Wallet top-up and gift points history (backend)

**Independent test**: top up the wallet and see balance and transaction; place an order and read the points history.

- [x] T109 [US9] TEST: Write `payment/WalletIT` (`balanceAndTransactions` newest first, `rangeOneToOneLakh` accepting 1 and 100000 and refusing 0, 0.99, 100000.01 and a non-number, `invalidPayment400`, `declinedCard402LeavesBalance`, `topUpWritesCreditRowWithSourceTopup`, `guestIs401`, `concurrentTopUpsAddUp`).
  - Accept: amount "from 1 to 100,000 rupees"; details validated with the same FR-043 rules; card number, CVV and UPI id are never stored or logged.
  - Dep: T108.
  - Check: red before T110.

- [x] T110 [US9] BE: Create `payment/controller/WalletController` and extend `WalletService` for `getWallet` and `topUpWallet`: validate amount, validate details with `PaymentDetailsValidator`, run `SimulatedGateway`, then credit the balance and write a `CREDIT` row with source `TOPUP` in one transaction with the member row locked.
  - Accept: FR-060; the response is the `Wallet` schema (`balance`, `transactions`); amount errors use reason `INVALID_AMOUNT` with status 400; the navbar balance comes from `GET /api/auth/me`.
  - Dep: T109.
  - Check: `WalletIT` green; `WalletTransactionIT#refundWritesCreditRow` still green.

- [x] T111 [US9] TEST: Write `member/PointsHistoryIT` (`listsEarnedRedeemedRestored` covering `EARNED`, `REDEEMED`, `RESTORED_ON_FAILURE`, `RESTORED_ON_CANCEL`, `newestFirst`, `onlyOwnEntries`, `guestIs401`, `balanceMatchesSum`).
  - Accept: each entry carries date, reason and signed points; the current balance equals the member's `giftPoints`.
  - Dep: T108.
  - Check: red before T112.

- [x] T112 [US9] BE: Add `pointsHistory` to `member/controller/AuthController` and `member/service/PointsService` reading `GiftPointsTransaction` by `memberId`.
  - Accept: FR-065; matches the `PointsHistory` schema in the contract; no write path is added here (writing was done in Phase 3).
  - Dep: T111.
  - Check: `PointsHistoryIT` green.

#### User Story 10 - Wishlist (backend)

**Independent test**: add, list and remove a wishlist item; adding twice is harmless.

- [x] T113 [US10] TEST: Write `catalog/WishlistIT` (`list` with delivery dates for the request pincode, `addIdempotent`, `remove`, `unknownBook404`, `removeAbsentIs404`, `guestIs401`, `otherMembersListNotVisible`).
  - Accept: wishlist item is "unique `(memberId, bookId)`".
  - Dep: T108.
  - Check: red before T114.

- [x] T114 [US10] BE: Create `catalog/service/WishlistService`, `catalog/controller/WishlistController`, `catalog/repository/WishlistItemRepository` and `catalog/entity/WishlistItem` for `listWishlist`, `addWishlistItem`, `removeWishlistItem`.
  - Accept: FR-061; the list returns `BookSummary` items; adding an existing item returns success without a duplicate row; wishlist rows already feed `RecommendationService`.
  - Dep: T113.
  - Check: `WishlistIT` green; `RecommendationServiceUT#fromOrdersAndWishlistElseTopSellers` still green.

#### User Story 11 - Writers (backend)

**Independent test**: browse writers, open one, follow, list followed, unfollow.

- [x] T115 [US11] TEST: Write `catalog/AuthorIT` (`browse` public, `profileWithBooks` public with delivery dates, `unknownSlug404`, `follow`, `followTwiceIsIdempotent`, `followList`, `unfollow`, `unfollowNotFollowing404`, `guestFollowIs401`, `bioAndImageReturned`).
  - Accept: author follow is "unique `(memberId, authorId)`".
  - Dep: T108.
  - Check: red before T116.

- [x] T116 [US11] BE: Create `catalog/service/AuthorService`, `catalog/controller/AuthorController`, `catalog/controller/FollowingController`, `catalog/repository/AuthorFollowRepository` and `catalog/entity/AuthorFollow` for `listAuthors`, `getAuthor`, `listFollowing`, `followAuthor`, `unfollowAuthor` (by slug).
  - Accept: FR-062; `listAuthors` and `getAuthor` need no token; the other three need one; the profile has bio, photo and books.
  - Dep: T115.
  - Check: `AuthorIT` green; `SecurityIT#publicRoutesNeedNoToken` updated and green.

#### User Story 12 - Reviews (backend)

**Independent test**: post one review, list it, post a second (409).

- [x] T117 [US12] TEST: Write `catalog/ReviewIT` (`listed` newest first, `createUpdatesRatingAndCount`, `oneReviewPerBook` returning 409 `DUPLICATE_REVIEW`, `bodyOver100Is400`, `bodyExactly100Accepted`, `ratingZeroAndSixAre400`, `missingRatingIs400`, `guestPostIs401`, `guestListIsPublic`, `anyBookMayBeReviewed`).
  - Accept: review `rating` "1-5"; `body` "<= 100 chars"; "unique `(memberId, bookId)`"; adding a review "recalculates `rating` and `reviewCount` in the same transaction"; a verified purchase is not required.
  - Dep: T108.
  - Check: red before T118.

- [x] T118 [US12] BE: Create `catalog/service/ReviewService`, `catalog/controller/ReviewController`, `catalog/repository/ReviewRepository` and `catalog/entity/Review` for `listReviews` and `createReview`; recalculate `Book.rating` and `reviewCount` in the same transaction.
  - Accept: FR-063; the average rating on the product page equals the mean of stored ratings, to one decimal; concurrent first reviews by two members keep the count correct.
  - Dep: T117.
  - Check: `ReviewIT` green; `CatalogIT#detailHasDeliveryDateSoldCountWriter` still green.

#### User Story 13 - Digital library and reader (backend)

**Independent test**: buy an eBook and an audiobook, list the library, read, stream and download; a book not bought is refused.

- [x] T119 [US13] TEST: Write `order/LibraryIT` (`onlyPurchasedDigital` excluding physical books and `PENDING`, `FAILED` and `CANCELLED` orders, `contentRequiresPurchase`, `audioRequiresPurchase`, `downloadRequiresPurchase`, `physicalBookIs404OrForbidden`, `ebookContentHasChapters`, `audioIsAudioWav`, `downloadHasAttachmentHeader`, `guestIs401`, `otherMembersPurchaseDoesNotGrantAccess`).
  - Accept: access "requires such an order item" (an `EBOOK` or `AUDIOBOOK` line in the member's `CONFIRMED` or later order); a refused request returns the envelope with `FORBIDDEN` (403) or `NOT_FOUND` (404) per the contract and never the content.
  - Dep: T108.
  - Check: red before T120.

- [x] T120 [US13] BE: Create `order/service/LibraryService`, `order/controller/LibraryController` and `order/dto/LibraryEntry`, `ReaderContent` for `listLibrary`, `readLibraryBook`, `streamLibraryAudio`, `downloadLibraryBook`. Chapters are generated text for the seeded eBook (generated at read time from the book's description and title, written for this project); audio is a short generated placeholder WAV; no reference file is copied.
  - Accept: FR-064; ownership check happens before any content is built; the content endpoint rejects an audiobook and the audio endpoint rejects an eBook with a clear 404; `Content-Disposition: attachment` on download.
  - Dep: T119.
  - Check: `LibraryIT` green.

#### User Story 14 - Profile (backend)

**Independent test**: change the profile name and read it back from `GET /api/auth/me`.

- [x] T121 [US14] TEST: Write `member/ProfileIT` (`updateName`, `nameTooShort400`, `nameTooLong400`, `emailAndPasswordCannotBeChanged`, `guestIs401`, `meShowsNewName`).
  - Accept: `fullName` "required, 2-100 chars"; the request carries the name only.
  - Dep: T108.
  - Check: red before T122.

- [x] T122 [US14] BE: Add `updateProfile` (`PATCH /api/auth/me`) to `AuthController` and `member/service/ProfileService` with `UpdateProfileRequest`.
  - Accept: FR-066, FR-006; no other member field can be set through this call.
  - Dep: T121.
  - Check: `ProfileIT` green.

#### Backend Tier 2 close

- [x] T123 TEST: Extend `OwnershipIT` to wallet, wishlist, follows, reviews, library and points history; update `SecurityIT#publicRoutesNeedNoToken` and `#everyOtherRouteNeedsToken` with the Tier 2 routes; empty the `OpenApiContractTest` allow-list so every one of the 52 operations must match.
  - Accept: `OpenApiContractTest#everyRouteIsInTheSpecAndViceVersa` passes with an empty allow-list.
  - Dep: T110, T112, T114, T116, T118, T120, T122.
  - Check: `mvn -q verify` green.

- [x] T124 Gate: backend Tier 2: run `mvn -q verify` under JDK 21; walk each Tier 2 route once with `Invoke-RestMethod` from `quickstart.md`; run `scripts/check-secrets.ps1`; commit `feat: Tier 2 backend`.
  - Accept: all Tier 2 backend rows of `coverage-matrix.md` pass; 52 operations in the contract equal the code routes.
  - Dep: T109 to T123.
  - Check: test counts in the commit body.

### 8B. Frontend

#### User Story 9 - Wallet and gift points (frontend)

**Independent test**: top up, see the balance, transaction and navbar pill update; open gift points after an order.

- [X] T125 [P] [US9] FE: Create `src/features/wallet/api/walletApi.js`, hooks `useWallet`, `useTopUp`, `usePointsHistory`, and a `topUpSchema` in `src/lib/schemas.js` ("1 to 100,000 rupees", non-numeric refused) reusing `paymentSchema` for the details.
  - Accept: a successful top-up invalidates the wallet and the `me` queries so the navbar pill updates.
  - Dep: T124.
  - Check: `topUpSchema.test.js` (1, 100000, 0, 100001, "abc", blank) and `useWallet.test.jsx` green.

- [X] T126 [US9] FE: Create `src/features/wallet/pages/WalletPage.jsx` with balance, transactions newest first, empty state, and `TopUpForm.jsx` (amount, payment tabs for card, UPI, net banking, validated like checkout, server field errors, declined message).
  - Accept: US9 scenarios 1 to 3; FR-060, FR-044, FR-043; the Wallet entry in the user menu opens this page; tokens only.
  - Dep: T125.
  - Check: `WalletPageTest#showsBalanceAndTransactions`, `#topUpUpdatesPill`, `#amountOutOfRangeRefused`, `#invalidPaymentBlocksSubmit`, `#declinedShowsMessage` green.

- [X] T127 [US9] FE: Create `src/features/wallet/pages/GiftPointsPage.jsx` listing date, reason and points per entry with the current balance, and an empty state; wire the Gift Points menu entry.
  - Accept: US9 scenario 4; FR-065; reasons are shown as readable labels (Earned, Redeemed, Restored after failed payment, Restored after cancellation).
  - Dep: T125.
  - Check: `GiftPointsPageTest#listsEntriesAndBalance`, `#emptyState` green.

#### User Story 10 - Wishlist (frontend)

**Independent test**: add and remove a book from the wishlist and add one to the cart from it.

- [X] T128 [P] [US10] FE: Create `src/features/wishlist/api/wishlistApi.js`, hooks `useWishlist`, `useToggleWishlist`, and `components/WishlistButton.jsx` placed on `BookTile.jsx` and `ProductPage.jsx` (saved state shown; guest is sent to login and returned).
  - Accept: US10 scenarios 1 and 3; FR-061; the control reflects the server list, not local guesswork.
  - Dep: T124.
  - Check: `WishlistButton.test.jsx#guestRedirect`, `#showsSavedState`, `#toggleCallsApi` green.

- [X] T129 [US10] FE: Create `src/features/wishlist/pages/WishlistPage.jsx` with tiles, Remove, Move to Cart, empty state; Move to Cart adds one copy through `useAddToCart` and then removes the wishlist entry (a true move); an out-of-stock book shows Notify Me instead; enable the Wishlist navbar link and route.
  - Accept: US10 scenarios 2 and 4. FR-061, FR-015, FR-076.
  - Dep: T128.
  - Check: `WishlistPageTest#removeDisappears`, `#moveToCartAddsAndRemoves`, `#outOfStockShowsNotifyMe`, `#emptyState` green.

#### User Story 11 - Writers (frontend)

**Independent test**: open a writer page, follow, see them under Writers, unfollow.

- [X] T130 [P] [US11] FE: Create `src/features/writers/api/writersApi.js`, hooks `useAuthors`, `useAuthor`, `useFollowing`, `useToggleFollow`, and `components/FollowButton.jsx` (Follow becomes Unfollow; guest sent to login).
  - Accept: US11 scenarios 2 and 3. FR-062.
  - Dep: T124.
  - Check: `FollowButton.test.jsx` green.

- [X] T131 [US11] FE: Create `src/features/writers/pages/WritersPage.jsx` (followed writers first, with a browse-all list) and `AuthorPage.jsx` (bio, photo, books, Follow); make writer names on tiles and the product page link to it; enable the Writers navbar link and routes.
  - Accept: US11 scenario 1; FR-062, FR-076; an unknown slug shows a not-found state.
  - Dep: T130.
  - Check: `AuthorPageTest#showsBioPhotoBooks`, `#followChangesButton`, `#unknownSlugNotFound`, `WritersPageTest#listsFollowed`, `#emptyFollowedState` green.

#### User Story 12 - Reviews (frontend)

**Independent test**: post a review, see it listed, try a second one.

- [X] T132 [US12] FE: Create `src/features/reviews/api/reviewsApi.js`, hooks `useReviews`, `useCreateReview`, `components/ReviewList.jsx` (average rating and reviews) and `ReviewForm.jsx` (star rating 1 to 5, text up to 100 characters with a live counter, zod: rating required, "<= 100 chars"); mount both on `ProductPage.jsx`.
  - Accept: US12 scenarios 1 to 4; FR-063; a duplicate shows the server message; the counter updates while typing; guest sees a login prompt in place of the form.
  - Dep: T124.
  - Check: `ReviewFormTest#counterShowsWhileTyping`, `#over100Blocked`, `#ratingRequired`, `#duplicateMessage`, `ReviewListTest#showsAverageAndReviews` green.

#### User Story 13 - Digital library and reader (frontend)

**Independent test**: buy an eBook, open the E-Library, open it in the reader, download it.

- [X] T133 [P] [US13] FE: Create `src/features/library/api/libraryApi.js`, hooks `useLibrary`, `useReaderContent`, and `pages/LibraryPage.jsx` (purchased eBooks and audiobooks, Read or Play and Download actions, empty state linking to digital books); enable the E-Library navbar link and route.
  - Accept: US13 scenarios 1 and 5; FR-064, FR-076; downloads send the bearer token (blob request through the Axios client), never a bare link.
  - Dep: T124.
  - Check: `LibraryPageTest#listsPurchased`, `#emptyStateLinksToDigital`, `#downloadSendsToken` green.

- [X] T134 [US13] FE: Create `pages/ReaderPage.jsx` (chapters with next and previous, font size control, theme-aware) and `components/AudioPlayer.jsx` (play, pause, seek, using a blob URL from the authenticated audio request); a refused request shows a clear message.
  - Accept: US13 scenarios 2 to 4; FR-064, FR-077; every control has an accessible label; no control without behaviour.
  - Dep: T133.
  - Check: `ReaderPageTest#showsChapters`, `#refusedShowsMessage`, `AudioPlayerTest#playPauseSeek` green.

#### User Story 14 - Profile, address management, help (frontend)

**Independent test**: add two addresses, change the default, delete one, edit the profile name; open Help.

- [X] T135 [US14] FE: Create `src/features/profile/pages/ProfilePage.jsx` with name (edit form), email, wallet balance and gift points, and `components/AddressList.jsx` (add, edit, delete, set default) using the single `AddressForm`; a deleted default leaves none selected; enable the Profile menu entry and route.
  - Accept: US14 scenarios 1 to 4; FR-066, FR-037 still holds (no second address form); the name form uses a zod rule "2-100 chars" and shows server field errors.
  - Dep: T124, T093.
  - Check: `ProfilePageTest#showsNameEmailWalletPoints`, `#editNameSaves`, `#nameTooShortBlocked`, `AddressListTest#setDefaultClearsOld`, `#deleteLeavesNoneSelected`, `#invalidPincodeBlocked`, and the single-address-form check green.

- [X] T136 [P] [US14] FE: Create `src/features/help/pages/HelpPage.jsx` with accordion answers on ordering, payment, cancellation (48-hour window and fee tiers), delivery and digital books, written for this project; enable the Help menu entry and route.
  - Accept: US14 scenario 5; FR-067; the cancellation text states the same 48 hours and 0, 10 and 20 percent as the server configuration; keyboard operable accordions.
  - Dep: T124.
  - Check: `HelpPageTest#showsAllFiveTopics`, `#accordionKeyboardOperable` green.

- [X] T137 TEST: Extend `NavbarTest#noDeadLinks` to every Tier 2 entry, run `NoDeadButtonsTest`, `NoForbiddenControlsTest`, `PageStatesTest` (extend the registry with every Tier 2 page) and the dark-class render check over every Tier 2 page, and run `npm run check:tokens` and `npm run lint`.
  - Accept: FR-070, FR-071, FR-077 for all Tier 2 pages.
  - Dep: T126, T127, T129, T131, T132, T134, T135, T136.
  - Check: all green.

- [ ] T138 Gate: Tier 2: run `mvn -q verify` and `npm run check:tokens; npm run lint; npm test; npm run build`; walk the `quickstart.md` Tier 2 scenarios in Light and Dark; tick every acceptance scenario of stories 9 to 14 in `specs/001-book-haven-bookstore/checklists/tier2-verification.md` (create it with one `- [ ] US#-S#` line per scenario copied from `spec.md`); commit `feat: Tier 2 frontend`.
  - Accept: the tick list has no unticked scenario; the contract allow-list is empty; every Tier 2 matrix row has a passing test.
  - Dep: T125 to T137.
  - Check: tick list committed.

---

## Phase 9: Polish and cross-cutting concerns

**Purpose**: Documentation, final audits, and a clean-checkout proof.

**Exit gate**: every command in "Build, test and run" is green on a clean checkout.

- [X] T139 DOC: Write `README.md`: prerequisites (JDK 21 with `JAVA_HOME`, Maven, Node 22, PostgreSQL 18), database creation, the table of required environment variables (names only, no values), backend and frontend commands, the contract test, the demo-member variables for the `dev` profile, how to run each check script.
  - Accept: a new developer can run the app from the README alone; no secret value appears; a "Security notes" section states that local JWT with BCrypt and plain HTTP on 127.0.0.1 are demo-only and that any other deployment needs TLS 1.2+ and OIDC with MFA (plan Complexity Tracking).
  - Dep: T138.
  - Check: follow the README on a clean checkout (T141).

- [X] T140 [P] OPS: Write `scripts/check-env-docs.ps1` comparing the variable names in the README table with those read in `application.properties`, `application-dev.properties` and `AppProperties`; fail on any difference.
  - Accept: exits 1 if a variable is added to one side only.
  - Dep: T139.
  - Check: add and remove a fake variable to prove both directions.

- [ ] T141 TEST: Clean-checkout proof: `git clone` into a temporary folder, set the environment variables, run `mvn -q verify`, then `npm ci; npm run check:tokens; npm run lint; npm test; npm run build`, then both check scripts.
  - Accept: all commands exit 0 with no skipped test.
  - Dep: T139, T140.
  - Check: output saved to `specs/001-book-haven-bookstore/checklists/clean-checkout.md`.

- [ ] T142 [P] OPS: Full secret scan: run `scripts/check-secrets.ps1` over the whole history (`git log -p` pipe) and the working tree; confirm there is no `.env`, default password, JWT secret or seeded admin.
  - Accept: spec SC-008 zero committed secrets; if one is found in history, stop and report it before anything else.
  - Dep: T138.
  - Check: script exit 0; `git grep -i "password" -- '*.properties'` shows only variable references.

- [X] T143 [P] FE: Accessibility pass: `eslint-plugin-jsx-a11y` clean, keyboard-only walk through register, add to cart, checkout, cancel and the reader, visible focus in both themes, labelled icon buttons, and image `alt` text.
  - Accept: FR-077 holds on every page; findings fixed, not suppressed.
  - Dep: T138.
  - Check: lint exit 0; the walk recorded in `checklists/a11y.md`.

- [X] T144 [P] OPS: Dependency audit: `npm audit`, `npm outdated`, `mvn versions:display-dependency-updates`, and a vulnerability scan of the Maven tree; update to the latest stable non-EOL versions and re-run all tests.
  - Accept: no high or critical finding; no EOL component; the backend is still on Spring Boot 4.1.x (or a newer stable 4.x, with a constitution amendment if the minor line changes).
  - Dep: T138.
  - Check: the audit output summary is in `research.md` under a dated note.

- [X] T145 DOC: Remove the Sync Impact Report comment from `.specify/memory/constitution.md`, mark coverage-matrix rows with their final test status, and confirm `plan.md` still shows the O1 to O5 decisions (they were closed on 2026-11-14).
  - Accept: no scratch material remains in committed governance files.
  - Dep: T138.
  - Check: `Select-String -Pattern 'Sync Impact Report'` finds nothing in the constitution.

- [X] T146 TEST: Performance and consistency check: time 100 requests to `GET /api/products` with filters on the seed data and confirm 95 percent under 2 seconds (SC-010); confirm every Tier 2 and Tier 1 page loads without console errors.
  - Accept: SC-010 met; no unhandled promise or React warning in the browser console.
  - Dep: T138.
  - Check: timing output and the console note in `checklists/clean-checkout.md`.

- [X] T146a [P] TEST: Wireframe conformance (SC-003): create `specs/001-book-haven-bookstore/checklists/wireframe-conformance.md` with one row per screen in `docs/wireframes` (home, catalogue, cart and product details, checkout, payment, purchase confirmation; seven JPG files including the architecture sheet) and one sub-row per visible element on that screen. Open each page in the running app in Light and Dark and mark each element present or absent with a note.
  - Accept: every element row is present in the app (100 percent), or is listed as a deliberate difference with the spec reference that overrides the wireframe (for example six payment tabs instead of four).
  - Dep: T138.
  - Check: the file has no unmarked row; deliberate differences are each justified in one line.

- [ ] T147 Gate: final: confirm T141 to T146a pass, tick the success criteria SC-001 to SC-011 in `specs/001-book-haven-bookstore/checklists/success-criteria.md`, and commit `docs: README, audits and final verification`.
  - Accept: every success criterion has a recorded result; work tree is clean.
  - Dep: T139 to T146a.
  - Check: `git status` clean; `git log --oneline` shows one commit per phase.

---

## Dependencies and execution order

### Phase dependencies

- **Phase 1** has no dependency. T001 (open items O1 to O5) is already done, so T004 can start.
- **Phase 2** needs the Phase 1 gate (T031).
- **Phase 3** needs the Phase 2 gate (T049).
- **Phase 4** needs the Phase 3 gate (T070): the backend is built and verified before any frontend work.
- **Phase 5** needs T082; **Phase 6** needs T091; **Phase 7** needs T102.
- **Phase 8** needs T108 (Tier 1 verified); backend 8A (T109 to T124) comes before frontend 8B (T125 to T138).
- **Phase 9** needs T138.

### Story dependencies (inside the phases)

| Story | Backend tasks | Frontend tasks | Depends on |
|-------|---------------|----------------|------------|
| US1 Register, log in, log out | T028 to T030 | T080, T081 | Foundation (T009 to T027) |
| US2 Browse and filter | T032 to T037 | T083 to T086 | US1 security |
| US3 Tile controls and product page | T040, T041 | T087 to T090 | US2, US5 cart |
| US4 Navbar, pincode, theme | T038, T039 | T078a, T079 (after T080) | US1 |
| US5 Cart and addresses | T042 to T048 | T092 to T094 | US2, US4 pricing share |
| US6 Checkout and payment | T050 to T061 | T095 to T101 | US5 |
| US7 Order history | T062 to T064 | T103 to T105 | US6 |
| US8 Cancel order | T065 to T069 | T106, T107 | US7 |
| US9 Wallet and points history | T109 to T112 | T125 to T127 | US6, US8 (wallet rows) |
| US10 Wishlist | T113, T114 | T128, T129 | US2, US3 |
| US11 Writers | T115, T116 | T130, T131 | US2 |
| US12 Reviews | T117, T118 | T132 | US3 |
| US13 Library and reader | T119, T120 | T133, T134 | US6 (orders with digital lines) |
| US14 Profile, addresses, help | T121, T122 | T135, T136 | US5 addresses, US1 |

Frontend tasks for a story always wait for that story's backend gate and for the Phase 4 foundation. US1 to US8 may not overlap in time with US9 to US14.

### Within each story

1. Test task first and seen failing (red).
2. Entities and repositories, then services, then controllers.
3. Frontend: api and hooks, then components, then pages.
4. The phase gate runs last and ends with a commit.

---

## Parallel opportunities

Tasks marked `[P]` touch different files and have no unfinished dependency.

- **Phase 1**: T003 with T005; T011 after T010; T012 and T013 together after T004; entity tasks T017 to T021 all together after T009.
- **Phase 2**: T034 with T036; the cart tests (T044) and address tests (T046) once T043 is done.
- **Phase 3**: T052 (payment cases) with T054 (gateway tests) and T065 (cancellation math tests); T063 with T064.
- **Phase 4**: T072 with T073; T075 with T076; T080 with T076 and T077.
- **Phase 5**: T083 with T087.
- **Phase 6**: T092 with T095.
- **Phase 8 backend**: the seven story pairs (T109/T110, T111/T112, T113/T114, T115/T116, T117/T118, T119/T120, T121/T122) are independent of each other; T109, T111, T113, T115, T117, T119 and T121 can all be written at the same time.
- **Phase 8 frontend**: T125, T128, T130, T132, T133 and T136 can start together once T124 is done.
- **Phase 9**: T140, T142, T143 and T144 run in parallel after T139 and T138.

Example launch for Phase 8 tests:

```text
Task: "TEST: Write payment/WalletIT ... (T109)"
Task: "TEST: Write catalog/WishlistIT ... (T113)"
Task: "TEST: Write catalog/AuthorIT ... (T115)"
Task: "TEST: Write catalog/ReviewIT ... (T117)"
Task: "TEST: Write order/LibraryIT ... (T119)"
```

---

## Implementation strategy

### MVP first (Tier 1)

1. Phase 1 (T001 to T031): foundation and auth.
2. Phase 2 (T032 to T049): catalogue, cart, addresses.
3. Phase 3 (T050 to T070): checkout, orders, cancellation, backend gate.
4. Phases 4 to 7 (T071 to T108): frontend, ending at the Tier 1 verification gate.
5. **Stop and validate**: the MVP is everything up to and including T108. Demonstrate register, browse, add to cart, pay by each method, view orders, and cancel.

### Incremental delivery

- One commit per phase; each gate has to be green before the next phase starts.
- Tier 2 follows in a fixed order: wallet and points, wishlist, writers, reviews, library, profile and help, so that stories which feed recommendations (wishlist) and orders (library) arrive after their sources are stable.
- Tier 2 is required. The build is not complete until T138 passes.

### Guard rails for every task

- Write the test first and see it fail.
- Services need Mockito `*ServiceTest` unit tests as well as integration tests (constitution IV).
- Money, points, delivery dates and cancellation eligibility only come from the server.
- Colours only through theme tokens; run `npm run check:tokens` before each frontend commit.
- Secrets only in environment variables; run `scripts/check-secrets.ps1` before each commit.
- Do not paste reference files; write from the spec.

---

## Notes

- Task IDs T001 to T147 are in execution order. Tasks added after the 2026-11-14 analysis carry a letter suffix (T026a to T026c, T059a, T077a, T078a, T107a, T146a) so that no existing ID and no existing dependency changed. Where a lettered task sits between two numbers, run it in file order. T080 is built before T079 (the Navbar needs the auth hook).
- The coverage matrix lists test names; each test task above names the matrix rows it covers.
- If a gate fails, add fix tasks in the same phase (new IDs at the end of the file with a `Fix:` prefix) rather than moving on.
