# Book Haven Constitution

## Core Principles

### I. API-First Contract
A handwritten `openapi.yaml` is the single source of truth for the HTTP API. Every operation
MUST list the requirement IDs it satisfies. A contract test MUST fail the build whenever the
code and the spec disagree. API changes MUST be made in the spec first, then in code.
Rationale: the frontend and backend are built in sequence; the spec is what lets them agree.

### II. Layered, Domain-Organised Architecture
The backend MUST use the layers controller, service, repository, entity and DTO, and MUST be
organised by domain: member, catalog, cart, order, payment, shipping. Controllers MUST NOT
contain business logic or access repositories. Entities MUST NOT be returned from controllers;
DTOs MUST be used. The frontend MUST be organised by feature with the folders api, hooks,
components, pages and lib. Server state MUST go through TanStack Query; HTTP calls MUST go
through the shared Axios client in `lib` (`src/lib/axiosClient.js`); feature `api` folders only call that client.

### III. Consistent Responses and Validation
Every response MUST use the envelope `{ success, data, message, code }`. Error `code` values
MUST be stable, documented in the spec, and never renamed without a spec change. Validation
failures MUST return exactly one status code across the whole API. Input MUST be validated on
the client (react-hook-form with zod) and again on the server; client validation is never
trusted. Error responses MUST NOT expose stack traces or internal details.

### IV. Test-Gated Delivery (NON-NEGOTIABLE)
Services MUST have unit tests. Endpoints MUST have integration tests. The OpenAPI contract
test MUST exist and run in the build. A feature is not done until all of its tests pass.
Failing or skipped tests MUST NOT be merged to hide a defect.

### V. Security by Default (NON-NEGOTIABLE)
- No secrets, passwords or default credentials may be committed in any config or source file.
  All secrets MUST be read from environment variables; `.env` files MUST be git-ignored.
- Passwords MUST be hashed with BCrypt. Authentication MUST use Spring Security with JWT.
- A user MUST be able to access only their own data; ownership MUST be enforced in the
  service layer on every request, never by client-side checks.
- CORS MUST be restricted to the configured frontend origin; wildcard origins are forbidden.
- Services MUST bind to localhost or a specific internal address, never `0.0.0.0`.

### VI. Server-Authoritative, Real, Themeable UI
The server is the source of truth for totals, points earned and cancellation eligibility; the
client MUST display these values and MUST NOT compute authoritative ones. Every button MUST
perform a real action or be removed. Every page MUST work in light and dark mode using only
Tailwind CSS-variable theme tokens; hard-coded colours are forbidden. Icons MUST come from
lucide-react.

### VII. Simplicity and Clear Code
Names MUST be meaningful. Functions MUST be small and single-purpose. Abstractions, layers or
dependencies beyond what a current requirement needs MUST NOT be added (no over-engineering).
Complexity that departs from this MUST be justified in the plan.

## Technology Stack and Constraints

- Backend: Java 21, Spring Boot 4 (4.1.x line), Spring Data JPA, Maven, PostgreSQL, Spring
  Security with JWT and BCrypt.
- Frontend: React 18, Vite, JavaScript, Tailwind CSS with CSS-variable tokens for light and
  dark, TanStack Query, Axios, react-router-dom, react-hook-form with zod, lucide-react.
- Dependencies MUST be the latest stable, actively maintained releases at the time they are
  added, and MUST NOT have known critical or high vulnerabilities.
- Changing anything in this stack requires a constitution amendment.

## Development Workflow and Reference Rules

- The backend MUST be built and verified (tests and contract test green) before frontend work
  begins.
- Work MUST be delivered in small phases, with a commit after each phase.
- The reference implementation at `reference/projectA` is the source for UI, styling,
  features and business rules. Features MUST be rebuilt from it through the spec-driven
  process (specify, plan, tasks, implement). Reference files MUST NOT be pasted in bulk.
- Each phase MUST be traceable: requirement IDs link the spec, the OpenAPI operations and
  the tests.

## Governance

This constitution supersedes other practices. Amendments MUST be proposed in writing with the
rationale, reviewed, and recorded by updating this file and its version. Versioning follows
semantic versioning: MAJOR for removed or redefined principles, MINOR for added principles or
materially expanded guidance, PATCH for clarifications and wording. Every plan, task list and
review MUST check compliance with these principles, and any violation MUST be fixed or
explicitly justified in the plan before merge.

**Version**: 1.1.0 | **Ratified**: 2026-11-13 | **Last Amended**: 2026-11-14
