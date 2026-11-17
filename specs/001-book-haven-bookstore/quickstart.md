# Quickstart: build, test and run Book Haven

A validation guide, not an implementation guide. Contract:
[`contracts/openapi.yaml`](contracts/openapi.yaml). Entities: [`data-model.md`](data-model.md).
Commands are for Windows PowerShell from the repository root. Nothing in this guide contains a real
secret: every secret is a variable you set in your own shell.

## 1. Prerequisites

| Tool | Needed | Found on this machine |
|------|--------|-----------------------|
| JDK 21 | yes | `C:\Program Files\Microsoft\jdk-21.0.12.101-hotspot` (but `java` on `PATH` is 1.8) |
| Maven 3.9+ | yes | 3.9.11 |
| Node 22+ and npm 10+ | yes | 22.23.3 / 10.9.9 |
| PostgreSQL | yes | service `postgresql-x64-18` is running; `psql` is at `C:\Program Files\PostgreSQL\18\bin` |
| Git | yes | 2.56 |

```powershell
$env:JAVA_HOME = 'C:\Program Files\Microsoft\jdk-21.0.12.101-hotspot'
$env:Path = "$env:JAVA_HOME\bin;C:\Program Files\PostgreSQL\18\bin;$env:Path"
java -version   # must say 21
```

## 2. Databases

Create `books` (run) and `books_test` (tests), with a dedicated role instead of `postgres`:

```powershell
psql -U postgres -h localhost -c "CREATE ROLE bookhaven LOGIN PASSWORD '<choose-a-password>';"
psql -U postgres -h localhost -c "CREATE DATABASE books OWNER bookhaven;"
psql -U postgres -h localhost -c "CREATE DATABASE books_test OWNER bookhaven;"
```

Flyway creates the tables and seed catalogue on first start. Nothing is reset on later starts.

## 3. Environment variables (no defaults for secrets)

| Variable | Purpose | Example |
|----------|---------|---------|
| `SPRING_DATASOURCE_URL` | JDBC URL | `jdbc:postgresql://localhost:5432/books` |
| `SPRING_DATASOURCE_USERNAME` | DB user | `bookhaven` |
| `SPRING_DATASOURCE_PASSWORD` | DB password | your password |
| `APP_JWT_SECRET` | JWT signing key, at least 32 bytes | generate below |
| `APP_CORS_ALLOWED_ORIGIN` | the one allowed frontend origin | `http://localhost:5173` |
| `SPRING_PROFILES_ACTIVE` | `dev` only for local demo | optional |
| `APP_DEMO_USER_EMAIL`, `APP_DEMO_USER_PASSWORD` | demo member, `dev` profile only; inserted only if absent | optional |

```powershell
# generate a signing key for this shell session
$bytes = New-Object byte[] 48; [Security.Cryptography.RandomNumberGenerator]::Fill($bytes)
$env:APP_JWT_SECRET = [Convert]::ToBase64String($bytes)
$env:SPRING_DATASOURCE_URL = 'jdbc:postgresql://localhost:5432/books'
$env:SPRING_DATASOURCE_USERNAME = 'bookhaven'
$env:SPRING_DATASOURCE_PASSWORD = Read-Host 'DB password'
$env:APP_CORS_ALLOWED_ORIGIN = 'http://localhost:5173'
```

Frontend: `VITE_API_BASE_URL` (default `http://127.0.0.1:5000/api`). It is not a secret.
Starting the backend without a required variable fails immediately with a clear message.

## 4. Backend commands

```powershell
cd backend
mvn -q verify                 # unit + integration + contract tests (needs books_test, see below)
mvn -q test                   # unit tests only
mvn -q -Dtest=OpenApiContractTest test     # the contract test alone
mvn -q spring-boot:run        # run on http://127.0.0.1:5000
```

Integration tests read `TEST_DATASOURCE_URL` (default `jdbc:postgresql://localhost:5432/books_test`),
`SPRING_DATASOURCE_USERNAME` and `SPRING_DATASOURCE_PASSWORD`. The JWT secret for tests is generated
inside the test setup.

Expected: `BUILD SUCCESS`, `OpenApiContractTest` green, server logs `Started BookHavenApplication`
and bind `127.0.0.1:5000` only.

## 5. Frontend commands

```powershell
cd frontend
npm ci
npm run check:tokens   # fails on hard-coded colours
npm run lint
npm test               # Vitest
npm run build
npm run dev            # http://localhost:5173
```

## 6. Validation scenarios

Backend gate (phases 1-3), each must pass before the frontend starts:

1. **Contract.** `mvn -q -Dtest=OpenApiContractTest test`: routes in code equal `openapi.yaml`,
   no `$ref` is broken, every operation has valid `x-requirements`, nothing documents 422.
   *Negative check:* temporarily remove a path from the YAML; the test must fail naming that path.
2. **Startup rules.** Unset `APP_JWT_SECRET`, run the app: it must stop with a clear message.
   Restart twice with the same database: no data or password changes.
3. **Auth.** Register, duplicate email (409), wrong password (401, generic message), `GET /api/auth/me`.
4. **Catalogue.** Filter by category, language, format and price band, sort, search, paginate;
   guest sees books with delivery dates; digital books have none.
5. **Checkout money.** One physical book at 499 gives shipping 49; at 500 shipping 0; redeem 100
   points gives 10 off; confirm pays and returns `pointsEarned = floor(total/10)`.
6. **Payment rules.** Each of the six methods with valid data succeeds; each invalid card, UPI and
   bank case returns 400 with field errors; COD with an eBook is 400; wallet short is 409.
7. **Stock.** Two members buy the last copy: one gets 409 `INSUFFICIENT_STOCK`. A pending order
   left 15 minutes (test clock) is expired and stock returns.
8. **Cancellation.** Inside 48 hours: full and partial cancels at CONFIRMED (0%), PROCESSING (10%)
   and SHIPPED (20%), wallet refund and masked bank refund, points restored. At 48 hours plus one
   second: `cancellable=false` and cancel returns 409 `CANNOT_CANCEL`.
9. **Ownership.** Member B reading member A's order, address or cart item gets 404 or 403.

Frontend gate (phases 4-7), in a real browser at `http://localhost:5173` with the backend running:

1. Switch Light, Dark and System on every page including payment and confirmation; nothing keeps a
   fixed colour; `npm run check:tokens` is green.
2. Guest: browse, filter (URL updates, reload keeps it), press Add to Cart: sent to login and back.
3. Place an order with each payment tab; submit each with bad data first and confirm it is blocked
   with field messages; the Wallet tab shows only Book Haven Wallet; COD is disabled with an eBook.
4. Cart shows the default address selected, progress bar, "9+" badge after ten items, no promo box.
5. Orders: newest first, tracker, details, Buy Again; Cancel appears only inside the 48-hour window.
6. No button anywhere does nothing; no language picker.

Tier 2 (phase 8, required): wallet top-up, wishlist, writers and follow, reviews, E-Library with
reader and download, gift points history, profile and addresses, help page.

## 7. Done criteria

`mvn verify` and `npm run check:tokens && npm run lint && npm test && npm run build` are all green,
the scenarios above pass, `scripts/check-secrets.ps1` finds nothing, and `git status` shows no
`.env` or build output.
