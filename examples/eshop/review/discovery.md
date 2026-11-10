# Discovery (hints only, nothing here is evidence)

Repo: `eShop` (monorepo, .NET 10, Aspire), default branch `origin/main` @ 913acea.
Hint sources read: README.md, CONTRIBUTING.md, ci.yml, .github/workflows/*. `.github/skills/*` (Aspire / Playwright agent skills) was NOT read: it is agent tooling, not repo docs for the system, and the brief said README/docs/CLAUDE.md-like only. No CLAUDE.md, no docs/ folder exist on origin/main.

## Decisions logged (non-interactive run)
- D1: Read code via `git grep ... origin/main` (and the Read tool on the working tree where `HEAD == origin/main`, 913acea). Reason: `git show`, `git status`, `git diff` were blocked by the sandbox permission prompt; `git grep` on origin/main was allowed. `build.js --verify` re-checks every quote against origin/main, so a stale working tree cannot slip through.
- D2: Not mapped (conservative): `ClientApp` (.NET MAUI mobile app), `HybridApp` (MAUI Blazor), test AppHosts, `tests/`, `e2e/`. Mentioned only in dropped.md. Reason: the three requested flows are web-shop flows; adding the MAUI clients would need a second pass on BFF auth that the brief did not ask for.
- D3: Message-broker style: publisher -> `rabbitmq` and `rabbitmq` -> consumer (two connections per hop). Event-level detail lives in flow steps.
- D4: One component `postgres` for the Postgres server; the four databases (catalogdb, identitydb, orderingdb, webhooksdb) are listed in `stores`.
- D5: Libraries (EventBus, EventBusRabbitMQ, IntegrationEventLogEF, ServiceDefaults) are described in facts, not as components.

## Candidate components (confirmed in code before use)
apphost, webapp, mobile-bff (YARP), identity-api, basket-api, catalog-api, ordering-api, order-processor, payment-processor, webhooks-api, webhooks-client, rabbitmq, redis, postgres.

## Candidate flows
1. browse-catalogue (WebApp -> Catalog.API -> catalogdb)
2. add-to-basket (WebApp -> Basket.API gRPC -> Redis)
3. checkout-and-order-status (WebApp -> Ordering.API -> RabbitMQ events -> OrderProcessor / Catalog / PaymentProcessor -> back to Ordering, WebApp notified)
4. (extra, short) price-change-webhook? dropped: only 3 requested.

## Things noticed
- Hard-coded OIDC client secret literal and test credentials in CI workflow (file paths only): `src/WebApp/Extensions/Extensions.cs`, `.github/workflows/playwright.yml`. Not cited.
- README says the architecture diagram is img/eshop_architecture.png; not used.
