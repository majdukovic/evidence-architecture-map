# Discovery (hints only; nothing here is evidence)

Repo: `bootzooka` (monorepo, default branch origin/HEAD = master, already fetched; not fetched again).
Hint sources used: the repo's own `docs/architecture.md` only (README/docs otherwise skimmed by file name). No CLAUDE.md in the repo.

## Decisions logged (non-interactive run)
- One repo, one map. Scope: backend (Scala 3, Ox, Tapir, Magnum, Flyway) + `ui` (React). `helm/`, `docker-compose.yml` and CI are used for facts only.
- Layers: `ui` (Browser UI), `backend` (Backend application), `data` (Data stores), `external` (External services).
- Conservative choice: backend internals are mapped at module level (user, security, password reset, email, http, db, config), not per class.
- `docker-compose.yml` contains a dev database password and `application.conf` contains defaults for passwords/keys: never quoted. Reported by path only.
- Absence claims (e.g. "the UI never calls the reset endpoint") are NOT put on the map; see "Surprises".

## Candidate components
- ui: React SPA (`ui/`), routes in `App.tsx`, generated API client `ui/src/api/apiComponents.ts`, fetcher `apiFetcher.ts`
- http-api: `HttpApi` Netty server, serves `/api/v1` + Swagger + static webapp
- user-module: `UserApi`, `UserService`, `UserModel`
- security: `Auth`, `ApiKeyService`, `ApiKeyModel`
- password-reset: `PasswordResetApi`, `PasswordResetService`, `PasswordResetCodeModel`
- email-service: `EmailService` outbox + background loop; senders Mailgun / SMTP / Dummy
- db: `DB` (Hikari + Magnum + Flyway)
- config: `Config` (pureconfig over `application.conf`)
- main: `Main` / `Dependencies` (startup)
- postgres (external datastore), mailgun (external HTTP), smtp-server (external)
- otel (OpenTelemetry exporter) — seen in Dependencies/docker-compose; candidate, kept out unless confirmed as a connection

## Candidate flows
1. register-and-login (UI -> API -> DB; API key stored in browser localStorage, sent as Bearer)
2. reset-password (forgot -> code in DB + email in outbox -> background sender -> Mailgun/SMTP; reset endpoint)
3. backend-startup (Main -> Dependencies -> config, Flyway migrate, email loops, Netty bind)

## Surprises (hints to check, not claims)
- Reset email link pattern points at `/password-reset?code=%s` on the UI origin (config), but `App.tsx` has no such route and no page calls `usePostPasswordresetReset`. Absence claim: left off the map, mentioned in the hand-over as an observation to confirm.
- Session is an opaque API key row in `api_keys` looked up per request (no JWT, no cookie).
- Email sending is an outbox table + polling loop, not inline.
- `DB.createTestMigrate` name is misleading; it creates pool, migrates (if enabled) and test-connects with retry.

## Secrets noticed (path only)
- `docker-compose.yml` (dev DB password), `backend/src/main/resources/application.conf` (default DB password / placeholder key).
