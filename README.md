# Book Haven

An online bookstore: a Spring Boot 4 REST API on PostgreSQL and a React single-page app.
The backend binds to `127.0.0.1:5000` and the frontend dev server to `127.0.0.1:5173`, which
proxies `/api` to the backend.

Specification, plan, contract and tasks live in `specs/001-book-haven-bookstore/`.

## Prerequisites

| Tool | Version | Notes |
|------|---------|-------|
| JDK | 21 | Set `JAVA_HOME` to the JDK 21 folder and put `%JAVA_HOME%\bin` first on `PATH` |
| Maven | 3.9 or newer | |
| Node.js | 22 or newer, with npm 10 | |
| PostgreSQL | 18 | `psql` on `PATH` |
| Git | any recent | |

```powershell
$env:JAVA_HOME = '<path to your JDK 21>'
$env:Path = "$env:JAVA_HOME\bin;$env:Path"
java -version   # must report 21
```

## Database

Create a dedicated role and two databases: `books` for running the app and `books_test` for the
integration tests. Choose your own password; never commit it.

```powershell
psql -U postgres -h localhost -c "CREATE ROLE bookhaven LOGIN PASSWORD '<choose-a-password>';"
psql -U postgres -h localhost -c "CREATE DATABASE books OWNER bookhaven;"
psql -U postgres -h localhost -c "CREATE DATABASE books_test OWNER bookhaven;"
```

Flyway creates the tables and the seed catalogue on first start. Nothing is reset on later starts.

## Required environment variables

The application has no defaults for secrets and refuses to start when a required one is missing.
This table lists names only; set the values in your own shell.

| Variable | Required | Purpose |
|----------|----------|---------|
| `SPRING_DATASOURCE_URL` | yes | JDBC URL of the `books` database |
| `SPRING_DATASOURCE_USERNAME` | yes | Database user |
| `SPRING_DATASOURCE_PASSWORD` | yes | Database password |
| `APP_JWT_SECRET` | yes | JWT signing key, at least 32 bytes |
| `APP_CORS_ALLOWED_ORIGIN` | yes | The single allowed frontend origin |
| `APP_JWT_EXPIRATION_MS` | no | Token lifetime in milliseconds (default 3600000) |
| `SPRING_PROFILES_ACTIVE` | no | Set to `dev` for the local demo only |
| `APP_DEMO_USER_EMAIL` | no | Demo member email, `dev` profile only |
| `APP_DEMO_USER_PASSWORD` | no | Demo member password, `dev` profile only |

Set them for the current PowerShell session:

```powershell
$bytes = New-Object byte[] 48
[Security.Cryptography.RandomNumberGenerator]::Fill($bytes)
$env:APP_JWT_SECRET = [Convert]::ToBase64String($bytes)
$env:SPRING_DATASOURCE_URL = 'jdbc:postgresql://127.0.0.1:5432/books'
$env:SPRING_DATASOURCE_USERNAME = 'bookhaven'
$env:SPRING_DATASOURCE_PASSWORD = Read-Host 'Database password'
$env:APP_CORS_ALLOWED_ORIGIN = 'http://localhost:5173'
```

### Demo member (dev profile)

With `SPRING_PROFILES_ACTIVE=dev` and both `APP_DEMO_USER_EMAIL` and `APP_DEMO_USER_PASSWORD` set,
the backend inserts one ordinary member if that email does not exist yet. It never changes an
existing member's password. There is no admin account and no built-in default password.

## Backend

```powershell
cd backend
mvn -q verify                              # unit, integration and contract tests
mvn -q test                                # unit tests only
mvn -q -Dtest=OpenApiContractTest test     # the contract test: routes in code equal contracts/openapi.yaml
mvn -q spring-boot:run                     # starts on http://127.0.0.1:5000
```

Integration tests use the `books_test` database. They read `TEST_DATASOURCE_URL` (default
`jdbc:postgresql://localhost:5432/books_test`) together with `SPRING_DATASOURCE_USERNAME` and
`SPRING_DATASOURCE_PASSWORD`. The test JWT key is generated inside the test setup. Integration tests
print long stack traces for the negative cases, so redirect the output to a file when you need to
read a summary.

## Frontend

```powershell
cd frontend
npm ci
npm run dev            # http://localhost:5173, proxies /api to the backend
npm run check:tokens   # fails on hard-coded colours
npm run lint           # single-address-form check, then ESLint with jsx-a11y
npm test               # Vitest
npm run build
```

## Check scripts

Run from the repository root.

| Script | What it checks |
|--------|----------------|
| `scripts/check-secrets.ps1` | No `.env` file, no literal password, secret or JWT value, no JDBC URL with a password |
| `scripts/check-env-docs.ps1` | The variable table in this README matches the variables the backend reads |
| `scripts/check-tokens.mjs` | Frontend uses design tokens, no hard-coded colours (`npm run check:tokens`) |
| `scripts/check-single-address-form.mjs` | `AddressForm.jsx` is the only address form (run by `npm run lint`) |

## Security notes

- Authentication is a local JWT with BCrypt password hashing, served over plain HTTP on
  `127.0.0.1`. This is **demo only**.
- Any other deployment needs TLS 1.2 or higher and OpenID Connect sign-in with MFA in place of the
  local JWT login (see Complexity Tracking in `specs/001-book-haven-bookstore/plan.md`).
- Payments are simulated; no real card or bank is contacted.
- Secrets come only from environment variables. Run `scripts/check-secrets.ps1` before every commit.
